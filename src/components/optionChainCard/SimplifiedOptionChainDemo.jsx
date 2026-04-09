import React, { useState } from 'react';
import { SimplifiedOptionChainCard } from './index';

const SimplifiedOptionChainDemo = () => {
  const [currentSymbol, setCurrentSymbol] = useState('NIFTY');

  const handleNavigateToChart = (symbol, optionData) => {
    // You can implement navigation logic here
    // For example: navigate(`/chart?symbol=${symbol}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Simplified Option Chain Card Demo</h2>
      <p>This is the new simplified option chain card that fixes scrolling issues and provides a cleaner interface.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Current Symbol: </label>
        <select 
          value={currentSymbol} 
          onChange={(e) => setCurrentSymbol(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="NIFTY">NIFTY</option>
          <option value="BANKNIFTY">BANKNIFTY</option>
          <option value="FINNIFTY">FINNIFTY</option>
        </select>
      </div>

      <div style={{ height: '600px' }}>
        <SimplifiedOptionChainCard 
          currentSymbol={currentSymbol}
          onNavigateToChart={handleNavigateToChart}
        />
      </div>
    </div>
  );
};

export default SimplifiedOptionChainDemo;
