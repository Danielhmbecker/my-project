import React from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Product, Shape } from './data';

/** Bottle art lives in a 100 x 300 box. Liquid 0 sits at Y_BOTTOM, 10 at Y_TOP. */
export const BOX_W = 100;
export const BOX_H = 300;
export const Y_BOTTOM = 278;
export const Y_TOP = 72;

export const levelToY = (level: number) => Y_BOTTOM - (level / 10) * (Y_BOTTOM - Y_TOP);

const PATHS: Record<Shape, string> = {
  standard:
    'M42 30 L58 30 L60 72 C61 92 85 100 85 124 L85 276 Q85 287 72 288 Q50 290 28 288 Q15 287 15 276 L15 124 C15 100 39 92 40 72 Z',
  round:
    'M43 42 L57 42 L58 76 C59 92 90 108 90 158 L90 268 Q90 287 69 288 Q50 290 31 288 Q10 287 10 268 L10 158 C10 108 41 92 42 76 Z',
  square:
    'M42 32 L58 32 L59 76 C60 94 84 98 84 122 L84 280 Q84 288 75 289 Q50 290 25 289 Q16 288 16 280 L16 122 C16 98 40 94 41 76 Z',
  slim: 'M43 30 L57 30 L58 88 C58.5 114 75 120 75 146 L75 278 Q75 287 64 288 Q50 290 36 288 Q25 287 25 278 L25 146 C25 120 41.5 114 42 88 Z',
};

const CAP_Y: Record<Shape, number> = { standard: 18, round: 30, square: 19, slim: 18 };
const LABEL: Record<Shape, { y: number; h: number; x: number; w: number }> = {
  standard: { y: 136, h: 102, x: 20, w: 60 },
  round: { y: 158, h: 88, x: 15, w: 70 },
  square: { y: 146, h: 104, x: 19, w: 62 },
  slim: { y: 158, h: 92, x: 28, w: 44 },
};

interface Props {
  product: Product;
  level: number;
  uid: string;
  detail?: boolean;
}

