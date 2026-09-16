import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSignatureFrameColor, isSignatureFrameEnabled } from './signature-frame';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isSignatureFrameEnabled', () => {
  it('is off unless asked for', () => {
    vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME', undefined);
    expect(isSignatureFrameEnabled()).toBe(false);

    vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME', 'false');
    expect(isSignatureFrameEnabled()).toBe(false);
  });

  it('accepts the usual truthy spellings', () => {
    for (const value of ['1', 'true', ' TRUE ', 'yes', 'on']) {
      vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME', value);
      expect(isSignatureFrameEnabled()).toBe(true);
    }
  });
});

describe('getSignatureFrameColor', () => {
  it('defaults and validates', () => {
    vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME_COLOR', undefined);
    expect(getSignatureFrameColor()).toBe('#4c3bcf');

    vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME_COLOR', '#0077d4');
    expect(getSignatureFrameColor()).toBe('#0077d4');

    vi.stubEnv('NEXT_PUBLIC_SIGNATURE_FRAME_COLOR', 'not a colour');
    expect(getSignatureFrameColor()).toBe('#4c3bcf');
  });
});
