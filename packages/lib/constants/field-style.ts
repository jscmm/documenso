import { FieldType } from '@prisma/client';
import { colord } from 'colord';

import { env } from '../utils/env';

export const DEFAULT_FIELD_TEXT_COLOR = 'black';

export const DEFAULT_FIELD_TEXT_FONT_STYLE = 'normal';

/**
 * Konva font styles a value may be rendered in.
 */
export const FIELD_TEXT_FONT_STYLES = ['normal', 'italic', 'bold', 'italic bold'] as const;

export type TFieldTextFontStyle = (typeof FIELD_TEXT_FONT_STYLES)[number];

/**
 * Field types whose inserted values can take the configured colour and font
 * style. Signature fields draw in the signature font and are not affected.
 */
export const STYLEABLE_FIELD_TYPES: FieldType[] = [
  FieldType.NAME,
  FieldType.EMAIL,
  FieldType.DATE,
  FieldType.INITIALS,
  FieldType.TEXT,
  FieldType.NUMBER,
];

/**
 * Field types that take the configured value style by default: the ones a
 * signer types or that carry their details, so they read as entered data
 * next to values already printed on the form. Dates and initials stay plain
 * unless listed in `NEXT_PUBLIC_FIELD_TEXT_STYLE_TYPES`.
 */
export const DEFAULT_FIELD_TEXT_STYLE_TYPES: FieldType[] = [
  FieldType.NAME,
  FieldType.EMAIL,
  FieldType.TEXT,
  FieldType.NUMBER,
];

/**
 * The colour inserted values are drawn in on the signing page and in the
 * sealed PDF, for the field types returned by `getFieldTextStyleTypes`.
 *
 * Configured with `NEXT_PUBLIC_FIELD_TEXT_COLOR` as any CSS colour
 * (`#0077d4`, `rgb(0, 119, 212)`, `navy`); unset, blank or invalid values
 * fall back to black. Labels and placeholders are always black.
 */
export const getFieldTextColor = (): string => {
  const raw = env('NEXT_PUBLIC_FIELD_TEXT_COLOR');

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_FIELD_TEXT_COLOR;
  }

  const value = raw.trim();

  if (!colord(value).isValid()) {
    return DEFAULT_FIELD_TEXT_COLOR;
  }

  return value;
};

/**
 * The font style inserted values are drawn in, for the same field types.
 *
 * Configured with `NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE` as one of `normal`,
 * `italic`, `bold` or `italic bold`; anything else falls back to `normal`.
 */
export const getFieldTextFontStyle = (): TFieldTextFontStyle => {
  const raw = env('NEXT_PUBLIC_FIELD_TEXT_FONT_STYLE');

  if (raw === undefined) {
    return DEFAULT_FIELD_TEXT_FONT_STYLE;
  }

  const value = raw.trim().toLowerCase().split(/\s+/).join(' ');

  const match = FIELD_TEXT_FONT_STYLES.find((style) => style === value);

  return match ?? DEFAULT_FIELD_TEXT_FONT_STYLE;
};

/**
 * The field types whose inserted values take the configured colour and font
 * style.
 *
 * Configured with `NEXT_PUBLIC_FIELD_TEXT_STYLE_TYPES` as a comma-separated
 * list drawn from `NAME`, `EMAIL`, `DATE`, `INITIALS`, `TEXT`, `NUMBER`.
 * Unknown values are ignored; unset means the default list.
 */
export const getFieldTextStyleTypes = (): FieldType[] => {
  const raw = env('NEXT_PUBLIC_FIELD_TEXT_STYLE_TYPES');

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_FIELD_TEXT_STYLE_TYPES;
  }

  const requested = raw.split(',').map((value) => value.trim().toUpperCase());

  return STYLEABLE_FIELD_TYPES.filter((type) => requested.includes(type));
};

export type TFieldValueTextStyle = {
  fill: string;
  fontStyle: TFieldTextFontStyle;
};

/**
 * The colour and font style to draw a field's text in. Labels, placeholders
 * and field types outside the configured list are drawn plain black.
 */
export const getFieldValueTextStyle = (type: FieldType, isLabel: boolean): TFieldValueTextStyle => {
  if (isLabel || !getFieldTextStyleTypes().includes(type)) {
    return { fill: DEFAULT_FIELD_TEXT_COLOR, fontStyle: DEFAULT_FIELD_TEXT_FONT_STYLE };
  }

  return { fill: getFieldTextColor(), fontStyle: getFieldTextFontStyle() };
};
