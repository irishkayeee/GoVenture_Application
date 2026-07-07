/**
 * charts.tsx
 * Lightweight SVG chart primitives (line, bar, donut) built on react-native-svg —
 * no extra charting dependency needed.
 *
 * Only Path/G/Text are used here (not Rect/Circle/Line/LinearGradient/Stop):
 * this project's tsconfig (moduleResolution "bundler" + react-native-svg's
 * typings) fails to type-check most named exports besides Svg/G/Path/Defs/Text,
 * so every shape below is expressed as a <Path> instead.
 */

import React from 'react';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../ThemeContext';

const PAD = { left: 6, right: 6, top: 14, bottom: 20 };

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutWedgePath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd   = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd   = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

type SeriesChartProps = {
  values: number[];
  labels: string[];
  color:  string;
  width:  number;
  height?: number;
};

export function MiniLineChart({ values, labels, color, width, height = 190 }: SeriesChartProps) {
  const { C } = useAppTheme();
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? chartW / (values.length - 1) : 0;

  const points = values.map((v, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`
    : '';

  const labelStep = Math.max(1, Math.ceil(labels.length / 6));

  return (
    <Svg width={width} height={height}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <Path
          key={f}
          d={`M ${PAD.left} ${PAD.top + chartH * f} L ${width - PAD.right} ${PAD.top + chartH * f}`}
          stroke={C.divider} strokeWidth={1} opacity={0.5}
        />
      ))}

      {!!areaPath && <Path d={areaPath} fill={color} opacity={0.14} />}
      {!!linePath && <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}

      {points.length > 0 && (
        <Path d={circlePath(points[points.length - 1].x, points[points.length - 1].y, 3.5)} fill={color} />
      )}

      {labels.map((l, i) => (
        i % labelStep === 0 ? (
          <SvgText key={i} x={PAD.left + i * stepX} y={height - 5} fontSize={9} fill={C.brownMid} opacity={0.65} textAnchor="middle">
            {l}
          </SvgText>
        ) : null
      ))}
    </Svg>
  );
}

export function MiniBarChart({ values, labels, color, width, height = 190 }: SeriesChartProps) {
  const { C } = useAppTheme();
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;
  const max = Math.max(1, ...values);
  const gap = 4;
  const barW = values.length > 0 ? (chartW - gap * (values.length - 1)) / values.length : 0;
  const labelStep = Math.max(1, Math.ceil(labels.length / 6));

  return (
    <Svg width={width} height={height}>
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * chartH);
        const x = PAD.left + i * (barW + gap);
        const y = PAD.top + chartH - barH;
        return <Path key={i} d={rectPath(x, y, barW, barH)} fill={color} />;
      })}
      {labels.map((l, i) => (
        i % labelStep === 0 ? (
          <SvgText key={i} x={PAD.left + i * (barW + gap) + barW / 2} y={height - 5} fontSize={9} fill={C.brownMid} opacity={0.65} textAnchor="middle">
            {l}
          </SvgText>
        ) : null
      ))}
    </Svg>
  );
}

type DonutChartProps = {
  slices:      { value: number; color: string }[];
  size?:       number;
  strokeWidth?: number;
};

export function DonutChart({ slices, size = 130, strokeWidth = 16 }: DonutChartProps) {
  const outerR = (size - strokeWidth) / 2 + strokeWidth / 2;
  const innerR = outerR - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const nonZero = slices.filter((s) => s.value > 0).length;

  let angleAcc = 0;
  const wedges = slices.map((s, i) => {
    if (s.value <= 0) return null;
    const fraction = s.value / total;
    const span = nonZero === 1 ? 359.9 : fraction * 360;
    const start = angleAcc;
    const end = angleAcc + span;
    angleAcc += fraction * 360;
    return <Path key={i} d={donutWedgePath(cx, cy, outerR, innerR, start, end)} fill={s.color} />;
  });

  return (
    <Svg width={size} height={size}>
      <G>{wedges}</G>
    </Svg>
  );
}
