import { prisma } from '@documenso/prisma';

import { ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP } from '../../constants/organisations';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { normaliseProvisionedEmail } from '../../universal/api-user-provisioning';
import { parseOidcProvisioningOptions } from '../../universal/oidc-provisioning';
import { env } from '../../utils/env';
import { buildOrganisationWhereQuery } from '../../utils/organisations';
import { onCreateUserHook } from './create-user';
import { provisionOidcUser } from './provision-oidc-user';

export type ProvisionUserByApiOptions = {
  /** The API token's user (a team token without a user acts as the organisation owner). */
  callerUserId: number;
  /** The API token's team: it must belong to the auto-join organisation. */
  teamId: number;
  email: string;
  name: string;
};

/**
 * Creates the user (or finds them by email) and applies the OIDC provisioning options to
 * them, so they are a member of the auto-join organisation before their first sign-in. Only
 * for a manager of that organisation, with a token of one of its teams; refused when no
 * auto-join organisation is configured.
 */
export const provisionUserByApi = async ({ callerUserId, teamId, email, name }: ProvisionUserByApiOptions) => {
  const { autoJoinOrganisation } = parseOidcProvisioningOptions((variable) => env(variable));

  if (!autoJoinOrganisation) {
    throw new AppError(AppErrorCode.NOT_SETUP, {
      message: 'Provisioning users needs NEXT_PRIVATE_OIDC_AUTO_JOIN_ORGANISATION',
    });
  }

  const organisation = await prisma.organisation.findFirst({
    where: {
      OR: [{ url: autoJoinOrganisation }, { id: autoJoinOrganisation }],
      teams: { some: { id: teamId } },
    },
    select: { id: true },
  });

  const managed = organisation
    ? await prisma.organisation.findFirst({
        where: buildOrganisationWhereQuery({
          organisationId: organisation.id,
          userId: callerUserId,
          roles: ORGANISATION_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_ORGANISATION'],
        }),
        select: { id: true },
      })
    : null;

  if (!organisation || !managed) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, {
      message: 'Only a manager of the auto-join organisation can provision users, with a token of its team',
    });
  }

  const normalisedEmail = normaliseProvisionedEmail(email);

  let user = await prisma.user.findFirst({
    where: { email: { equals: normalisedEmail, mode: 'insensitive' } },
  });

  const created = user === null;

  if (user === null) {
    user = await prisma.user.create({
      data: { email: normalisedEmail, name, emailVerified: new Date() },
    });

    await onCreateUserHook(user);
  }

  if (user.disabled) {
    throw new AppError(AppErrorCode.FORBIDDEN, { message: 'This user is disabled' });
  }

  await provisionOidcUser({ userId: user.id, name });

  const member = await prisma.organisationMember.findFirst({
    where: { organisationId: organisation.id, userId: user.id },
    select: { id: true },
  });

  if (!member) {
    throw new AppError(AppErrorCode.UNKNOWN_ERROR, {
      message: 'The user could not be added to the organisation',
    });
  }

  return { userId: user.id, created };
};
