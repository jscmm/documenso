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

/**
 * Field types that may be filled in for a recipient without a click. Both
 * values come straight from the recipient record, so nothing is guessed.
 */
export const AUTO_INSERTABLE_FIELD_TYPES: FieldType[] = [FieldType.NAME, FieldType.EMAIL];

/**
 * Field types that are filled in for the recipient without a click on V2
 * envelopes: the signing page shows them prefilled and read-only, and the
 * server inserts them when the recipient completes, the same way DATE
 * fields are always handled.
 *
 * Configured with `NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES` as a comma-separated
 * list (e.g. `NAME` or `NAME,EMAIL`). Unknown values are ignored; unset means
 * none, which keeps the default behaviour of requiring a click.
 */
export const getAutoInsertFieldTypes = (): FieldType[] => {
  const raw = env('NEXT_PUBLIC_AUTO_INSERT_FIELD_TYPES');

  if (!raw) {
    return [];
  }

  const requested = raw.split(',').map((value) => value.trim().toUpperCase());

  return AUTO_INSERTABLE_FIELD_TYPES.filter((type) => requested.includes(type));
};
