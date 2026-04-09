import React from "react";

// Import only the icons you actually use
// This ensures only used icons are bundled
// Feather Icons
import {
  FiChevronDown,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiPhone,
  FiTarget,
  FiArrowLeft,
  FiTrendingUp,
  FiBarChart2,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiPlay,
  FiStar,
  FiShield,
  FiActivity,
  FiBook,
} from "react-icons/fi";

// Material Design Icons
import {
  MdDashboard,
  MdShowChart,
  MdAccountBalance,
  MdAssignment,
  MdTrendingUp,
  MdSettings,
  MdSchool,
  MdArticle,
  MdHelp,
  MdPerson,
  MdNotifications,
  MdApi,
  MdBackup,
  MdAutoGraph,
  MdAnalytics,
  MdHistory,
  MdPendingActions,
  MdCheckCircle,
  MdCancel,
  MdSwapHoriz,
  MdTrendingDown,
  MdBarChart,
  MdTimeline,
  MdPsychology,
  MdRocketLaunch,
  MdAdd,
} from "react-icons/md";

// Font Awesome Icons
import {
  FaBars,
  FaTimes,
  FaCalculator,
  FaChartArea,
  FaChartLine,
  FaMinus,
  FaExpand,
  FaCompress,
} from "react-icons/fa";

import { FaEyeLowVision } from "react-icons/fa6";

import { IoCaretDownOutline, IoCaretUpOutline, IoClose } from "react-icons/io5";

// Ionicons
import { IoMdEye } from "react-icons/io";

// Bootstrap Icons
import { BsExclamationOctagon as BsExclamationOctagonIcon } from "react-icons/bs";
import { HiArrowsExpand } from "react-icons/hi";
import { HiRefresh } from "react-icons/hi";
import { HiPlus } from "react-icons/hi";

// Heroicons
import { HiOutlineDotsCircleHorizontal } from "react-icons/hi";

// Go Icons
import { GoLock } from "react-icons/go";

// Lucide Icons
import { LuMails } from "react-icons/lu";

// Tabler Icons
import { TbTrash } from "react-icons/tb";

// Create forwardRef wrapper for BsExclamationOctagon
const BsExclamationOctagon = React.forwardRef((props, ref) => {
  return <BsExclamationOctagonIcon ref={ref} {...props} />;
});

// Icon mapping for easy access and consistent naming
export const iconMap = {
  // Navigation
  "chevron-down": FiChevronDown,
  bars: FaBars,
  times: FaTimes,
  add: MdAdd,
  minus: FaMinus,
  expand: FaExpand,
  compress: FaCompress,

  // User & Auth
  user: FiUser,
  lock: FiLock,
  eye: FiEye,
  "eye-off": FiEyeOff,
  "eye-low-vision": FaEyeLowVision,
  camera: "fas fa-camera", // Keep as CSS class for now
  search: FiSearch,
  phone: FiPhone,
  mail: LuMails,
  target: FiTarget,
  "arrow-left": FiArrowLeft,
  "trending-up": FiTrendingUp,
  "bar-chart-2": FiBarChart2,
  clock: FiClock,
  "dollar-sign": FiDollarSign,
  "check-circle": FiCheckCircle,
  "alert-circle": FiAlertCircle,
  "file-text": FiFileText,
  play: FiPlay,
  star: FiStar,
  shield: FiShield,
  activity: FiActivity,
  book: FiBook,

  // Dashboard & Charts
  dashboard: MdDashboard,
  chart: MdShowChart,
  "chart-area": FaChartArea,
  "chart-line": FaChartLine,
  "bar-chart": MdBarChart,
  timeline: MdTimeline,
  "trending-up-md": MdTrendingUp,
  "trending-down": MdTrendingDown,
  analytics: MdAnalytics,
  "auto-graph": MdAutoGraph,

  // Trading & Finance
  "account-balance": MdAccountBalance,
  assignment: MdAssignment,
  "swap-horiz": MdSwapHoriz,
  calculator: FaCalculator,
  "credit-card": "fas fa-credit-card", // Keep as CSS class for now
  download: "fas fa-download", // Keep as CSS class for now
  "shield-alt": "fas fa-shield-alt", // Keep as CSS class for now

  // Status & Actions
  "check-circle-md": MdCheckCircle,
  cancel: MdCancel,
  "pending-actions": MdPendingActions,
  history: MdHistory,
  "exclamation-octagon": BsExclamationOctagon,
  "dots-horizontal": HiOutlineDotsCircleHorizontal,
  "arrows-alt": HiArrowsExpand,
  refresh: HiRefresh,
  plus: HiPlus,
  trash: TbTrash,

  // Caret Icons
  "caret-down": IoCaretDownOutline,
  "caret-up": IoCaretUpOutline,

  // Settings & Help
  settings: MdSettings,
  school: MdSchool,
  article: MdArticle,
  help: MdHelp,
  notifications: MdNotifications,
  api: MdApi,
  backup: MdBackup,
  psychology: MdPsychology,
  rocket: MdRocketLaunch,

  // Status Icons (for FAQ)
  "clock-fa": "fas fa-clock",
  "check-circle-fa": "fas fa-check-circle",
  "times-circle": "fas fa-times-circle",
};

// Optimized Icon Component with forwardRef support
export const Icon = React.forwardRef(
  ({ name, size = 16, className = "", ...props }, ref) => {
    const IconComponent = iconMap[name];

    if (!IconComponent) {
      return null;
    }

    // Handle CSS-based icons (Font Awesome classes)
    if (typeof IconComponent === "string") {
      return (
        <i
          ref={ref}
          className={`${IconComponent} ${className}`}
          style={{ fontSize: size }}
          {...props}
        />
      );
    }

    // Handle React component icons
    return (
      <IconComponent ref={ref} size={size} className={className} {...props} />
    );
  }
);

// Export individual icons for direct import when needed
export {
  FiChevronDown,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiPhone,
  FiTarget,
  FiArrowLeft,
  FiTrendingUp,
  FiBarChart2,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiPlay,
  FiStar,
  FiShield,
  FiActivity,
  FiBook,
  MdDashboard,
  MdShowChart,
  MdAccountBalance,
  MdAssignment,
  MdTrendingUp,
  MdSettings,
  MdSchool,
  MdArticle,
  MdHelp,
  MdPerson,
  MdNotifications,
  MdApi,
  MdBackup,
  MdAutoGraph,
  MdAnalytics,
  MdHistory,
  MdPendingActions,
  MdCheckCircle,
  MdCancel,
  MdSwapHoriz,
  MdTrendingDown,
  MdBarChart,
  MdTimeline,
  MdPsychology,
  MdRocketLaunch,
  MdAdd,
  FaBars,
  FaTimes,
  FaCalculator,
  FaEyeLowVision,
  FaChartArea,
  FaChartLine,
  FaMinus,
  FaExpand,
  FaCompress,
  IoMdEye,
  IoCaretDownOutline,
  IoCaretUpOutline,
  BsExclamationOctagon,
  HiOutlineDotsCircleHorizontal,
  HiArrowsExpand,
  HiRefresh,
  HiPlus,
  GoLock,
  LuMails,
  TbTrash,
  IoClose,
};

// IconRegistry component with forwardRef support
export const IconRegistry = React.forwardRef((props, ref) => {
  return <Icon ref={ref} {...props} />;
});

// Default export - the main Icon component
export default Icon;
