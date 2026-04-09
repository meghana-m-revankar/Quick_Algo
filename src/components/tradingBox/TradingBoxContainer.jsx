import React, { useRef, useCallback, memo, useEffect, useState } from "react";
import TradingBox from "./TradingBox";
import { useTradingBox } from "../../context/TradingBoxContext";
import Draggable from "react-draggable";
import { fetchWatchList } from "#utils/watchList";
import { useLocation } from "react-router-dom";

// Separate component for each draggable trading box
const DraggableTradingBox = memo(({ box, onClose, onPositionUpdate }) => {
  const nodeRef = useRef(null);

  const handleStop = useCallback(
    (e, data) => {
      onPositionUpdate(box.id, { x: data.x, y: data.y });
    },
    [box.id, onPositionUpdate],
  );

  const handleClose = useCallback(() => {
    onClose(box.id);
  }, [box.id, onClose]);

  // Calculate bounds to keep box within viewport
  const getBounds = useCallback(() => {
    const headerHeight = 70;
    const padding = 10;
    const boxWidth = window.innerWidth > 768 ? 330 : 300; // Responsive box width
    return {
      left: padding,
      top: headerHeight + padding,
      right: window.innerWidth - boxWidth - padding,
      bottom: window.innerHeight - padding,
    };
  }, []);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: box.position.x, y: box.position.y }}
      onStop={handleStop}
      handle=".header-drag-area"
      bounds={getBounds()}
    >
      <div
        ref={nodeRef}
        style={{
          position: "fixed",
          zIndex: 10000 + box.id,
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        <TradingBox id={box.id} symbol={box.symbol} onClose={handleClose} />
      </div>
    </Draggable>
  );
});

const TradingBoxContainer = memo(
  ({ onAllBoxesClosed, autoInitializeDefaultBox = true }) => {
    const [isLoadingNiftyData, setIsLoadingNiftyData] = useState(false);
    const location = useLocation();
    const hasInitializedRef = useRef(false);
    const { tradingBoxes, addTradingBox, closeTradingBox, updateBoxPosition } =
      useTradingBox();

    // Track previous box count to avoid firing close callback on initial mount
    const prevBoxCountRef = useRef(tradingBoxes.length);

    // Notify parent when all boxes are closed (only when going from >0 to 0)
    useEffect(() => {
      const prevCount = prevBoxCountRef.current;
      const currentCount = tradingBoxes.length;

      if (prevCount > 0 && currentCount === 0 && onAllBoxesClosed) {
        onAllBoxesClosed();
      }

      prevBoxCountRef.current = currentCount;
    }, [tradingBoxes.length, onAllBoxesClosed]);

    // Function to initialize NIFTY trading box
    const initializeNiftyTradingBox = useCallback(async () => {
      if (isLoadingNiftyData || hasInitializedRef.current) return;

      try {
        setIsLoadingNiftyData(true);
        hasInitializedRef.current = true;

        // Fetch Nifty symbol data like in the algo section
        const niftySymbolData = await fetchWatchList({
          categoryID: 5,
          identifier: "",
        });

        // Find NIFTY symbol from the fetched data
        if (niftySymbolData && Array.isArray(niftySymbolData)) {
          const niftySymbol = niftySymbolData.find((symbol) =>
            symbol?.identifier?.toUpperCase().includes("NIFTY"),
          );

          if (niftySymbol) {
            await addTradingBox(niftySymbol);
          } else {
            // Fallback to simple "NIFTY" if specific symbol not found
            await addTradingBox("NIFTY");
          }
        } else {
          // Fallback to simple "NIFTY" if data fetch fails
          await addTradingBox("NIFTY");
        }
      } catch (error) {
        // Error fetching Nifty symbol data
        // Fallback to simple "NIFTY" if there's an error
        try {
          await addTradingBox("NIFTY");
        } catch (err) {
          // If addTradingBox fails, reset the flag so it can try again
          hasInitializedRef.current = false;
        }
      } finally {
        setIsLoadingNiftyData(false);
      }
    }, [addTradingBox, isLoadingNiftyData]);

    // Auto-add a box when container mounts and no boxes exist
    useEffect(() => {
      if (!autoInitializeDefaultBox) {
        return;
      }
      if (
        tradingBoxes.length === 0 &&
        !isLoadingNiftyData &&
        !hasInitializedRef.current
      ) {
        initializeNiftyTradingBox();
      }
    }, [
      autoInitializeDefaultBox,
      tradingBoxes.length,
      isLoadingNiftyData,
      initializeNiftyTradingBox,
    ]);

    return (
      <>
        {/* Trading Boxes Container */}
        <div className="trading-boxes-container">
          {tradingBoxes.map((box) => {
            return (
              <DraggableTradingBox
                key={box.id}
                box={box}
                onClose={closeTradingBox}
                onPositionUpdate={updateBoxPosition}
              />
            );
          })}
        </div>
      </>
    );
  },
);

export default TradingBoxContainer;
