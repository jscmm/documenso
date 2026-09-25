import { beforeEach, describe, expect, it } from 'vitest';

import {
  clipboardFieldCount,
  copyFieldsToClipboard,
  getFieldShortcut,
  isActiveFieldTarget,
  isTextEntryTarget,
  PASTE_OFFSET_PERCENT,
  pasteFieldsAtPointer,
  pasteFieldsFromClipboard,
  resetFieldClipboard,
  setActiveFieldTarget,
} from './field-clipboard';
import type { TLocalField } from './hooks/use-editor-fields';

const field = (overrides: Partial<TLocalField> = {}): TLocalField =>
  ({
    formId: 'a',
    id: 7,
    envelopeItemId: 'item',
    page: 54,
    type: 'SIGNATURE',
    recipientId: 1,
    positionX: 10,
    positionY: 60,
    width: 18,
    height: 3.7,
    fieldMeta: { type: 'signature', fontSize: 13 },
    ...overrides,
  }) as TLocalField;

const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
  ({ key: k, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods }) as KeyboardEvent;

describe('field clipboard', () => {
  beforeEach(() => resetFieldClipboard());

  it('pastes onto another page at the same positions', () => {
    copyFieldsToClipboard([field(), field({ formId: 'b', type: 'DATE', positionX: 60 })]);

    const pasted = pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 55 });

    expect(pasted).toHaveLength(2);
    expect(pasted.map((f) => [f.page, f.positionX, f.positionY])).toEqual([
      [55, 10, 60],
      [55, 60, 60],
    ]);
    expect(pasted.every((f) => f.id === undefined && !('formId' in f))).toBe(true);
  });

  it('offsets a paste onto the page the fields came from, more each time', () => {
    copyFieldsToClipboard([field()]);

    const first = pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 54 });
    const second = pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 54 });

    expect(first[0].positionX).toBe(10 + PASTE_OFFSET_PERCENT);
    expect(second[0].positionX).toBe(10 + 2 * PASTE_OFFSET_PERCENT);
  });

  it('does not stack a second paste on another page exactly on the first', () => {
    copyFieldsToClipboard([field()]);

    pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 55 });
    const again = pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 55 });

    expect(again[0].positionX).toBe(10 + PASTE_OFFSET_PERCENT);
  });

  it('keeps its own copy of the fields', () => {
    const original = field();
    copyFieldsToClipboard([original]);
    original.positionX = 99;

    expect(pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 55 })[0].positionX).toBe(10);
    expect(clipboardFieldCount()).toBe(1);
  });

  it('pastes the group at the pointer, keeping its layout', () => {
    copyFieldsToClipboard([field(), field({ formId: 'b', type: 'DATE', positionX: 60, positionY: 62 })]);

    const pasted = pasteFieldsAtPointer({ envelopeItemId: 'item', page: 56, x: 20, y: 30 });

    expect(pasted.map((f) => [f.page, f.positionX, f.positionY])).toEqual([
      [56, 20, 30],
      [56, 70, 32],
    ]);
  });

  it('moves a group pasted near the edge back onto the page', () => {
    copyFieldsToClipboard([field(), field({ formId: 'b', positionX: 60 })]);

    // the group is 68% wide (10..78) and 3.7% tall
    const pasted = pasteFieldsAtPointer({ envelopeItemId: 'item', page: 54, x: 90, y: 99 });

    expect(pasted[0].positionX).toBeCloseTo(32);
    expect(pasted[1].positionX + pasted[1].width).toBeCloseTo(100);
    expect(pasted[0].positionY + pasted[0].height).toBeCloseTo(100);
  });

  it('pastes nothing before a copy', () => {
    expect(pasteFieldsFromClipboard({ envelopeItemId: 'item', page: 1 })).toEqual([]);
  });

  it('tracks the page the author last pressed on', () => {
    setActiveFieldTarget({ envelopeItemId: 'item', page: 3 });

    expect(isActiveFieldTarget({ envelopeItemId: 'item', page: 3 })).toBe(true);
    expect(isActiveFieldTarget({ envelopeItemId: 'item', page: 4 })).toBe(false);
    expect(isActiveFieldTarget({ envelopeItemId: 'other', page: 3 })).toBe(false);
  });
});

describe('getFieldShortcut', () => {
  it('reads delete, copy and paste on both platforms', () => {
    expect(getFieldShortcut(key('Delete'))).toBe('delete');
    expect(getFieldShortcut(key('Backspace'))).toBe('delete');
    expect(getFieldShortcut(key('c', { metaKey: true }))).toBe('copy');
    expect(getFieldShortcut(key('C', { ctrlKey: true }))).toBe('copy');
    expect(getFieldShortcut(key('v', { metaKey: true }))).toBe('paste');
    expect(getFieldShortcut(key('V', { metaKey: true, shiftKey: true }))).toBe('paste-in-place');
    expect(getFieldShortcut(key('v', { ctrlKey: true, shiftKey: true }))).toBe('paste-in-place');
  });

  it('ignores other keys and modified deletes', () => {
    expect(getFieldShortcut(key('c'))).toBeNull();
    expect(getFieldShortcut(key('Backspace', { metaKey: true }))).toBeNull();
    expect(getFieldShortcut(key('c', { metaKey: true, shiftKey: true }))).toBeNull();
    expect(getFieldShortcut(key('x', { metaKey: true }))).toBeNull();
  });
});

describe('isTextEntryTarget', () => {
  it('leaves keys in text inputs alone', () => {
    expect(isTextEntryTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBe(true);
    expect(isTextEntryTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget)).toBe(true);
    expect(isTextEntryTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget)).toBe(true);
    expect(isTextEntryTarget({ tagName: 'DIV', isContentEditable: false } as unknown as EventTarget)).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });
});
