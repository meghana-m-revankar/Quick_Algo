// Icon migration utility to help convert existing icon usage
// This script helps identify and convert icon usage patterns

export const iconMigrationMap = {
  // Convert from individual imports to centralized registry
  'react-icons/fi': {
    'FiChevronDown': 'chevron-down',
    'FiUser': 'user',
    'FiLock': 'lock',
    'FiEye': 'eye',
    'FiEyeOff': 'eye-off',
  },
  'react-icons/md': {
    'MdDashboard': 'dashboard',
    'MdShowChart': 'chart',
    'MdAccountBalance': 'account-balance',
    'MdAssignment': 'assignment',
    'MdTrendingUp': 'trending-up',
    'MdSettings': 'settings',
    'MdSchool': 'school',
    'MdArticle': 'article',
    'MdHelp': 'help',
    'MdPerson': 'user',
    'MdNotifications': 'notifications',
    'MdApi': 'api',
    'MdBackup': 'backup',
    'MdAutoGraph': 'auto-graph',
    'MdAnalytics': 'analytics',
    'MdHistory': 'history',
    'MdPendingActions': 'pending-actions',
    'MdCheckCircle': 'check-circle',
    'MdCancel': 'cancel',
    'MdSwapHoriz': 'swap-horiz',
    'MdTrendingDown': 'trending-down',
    'MdBarChart': 'bar-chart',
    'MdTimeline': 'timeline',
    'MdPsychology': 'psychology',
    'MdRocketLaunch': 'rocket',
    'MdAdd': 'add',
  },
  'react-icons/fa': {
    'FaBars': 'bars',
    'FaTimes': 'times',
    'FaCalculator': 'calculator',
    'FaChartArea': 'chart-area',
  },
  'react-icons/fa6': {
    'FaEyeLowVision': 'eye-low-vision',
  },
  'react-icons/io': {
    'IoMdEye': 'eye',
  },
  'react-icons/io5': {
    'IoCaretDownOutline': 'caret-down',
    'IoCaretUpOutline': 'caret-up',
  },
  'react-icons/bs': {
    'BsExclamationOctagon': 'exclamation-octagon',
  },
  'react-icons/hi': {
    'HiOutlineDotsCircleHorizontal': 'dots-horizontal',
  },
  'react-icons/go': {
    'GoLock': 'lock',
  },
  'react-icons/lu': {
    'LuUser': 'user',
    'LuUserCog': 'user-cog',
  },
};

// CSS class to icon name mapping
export const cssIconMap = {
  'fas fa-camera': 'camera',
  'fas fa-credit-card': 'credit-card',
  'fas fa-download': 'download',
  'fas fa-shield-alt': 'shield',
  'fas fa-clock': 'clock',
  'fas fa-check-circle': 'check-circle-fa',
  'fas fa-times-circle': 'times-circle',
};

// Migration helper function
export const migrateIconUsage = (fileContent) => {
  let migratedContent = fileContent;
  
  // Replace individual icon imports with centralized import
  Object.entries(iconMigrationMap).forEach(([library, iconMap]) => {
    Object.entries(iconMap).forEach(([oldName, newName]) => {
      // Remove individual imports
      const importPattern = new RegExp(`import\\s*{\\s*${oldName}\\s*}\\s*from\\s*["']${library}["'];?\\s*`, 'g');
      migratedContent = migratedContent.replace(importPattern, '');
    });
  });
  
  // Add centralized import if not present
  if (!migratedContent.includes('import { Icon }')) {
    const importStatement = "import { Icon } from '#components/icons/IconRegistry';\n";
    migratedContent = importStatement + migratedContent;
  }
  
  // Replace icon component usage
  Object.entries(iconMigrationMap).forEach(([library, iconMap]) => {
    Object.entries(iconMap).forEach(([oldName, newName]) => {
      // Replace <OldName /> with <Icon name="new-name" />
      const componentPattern = new RegExp(`<${oldName}([^>]*?)\\s*/>`, 'g');
      migratedContent = migratedContent.replace(componentPattern, `<Icon name="${newName}"$1 />`);
    });
  });
  
  // Replace CSS class usage
  Object.entries(cssIconMap).forEach(([cssClass, iconName]) => {
    const cssPattern = new RegExp(`<i\\s+className=["']${cssClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']([^>]*?)\\s*/>`, 'g');
    migratedContent = migratedContent.replace(cssPattern, `<Icon name="${iconName}"$1 />`);
  });
  
  return migratedContent;
};

// Usage example:
// const migratedCode = migrateIconUsage(originalFileContent);
