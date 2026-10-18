import { prisma } from '@documenso/prisma';
import { OrganisationMemberRole } from '@prisma/client';

import { nameFromClaim, parseOidcProvisioningOptions } from '../../universal/oidc-provisioning';
import { env } from '../../utils/env';
import { addUserToOrganisation } from '../organisation/accept-organisation-invitation';

/**
 * Applies the OIDC provisioning options (see `universal/oidc-provisioning.ts`) to a user who
 * just signed in through the generic OIDC provider. Failures are logged and never block
 * the sign-in.
 *
 * Returns the path of the auto-join organisation's first team the user can open, so a
 * sign-in with no other destination lands there instead of the personal account; null
 * without auto-join or such a team.
 */
export const provisionOidcUser = async ({ userId, name }: { userId: number; name: string }): Promise<string | null> => {
  const options = parseOidcProvisioningOptions((variable) => env(variable));

  if (options.syncName) {
    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
      const newName = nameFromClaim(name, user.name);

      if (newName) {
        await prisma.user.update({ where: { id: userId }, data: { name: newName } });
      }
    } catch (err) {
      console.error('OIDC provisioning: could not update the user name', err);
    }
  }

  if (options.autoJoinOrganisation) {
    try {
      const organisation = await prisma.organisation.findFirst({
        where: { OR: [{ url: options.autoJoinOrganisation }, { id: options.autoJoinOrganisation }] },
        include: { groups: true, members: { where: { userId }, select: { id: true } } },
      });

      if (!organisation) {
        console.error(`OIDC provisioning: organisation "${options.autoJoinOrganisation}" not found`);
      } else if (organisation.members.length === 0) {
        await addUserToOrganisation({
          userId,
          organisationId: organisation.id,
          organisationGroups: organisation.groups,
          organisationMemberRole: OrganisationMemberRole.MEMBER,
          bypassEmail: true,
        });
      }
    } catch (err) {
      console.error('OIDC provisioning: could not add the user to the organisation', err);
    }

    try {
      const team = await prisma.team.findFirst({
        where: {
          organisation: { OR: [{ url: options.autoJoinOrganisation }, { id: options.autoJoinOrganisation }] },
          teamGroups: {
            some: { organisationGroup: { organisationGroupMembers: { some: { organisationMember: { userId } } } } },
          },
        },
        orderBy: { createdAt: 'asc' },
        select: { url: true },
      });

      return team ? `/t/${team.url}` : null;
    } catch (err) {
      console.error('OIDC provisioning: could not find a team to land in', err);
    }
  }

  return null;
};
