import React, { memo } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

function EarningsIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color}>
      <Circle cx={12} cy={12} r={7.5} stroke="currentColor" strokeWidth={1.8} />
      <Path
        d="M14.8 9.6C14.4 8.8 13.5 8.3 12.4 8.3C11 8.3 10 9 10 10C10 11 10.7 11.5 12.5 11.9C14.1 12.2 14.8 12.7 14.8 13.8C14.8 14.9 13.8 15.7 12.3 15.7C11.1 15.7 10 15.1 9.5 14.1"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12.2 7V8.3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12.2 15.7V17" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default memo(EarningsIcon);
