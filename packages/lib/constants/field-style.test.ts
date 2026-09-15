import { FieldType } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getFieldTextColor,
  getFieldTextFontStyle,
  getFieldTextStyleTypes,
  getFieldValueTextStyle,
} from './field-style';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getFieldTextColor', () => {
  it('defaults to black when the variable is unset or blank', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', undefined);
    expect(getFieldTextColor()).toBe('black');

    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', '  ');
    expect(getFieldTextColor()).toBe('black');
  });

  it('returns a valid CSS colour as given', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', '#0077d4');
    expect(getFieldTextColor()).toBe('#0077d4');

    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', ' rgb(0, 119, 212) ');
    expect(getFieldTextColor()).toBe('rgb(0, 119, 212)');
  });

  it('falls back to black for values that are not colours', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', 'bright');
    expect(getFieldTextColor()).toBe('black');

    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', '#12');
    expect(getFieldTextColor()).toBe('black');
  });
});

describe('getFieldTextFontStyle', () => {
  it('defaults to normal', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', undefined);
    expect(getFieldTextFontStyle()).toBe('normal');

    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', '');
    expect(getFieldTextFontStyle()).toBe('normal');
  });

  it('accepts the known styles in any casing or spacing', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', 'italic');
    expect(getFieldTextFontStyle()).toBe('italic');

    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', ' Italic   Bold ');
    expect(getFieldTextFontStyle()).toBe('italic bold');
  });

  it('falls back to normal for unknown styles', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', 'oblique');
    expect(getFieldTextFontStyle()).toBe('normal');
  });
});

describe('getFieldTextStyleTypes', () => {
  it('defaults to the typed value types', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_STYLE_TYPES', undefined);
    expect(getFieldTextStyleTypes()).toEqual([FieldType.NAME, FieldType.EMAIL, FieldType.TEXT, FieldType.NUMBER]);
  });

  it('accepts a comma-separated list and ignores unknown or unstyleable types', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_STYLE_TYPES', 'name, date,SIGNATURE,bogus');
    expect(getFieldTextStyleTypes()).toEqual([FieldType.NAME, FieldType.DATE]);
  });
});

describe('getFieldValueTextStyle', () => {
  it('styles values of listed types and leaves labels and other types plain', () => {
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_COLOR', '#0077d4');
    vi.stubEnv('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE', 'italic');

    expect(getFieldValueTextStyle(FieldType.NAME, false)).toEqual({
      fill: '#0077d4',
      fontStyle: 'italic',
    });
    expect(getFieldValueTextStyle(FieldType.NAME, true)).toEqual({ fill: 'black', fontStyle: 'normal' });
    expect(getFieldValueTextStyle(FieldType.DATE, false)).toEqual({ fill: 'black', fontStyle: 'normal' });
  });
});
