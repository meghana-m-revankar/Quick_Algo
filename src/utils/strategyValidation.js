import Joi from 'joi';


// Selected symbol schema - REQUIRED
const selectedSymbolSchema = Joi.object({
  symbolIdentifierId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  identifier: Joi.string().required(),
  symbolName: Joi.string().optional(),
  product: Joi.string().optional()
}).required();

// Broker validation schema - REQUIRED
const brokerSchema = Joi.alternatives().try(
  Joi.string().required(),
  Joi.number().required().min(1)
).required();

// Create strategy request schema - Validates symbol and broker
const createStrategySchema = Joi.object({
  selectedSymbol: selectedSymbolSchema,
  CustomerBrokerID: brokerSchema
}).unknown(true); // Allow all other fields without validation

/**
 * Validate strategy data - Only validates symbol selection
 * @param {Object} strategyData - Strategy data to validate
 * @returns {Object} - { isValid: boolean, errors: Array, value: Object }
 */
export const validateStrategy = (strategyData) => {
  // Check for symbol selection - support multiple formats
  let selectedSymbol = strategyData.selectedSymbol;
  
  // If selectedSymbol doesn't exist, check for IdentifierName and IdentifierID (backward compatibility)
  if (!selectedSymbol) {
    const identifierName = strategyData.IdentifierName;
    const identifierID = strategyData.IdentifierID;
    
    // If IdentifierName exists, create selectedSymbol object from it
    if (identifierName && identifierName.trim() !== '') {
      selectedSymbol = {
        identifier: identifierName,
        symbolIdentifierId: identifierID !== undefined ? identifierID : 0,
        symbolName: strategyData.ProductName || identifierName,
        product: strategyData.ProductName || ''
      };
    } else {
      // No symbol found in any format
      return {
        isValid: false,
        errors: [{
          field: 'selectedSymbol',
          message: 'Symbol selection is required. Please select a symbol first.',
          fullPath: ['selectedSymbol']
        }],
        value: null
      };
    }
  }

  // Validate selectedSymbol has required fields
  if (!selectedSymbol.identifier || selectedSymbol.identifier.trim() === '') {
    return {
      isValid: false,
      errors: [{
        field: 'selectedSymbol',
        message: 'Symbol selection is required. Please select a symbol first.',
        fullPath: ['selectedSymbol']
      }],
      value: null
    };
  }

  // Check broker selection
  const brokerId = strategyData.CustomerBrokerID;
  if (!brokerId || brokerId === '' || brokerId === 0 || brokerId === '0') {
    return {
      isValid: false,
      errors: [{
        field: 'CustomerBrokerID',
        message: 'Broker selection is required. Please select a broker first.',
        fullPath: ['CustomerBrokerID']
      }],
      value: null
    };
  }

  // Validate that at least one order leg is present
  const orderLegs = Array.isArray(strategyData.qaCustomCustomerOptionsAlgoChild)
    ? strategyData.qaCustomCustomerOptionsAlgoChild
    : [];

  if (orderLegs.length === 0) {
    return {
      isValid: false,
      errors: [{
        field: 'qaCustomCustomerOptionsAlgoChild',
        message: 'At least one order leg is required. Please add at least one leg.',
        fullPath: ['qaCustomCustomerOptionsAlgoChild']
      }],
      value: null
    };
  }

  // Validate required fields for each order leg
  for (let i = 0; i < orderLegs.length; i++) {
    const leg = orderLegs[i] || {};
    const legIndex = i + 1;
    const legLabel = `Order leg ${legIndex}`;

    // Type / CallType (BUY / SELL)
    const typeValue = leg.CallType || leg.action || leg.callType;
    if (!typeValue || String(typeValue).trim() === '') {
      return {
        isValid: false,
        errors: [{
          field: 'qaCustomCustomerOptionsAlgoChild',
          message: `${legLabel}: Type is required. Please select Buy/Sell.`,
          fullPath: ['qaCustomCustomerOptionsAlgoChild', i, 'CallType']
        }],
        value: null
      };
    }

    // Expiry (ExpiryDate / expiry)
    const expiryValue = leg.ExpiryDate || leg.expiry;
    if (!expiryValue || String(expiryValue).trim() === '') {
      return {
        isValid: false,
        errors: [{
          field: 'qaCustomCustomerOptionsAlgoChild',
          message: `${legLabel}: Expiry is required. Please select an expiry.`,
          fullPath: ['qaCustomCustomerOptionsAlgoChild', i, 'ExpiryDate']
        }],
        value: null
      };
    }

    // Strike price
    const rawStrike = leg.strikePrice ?? leg.StrikePrice;
    const strike = rawStrike !== undefined && rawStrike !== null
      ? Number(rawStrike)
      : NaN;
    if (!strike || Number.isNaN(strike) || strike <= 0) {
      return {
        isValid: false,
        errors: [{
          field: 'qaCustomCustomerOptionsAlgoChild',
          message: `${legLabel}: Strike price is required and must be greater than 0.`,
          fullPath: ['qaCustomCustomerOptionsAlgoChild', i, 'strikePrice']
        }],
        value: null
      };
    }

    // Option type (CE / PE / ATM / OTM etc.)
    const optionTypeValue = leg.optionType || leg.OptionsType || leg.optionsType;
    if (!optionTypeValue || String(optionTypeValue).trim() === '') {
      return {
        isValid: false,
        errors: [{
          field: 'qaCustomCustomerOptionsAlgoChild',
          message: `${legLabel}: Option type is required. Please select type/side for the leg.`,
          fullPath: ['qaCustomCustomerOptionsAlgoChild', i, 'optionType']
        }],
        value: null
      };
    }
  }

  // Validate entry conditions (all visible groups required)
  const entryConditions = strategyData.entryConditions || {};
  const entryGroups = Array.isArray(entryConditions.conditionGroups)
    ? entryConditions.conditionGroups
    : [];

  if (entryGroups.length === 0) {
    return {
      isValid: false,
      errors: [{
        field: 'entryConditions',
        message: 'At least one entry condition group is required. Please configure entry conditions.',
        fullPath: ['entryConditions', 'conditionGroups']
      }],
      value: null
    };
  }

  const isEntryConditionFilled = (cond) =>
    cond &&
    typeof cond === 'object' &&
    cond.indicator1 &&
    String(cond.indicator1).trim() !== '' &&
    cond.comparator &&
    String(cond.comparator).trim() !== '';

  for (let i = 0; i < entryGroups.length; i++) {
    const group = entryGroups[i] || {};
    const groupIndex = i + 1;
    const longEntry = group.longEntry || {};
    const shortEntry = group.shortEntry || {};

    const longFilled = isEntryConditionFilled(longEntry);
    const shortFilled = isEntryConditionFilled(shortEntry);

    // Har visible group me kam se kam ek proper condition (long ya short) required
    if (!longFilled && !shortFilled) {
      return {
        isValid: false,
        errors: [{
          field: 'entryConditions',
          message: `Entry condition group ${groupIndex}: Please select indicator and comparator for Long or Short side.`,
          fullPath: ['entryConditions', 'conditionGroups', i]
        }],
        value: null
      };
    }
  }

  // Validate exit conditions only when enabled
  const exitConditions = strategyData.exitConditions || {};
  const exitEnabled = exitConditions.enabled === true;

  if (exitEnabled) {
    const exitGroups = Array.isArray(exitConditions.conditionGroups)
      ? exitConditions.conditionGroups
      : [];

    if (exitGroups.length === 0) {
      return {
        isValid: false,
        errors: [{
          field: 'exitConditions',
          message: 'At least one exit condition group is required when exit conditions are enabled.',
          fullPath: ['exitConditions', 'conditionGroups']
        }],
        value: null
      };
    }

    const isExitConditionFilled = (cond) =>
      cond &&
      typeof cond === 'object' &&
      cond.indicator1 &&
      String(cond.indicator1).trim() !== '' &&
      cond.comparator &&
      String(cond.comparator).trim() !== '';

    for (let i = 0; i < exitGroups.length; i++) {
      const group = exitGroups[i] || {};
      const groupIndex = i + 1;
      const longExit = group.longExit || {};
      const shortExit = group.shortExit || {};

      const longFilled = isExitConditionFilled(longExit);
      const shortFilled = isExitConditionFilled(shortExit);

      if (!longFilled && !shortFilled) {
        return {
          isValid: false,
          errors: [{
            field: 'exitConditions',
            message: `Exit condition group ${groupIndex}: Please select indicator and comparator for Long or Short side.`,
            fullPath: ['exitConditions', 'conditionGroups', i]
          }],
          value: null
        };
      }
    }
  }

  // Helper: parse number from string or number, return NaN if invalid
  const parseNum = (v) => {
    if (v === '' || v === null || v === undefined) return NaN;
    const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
    return Number.isNaN(n) ? NaN : n;
  };

  const hasValue = (v) =>
    v !== undefined && v !== null && v !== '' && String(v).trim() !== '';

  const MAX_POINTS = 999999;

  // Risk Management: read from top-level or nested riskManagement
  const rmProfitRaw =
    strategyData.rmProfitExitAmount ??
    strategyData.riskManagement?.profitExitAmount;
  if (hasValue(rmProfitRaw)) {
    const rmProfit = parseNum(rmProfitRaw);
    if (
      Number.isNaN(rmProfit) ||
      !Number.isFinite(rmProfit) ||
      rmProfit < 0 ||
      rmProfit > MAX_POINTS
    ) {
      return {
        isValid: false,
        errors: [{
          field: 'rmProfitExitAmount',
          message:
            'Risk Management: Target (profit exit) must be a valid number between 0 and 999999.',
          fullPath: ['rmProfitExitAmount']
        }],
        value: null
      };
    }
  }

  const rmLossRaw =
    strategyData.rmLossExitAmount ??
    strategyData.riskManagement?.lossExitAmount;
  if (hasValue(rmLossRaw)) {
    const rmLoss = parseNum(rmLossRaw);
    if (
      Number.isNaN(rmLoss) ||
      !Number.isFinite(rmLoss) ||
      rmLoss < 0 ||
      rmLoss > MAX_POINTS
    ) {
      return {
        isValid: false,
        errors: [{
          field: 'rmLossExitAmount',
          message:
            'Risk Management: Stop loss must be a valid number between 0 and 999999.',
          fullPath: ['rmLossExitAmount']
        }],
        value: null
      };
    }
  }

  // Move SL to Cost: when enabled, both fields required and valid
  const moveSlToCost = strategyData.MoveSlToCost === true || strategyData.MoveSlToCost === 'true';
  if (moveSlToCost) {
    const increaseOf = parseNum(strategyData.MoveSlToCostIncreaseOf);
    if (Number.isNaN(increaseOf) || !Number.isFinite(increaseOf) || increaseOf <= 0 || increaseOf > MAX_POINTS) {
      return {
        isValid: false,
        errors: [{
          field: 'MoveSlToCostIncreaseOf',
          message: 'Move SL to Cost: "Increase of" is required and must be a number greater than 0 (points).',
          fullPath: ['MoveSlToCostIncreaseOf']
        }],
        value: null
      };
    }
    const trailBy = parseNum(strategyData.MoveSlToCostTrailBy);
    if (Number.isNaN(trailBy) || !Number.isFinite(trailBy) || trailBy < 0 || trailBy > MAX_POINTS) {
      return {
        isValid: false,
        errors: [{
          field: 'MoveSlToCostTrailBy',
          message: 'Move SL to Cost: "Trail by" is required and must be a number 0 or greater (points).',
          fullPath: ['MoveSlToCostTrailBy']
        }],
        value: null
      };
    }
  }

  // Profit Trailing: when enabled, both fields required and valid
  const profitTrailing = strategyData.ProfitTrailing === true || strategyData.ProfitTrailing === 'true';
  if (profitTrailing) {
    const lockReaches = parseNum(strategyData.PTLockIfProfitReaches ?? strategyData.pTLockIfProfitReaches);
    if (Number.isNaN(lockReaches) || !Number.isFinite(lockReaches) || lockReaches <= 0 || lockReaches > MAX_POINTS) {
      return {
        isValid: false,
        errors: [{
          field: 'PTLockIfProfitReaches',
          message: 'Profit Trailing: "Lock if profit reaches" is required and must be a number greater than 0 (points).',
          fullPath: ['PTLockIfProfitReaches']
        }],
        value: null
      };
    }
    const lockAt = parseNum(strategyData.PTLockProfitAt ?? strategyData.pTLockProfitAt);
    if (Number.isNaN(lockAt) || !Number.isFinite(lockAt) || lockAt <= 0 || lockAt > MAX_POINTS) {
      return {
        isValid: false,
        errors: [{
          field: 'PTLockProfitAt',
          message: 'Profit Trailing: "Lock profit at" is required and must be a number greater than 0 (points).',
          fullPath: ['PTLockProfitAt']
        }],
        value: null
      };
    }
  }

  // Create a copy of strategyData with selectedSymbol for Joi validation
  const dataForValidation = {
    ...strategyData,
    selectedSymbol: selectedSymbol
  };

  // Validate selectedSymbol structure using Joi
  const { error } = createStrategySchema.validate(dataForValidation, {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: false, // Keep all fields
    allowUnknown: true // Allow unknown fields
  });

  if (error) {
    const errors = error.details.map(detail => {
      const path = detail.path.join('.');
      // Customize error message for symbol - Remove field name, show only clean message
      let message = detail.message;
      if (path.includes('selectedSymbol')) {
        if (detail.message.includes('required')) {
          message = 'Symbol selection is required. Please select a symbol first.';
        } else if (detail.message.includes('identifier')) {
          message = 'Symbol identifier is required. Please select a valid symbol.';
        } else {
          // Remove field name from Joi error message
          message = message.replace(/^"[^"]*"\s*/, ''); // Remove quoted field name
          message = message.replace(/^selectedSymbol\s*/, ''); // Remove field name
          message = message.trim();
        }
      } else if (path.includes('CustomerBrokerID')) {
        if (detail.message.includes('required')) {
          message = 'Broker selection is required. Please select a broker first.';
        } else {
          // Remove field name from Joi error message
          message = message.replace(/^"[^"]*"\s*/, ''); // Remove quoted field name
          message = message.replace(/^CustomerBrokerID\s*/, ''); // Remove field name
          message = message.trim();
        }
      } else {
        // Remove field name from any error message
        message = message.replace(/^"[^"]*"\s*/, ''); // Remove quoted field name
        message = message.replace(new RegExp(`^${path}\\s*`, 'i'), ''); // Remove field name
        message = message.trim();
      }
      
      return {
        field: path,
        message: message, // Clean message without field name
        fullPath: detail.path
      };
    });

    return {
      isValid: false,
      errors: errors,
      value: null
    };
  }

  // Return validated data with selectedSymbol included
  return {
    isValid: true,
    errors: [],
    value: {
      ...strategyData,
      selectedSymbol: selectedSymbol
    }
  };
};

