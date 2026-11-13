import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../theme';

export type DonutSegment = {
  color: string;
  valueMs: number;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function DonutChart({
  segments,
  size = 210,
  thickness = 32,
  centerLabel,
  centerValue,
}: Props) {
  const active = segments.filter((s) => s.valueMs > 0);
  const totalMs = active.reduce((acc, s) => acc + s.valueMs, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = active.length > 1 ? 2 : 0;

  const arcs = active.map((segment, index) => {
    const sweep = totalMs > 0 ? (segment.valueMs / totalMs) * 360 : 0;
    const before = active
      .slice(0, index)
      .reduce((acc, s) => acc + (totalMs > 0 ? (s.valueMs / totalMs) * 360 : 0), 0);
    return { ...segment, startAngle: before + gapDeg / 2, endAngle: before + sweep - gapDeg / 2, sweep };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {totalMs === 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={COLORS.track}
            strokeWidth={thickness}
            fill="none"
          />
        )}
        {arcs.map((arc, index) =>
          arc.sweep >= 359.5 ? (
            <Circle
              key={index}
              cx={cx}
              cy={cy}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              fill="none"
            />
          ) : (
            <Path
              key={index}
              d={describeArc(cx, cy, radius, arc.startAngle, arc.endAngle)}
              stroke={arc.color}
              strokeWidth={thickness}
              fill="none"
            />
          ),
        )}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        <Text style={styles.centerValue}>{centerValue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  centerValue: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
  },
});
