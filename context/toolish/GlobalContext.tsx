"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";

import { useTheme } from "next-themes";



interface GlobalContextType {
  // UI Settings
  uiSettings: { theme: "light" | "dark"; language: "en" | "zh" };

  // Sidebar
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  // --- UI Settings Logic ---
  const { theme, setTheme } = useTheme();
  const [uiSettings, setUiSettings] = useState<{
    theme: "light" | "dark";
    language: "en" | "zh";
  }>({ theme: "light", language: "en" });

  

  // --- Sidebar State ---
  const SIDEBAR_MIN_WIDTH = 64;
  const SIDEBAR_MAX_WIDTH = 320;
  const SIDEBAR_DEFAULT_WIDTH = 256;
  const SIDEBAR_COLLAPSED_WIDTH = 64;

  const [sidebarWidth, setSidebarWidthState] = useState<number>(
    SIDEBAR_DEFAULT_WIDTH,
  );
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWidth = localStorage.getItem("sidebarWidth");
      const storedCollapsed = localStorage.getItem("sidebarCollapsed");

      if (storedWidth) {
        const width = parseInt(storedWidth, 10);
        if (
          !isNaN(width) &&
          width >= SIDEBAR_MIN_WIDTH &&
          width <= SIDEBAR_MAX_WIDTH
        ) {
          setSidebarWidthState(width);
        }
      }

      if (storedCollapsed) {
        setSidebarCollapsedState(storedCollapsed === "true");
      }
    }
  }, []);

  const setSidebarWidth = (width: number) => {
    const clampedWidth = Math.max(
      SIDEBAR_MIN_WIDTH,
      Math.min(SIDEBAR_MAX_WIDTH, width),
    );
    setSidebarWidthState(clampedWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarWidth", clampedWidth.toString());
    }
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", collapsed.toString());
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };















  return (
    <GlobalContext.Provider
      value={{
        uiSettings,
        sidebarWidth,
        setSidebarWidth,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within GlobalProvider");
  return context;
};
