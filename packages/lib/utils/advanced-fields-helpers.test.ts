import { FieldType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { fieldsContainUnsignedRequiredField, isRequiredField } from './advanced-fields-helpers';

const initials = (fieldMeta: unknown, inserted = false) => ({ type: FieldType.INITIALS, fieldMeta, inserted });

describe('isRequiredField for INITIALS', () => {
  it('is optional when fieldMeta sets required to false', () => {
    expect(isRequiredField(initials({ type: 'initials', required: false }))).toBe(false);
  });

  it('stays required without fieldMeta, without the flag, or with required true', () => {
    expect(isRequiredField(initials(null))).toBe(true);
    expect(isRequiredField(initials({ type: 'initials', fontSize: 14 }))).toBe(true);
    expect(isRequiredField(initials({ type: 'initials', required: true }))).toBe(true);
  });

  it('stays required when fieldMeta does not parse', () => {
    expect(isRequiredField(initials({ type: 'initials', required: 'no' }))).toBe(true);
  });
});

describe('fieldsContainUnsignedRequiredField', () => {
  const signedSignature = { type: FieldType.SIGNATURE, fieldMeta: null, inserted: true };

  it('lets a blank optional initials field through', () => {
    expect(fieldsContainUnsignedRequiredField([signedSignature, initials({ type: 'initials', required: false })])).toBe(
      false,
    );
  });

  it('blocks on a blank initials field without the flag', () => {
    expect(fieldsContainUnsignedRequiredField([signedSignature, initials(null)])).toBe(true);
  });
});

describe('isRequiredField for the other optional types', () => {
  it('still treats a TEXT field without fieldMeta as optional', () => {
    expect(isRequiredField({ type: FieldType.TEXT, fieldMeta: null })).toBe(false);
  });
});
