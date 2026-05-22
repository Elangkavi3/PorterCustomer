import React, { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

function ProfileIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 18.2C5 15.6 7.3 13.8 10.1 13.8H13.9C16.7 13.8 19 15.6 19 18.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default memo(ProfileIcon);
