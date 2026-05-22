import React, { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

function FleetIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 11.4C4.5 7.87 7.37 5 10.9 5H13.1C16.63 5 19.5 7.87 19.5 11.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Rect x={4.2} y={11.1} width={3.6} height={5.8} rx={1.4} stroke={color} strokeWidth={1.8} />
      <Rect x={16.2} y={11.1} width={3.6} height={5.8} rx={1.4} stroke={color} strokeWidth={1.8} />
      <Path
        d="M16.2 16.9V17.7C16.2 19.26 14.94 20.52 13.38 20.52H12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={10.8} cy={20.5} r={1.2} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export default memo(FleetIcon);
