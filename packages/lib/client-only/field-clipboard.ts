import type { TLocalField } from './hooks/use-editor-fields';

/**
 * Keyboard editing for the envelope editor: delete, copy and paste the
 * selected fields.
 *
 * Every page renders its own canvas with its own selection, so delete and
 * copy go to the page the author last pressed on (the "active" page). The
 * clipboard is shared across pages. Paste puts the copied group where the
 * pointer is (its top-left corner at the pointer, the layout kept, moved in
 * to stay on the page); "paste in place" keeps the original positions on the
 * active page, which repeats a row page after page. Pasting in place onto the
 * page the fields came from offsets them like "duplicate" does.
 */

export type TFieldTarget = {
  envelopeItemId: string;
  page: number;
};

export type TFieldShortcut = 'delete' | 'copy' | 'paste' | 'paste-in-place';

/** The pointer over a page, in percent of the page. */
export type TFieldPointer = TFieldTarget & { x: number; y: number };

/** Offset of a pasted copy on the page it came from, in percent of the page (as duplicate). */
export const PASTE_OFFSET_PERCENT = 3;

let clipboard: TLocalField[] = [];
let pastesByTarget = new Map<string, number>();
let activeTarget: TFieldTarget | null = null;
let pointer: TFieldPointer | null = null;

const targetKey = (target: TFieldTarget) => `${target.envelopeItemId}:${target.page}`;

export const setActiveFieldTarget = (target: TFieldTarget | null) => {
  activeTarget = target;
};

export const isActiveFieldTarget = (target: TFieldTarget) =>
  activeTarget !== null && targetKey(activeTarget) === targetKey(target);

export const getActiveFieldTarget = () => activeTarget;

export const setFieldPointer = (next: TFieldPointer | null) => {
  pointer = next;
};

export const getFieldPointer = () => pointer;

export const copyFieldsToClipboard = (fields: TLocalField[]) => {
  clipboard = fields.map((field) => structuredClone(field));
  pastesByTarget = new Map();
};

export const clipboardFieldCount = () => clipboard.length;

/**
 * The copied fields as new fields on `target`: same positions on another
 * page, offset once more for every paste onto the same page.
 */
export const pasteFieldsFromClipboard = (target: TFieldTarget): Omit<TLocalField, 'formId'>[] => {
  if (clipboard.length === 0) {
    return [];
  }

  const key = targetKey(target);
  const fromHere = clipboard.every((field) => targetKey(field) === key);
  const previous = pastesByTarget.get(key) ?? 0;
  const offset = PASTE_OFFSET_PERCENT * (previous + (fromHere ? 1 : 0));

  pastesByTarget.set(key, previous + 1);

  return clipboard.map(({ formId: _formId, ...field }) => ({
    ...structuredClone(field),
    id: undefined,
    envelopeItemId: target.envelopeItemId,
    page: target.page,
    positionX: field.positionX + offset,
    positionY: field.positionY + offset,
  }));
};

/**
 * The copied fields as new fields on the pointer's page, the group's top-left
 * corner at the pointer and moved in as needed to stay on the page.
 */
export const pasteFieldsAtPointer = (at: TFieldPointer): Omit<TLocalField, 'formId'>[] => {
  if (clipboard.length === 0) {
    return [];
  }

  const left = Math.min(...clipboard.map((field) => field.positionX));
  const top = Math.min(...clipboard.map((field) => field.positionY));
  const right = Math.max(...clipboard.map((field) => field.positionX + field.width));
  const bottom = Math.max(...clipboard.map((field) => field.positionY + field.height));

  const x = Math.max(0, Math.min(at.x, 100 - (right - left)));
  const y = Math.max(0, Math.min(at.y, 100 - (bottom - top)));

  return clipboard.map(({ formId: _formId, ...field }) => ({
    ...structuredClone(field),
    id: undefined,
    envelopeItemId: at.envelopeItemId,
    page: at.page,
    positionX: x + field.positionX - left,
    positionY: y + field.positionY - top,
  }));
};

/** Which editing shortcut a key press is, if any. */
export const getFieldShortcut = (
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
): TFieldShortcut | null => {
  const modifier = event.metaKey || event.ctrlKey;

  if (!modifier && !event.altKey && (event.key === 'Delete' || event.key === 'Backspace')) {
    return 'delete';
  }

  if (modifier && !event.altKey) {
    const key = event.key.toLowerCase();

    if (key === 'c' && !event.shiftKey) {
      return 'copy';
    }

    if (key === 'v') {
      return event.shiftKey ? 'paste-in-place' : 'paste';
    }
  }

  return null;
};

/** Key presses inside text inputs belong to the input, not the canvas. */
export const isTextEntryTarget = (target: EventTarget | null) => {
  if (!target || typeof (target as HTMLElement).tagName !== 'string') {
    return false;
  }

  const element = target as HTMLElement;
  const tag = element.tagName.toLowerCase();

  return tag === 'input' || tag === 'textarea' || tag === 'select' || element.isContentEditable === true;
};

/** Test hook: forget the clipboard and the active page. */
export const resetFieldClipboard = () => {
  clipboard = [];
  pastesByTarget = new Map();
  activeTarget = null;
  pointer = null;
};
