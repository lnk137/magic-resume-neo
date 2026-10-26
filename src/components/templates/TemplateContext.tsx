import React, { createContext, useContext } from "react";
import { MenuSection, GlobalSettings } from "@/types/resume";

interface TemplateContextProps {
  templateId: string;
  menuSections: MenuSection[];
  globalSettings?: GlobalSettings;
}

const TemplateContext = createContext<TemplateContextProps | undefined>(undefined);

export const TemplateProvider: React.FC<{
  templateId: string;
  menuSections: MenuSection[];
  globalSettings?: GlobalSettings;
  children: React.ReactNode;
}> = ({ templateId, menuSections, globalSettings, children }) => {
  return (
    <TemplateContext.Provider value={{ templateId, menuSections, globalSettings }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  return useContext(TemplateContext);
};
