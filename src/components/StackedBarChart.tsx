import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../theme';

export type BarBucket = {
  key: string;
  label: string;
  segments: { color: string; valueMs: number }[];
};

type Props = {
  buckets: BarBucket[];
  maxHours: number;
  height?: number;
};

const PAD_LEFT = 34;
const PAD_RIGHT = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const TICKS = 6;

export function StackedBarChart({ buckets, maxHours, height = 190 }: Props) {
  const [width, setWidth] = useState(0);
  const chartHeight = height - PAD_TOP - PAD_BOTTOM;
  const chartWidth = width - PAD_LEFT - PAD_RIGHT;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {Array.from({ length: TICKS + 1 }, (_, i) => {
            const y = PAD_TOP + (chartHeight * i) / TICKS;
            const value = Math.round((maxHours * (TICKS - i)) / TICKS);
            return (
              <G key={`tick-${i}`}>
                <Line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={width - PAD_RIGHT}
                  y2={y}
                  stroke={COLORS.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD_LEFT - 7}
                  y={y + 3}
                  fontSize={9}
                  fill={COLORS.faint}
                  textAnchor="end"
                >
                  {`${value}h`}
                </SvgText>
              </G>
            );
          })}

          {buckets.map((bucket, bucketIndex) => {
            const slot = chartWidth / buckets.length;
            const barWidth = Math.min(26, slot * 0.55);
            const x = PAD_LEFT + slot * bucketIndex + (slot - barWidth) / 2;
            let accumulated = 0;
            return (
              <G key={bucket.key}>
                {bucket.segments.map((segment, segmentIndex) => {
                  const segmentHeight =
                    (segment.valueMs / (maxHours * 3_600_000)) * chartHeight;
                  const y = PAD_TOP + chartHeight - accumulated - segmentHeight;
                  accumulated += segmentHeight;
                  if (segmentHeight <= 0) return null;
                  return (
                    <Rect
                      key={`${bucket.key}-${segmentIndex}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={segmentHeight}
                      rx={2}
                      fill={segment.color}
                    />
                  );
                })}
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 7}
                  fontSize={10}
                  fontWeight="600"
                  fill={COLORS.muted}
                  textAnchor="middle"
                >
                  {bucket.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
