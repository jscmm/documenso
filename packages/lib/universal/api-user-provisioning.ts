/**
 * Provisioning users through the API (`POST /api/v2/user/provision`): a service that signs
 * its users in to this instance through OIDC creates their account before their first
 * sign-in, so it can create documents owned by them straight away. A later OIDC sign-in with
 * the same email links to this account.
 */

/** The email a provisioned account is stored under: trimmed and lowercased. */
export const normaliseProvisionedEmail = (email: string) => email.trim().toLowerCase();
