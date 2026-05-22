import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

function DashboardIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4.2} y={4.2} width={6.8} height={6.8} rx={1.3} stroke={color} strokeWidth={1.8} />
      <Rect x={13} y={4.2} width={6.8} height={4.6} rx={1.1} stroke={color} strokeWidth={1.8} />
      <Rect x={13} y={10.8} width={6.8} height={9} rx={1.1} stroke={color} strokeWidth={1.8} />
      <Path d="M4.2 13.2H11V19.8H4.2V13.2Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export default memo(DashboardIcon);
