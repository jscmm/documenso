import { describe, expect, it } from 'vitest';

import {
  OAUTH_PROVIDER_MESSAGE_MAX_LENGTH,
  providerRefusalMessage,
  sanitizeProviderMessage,
} from './oauth-provider-error';

describe('providerRefusalMessage', () => {
  it('takes the message of a pre-token trigger from the error code', () => {
    expect(
      providerRefusalMessage('PreTokenGeneration failed with error Finish setting up your account first.', null),
    ).toBe('Finish setting up your account first.');
  });

  it('takes it from the description too', () => {
    expect(
      providerRefusalMessage('invalid_request', 'PreAuthentication failed with error Your access was revoked.'),
    ).toBe('Your access was revoked.');
  });

  it('keeps a message without its own full stop', () => {
    expect(providerRefusalMessage('PreTokenGeneration failed with error Not allowed.', null)).toBe('Not allowed.');
    expect(providerRefusalMessage('PreTokenGeneration failed with error Not allowed', null)).toBe('Not allowed');
  });

  it('is null for other refusals', () => {
    expect(providerRefusalMessage('invalid_grant', null)).toBeNull();
    expect(providerRefusalMessage('invalid_grant', 'Authorization code expired')).toBeNull();
    expect(providerRefusalMessage('PreTokenGeneration failed with error  ', null)).toBeNull();
  });
});

describe('sanitizeProviderMessage', () => {
  it('makes plain text on one line', () => {
    expect(sanitizeProviderMessage('<b>Hi</b>\n\tthere\u0000')).toBe('b Hi /b there');
  });

  it('caps the length', () => {
    const message = sanitizeProviderMessage('a'.repeat(1000));

    expect(message).toHaveLength(OAUTH_PROVIDER_MESSAGE_MAX_LENGTH);
    expect(message?.endsWith('…')).toBe(true);
  });

  it('is null for nothing', () => {
    expect(sanitizeProviderMessage(undefined)).toBeNull();
    expect(sanitizeProviderMessage(' \n ')).toBeNull();
  });
});
