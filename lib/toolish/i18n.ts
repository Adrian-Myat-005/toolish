export const translations = {
  en: {
    // Sidebar
    Start: "Start",
    Learn: "Learn",
    Research: "Research",
    Dashboard: "Dashboard",
    Notebooks: "Notebooks",
    Settings: "Settings",

    // Common
    Loading: "Loading...",
    Save: "Save",
    Cancel: "Cancel",
    Error: "Error",
    Success: "Success",
    "View All": "View All",
    Refresh: "Refresh",
    Create: "Create",

    // Settings Page
    "System Settings": "System Settings",
    "Manage system configuration and preferences":
      "Manage system configuration and preferences",
    "General Settings": "General Settings",
    "Environment Variables": "Environment Variables",
    "Interface Preferences": "Interface Preferences",
    Theme: "Theme",
    "Light Mode": "Light Mode",
    "Dark Mode": "Dark Mode",
    Language: "Language",
    English: "English",
    Chinese: "Chinese",
    "System Configuration": "System Configuration",
    "System Language": "System Language",
    "Default language for system operations":
      "Default language for system operations",
    "Save All Changes": "Save All Changes",
    "Configuration Saved": "Configuration Saved",
    "Configuration Status": "Configuration Status",
    "Refresh Status": "Refresh Status",
    "Runtime Configuration": "Runtime Configuration",
    "Environment variables are loaded from":
      "Environment variables are loaded from",
    "file on startup": "file on startup",
    "Changes made here take effect immediately but are not saved to file":
      "Changes made here take effect immediately but are not saved to file",
    "On restart, values will be reloaded from":
      "On restart, values will be reloaded from",
    "Apply Environment Changes": "Apply Environment Changes",
    "Environment Updated!": "Environment Updated!",
    REQUIRED: "REQUIRED",
    "Error loading data": "Error loading data",
    "Failed to load settings": "Failed to load settings",
    "Failed to connect to backend": "Failed to connect to backend",

    // Dashboard Page
    records: "records",

    // Home Page
    Home: "Home",
    History: "History",

    // History Page
    "Chat History": "Chat History",
    "All Activities": "All Activities",
    "Filter by type": "Filter by type",
    All: "All",
    "No history found": "No history found",
    "Your activities will appear here": "Your activities will appear here",
    Continue: "Continue",
  },
  zh: {
    // Sidebar
    Start: "开始",
    Learn: "学习",
    Research: "研究",
    Dashboard: "仪表盘",
    Notebooks: "笔记本",
    Settings: "设置",

    // Common
    Loading: "加载中...",
    Save: "保存",
    Cancel: "取消",
    Error: "错误",
    Success: "成功",
    "View All": "查看全部",
    Refresh: "刷新",
    Create: "创建",

    // Settings Page
    "System Settings": "系统设置",
    "Manage system configuration and preferences": "管理系统配置和偏好设置",
    "General Settings": "常规设置",
    "Environment Variables": "环境变量",
    "Interface Preferences": "界面偏好",
    Theme: "主题",
    "Light Mode": "浅色模式",
    "Dark Mode": "深色模式",
    Language: "语言",
    English: "英语",
    Chinese: "中文",
    "System Configuration": "系统配置",
    "System Language": "系统语言",
    "Default language for system operations": "系统操作的默认语言",
    "Save All Changes": "保存所有更改",
    "Configuration Saved": "配置已保存",
    "Configuration Status": "配置状态",
    "Refresh Status": "刷新状态",
    "Runtime Configuration": "运行时配置",
    "Environment variables are loaded from": "环境变量从",
    "file on startup": "文件加载于启动时",
    "Changes made here take effect immediately but are not saved to file":
      "此处的更改立即生效但不会保存到文件",
    "On restart, values will be reloaded from":
      "重启后，值将从以下文件重新加载",
    "Apply Environment Changes": "应用环境变量更改",
    "Environment Updated!": "环境变量已更新！",
    REQUIRED: "必填",
    "Error loading data": "加载数据出错",
    "Failed to load settings": "加载设置失败",
    "Failed to connect to backend": "连接后端失败",

    // Dashboard Page
    records: "条记录",

    // Home Page
    Home: "首页",
    History: "历史记录",

    // History Page
    "Chat History": "聊天历史",
    "All Activities": "所有活动",
    "Filter by type": "按类型筛选",
    All: "全部",
    "No history found": "未找到历史记录",
    "Your activities will appear here": "您的活动将显示在这里",
    Continue: "继续对话",
  },
};

export type Language = "en" | "zh";

export function getTranslation(lang: Language, key: string): string {
  const dict = translations[lang] || translations.en;
  return dict[key as keyof typeof dict] || key;
}

// Hook helper for components
export function useTranslation(lang: Language) {
  return (key: string) => getTranslation(lang, key);
}
