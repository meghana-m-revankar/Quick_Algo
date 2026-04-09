import { useCallback, useState, useEffect } from "react";
import dayjs from "dayjs";
import { asyncPostStartBacktest } from "#redux/backtest/action.js";
import { useNavigate, useLocation } from "react-router-dom";
import { handleCatchErrors } from "#utils/validation";
import { errorMsg, successMsg, warningMsg } from "#helpers";

const useBacktest = () => {
  const location = useLocation();
  const strategyContext = location.state?.strategyId
    ? { strategyId: location.state.strategyId }
    : location.state?.adminStrategyId
      ? { adminStrategyId: location.state.adminStrategyId }
      : null;

  const defaultBacktest = {
    instrument: {
      index: "NIFTY",
      underlying: "cash",
    },
    entry: {
      strategy_type: "intraday",
      entry_time: {
        hour: 9,
        minute: 15,
      },
      exit_time: { 
        hour: 13,
        minute: 15,
      },
      range_exit_time:{
        hour: 13,
        minute: 15,
      }
    },
    leg_builder: {
      segment: "future",
      lot: 1,
      position: "buy",
      strike_type: "strike",
      op_type: "CE",
      lower_range_value: "50",
      upper_range_value: "200",
      premium: "50",
      max_re_entries:3,
      re_entry_enabled:false,
    },
    legs: [],
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().format("YYYY-MM-DD"),
    range_type:"high",
   
   
  };

  // symbolList is a placeholder for the list of symbols you want to backtest
  const [symbolList] = useState(["NIFTY", "BANKNIFTY"]);
  const [backtest, setBacktest] = useState(defaultBacktest);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [listing, setListing] = useState([]);
  const [listSummary, setListSummary] = useState([]);

  // When opened from strategy list: cap end_date to today (backend validates full range)
  useEffect(() => {
    if (!strategyContext) return;
    const today = dayjs().format("YYYY-MM-DD");
    setBacktest((prev) => ({
      ...prev,
      end_date:
        prev.end_date && dayjs(prev.end_date).isAfter(dayjs(today))
          ? today
          : prev.end_date,
    }));
  }, [strategyContext?.strategyId, strategyContext?.adminStrategyId]);

  // Manage entry_time and exit_time in a single state object for UI
  const [times, setTimes] = useState({
    entry_time: dayjs()
      .hour(defaultBacktest.entry.entry_time.hour)
      .minute(defaultBacktest.entry.entry_time.minute)
      .second(0),
    exit_time: dayjs()
      .hour(defaultBacktest.entry.exit_time.hour)
      .minute(defaultBacktest.entry.exit_time.minute)
      .second(0),

      range_exit_time: dayjs()
      .hour(defaultBacktest.entry.range_exit_time.hour)
      .minute(defaultBacktest.entry.range_exit_time.minute)
      .second(0),
  });

  // Handler to update either entry_time or exit_time in UI state
  const handleTimeChange = (newValue, type) => {
    if (!newValue) return;
    setTimes((prev) => ({
      ...prev,
      [type]: newValue,
    }));
    // Also update the backtest object for API
    setBacktest((prev) => ({
      ...prev,
      entry: {
        ...prev.entry,
        [type]: {
          hour: newValue.hour(),
          minute: newValue.minute(),
        },
      },
    }));
  };

  const handleChange = useCallback(
    async (e) => {
      const { name, value, type, checked } = e.target;

      // Pattern 1: objectKey[fieldKey]
      let matches = name.match(/^\w+\[\w+\]$/);
      
      if (matches) {
        const [objectKey, fieldKey] = name.match(/^(\w+)\[(\w+)\]$/).slice(1);
       
        if (fieldKey === "strike_type" && value === "strike") {
          setBacktest((prevState) => ({
            ...prevState,
            [objectKey]: {
              ...prevState[objectKey],
              [fieldKey]: value,
              premium: "strike",
            },
          }));
        } else {
          setBacktest((prevState) => ({
            ...prevState,
            [objectKey]: {
              ...prevState[objectKey],
              [fieldKey]: type === "checkbox" ? checked : value,
            },
          }));
        }
        return;
      }

      // Pattern 2: arrayKey[index].fieldKey
      matches = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
      if (matches) {
        const [_, arrayKey, indexStr, fieldKey] = matches;
        const index = parseInt(indexStr, 10);
        setBacktest((prevState) => {
          const updatedArray = [...prevState[arrayKey]];
          updatedArray[index] = {
            ...updatedArray[index],
            [fieldKey]: type === "checkbox" ? checked : value,
          };
          return {
            ...prevState,
            [arrayKey]: updatedArray,
          };
        });
        return;
      }

      const singleValue = ["start_date", "end_date", "is_range","range_type"]
      // Handle direct top-level fields (e.g., start_date, end_date)
      if (singleValue.includes(name)) {
        setBacktest((prevState) => ({
          ...prevState,
          [name]: type === "checkbox" ? checked : value,
        }));
        return;
      }
    },
    []
  );

  // Common function to update any property in backtest state by path
  const handleButton = useCallback((path, value) => {
    setBacktest((prev) => {
      const keys = path.split(".");
      const newState = { ...prev };
      let curr = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!curr[keys[i]]) curr[keys[i]] = {};
        curr = curr[keys[i]];
      }
      curr[keys[keys.length - 1]] = value;
      return newState;
    });
  }, []);

  const handleAddLeg = () => {
    setBacktest((prev) => ({
      ...prev,
      legs: [
        ...prev.legs,
        {
          ...prev.leg_builder,
          lot: prev.leg_builder.lot,
          position: prev.leg_builder.position,
          tp_check: false,
          sl_check: false,
          trail_sl_check: false,
          reentry_type:  prev.leg_builder.reentry_type,
          segment: prev.leg_builder.segment,
          strike_type: prev.leg_builder.strike_type,
          op_type: prev.leg_builder.op_type,
          lower_range_value: prev.leg_builder.lower_range_value,
          upper_range_value: prev.leg_builder.upper_range_value,
          premium: prev.leg_builder.premium,
          id: Date.now() + Math.random(), // Add unique id for each leg
        },
      ],
    }));
    
    // Show success notification
    successMsg("Leg added successfully! 🎯");
  };

  // Function to delete a leg by index
  const handleDeleteLeg = (index) => {
    setBacktest((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, i) => i !== index),
    }));
    
    // Show warning notification
    warningMsg("Leg deleted successfully! 🗑️");
  };

  // Function to clone a leg by index
  const handleCloneLeg = (index) => {
    setBacktest((prev) => {
      const legToClone = prev.legs[index];
      if (!legToClone) return prev;
      const clonedLeg = {
        ...legToClone,
        id: Date.now() + Math.random(), // Ensure unique id
      };
      const newLegs = [
        ...prev.legs.slice(0, index + 1),
        clonedLeg,
        ...prev.legs.slice(index + 1),
      ];
      return {
        ...prev,
        legs: newLegs,
      };
    });
    
    // Show success notification
    successMsg("Leg cloned successfully! 📋");
  };

  // Function to reset dates to today
  const resetDatesToToday = () => {
    const today = dayjs().format("YYYY-MM-DD");
    setBacktest((prev) => ({
      ...prev,
      start_date: today,
      end_date: today,
    }));
    
    // Show success notification
    successMsg("Dates reset to today! 📅");
  };

  const startBacktest = () => {
    if (backtest?.legs?.length <= 0) {
      errorMsg("add atleast 1 leg");
      return;
    }
    const today = dayjs().format("YYYY-MM-DD");
    const payload = {
      ...backtest,
      ...(strategyContext?.strategyId && { strategyId: strategyContext.strategyId }),
      ...(strategyContext?.adminStrategyId && { adminStrategyId: strategyContext.adminStrategyId }),
      end_date: backtest.end_date && dayjs(backtest.end_date).isAfter(dayjs(today)) ? today : backtest.end_date,
    };
    setIsLoading(true);
    asyncPostStartBacktest({ formData: payload })
      .then((result) => {
        setListing(result?.data?.data);
        setListSummary(result?.data?.statsData);
        
        // Show success notification
        successMsg("Backtest started successfully! 🚀");
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };


  return {
    symbolList,
    backtest,
    handleChange,
    handleButton,
    times,
    handleTimeChange,
    handleAddLeg,
    handleDeleteLeg,
    handleCloneLeg,
    startBacktest,
    listing,
    isLoading,
    listSummary,
    resetDatesToToday,
    strategyContext,
  };
};

export default useBacktest;
