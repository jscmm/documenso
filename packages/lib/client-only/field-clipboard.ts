import type { TLocalField } from './hooks/use-editor-fields';

/**
 * Keyboard editing for the envelope editor: delete, copy and paste the
 * selected fields.
 *
 * Every page renders its own canvas with its own selection, so shortcuts go
 * to the page the author last pressed on (the "active" page). The clipboard
 * is shared across pages: copy fields on one page, press on another and
 * paste to put them at the same positions there. Pasting onto the page the
 * fields came from offsets them like "duplicate" does.
 */

export type TFieldTarget = {
  envelopeItemId: string;
  page: number;
};

export type TFieldShortcut = 'delete' | 'copy' | 'paste';

/** Offset of a pasted copy on the page it came from, in percent of the page (as duplicate). */
export const PASTE_OFFSET_PERCENT = 3;

let clipboard: TLocalField[] = [];
let pastesByTarget = new Map<string, number>();
let activeTarget: TFieldTarget | null = null;

const targetKey = (target: TFieldTarget) => `${target.envelopeItemId}:${target.page}`;

export const setActiveFieldTarget = (target: TFieldTarget | null) => {
  activeTarget = target;
};

export const isActiveFieldTarget = (target: TFieldTarget) =>
  activeTarget !== null && targetKey(activeTarget) === targetKey(target);

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

/** Which editing shortcut a key press is, if any. */
export const getFieldShortcut = (
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
): TFieldShortcut | null => {
  const modifier = event.metaKey || event.ctrlKey;

  if (!modifier && !event.altKey && (event.key === 'Delete' || event.key === 'Backspace')) {
    return 'delete';
  }

  if (modifier && !event.altKey && !event.shiftKey) {
    const key = event.key.toLowerCase();

    if (key === 'c') {
      return 'copy';
    }

    if (key === 'v') {
      return 'paste';
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
};
