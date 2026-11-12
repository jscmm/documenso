import { provisionUserByApi } from '@documenso/lib/server-only/user/provision-user-by-api';

import { authenticatedProcedure, router } from '../trpc';
import { ZProvisionUserRequestSchema, ZProvisionUserResponseSchema } from './schema';

export const userProvisioningRouter = router({
  /**
   * @public
   */
  provisionUser: authenticatedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/user/provision',
        summary: 'Provision a user',
        description:
          'Creates the user (or finds them by email) and adds them to the OIDC auto-join organisation, so ' +
          'documents can be created for them before their first sign-in. A later OIDC sign-in with the same ' +
          'email signs in to this account. Needs NEXT_PRIVATE_OIDC_AUTO_JOIN_ORGANISATION and a token of a team ' +
          'in that organisation whose user manages it.',
        tags: ['User'],
      },
    })
    .input(ZProvisionUserRequestSchema)
    .output(ZProvisionUserResponseSchema)
    .mutation(async ({ input, ctx }) => {
      return await provisionUserByApi({
        callerUserId: ctx.user.id,
        teamId: ctx.teamId,
        email: input.email,
        name: input.name,
      });
    }),
});
