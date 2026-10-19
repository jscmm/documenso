import { describe, expect, it } from 'vitest';

import { shouldSkipPlaceholderScan } from './auto-place-fields-options';

describe('shouldSkipPlaceholderScan', () => {
  const on = (name: string) => (name === 'NEXT_PRIVATE_SKIP_AUTO_PLACE_FIELDS' ? 'true' : undefined);

  it('is off by default', () => {
    expect(shouldSkipPlaceholderScan(() => undefined, { auth: 'api' })).toBe(false);
  });

  it('skips API token requests when enabled', () => {
    expect(shouldSkipPlaceholderScan(on, { auth: 'api' })).toBe(true);
  });

  it('keeps the scan for the web app and unauthenticated requests', () => {
    expect(shouldSkipPlaceholderScan(on, { auth: 'session' })).toBe(false);
    expect(shouldSkipPlaceholderScan(on, { auth: null })).toBe(false);
  });

  it('only accepts "true"', () => {
    expect(shouldSkipPlaceholderScan(() => '1', { auth: 'api' })).toBe(false);
  });
});
