import { FieldType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { getNewFieldScreenSize, NEW_FIELD_SIZE_POINTS } from './new-field-size';

const page = (pointsWide: number | null, pixelsWide: number) => ({
  getAttribute: (name: string) => (name === 'data-page-width' && pointsWide !== null ? String(pointsWide) : null),
  getBoundingClientRect: () => ({ width: pixelsWide }) as DOMRect,
});

describe('getNewFieldScreenSize', () => {
  it('keeps one size on the page at every zoom level', () => {
    for (const pixelsWide of [612, 918, 1224]) {
      const $page = page(612, pixelsWide);
      const size = getNewFieldScreenSize(FieldType.INITIALS, $page);

      expect(size).not.toBeNull();
      // As a share of the page, which is what the field stores.
      expect(((size?.width ?? 0) / pixelsWide) * 612).toBeCloseTo(40);
      expect(((size?.height ?? 0) / pixelsWide) * 612).toBeCloseTo(29);
    }
  });

  it('scales the on-screen size with the zoom', () => {
    expect(getNewFieldScreenSize(FieldType.SIGNATURE, page(612, 1224))).toEqual({ width: 220, height: 58 });
  });

  it('gives up when the page does not say its size', () => {
    expect(getNewFieldScreenSize(FieldType.DATE, page(null, 800))).toBeNull();
    expect(getNewFieldScreenSize(FieldType.DATE, page(612, 0))).toBeNull();
  });

  it('has a size for every field type', () => {
    for (const type of Object.values(FieldType)) {
      expect(NEW_FIELD_SIZE_POINTS[type].width).toBeGreaterThan(0);
      expect(NEW_FIELD_SIZE_POINTS[type].height).toBeGreaterThan(0);
    }
  });
});