/** SVG group — drop inside an <Svg viewBox/transform> of your own. */
export function BottleArt({ product, level, uid, detail = true }: Props) {
  const d = PATHS[product.shape];
  const capY = CAP_Y[product.shape];
  const lab = LABEL[product.shape];
  const y = levelToY(level);
  const clipId = `clip-${uid}`;
  const shineId = `shine-${uid}`;
  const glassId = `glass-${uid}`;
  const liquidId = `liq-${uid}`;
  const isPimms = product.id === 'pimms';

  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
        <LinearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#090c0a" stopOpacity="0.65" />
          <Stop offset="0.18" stopColor={product.glass} stopOpacity="0.35" />
          <Stop offset="0.5" stopColor={product.glass} stopOpacity="0.22" />
          <Stop offset="0.82" stopColor={product.glass} stopOpacity="0.38" />
          <Stop offset="1" stopColor="#070908" stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0.48" />
          <Stop offset="0.09" stopColor="#fff" stopOpacity="0.32" />
          <Stop offset="0.18" stopColor="#fff" stopOpacity="0.06" />
          <Stop offset="0.32" stopColor="#fff" stopOpacity="0.20" />
          <Stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.82" stopColor="#000" stopOpacity="0.25" />
          <Stop offset="0.93" stopColor="#fff" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </LinearGradient>
        <LinearGradient id={liquidId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1b0904" stopOpacity="0.92" />
          <Stop offset="0.18" stopColor={product.liquid} stopOpacity="0.96" />
          <Stop offset="0.5" stopColor={product.liquid} stopOpacity="0.88" />
          <Stop offset="0.84" stopColor={product.liquid} stopOpacity="0.96" />
          <Stop offset="1" stopColor="#160703" stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      {/* Contact shelf shadow */}
      <Ellipse cx={50} cy={290.5} rx={30} ry={3.5} fill="#000" opacity={0.55} />

      {/* Cap + neck seal */}
      <Rect x={41.5} y={capY} width={17} height={14} rx={2} fill={product.cap} />
      {isPimms ? (
        <>
          <Rect x={41.5} y={capY} width={17} height={3.5} rx={1} fill="#a81c22" />
          <Rect x={41} y={capY + 11} width={18} height={11} rx={1} fill="#efe9da" />
          {detail ? (
            <SvgText x={50} y={capY + 18.5} fontSize={4.8} fontWeight="700" fill="#a67c32" textAnchor="middle">
              No.1
            </SvgText>
          ) : null}
        </>
      ) : product.foil ? (
        <Rect x={41} y={capY + 11} width={18} height={18} fill={product.foil} opacity={0.9} />
      ) : null}

      {/* Glass body */}
      <Path d={d} fill={`url(#${glassId})`} />

      <G clipPath={`url(#${clipId})`}>
        {/* Liquid column */}
        {level > 0 ? (
          <>
            <Rect x={0} y={y} width={BOX_W} height={BOX_H - y} fill={`url(#${liquidId})`} />
            {/* Meniscus rim highlight */}
            <Ellipse cx={50} cy={y + 0.8} rx={32} ry={2.4} fill="#ffd9a0" opacity={0.35} />
            <Rect x={0} y={y} width={BOX_W} height={1.4} fill="#fff3d6" opacity={0.5} />
          </>
        ) : null}

        {/* Glass punt / thick bottom reflection */}
        <Path
          d="M15 278 Q50 285 85 278 L85 290 L15 290 Z"
          fill="#d9c6b4"
          opacity={0.22}
        />
        <Path
          d="M22 282 Q50 288 78 282"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.38}
          strokeWidth={1}
        />

        {/* Pimm's shoulder collar */}
        {isPimms ? (
          <G>
            <Polygon points="28,96 72,96 77,108 23,108" fill="#f1ead8" />
            <Polygon points="29,97.5 71,97.5 75,106.5 25,106.5" fill="none" stroke="#b9934d" strokeWidth={0.7} />
            {detail ? (
              <SvgText x={50} y={104.5} fontSize={5.5} fontWeight="bold" fill="#9a1e24" textAnchor="middle">
                No.1
              </SvgText>
            ) : null}
          </G>
        ) : null}

        {/* Label */}
        {isPimms ? (
          <PimmsLabel detail={detail} />
        ) : product.shape === 'round' && product.id === 'hendricks' ? (
          <G>
            <Polygon points="50,154 78,196 50,238 22,196" fill={product.label} />
            <Polygon points="50,159 73,196 50,233 27,196" fill="none" stroke="#333" strokeWidth={0.8} strokeOpacity={0.45} />
            {detail ? (
              <SvgText x={50} y={199} fontSize={7.5} fontWeight="bold" fill={product.labelInk} textAnchor="middle">
                {product.mark}
              </SvgText>
            ) : null}
          </G>
        ) : (
          <G>
            <Rect x={lab.x} y={lab.y} width={lab.w} height={lab.h} rx={2.5} fill={product.label} />
            <Rect
              x={lab.x + 2.5}
              y={lab.y + 2.5}
              width={lab.w - 5}
              height={lab.h - 5}
              rx={1.5}
              fill="none"
              stroke={product.labelInk}
              strokeOpacity={0.35}
              strokeWidth={0.8}
            />
            {product.id === 'bacardi' ? (
              <Circle cx={50} cy={lab.y + 22} r={8} fill="#a8191e" />
            ) : null}
            {product.id === 'absolut' ? (
              <Rect x={lab.x + 4} y={lab.y + 26} width={lab.w - 8} height={14} rx={2} fill="#1d4f9c" />
            ) : null}
            {detail ? (
              <SvgText
                x={50}
                y={lab.y + lab.h / 2 + 4}
                fontSize={product.mark.length > 8 ? 7.5 : 10}
                fontWeight="bold"
                fill={product.labelInk}
                textAnchor="middle"
              >
                {product.mark}
              </SvgText>
            ) : null}
          </G>
        )}

        {/* Cylindrical bottle specular & edge shading */}
        <Rect x={0} y={0} width={BOX_W} height={BOX_H} fill={`url(#${shineId})`} />
        {/* Crisp left & right shoulder glints */}
        <Path
          d="M23 122 C23 102 39 92 42 74"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.34}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Path
          d="M77 122 C77 104 64 95 60 80"
          fill="none"
          stroke="#fff"
          strokeOpacity={0.18}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      </G>

      {/* Outer glass outline */}
      <Path d={d} fill="none" stroke="#fff" strokeOpacity={0.26} strokeWidth={1} />
    </G>
  );
}

