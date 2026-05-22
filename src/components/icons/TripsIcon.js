import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

function TripsIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4.2} y={5.2} width={15.6} height={13.6} rx={2.2} stroke={color} strokeWidth={1.8} />
      <Path d="M8.2 9.2H15.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.2 13H13.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default memo(TripsIcon);
