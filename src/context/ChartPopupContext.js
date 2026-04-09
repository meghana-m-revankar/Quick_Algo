import React, { createContext, useContext, useReducer } from 'react';

const ChartPopupContext = createContext();

const initialState = {
  isOpen: false,
  symbol: null,
  position: { x: 100, y: 100 },
  zIndex: 999999,
  isMinimized: false,
};

const chartPopupReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_POPUP':
      return {
        ...state,
        isOpen: true,
        symbol: action.payload.symbol,
        position: action.payload.position || { x: 100, y: 100 },
        zIndex: action.payload.zIndex || 999999,
        isMinimized: false,
      };
    case 'CLOSE_POPUP':
      return {
        ...state,
        isOpen: false,
        symbol: null,
        isMinimized: false,
      };
    case 'MINIMIZE_POPUP':
      return {
        ...state,
        isMinimized: true,
      };
    case 'RESTORE_POPUP':
      return {
        ...state,
        isMinimized: false,
      };
    case 'UPDATE_POSITION':
      return {
        ...state,
        position: action.payload.position,
      };
    default:
      return state;
  }
};

export const ChartPopupProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chartPopupReducer, initialState);

  const openPopup = (symbol, position = { x: 100, y: 100 }, zIndex = 999999) => {
    dispatch({
      type: 'OPEN_POPUP',
      payload: { symbol, position, zIndex },
    });
  };

  const closePopup = () => {
    dispatch({ type: 'CLOSE_POPUP' });
  };

  const minimizePopup = () => {
    dispatch({ type: 'MINIMIZE_POPUP' });
  };

  const restorePopup = () => {
    dispatch({ type: 'RESTORE_POPUP' });
  };

  const updatePosition = (position) => {
    dispatch({
      type: 'UPDATE_POSITION',
      payload: { position },
    });
  };

  const value = {
    ...state,
    openPopup,
    closePopup,
    minimizePopup,
    restorePopup,
    updatePosition,
  };

  return (
    <ChartPopupContext.Provider value={value}>
      {children}
    </ChartPopupContext.Provider>
  );
};

export const  useChartPopup = () => {
  const context = useContext(ChartPopupContext);
  if (!context) {
    throw new Error('useChartPopup must be used within a ChartPopupProvider');
  }
  return context;
};
