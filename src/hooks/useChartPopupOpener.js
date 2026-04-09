import { useCallback } from 'react';
import { useChartPopup } from '#context/ChartPopupContext';

export const useChartPopupOpener = () => {
  const { openPopup, closePopup, isOpen, symbol } = useChartPopup();

  const openChartPopup = useCallback((symbol, position = { x: 100, y: 100 }) => {
    if (symbol) {
      openPopup(symbol, position);
    }
  }, [openPopup]);

  const closeChartPopup = useCallback(() => {
    closePopup();
  }, [closePopup]);

  return {
    openChartPopup,
    closeChartPopup,
    isChartOpen: isOpen,
    currentSymbol: symbol,
  };
};
