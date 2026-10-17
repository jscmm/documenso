import { describe, expect, it } from 'vitest';

import { isOidcSigninRequested, nameFromClaim, parseOidcProvisioningOptions } from './oidc-provisioning';

describe('parseOidcProvisioningOptions', () => {
  it('is off by default', () => {
    expect(parseOidcProvisioningOptions(() => undefined)).toEqual({ syncName: false, autoJoinOrganisation: null });
  });

  it('reads both options', () => {
    const env: Record<string, string> = {
      NEXT_PRIVATE_OIDC_SYNC_NAME: 'true',
      NEXT_PRIVATE_OIDC_AUTO_JOIN_ORGANISATION: ' acme ',
    };

    expect(parseOidcProvisioningOptions((name) => env[name])).toEqual({ syncName: true, autoJoinOrganisation: 'acme' });
  });

  it('treats a blank organisation as none', () => {
    expect(parseOidcProvisioningOptions(() => '  ').autoJoinOrganisation).toBeNull();
  });
});

describe('nameFromClaim', () => {
  it('returns a changed name', () => {
    expect(nameFromClaim(' Example User ', 'Old Name')).toBe('Example User');
  });

  it('keeps the current name when the claim is the same or empty', () => {
    expect(nameFromClaim('Example User', 'Example User')).toBeNull();
    expect(nameFromClaim('   ', 'Example User')).toBeNull();
  });
});

describe('isOidcSigninRequested', () => {
  it('starts OIDC only for provider=oidc', () => {
    expect(isOidcSigninRequested(new URLSearchParams('provider=oidc&returnTo=/t/team'))).toBe(true);
    expect(isOidcSigninRequested(new URLSearchParams('provider=google'))).toBe(false);
    expect(isOidcSigninRequested(new URLSearchParams(''))).toBe(false);
  });
});
