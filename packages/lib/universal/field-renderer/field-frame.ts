import Konva from 'konva';

import { getSignatureFrameColor, isSignatureFrameEnabled } from '../../constants/signature-frame';
import type { FieldRenderMode } from './field-renderer';

export const FRAME_TICK = 12; // length of the top and bottom ticks
export const FRAME_STROKE = 1.5;
export const FRAME_CAPTION_SIZE = 6;
export const FRAME_CAPTION_GAP = 2; // between the caption's baseline and the field's top edge
// The interface font (registered for the seal renderer too), not the field font.
export const FRAME_CAPTION_FONT = 'Inter, sans-serif';

type SignatureFrameOptions = {
  fieldGroup: Konva.Group;
  width: number;
  height: number;
  caption: string;
  mode: FieldRenderMode;
  inserted: boolean;
};

/**
 * A bracket down the left edge of an inserted signature or initials field,
 * with a small caption above it. Drawn on the signing page and into the
 * sealed PDF only when the instance enables it; never in the editor.
 */
export const renderSignatureFrame = (options: SignatureFrameOptions) => {
  const { fieldGroup, width, height, caption, mode, inserted } = options;

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
};
