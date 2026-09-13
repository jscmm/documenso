import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAutoInsertFieldTypes, getAutoSignThreshold } from './autosign';

describe('getAutoSignThreshold', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to 5 when the variable is unset or blank', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', undefined);
    expect(getAutoSignThreshold()).toBe(5);

    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '');
    expect(getAutoSignThreshold()).toBe(5);

    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '   ');
    expect(getAutoSignThreshold()).toBe(5);
  });

  it('returns the configured non-negative integer', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '0');
    expect(getAutoSignThreshold()).toBe(0);

    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '12');
    expect(getAutoSignThreshold()).toBe(12);
  });

  it('falls back to the default for invalid values', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '-1');
    expect(getAutoSignThreshold()).toBe(5);

    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', '2.5');
    expect(getAutoSignThreshold()).toBe(5);

    vi.stubEnv('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD', 'many');
    expect(getAutoSignThreshold()).toBe(5);
  });
});

describe('getAutoInsertFieldTypes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns no types when the variable is unset or blank', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES', undefined);
    expect(getAutoInsertFieldTypes()).toEqual([]);

    vi.stubEnv('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES', '');
    expect(getAutoInsertFieldTypes()).toEqual([]);
  });

  it('parses a comma-separated list case-insensitively', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES', 'NAME');
    expect(getAutoInsertFieldTypes()).toEqual(['NAME']);

    vi.stubEnv('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES', ' email , name ');
    expect(getAutoInsertFieldTypes()).toEqual(['NAME', 'EMAIL']);
  });

  it('ignores unsupported types', () => {
    vi.stubEnv('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES', 'SIGNATURE,NAME,DATE,bogus');
    expect(getAutoInsertFieldTypes()).toEqual(['NAME']);
  });
});
