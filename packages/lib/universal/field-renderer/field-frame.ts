import Konva from 'konva';

import { getSignatureFrameColor, isSignatureFrameEnabled } from '../../constants/signature-frame';
import type { FieldRenderMode } from './field-renderer';

export const FRAME_TICK = 12; // length of the top and bottom ticks
export const FRAME_STROKE = 1.5;
export const FRAME_CAPTION_SIZE = 6;
export const FRAME_CAPTION_GAP = 2; // between the caption's baseline and the field's top edge
// The interface font (registered for the seal renderer too), not the field font.
export const FRAME_CAPTION_FONT = 'Inter, sans-serif';

export const FRAME_IDENTIFIER_LENGTH = 15;

type SignatureFrameOptions = {
  fieldGroup: Konva.Group;
  width: number;
  height: number;
  caption: string;
  mode: FieldRenderMode;
  inserted: boolean;
  /** Printed small under the box: the field's identifier, as recorded in the audit log. */
  identifier?: string;
};

/**
 * The field's identifier as printed under a signature: any prefix before an
 * underscore dropped, upper-cased, cut to a fixed length with an ellipsis.
 */
export const formatFrameIdentifier = (secondaryId: string | null | undefined): string | undefined => {
  if (!secondaryId) {
    return undefined;
  }

  const bare = secondaryId.includes('_') ? secondaryId.slice(secondaryId.lastIndexOf('_') + 1) : secondaryId;
  const clean = bare.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (!clean) {
    return undefined;
  }

  return clean.length > FRAME_IDENTIFIER_LENGTH ? `${clean.slice(0, FRAME_IDENTIFIER_LENGTH)}...` : clean;
};

/**
 * A bracket down the left edge of an inserted signature or initials field,
 * with a small caption above it. Drawn on the signing page and into the
 * sealed PDF only when the instance enables it; never in the editor.
 */
export const renderSignatureFrame = (options: SignatureFrameOptions) => {
  const { fieldGroup, width, height, caption, mode, inserted, identifier } = options;

  if (mode === 'edit' || !inserted || !isSignatureFrameEnabled()) {
    return;
  }

  const color = getSignatureFrameColor();
  const tick = Math.min(FRAME_TICK, width / 3);

  const bracket = new Konva.Line({
    name: 'signature-frame',
    points: [tick, 0, 0, 0, 0, height, tick, height],
    stroke: color,
    strokeWidth: FRAME_STROKE,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0,
    bezier: false,
    listening: false,
  });

  const label = new Konva.Text({
    name: 'signature-frame-caption',
    x: tick + 1,
    y: -(FRAME_CAPTION_SIZE + FRAME_CAPTION_GAP),
    text: caption,
    fontSize: FRAME_CAPTION_SIZE,
    fontFamily: FRAME_CAPTION_FONT,
    fontStyle: 'bold',
    fill: 'black',
    listening: false,
  });

  fieldGroup.add(bracket);
  fieldGroup.add(label);

  if (identifier) {
    fieldGroup.add(
      new Konva.Text({
        name: 'signature-frame-identifier',
        x: tick + 1,
        y: height + FRAME_CAPTION_GAP,
        text: identifier,
        fontSize: FRAME_CAPTION_SIZE,
        fontFamily: FRAME_CAPTION_FONT,
        fill: '#374151',
        listening: false,
      }),
    );
  }
};
