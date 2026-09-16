import { colord } from 'colord';

import { env } from '../utils/env';

export const DEFAULT_SIGNATURE_FRAME_COLOR = '#3300ff';

/**
 * Whether inserted signatures and initials are drawn with a frame on the
 * signing page and in the sealed PDF: a bracket down the left edge with a
 * small caption above ("Signed by:" / "Initial"), the mark many signers
 * expect next to an electronic signature.
 *
 * Configured with `NEXT_PUBLIC_SIGNATURE_FRAME` (`true`/`1` to enable;
 * default off).
 */
export const isSignatureFrameEnabled = (): boolean => {
  const raw = env('NEXT_PUBLIC_SIGNATURE_FRAME');

  if (raw === undefined) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
};

/**
 * The frame's colour, any CSS colour; invalid values fall back to the default.
 *
 * Configured with `NEXT_PUBLIC_SIGNATURE_FRAME_COLOR`.
 */
export const getSignatureFrameColor = (): string => {
  const raw = env('NEXT_PUBLIC_SIGNATURE_FRAME_COLOR');

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_SIGNATURE_FRAME_COLOR;
  }

  const value = raw.trim();

  return colord(value).isValid() ? value : DEFAULT_SIGNATURE_FRAME_COLOR;
};
