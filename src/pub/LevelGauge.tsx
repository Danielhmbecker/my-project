import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { BottleArt, BOX_H, levelToY } from './Bottle';
import { Product } from './data';
import { C } from './theme';

interface Props {
  product: Product;
  level: number; // fractional while dragging
  height: number;
  onChange: (level: number) => void; // live
  onRelease: (level: number) => void; // snapped integer
}

const RULER_W = 44;

/** Bottle + 0–10 ruler + draggable brass level line, drawn in a single SVG. */
export function LevelGauge({ product, level, height, onChange, onRelease }: Props) {
  const [width, setWidth] = useState(0);
  const scale = height / BOX_H;
  const toLevel = (py: number) => {
    const svgY = py / scale;
    const top = levelToY(10);
    const bottom = levelToY(0);
    const l = ((bottom - svgY) / (bottom - top)) * 10;
    return Math.min(10, Math.max(0, l));
  };

  const startY = useRef(0);
  const live = useRef(level);
  live.current = level;
  const cb = useRef({ onChange, onRelease, toLevel });
  cb.current = { onChange, onRelease, toLevel };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          startY.current = e.nativeEvent.locationY;
          cb.current.onChange(cb.current.toLevel(startY.current));
        },
        onPanResponderMove: (_e, g) => {
          cb.current.onChange(cb.current.toLevel(startY.current + g.dy));
        },
        onPanResponderRelease: () => cb.current.onRelease(Math.round(live.current)),
        onPanResponderTerminate: () => cb.current.onRelease(Math.round(live.current)),
      }),
    [],
  );

  const lineY = levelToY(level) * scale;
  const cx = width / 2;
  const bottleW = 100 * scale;
  const ticks = [] as React.ReactElement[];
  for (let i = 0; i <= 20; i++) {
    const v = i / 2;
    const y = levelToY(v) * scale;
    const major = i % 2 === 0;
    ticks.push(
      <Line key={`t${i}`} x1={RULER_W - 14} x2={RULER_W - (major ? 6 : 10)} y1={y} y2={y} stroke={C.gold} strokeOpacity={major ? 0.75 : 0.4} strokeWidth={1} />,
    );
    if (major) {
      ticks.push(
        <SvgText key={`n${i}`} x={RULER_W - 18} y={y + 4} fontSize={11} fill={C.muted} textAnchor="end">
          {String(v)}
        </SvgText>,
      );
    }
  }

  return (
    <View
      style={{ height, width: '100%' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      {width > 0 ? (
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.gold} stopOpacity="0.34" />
              <Stop offset="1" stopColor={C.gold} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          {/* shaded stock below the line */}
          <Rect x={0} y={lineY} width={width} height={Math.max(0, height - lineY)} fill="url(#shade)" />
          {ticks}
          {/* spine */}
          <Line x1={RULER_W - 6} x2={RULER_W - 6} y1={levelToY(10) * scale} y2={levelToY(0) * scale} stroke={C.gold} strokeOpacity={0.4} strokeWidth={1} />
          {/* bottle */}
          <BottleGroup product={product} level={level} cx={cx} scale={scale} bottleW={bottleW} />
          {/* level line + handle */}
          <Line x1={0} x2={width} y1={lineY} y2={lineY} stroke={C.gold} strokeWidth={1.6} strokeOpacity={0.95} />
          <Circle cx={width - 18} cy={lineY} r={9} fill={C.goldLight} stroke={C.goldDeep} strokeWidth={2.5} />
        </Svg>
      ) : null}
    </View>
  );
}

function BottleGroup({ product, level, cx, scale, bottleW }: { product: Product; level: number; cx: number; scale: number; bottleW: number }) {
  // translate/scale via a nested Svg so BottleArt can stay in its 100x300 box
  return (
    <Svg x={cx - bottleW / 2} y={0} width={bottleW} height={BOX_H * scale} viewBox={`0 0 100 ${BOX_H}`}>
      <BottleArt product={product} level={level} uid="main" />
    </Svg>
  );
}
