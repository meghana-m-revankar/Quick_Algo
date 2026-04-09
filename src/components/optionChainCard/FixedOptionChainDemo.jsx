import React, { useState } from 'react';
import { FixedOptionChainCard } from './index';

const FixedOptionChainDemo = () => {
  const [currentSymbol, setCurrentSymbol] = useState('NIFTY');

  const handleNavigateToChart = (symbol, optionData) => {
    // You can implement navigation logic here
    // For example: navigate(`/chart?symbol=${symbol}`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Fixed Option Chain Card Demo</h2>
      <p>यह एक fixed height का option chain card है जो scrolling नहीं करता। यह सिर्फ 12 rows show करता है।</p>
      
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

      <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <FixedOptionChainCard 
          currentSymbol={currentSymbol}
          onNavigateToChart={handleNavigateToChart}
        />
      </div>
    </div>
  );
};

export default FixedOptionChainDemo;
