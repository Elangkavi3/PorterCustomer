import React from 'react';
import AppBadge from './ui/AppBadge';

function StatusBadge({ status, tone }) {
  return <AppBadge label={status} tone={tone} />;
}

export default StatusBadge;
