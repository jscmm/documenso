import Konva from 'konva';

import { getSignatureFrameColor, isSignatureFrameEnabled } from '../../constants/signature-frame';
import type { FieldRenderMode } from './field-renderer';

// The interface font (registered for the seal renderer too), not the field font.
export const FRAME_CAPTION_FONT = 'Inter, sans-serif';
export const FRAME_STROKE = 0.8;
export const FRAME_IDENTIFIER_LENGTH = 15;

export type FrameKind = 'signature' | 'initials';

type FrameSpec = {
  radius: number;
  tick: number; // the rules run from the corner to here; caption and identifier start just after
  captionSize: number;
  identifierSize: number;
};

/**
 * The frame is the field's box: its top and bottom rules are the box's top
 * and bottom edges, so the caller decides where the mark sits on the page.
 * Proportions measured off a signed page: a 0.8 pt stroke, 6 pt corners,
 * rules that stop where the 6.5 pt bold caption begins, the identifier in
 * 5.5 pt on the bottom rule. Initials use a smaller mark.
 */
const FRAME_SPECS: Record<FrameKind, FrameSpec> = {
  signature: { radius: 6, tick: 15, captionSize: 6.5, identifierSize: 5.5 },
  initials: { radius: 4, tick: 10, captionSize: 5, identifierSize: 0 },
};

type SignatureFrameOptions = {
  fieldGroup: Konva.Group;
  height: number;
  kind: FrameKind;
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
 * with a small caption on its top rule and, for signatures, the identifier
 * on its bottom rule. Drawn on the signing page and into the sealed PDF only
 * when the instance enables it; never in the editor.
 */
export const renderSignatureFrame = (options: SignatureFrameOptions) => {
  const { fieldGroup, height, kind, caption, mode, inserted, identifier } = options;

  if (mode === 'edit' || !inserted || !isSignatureFrameEnabled()) {
    return;
  }

  const spec = FRAME_SPECS[kind];
  const color = getSignatureFrameColor();
  const top = 0;
  const bottom = height;
  const r = Math.min(spec.radius, height / 2);
  const x = FRAME_STROKE / 2;

  // Rounded corners as quadratic curves with the corner as control point.
  const bracket = new Konva.Path({
    name: 'signature-frame',
    data:
      `M ${spec.tick} ${top} H ${x + r} Q ${x} ${top} ${x} ${top + r} ` +
      `V ${bottom - r} Q ${x} ${bottom} ${x + r} ${bottom} H ${spec.tick}`,
    stroke: color,
    strokeWidth: FRAME_STROKE,
    lineCap: 'butt',
    lineJoin: 'round',
    listening: false,
  });

  // The caption sits on the top rule: the rule runs through the middle of its capitals.
  const label = new Konva.Text({
    name: 'signature-frame-caption',
    x: spec.tick + 1,
    y: top - spec.captionSize * 0.55,
    text: caption,
    fontSize: spec.captionSize,
    fontFamily: FRAME_CAPTION_FONT,
    fontStyle: 'bold',
    fill: 'black',
    listening: false,
  });

  fieldGroup.add(bracket);
  fieldGroup.add(label);

  if (identifier && spec.identifierSize > 0) {
    fieldGroup.add(
      new Konva.Text({
        name: 'signature-frame-identifier',
        x: spec.tick + 1,
        y: bottom - spec.identifierSize * 0.55,
        text: identifier,
        fontSize: spec.identifierSize,
        fontFamily: FRAME_CAPTION_FONT,
        fill: '#333333',
        listening: false,
      }),
    );
  }
};
