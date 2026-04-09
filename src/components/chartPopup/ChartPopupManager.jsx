import React from 'react';
import { useChartPopup } from '../../context/ChartPopupContext';
import ChartPopup from './ChartPopup';
import './ChartPopup.scss';

const ChartPopupManager = () => {
  const { isOpen, symbol, position, closePopup } = useChartPopup();

  if (!isOpen) {
    return null;
  }

  return (
    <ChartPopup
      symbol={symbol}
      position={position}
      onClose={closePopup}
    />
  );
};

export default ChartPopupManager;
