import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
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

const SPINE_X = 24;
const RIGHT_PAD = 28;

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
  const topY = levelToY(10) * scale;
  const botY = levelToY(0) * scale;
  const cx = width / 2;
  const bottleW = 100 * scale;
  const handleX = Math.max(SPINE_X + 60, width - RIGHT_PAD);
  const bottleHalfW = 36 * scale;
  const shadeH = Math.max(0, botY + 12 - lineY);

  // 100 sub-ticks from 0 to 10 (every 0.1), ticks point right of the spine, numbers sit to the right
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= 100; i++) {
    const v = i / 10;
    const y = levelToY(v) * scale;
    const isMajor = i % 10 === 0;
    const isHalf = i % 5 === 0 && !isMajor;
    const len = isMajor ? 9 : isHalf ? 6 : 3.5;
    ticks.push(
      <Line
        key={`t${i}`}
        x1={SPINE_X}
        x2={SPINE_X + len}
        y1={y}
        y2={y}
        stroke={C.gold}
        strokeOpacity={isMajor ? 0.8 : isHalf ? 0.52 : 0.32}
        strokeWidth={isMajor ? 1.1 : 0.8}
      />,
    );
    if (isMajor) {
      ticks.push(
        <SvgText
          key={`n${i}`}
          x={SPINE_X + 14}
          y={y + 4}
          fontSize={11}
          fontWeight="500"
          fill="rgba(245,244,239,0.68)"
          textAnchor="start"
        >
          {String(v)}
        </SvgText>,
      );
    }
  }

  return (
    <View
      style={[
        { height, width: '100%' },
        Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none', cursor: 'ns-resize' } as object) : null,
      ]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      {width > 0 ? (
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <RadialGradient id="backAura" cx="50%" cy="48%" rx="42%" ry="46%">
              <Stop offset="0" stopColor="#264234" stopOpacity="0.45" />
              <Stop offset="1" stopColor="#14201b" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="shadeV" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#c9a259" stopOpacity="0.30" />
              <Stop offset="0.55" stopColor="#b08843" stopOpacity="0.14" />
              <Stop offset="1" stopColor="#9c7536" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="shadeFadeH" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#0f1a15" stopOpacity="0.55" />
              <Stop offset="0.14" stopColor="#0f1a15" stopOpacity="0" />
              <Stop offset="0.88" stopColor="#0f1a15" stopOpacity="0" />
              <Stop offset="1" stopColor="#0f1a15" stopOpacity="0.85" />
            </LinearGradient>
          </Defs>

          {/* Soft back-bar radial spotlight behind the bottle */}
          <Rect x={0} y={0} width={width} height={height} fill="url(#backAura)" />

          {/* Shaded stock area below the level line */}
          <Rect x={SPINE_X} y={lineY} width={Math.max(0, width - SPINE_X - 12)} height={shadeH} fill="url(#shadeV)" />
          <Rect x={SPINE_X} y={lineY} width={Math.max(0, width - SPINE_X - 12)} height={shadeH} fill="url(#shadeFadeH)" />

          {/* Left ruler spine + ticks */}
          <Line x1={SPINE_X} x2={SPINE_X} y1={topY} y2={botY} stroke={C.gold} strokeOpacity={0.42} strokeWidth={1} />
          {ticks}

          {/* Faint right guide track */}
          <Line x1={handleX} x2={handleX} y1={topY} y2={botY} stroke={C.gold} strokeOpacity={0.2} strokeWidth={1} />

          {/* Horizontal gold level line broken cleanly around the ruler digits and bottle */}
          <Line x1={12} x2={SPINE_X + 2} y1={lineY} y2={lineY} stroke={C.goldBright} strokeWidth={1.4} strokeOpacity={0.92} />
          <Line x1={SPINE_X + 34} x2={Math.max(SPINE_X + 34, cx - bottleHalfW)} y1={lineY} y2={lineY} stroke={C.goldBright} strokeWidth={1.4} strokeOpacity={0.92} />
          <Line x1={Math.min(width - 12, cx + bottleHalfW)} x2={width - 12} y1={lineY} y2={lineY} stroke={C.goldBright} strokeWidth={1.4} strokeOpacity={0.92} />

          {/* Bottle sits cleanly in front of the level line */}
          <BottleGroup product={product} level={level} cx={cx} scale={scale} bottleW={bottleW} />

          {/* Drag handle on the right vertical track */}
          <Circle cx={handleX} cy={lineY} r={11} fill="#000" opacity={0.28} />
          <Circle cx={handleX} cy={lineY} r={8} fill="#2a2618" stroke={C.goldBright} strokeWidth={2} />
        </Svg>
      ) : null}
    </View>
  );
}

function BottleGroup({ product, level, cx, scale, bottleW }: { product: Product; level: number; cx: number; scale: number; bottleW: number }) {
  return (
    <Svg x={cx - bottleW / 2} y={0} width={bottleW} height={BOX_H * scale} viewBox={`0 0 100 ${BOX_H}`}>
      <BottleArt product={product} level={level} uid="main" />
    </Svg>
  );
}
