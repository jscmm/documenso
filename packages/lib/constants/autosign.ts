import { FieldType } from '@prisma/client';

import { env } from '../utils/env';

export const AUTO_SIGNABLE_FIELD_TYPES: FieldType[] = [
  FieldType.NAME,
  FieldType.INITIALS,
  FieldType.EMAIL,
  FieldType.DATE,
];

const DEFAULT_AUTO_SIGN_THRESHOLD = 5;

/**
 * The number of auto-signable fields a recipient must have before the
 * "automatically sign fields" dialog is offered. The dialog opens when the
 * count is strictly greater than this value, so `0` offers it whenever at
 * least one field can be auto-signed.
 *
 * Configured with `NEXT_PUBLIC_AUTO_SIGN_THRESHOLD`; unset, blank or invalid
 * values fall back to the default.
 */
export const getAutoSignThreshold = (): number => {
  const raw = env('NEXT_PUBLIC_AUTO_SIGN_THRESHOLD');

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_AUTO_SIGN_THRESHOLD;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_AUTO_SIGN_THRESHOLD;
  }

  return parsed;
};
