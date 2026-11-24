import { FieldType } from '@prisma/client';

/**
 * The size a field gets when it is dropped on a page, in PDF points.
 *
 * Sizes are fixed on the page, so a new field is the same size at every zoom level
 * and window width. Signature-like fields straddle a signature line; text-like
 * fields sit on a single line of a form.
 */
export const NEW_FIELD_SIZE_POINTS: Record<FieldType, { width: number; height: number }> = {
  [FieldType.SIGNATURE]: { width: 110, height: 29 },
  [FieldType.FREE_SIGNATURE]: { width: 110, height: 29 },
  [FieldType.INITIALS]: { width: 40, height: 29 },
  [FieldType.NAME]: { width: 110, height: 15 },
  [FieldType.EMAIL]: { width: 150, height: 15 },
  [FieldType.DATE]: { width: 70, height: 15 },
  [FieldType.TEXT]: { width: 150, height: 15 },
  [FieldType.NUMBER]: { width: 70, height: 15 },
  [FieldType.RADIO]: { width: 90, height: 30 },
  [FieldType.CHECKBOX]: { width: 90, height: 30 },
  [FieldType.DROPDOWN]: { width: 90, height: 30 },
};

type PageElement = Pick<Element, 'getAttribute' | 'getBoundingClientRect'>;

/**
 * The on-screen size, in CSS pixels, of a new field of `type` on `$page`.
 *
 * The page element carries its size in points (`data-page-width`); its rendered
 * width gives the current zoom. Returns null when the page does not say its size.
 */
export const getNewFieldScreenSize = (type: FieldType, $page: PageElement) => {
  const pageWidthPoints = Number($page.getAttribute('data-page-width'));
  const { width: pageWidthPixels } = $page.getBoundingClientRect();

  if (!pageWidthPoints || !pageWidthPixels) {
    return null;
  }

  const pixelsPerPoint = pageWidthPixels / pageWidthPoints;
  const size = NEW_FIELD_SIZE_POINTS[type];

  return {
    width: size.width * pixelsPerPoint,
    height: size.height * pixelsPerPoint,
  };
};
