import React from 'react';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Product, Shape } from './data';

/** Bottle art lives in a 100 x 300 box. Liquid 0 sits at Y_BOTTOM, 10 at Y_TOP. */
export const BOX_W = 100;
export const BOX_H = 300;
export const Y_BOTTOM = 288;
export const Y_TOP = 66;

export const levelToY = (level: number) => Y_BOTTOM - (level / 10) * (Y_BOTTOM - Y_TOP);

const PATHS: Record<Shape, string> = {
  standard:
    'M41 22 L59 22 L59 92 C59 112 82 118 82 140 L82 280 Q82 290 72 290 L28 290 Q18 290 18 280 L18 140 C18 118 41 112 41 92 Z',
  round:
    'M43 40 L57 40 L57 80 C57 95 88 110 88 160 L88 270 Q88 290 68 290 L32 290 Q12 290 12 270 L12 160 C12 110 43 95 43 80 Z',
  square:
    'M42 24 L58 24 L58 80 C58 98 82 100 82 124 L82 284 Q82 290 76 290 L24 290 Q18 290 18 284 L18 124 C18 100 42 98 42 80 Z',
  slim: 'M43 22 L57 22 L57 100 C57 125 72 128 72 150 L72 282 Q72 290 64 290 L36 290 Q28 290 28 282 L28 150 C28 128 43 125 43 100 Z',
};

const CAP_TOP: Record<Shape, number> = { standard: 10, round: 28, square: 12, slim: 10 };
const LABEL: Record<Shape, { y: number; h: number; x: number; w: number }> = {
  standard: { y: 166, h: 92, x: 25, w: 50 },
  round: { y: 170, h: 84, x: 15, w: 70 },
  square: { y: 150, h: 104, x: 20, w: 60 },
  slim: { y: 170, h: 86, x: 30, w: 40 },
};

interface Props {
  product: Product;
  level: number;
  uid: string;
  detail?: boolean; // draw label text, highlights
}

/** SVG group — drop inside an <Svg viewBox/transform> of your own. */
export function BottleArt({ product, level, uid, detail = true }: Props) {
  const d = PATHS[product.shape];
  const cap = CAP_TOP[product.shape];
  const lab = LABEL[product.shape];
  const y = levelToY(level);
  const clipId = `clip-${uid}`;
  const shineId = `shine-${uid}`;
  const liquidId = `liq-${uid}`;
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
        <LinearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.22" stopColor="#fff" stopOpacity="0.28" />
          <Stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.85" stopColor="#000" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </LinearGradient>
        <LinearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={product.liquid} stopOpacity="1" />
          <Stop offset="1" stopColor={product.liquid} stopOpacity="0.82" />
        </LinearGradient>
      </Defs>

      {/* cap + foil */}
      <Rect x={44} y={cap} width={12} height={16} rx={2} fill={product.cap} />
      {product.foil ? <Rect x={42} y={cap + 12} width={16} height={34} fill={product.foil} opacity={0.9} /> : null}

      {/* glass */}
      <Path d={d} fill={product.glass} fillOpacity={0.32} />
      {/* liquid */}
      <G clipPath={`url(#${clipId})`}>
        <Rect x={0} y={y} width={BOX_W} height={BOX_H - y} fill={`url(#${liquidId})`} />
        <Rect x={0} y={y} width={BOX_W} height={1.6} fill="#fff" opacity={0.35} />
        {/* label */}
        <Rect x={lab.x} y={lab.y} width={lab.w} height={lab.h} rx={2} fill={product.label} />
        <Rect x={lab.x + 3} y={lab.y + 3} width={lab.w - 6} height={lab.h - 6} rx={1} fill="none" stroke={product.labelInk} strokeOpacity={0.35} strokeWidth={0.8} />
        {detail ? (
          <SvgText
            x={50}
            y={lab.y + lab.h / 2 + 4}
            fontSize={product.mark.length > 8 ? 8.5 : 11}
            fontWeight="bold"
            fill={product.labelInk}
            textAnchor="middle"
          >
            {product.mark}
          </SvgText>
        ) : null}
        {/* shading */}
        <Rect x={0} y={0} width={BOX_W} height={BOX_H} fill={`url(#${shineId})`} />
      </G>
      <Path d={d} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={1.2} />
    </G>
  );
}

/** Small standalone bottle for the carousel. */
export function BottleThumb({ product, level, size = 46 }: { product: Product; level: number; size?: number }) {
  return (
    <Svg width={size * (BOX_W / BOX_H) * 1.5} height={size} viewBox={`15 0 70 ${BOX_H}`} preserveAspectRatio="xMidYMid meet">
      <BottleArt product={product} level={level} uid={`t-${product.id}`} detail={false} />
    </Svg>
  );
}
