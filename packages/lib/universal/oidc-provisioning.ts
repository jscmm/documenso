/**
 * Options for provisioning users who sign in through the generic OIDC provider, so that an
 * identity provider can own the user's profile and organisation membership:
 *
 * - `NEXT_PRIVATE_OIDC_SYNC_NAME="true"`: the user's name follows the `name` claim on every
 *   OIDC sign-in, not only when the account is created.
 * - `NEXT_PRIVATE_OIDC_AUTO_JOIN_ORGANISATION="<organisation url or id>"`: every OIDC sign-in
 *   makes the user a member of that organisation (and so of its teams that allow all
 *   members) if they are not one already. Access is then decided by the identity provider:
 *   to remove someone, stop the provider from issuing them a token, then remove the member.
 */
export type OidcProvisioningOptions = {
  syncName: boolean;
  autoJoinOrganisation: string | null;
};

export const parseOidcProvisioningOptions = (get: (name: string) => string | undefined): OidcProvisioningOptions => ({
  syncName: get('NEXT_PRIVATE_OIDC_SYNC_NAME') === 'true',
  autoJoinOrganisation: get('NEXT_PRIVATE_OIDC_AUTO_JOIN_ORGANISATION')?.trim() || null,
});

/**
 * The name to store for a user, or null to keep the current one: only a non-empty claim
 * that differs from it.
 */
export const nameFromClaim = (claim: string, current: string | null): string | null => {
  const name = claim.trim();

  return name && name !== current ? name : null;
};

/**
 * `/signin?provider=oidc` starts the OIDC sign-in straight away, so an application that
 * signs its users in through the same provider can link to Documenso without a click.
 */
export const isOidcSigninRequested = (searchParams: URLSearchParams): boolean =>
  searchParams.get('provider') === 'oidc';
