import axios from 'axios';

// Holiday service to fetch real-time market holiday information
class HolidayService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours cache
  }

  // Check if cache is valid
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheExpiry;
  }

  // Get cached data
  getCachedData(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // Set cache data
  setCacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Fetch NSE holiday data
  async fetchNSEHolidays() {
    try {
      const cacheKey = 'nse_holidays';
      if (this.isCacheValid(cacheKey)) {
        return this.getCachedData(cacheKey);
      }

      // Try multiple NSE API endpoints for holidays
      const endpoints = [
        'https://www.nseindia.com/api/holiday-master',
        'https://www.nseindia.com/api/holiday-calendar',
        'https://www.nseindia.com/api/market-data/holidays'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.nseindia.com/',
              'Origin': 'https://www.nseindia.com'
            }
          });

          if (response.data && (response.data.data || response.data.holidays || response.data.calendar)) {
            const holidays = this.parseNSEHolidays(response.data.data || response.data.holidays || response.data.calendar);
            if (holidays.length > 0) {
              this.setCacheData(cacheKey, holidays);
              return holidays;
            }
          }
        } catch (endpointError) {
          continue;
        }
      }

      // If all endpoints fail, use fallback
      return this.getFallbackNSEHolidays();
    } catch (error) {
      return this.getFallbackNSEHolidays();
    }
  }

  // Fetch BSE holiday data
  async fetchBSEHolidays() {
    try {
      const cacheKey = 'bse_holidays';
      if (this.isCacheValid(cacheKey)) {
        return this.getCachedData(cacheKey);
      }

      // Try multiple BSE API endpoints for holidays
      const endpoints = [
        'https://www.bseindia.com/api/holiday-master',
        'https://www.bseindia.com/api/holiday-calendar',
        'https://www.bseindia.com/api/market-data/holidays'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.bseindia.com/',
              'Origin': 'https://www.bseindia.com'
        }
          });

          if (response.data && (response.data.data || response.data.holidays || response.data.calendar)) {
            const holidays = this.parseBSEHolidays(response.data.data || response.data.holidays || response.data.calendar);
            if (holidays.length > 0) {
              this.setCacheData(cacheKey, holidays);
              return holidays;
            }
          }
        } catch (endpointError) {
          continue;
        }
      }

      // If all endpoints fail, use fallback
      return this.getFallbackBSEHolidays();
    } catch (error) {
      return this.getFallbackBSEHolidays();
    }
  }

  // Fetch MCX holiday data
  async fetchMCXHolidays() {
    try {
      const cacheKey = 'mcx_holidays';
      if (this.isCacheValid(cacheKey)) {
        return this.getCachedData(cacheKey);
      }

      // Try multiple MCX API endpoints for holidays
      const endpoints = [
        'https://www.mcxindia.com/api/holiday-master',
        'https://www.mcxindia.com/api/holiday-calendar',
        'https://www.mcxindia.com/api/market-data/holidays'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.mcxindia.com/',
              'Origin': 'https://www.mcxindia.com'
            }
          });

          if (response.data && (response.data.data || response.data.holidays || response.data.calendar)) {
            const holidays = this.parseMCXHolidays(response.data.data || response.data.holidays || response.data.calendar);
            if (holidays.length > 0) {
              this.setCacheData(cacheKey, holidays);
              return holidays;
            }
          }
        } catch (endpointError) {
          continue;
        }
      }

      // If all endpoints fail, use fallback
      return this.getFallbackMCXHolidays();
    } catch (error) {
      return this.getFallbackMCXHolidays();
    }
  }

  // Parse NSE holiday data
  parseNSEHolidays(data) {
    try {
      // Parse NSE specific format
      const holidays = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.date && item.description) {
            holidays.push({
              date: new Date(item.date),
              name: item.description,
              exchange: 'NSE',
              segments: item.segments || ['Equity', 'F&O'],
              type: 'Holiday'
            });
          }
        });
      }
      return holidays;
    } catch (error) {
      return this.getFallbackNSEHolidays();
    }
  }

  // Parse BSE holiday data
  parseBSEHolidays(data) {
    try {
      // Parse BSE specific format
      const holidays = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.date && item.description) {
            holidays.push({
              date: new Date(item.date),
              name: item.description,
              exchange: 'BSE',
              segments: item.segments || ['Equity', 'F&O'],
              type: 'Holiday'
            });
          }
        });
      }
      return holidays;
    } catch (error) {
      return this.getFallbackBSEHolidays();
    }
  }

  // Parse MCX holiday data
  parseMCXHolidays(data) {
    try {
      // Parse MCX specific format
      const holidays = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.date && item.description) {
            holidays.push({
              date: new Date(item.date),
              name: item.description,
              exchange: 'MCX',
              segments: item.segments || ['Commodity'],
              type: 'Holiday'
            });
          }
        });
      }
      return holidays;
    } catch (error) {
      return this.getFallbackMCXHolidays();
    }
  }

  // Get next upcoming holiday across all exchanges
  getNextHoliday(allHolidays) {
    const now = new Date();
    const futureHolidays = allHolidays.filter(holiday => 
      holiday.date > now
    ).sort((a, b) => a.date - b.date);
    
    return futureHolidays.length > 0 ? futureHolidays[0] : null;
  }

  // Check if today is a holiday
  isTodayHoliday(allHolidays) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return allHolidays.some(holiday => {
      const holidayStr = holiday.date.toISOString().split('T')[0];
      return holidayStr === todayStr;
    });
  }

  // Get special trading sessions
  getSpecialTradingSessions() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Special trading sessions based on common patterns
    if (currentMonth === 1 && currentDay >= 25 && currentDay <= 28) {
      return "Budget Day - Extended trading hours";
    } else if (currentMonth === 0 && currentDay >= 20 && currentDay <= 25) {
      return "Republic Day - Special trading session";
    } else if (currentMonth === 10 && currentDay >= 1 && currentDay <= 5) {
      return "Diwali - Muhurat trading";
    } else if (currentMonth === 2 && currentDay >= 20 && currentDay <= 25) {
      return "Holi - Special trading session";
    } else {
      return "No special trading today";
    }
  }

  // Get comprehensive market info
  async getMarketInfo() {
    try {
      // Fetch holidays from all exchanges
      const [nseHolidays, bseHolidays, mcxHolidays] = await Promise.allSettled([
        this.fetchNSEHolidays(),
        this.fetchBSEHolidays(),
        this.fetchMCXHolidays()
      ]);

      // Combine all holidays
      const allHolidays = [
        ...(nseHolidays.status === 'fulfilled' ? nseHolidays.value : []),
        ...(bseHolidays.status === 'fulfilled' ? bseHolidays.value : []),
        ...(mcxHolidays.status === 'fulfilled' ? mcxHolidays.value : [])
      ];

      // Get next holiday
      const nextHoliday = this.getNextHoliday(allHolidays);
      
      // Check if today is holiday
      const isTodayHoliday = this.isTodayHoliday(allHolidays);
      
      // Get special trading info
      const specialTrading = this.getSpecialTradingSessions();

      return {
        nextHoliday: nextHoliday ? {
          name: nextHoliday.name,
          date: nextHoliday.date,
          exchange: nextHoliday.exchange
        } : null,
        isTodayHoliday,
        specialTrading,
        lastUpdated: new Date(),
        holidays: allHolidays
      };
    } catch (error) {
      return this.getFallbackMarketInfo();
    }
  }

  // Fallback NSE holidays (2024-2025)
  getFallbackNSEHolidays() {
    const currentYear = new Date().getFullYear();
    return [
      { date: new Date(`${currentYear}-01-26`), name: 'Republic Day', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-03-25`), name: 'Holi', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-04-09`), name: 'Ram Navami', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-05-01`), name: 'Maharashtra Day', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-08-15`), name: 'Independence Day', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-10-02`), name: 'Gandhi Jayanti', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-11-01`), name: 'Diwali', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-12-25`), name: 'Christmas', exchange: 'NSE', segments: ['Equity', 'F&O'], type: 'Holiday' }
    ];
  }

  // Fallback BSE holidays (2024-2025)
  getFallbackBSEHolidays() {
    const currentYear = new Date().getFullYear();
    return [
      { date: new Date(`${currentYear}-01-26`), name: 'Republic Day', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-03-25`), name: 'Holi', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-04-09`), name: 'Ram Navami', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-05-01`), name: 'Maharashtra Day', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-08-15`), name: 'Independence Day', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-10-02`), name: 'Gandhi Jayanti', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-11-01`), name: 'Diwali', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' },
      { date: new Date(`${currentYear}-12-25`), name: 'Christmas', exchange: 'BSE', segments: ['Equity', 'F&O'], type: 'Holiday' }
    ];
  }

  // Fallback MCX holidays (2024-2025)
  getFallbackMCXHolidays() {
    const currentYear = new Date().getFullYear();
    return [
      { date: new Date(`${currentYear}-01-26`), name: 'Republic Day', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-03-25`), name: 'Holi', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-04-09`), name: 'Ram Navami', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-05-01`), name: 'Maharashtra Day', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-08-15`), name: 'Independence Day', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-10-02`), name: 'Gandhi Jayanti', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-11-01`), name: 'Diwali', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' },
      { date: new Date(`${currentYear}-12-25`), name: 'Christmas', exchange: 'MCX', segments: ['Commodity'], type: 'Holiday' }
    ];
  }

  // Fallback market info
  getFallbackMarketInfo() {
    const currentYear = new Date().getFullYear();
    return {
      nextHoliday: {
        name: 'Independence Day',
        date: new Date(`${currentYear}-08-15`),
        exchange: 'NSE & BSE'
      },
      isTodayHoliday: false,
      specialTrading: 'No special trading today',
      lastUpdated: new Date(),
      holidays: []
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache status
  getCacheStatus() {
    const status = {};
    for (const [key, value] of this.cache.entries()) {
      status[key] = {
        hasData: !!value.data,
        age: Date.now() - value.timestamp,
        isValid: this.isCacheValid(key)
      };
    }
    return status;
  }
}

// Create singleton instance
const holidayService = new HolidayService();

export default holidayService;