function PimmsLabel({ detail }: { detail: boolean }) {
  return (
    <G>
      {/* Main cream label with top crest arch */}
      <Path
        d="M19 134 L38 134 Q50 116 62 134 L81 134 L81 235 L19 235 Z"
        fill="#f2ebda"
      />
      {/* Gold inner border */}
      <Path
        d="M22 137 L39 137 Q50 121 61 137 L78 137 L78 232 L22 232 Z"
        fill="none"
        stroke="#b89146"
        strokeWidth={0.9}
      />
      {/* Gold crown crest in arch */}
      <Circle cx={50} cy={137} r={8.5} fill="#efe5cc" stroke="#b89146" strokeWidth={0.8} />
      <Polygon points="44,139 45,133 48,136 50,132 52,136 55,133 56,139" fill="#b88d32" />
      <Rect x={44} y={139.5} width={12} height={2} rx={0.5} fill="#9c1c22" />

      {/* PIMM'S wordmark */}
      {detail ? (
        <>
          <SvgText x={50} y={166} fontSize={14.8} fontWeight="bold" fill="#9c1c22" textAnchor="middle" letterSpacing={0.2}>
            PIMM'S
          </SvgText>
          <Line x1={29} y1={172} x2={71} y2={172} stroke="#b89146" strokeWidth={0.6} />
          <SvgText x={50} y={193} fontSize={14} fontWeight="bold" fontStyle="italic" fill="#9e762c" textAnchor="middle">
            No.1
          </SvgText>
          <Path d="M33 191 Q50 186 67 190" fill="none" stroke="#302820" strokeWidth={0.7} />
          <SvgText x={50} y={209} fontSize={4.4} fontWeight="600" fill="#504538" textAnchor="middle" letterSpacing={0.4}>
            THE ORIGINAL
          </SvgText>
          <SvgText x={50} y={215} fontSize={3.7} fill="#6d6253" textAnchor="middle">
            HANDMADE LIQUEUR
          </SvgText>
          <SvgText x={26} y={228} fontSize={3.9} fill="#6d6253" textAnchor="start">
            75cl
          </SvgText>
          <SvgText x={74} y={228} fontSize={3.9} fill="#6d6253" textAnchor="end">
            25% vol
          </SvgText>
        </>
      ) : (
        <>
          <Rect x={26} y={155} width={48} height={11} rx={1} fill="#9c1c22" />
          <Rect x={35} y={177} width={30} height={8} rx={1} fill="#b89146" />
        </>
      )}

      {/* Lower sub-label */}
      <Rect x={19} y={239} width={62} height={28} rx={1} fill="#ede6d4" />
      <Rect x={21.5} y={241.5} width={57} height={23} fill="none" stroke="#b89146" strokeWidth={0.7} />
      <Line x1={50} y1={242} x2={50} y2={264} stroke="#b89146" strokeWidth={0.6} />
      <Line x1={26} y1={249} x2={46} y2={249} stroke="#8f8371" strokeWidth={0.8} />
      <Line x1={26} y1={254} x2={44} y2={254} stroke="#8f8371" strokeWidth={0.8} />
      <Line x1={54} y1={249} x2={74} y2={249} stroke="#8f8371" strokeWidth={0.8} />
      <Line x1={54} y1={254} x2={72} y2={254} stroke="#8f8371" strokeWidth={0.8} />
    </G>
  );
}

/** Small standalone bottle for the carousel. */
export function BottleThumb({ product, level, size = 48 }: { product: Product; level: number; size?: number }) {
  return (
    <Svg width={size * (BOX_W / BOX_H) * 1.5} height={size} viewBox={`8 12 84 ${BOX_H - 16}`} preserveAspectRatio="xMidYMid meet">
      <BottleArt product={product} level={level} uid={`t-${product.id}`} detail={false} />
    </Svg>
  );
}
