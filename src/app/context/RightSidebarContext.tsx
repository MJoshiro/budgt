import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface RightSidebarContextType {
  setSidebarContent: (content: ReactNode) => void;
  sidebarContainer: HTMLElement | null;
  setSidebarContainer: (el: HTMLElement | null) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(undefined);

export function RightSidebarProvider({ children }: { children: ReactNode }) {
  const [content, setSidebarContent] = useState<ReactNode>(null);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(null);

  return (
    <RightSidebarContext.Provider value={{ setSidebarContent, sidebarContainer, setSidebarContainer }}>
      {children}
      {sidebarContainer && content && createPortal(content, sidebarContainer)}
    </RightSidebarContext.Provider>
  );
}

export function useRightSidebar() {
  const context = useContext(RightSidebarContext);
  if (context === undefined) {
    throw new Error("useRightSidebar must be used within a RightSidebarProvider");
  }
  return context;
}

export function RightSidebarPortal({ children }: { children: ReactNode }) {
  const { setSidebarContent } = useRightSidebar();

  useEffect(() => {
    setSidebarContent(children);
    return () => setSidebarContent(null);
  }, [children, setSidebarContent]);

  return null;
}