export const formatValidationErrors = (errors) => {
  if (!errors || errors.length === 0) {
    return 'Validation failed';
  }

  // Show only error messages, not field names
  const errorMessages = errors.map((error, index) => {
    // Return only the message, without field name
    return error.message || 'Validation failed';
  });

  // Return first error message only (or join if multiple)
  return errorMessages.length > 0 ? errorMessages[0] : 'Validation failed';
};

/**
 * Validate symbol selection - Client-side validation (matches server-side logic)
 * Can be used for multiple validation keys (selectedSymbol, selectedSymbols, IdentifierName, etc.)
 * @param {Object} strategyData - Strategy data to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateSymbolSelection = (strategyData) => {
  // Check for selectedSymbol (preferred format)
  if (strategyData.selectedSymbol) {
    if (!strategyData.selectedSymbol.identifier || strategyData.selectedSymbol.identifier.trim() === '') {
      return {
        isValid: false,
        message: 'Symbol selection is required. Please select a symbol first.'
      };
    }
    // Check if symbolIdentifierId is valid (can be 0, but must be defined)
    if (strategyData.selectedSymbol.symbolIdentifierId === undefined || strategyData.selectedSymbol.symbolIdentifierId === null) {
      return {
        isValid: false,
        message: 'Symbol identifier ID is required. Please select a valid symbol.'
      };
    }
    return { isValid: true, message: 'Symbol validation passed' };
  }

  // Check for selectedSymbols array (admin can have multiple symbols)
  if (Array.isArray(strategyData.selectedSymbols) && strategyData.selectedSymbols.length > 0) {
    // Validate first symbol in array
    const firstSymbol = strategyData.selectedSymbols[0];
    if (!firstSymbol.identifier || firstSymbol.identifier.trim() === '') {
      return {
        isValid: false,
        message: 'Symbol selection is required. Please select a symbol first.'
      };
    }
    return { isValid: true, message: 'Symbol validation passed' };
  }

  // Check for IdentifierName (backward compatibility)
  if (strategyData.IdentifierName && strategyData.IdentifierName.trim() !== '') {
    return { isValid: true, message: 'Symbol validation passed' };
  }

  // No symbol found
  return {
    isValid: false,
    message: 'Symbol selection is required. Please select a symbol first.'
  };
};

/**
 * Validate broker selection - Client-side validation (matches server-side logic)
 * @param {Object} strategyData - Strategy data to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateBrokerSelection = (strategyData) => {
  const brokerId = strategyData.CustomerBrokerID;
  
  // Check if broker is selected (must be a valid number > 0 or valid string)
  if (!brokerId || brokerId === '' || brokerId === 0 || brokerId === '0') {
    return {
      isValid: false,
      message: 'Broker selection is required. Please select a broker first.'
    };
  }

  // Check if brokerId is a valid number (if it's a string, try to parse it)
  const brokerIdNum = typeof brokerId === 'string' ? parseInt(brokerId, 10) : brokerId;
  if (isNaN(brokerIdNum) || brokerIdNum <= 0) {
    return {
      isValid: false,
      message: 'Broker selection is required. Please select a broker first.'
    };
  }

  return { isValid: true, message: 'Broker validation passed' };
};

const strategyValidation = {
  validateStrategy,
  formatValidationErrors,
  createStrategySchema
};

export default strategyValidation;

