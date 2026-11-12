import { describe, expect, it } from 'vitest';

import { normaliseProvisionedEmail } from './api-user-provisioning';

describe('normaliseProvisionedEmail', () => {
  it('trims and lowercases', () => {
    expect(normaliseProvisionedEmail('  Pat.Agent@Example.COM ')).toBe('pat.agent@example.com');
  });

  it('keeps an already normal email', () => {
    expect(normaliseProvisionedEmail('pat@example.com')).toBe('pat@example.com');
  });
});
