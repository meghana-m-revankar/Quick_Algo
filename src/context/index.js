import { createContext } from "react";
export const GlobalContext = createContext();
export const ThemeContext = createContext();
export const OrderContext = createContext();
export const LogsContext = createContext();

// Export StrategyStateContext
export { StrategyStateProvider, useStrategyState } from './StrategyStateContext';