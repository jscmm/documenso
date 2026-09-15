/**
 * !: This is a workaround to fix the memory leak in the skia-canvas library.
 * !: Internals are ported from the original `konva/skia-backend.js` file.
 */

import { Canvas, DOMMatrix, Image, Path2D } from '@documenso/skia-canvas';
import { Konva } from 'konva/lib/_CoreInternals';
import { Text } from 'konva/lib/shapes/Text';

// @ts-expect-error skia-canvas satisfies the requirements
global.DOMMatrix = DOMMatrix;

// @ts-expect-error skia-canvas satisfies the requirements
global.Path2D = Path2D;
Path2D.prototype.toString = () => '[object Path2D]';

Konva.Util['createCanvasElement'] = () => {
  const node = new Canvas(300, 300);
  node.gpu = false;

  if (!('style' in node) || !node['style']) {
    Object.assign(node, { style: {} });
  }

  node.toString = () => '[object HTMLCanvasElement]';
  const ctx = node.getContext('2d');

  Object.defineProperty(ctx, 'canvas', {
    get: () => node,
  });

  return node as unknown as HTMLCanvasElement;
};

Konva.Util.createImageElement = () => {
  const node = new Image();
  node.toString = () => '[object HTMLImageElement]';

  return node as unknown as HTMLImageElement;
};

/**
 * Mirrors Konva's private font-family normaliser: families containing a
 * space are quoted so the canvas font shorthand stays parseable.
 */
const normalizeFontFamily = (fontFamily: string) =>
  fontFamily
    .split(',')
    .map((family) => {
      const trimmed = family.trim();
      const hasSpace = trimmed.includes(' ');
      const hasQuotes = trimmed.includes('"') || trimmed.includes("'");

      return hasSpace && !hasQuotes ? `"${trimmed}"` : trimmed;
    })
    .join(', ');

/**
 * skia-canvas drops a font style when a later `normal` keyword follows it:
 * `italic normal 12px …` is parsed as upright. Konva always writes the font
 * variant after the style, so build the shorthand without default keywords.
 */
Text.prototype._getContextFont = function (this: Text) {
  const keywords = [this.fontStyle(), this.fontVariant()].filter((keyword) => keyword && keyword !== 'normal');

  return [...keywords, `${this.fontSize()}px`, normalizeFontFamily(this.fontFamily())].join(' ');
};

Konva._renderBackend = '@documenso/skia-canvas';

export default Konva;
