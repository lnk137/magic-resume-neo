import { cloneElement, isValidElement, createContext, useContext, type CSSProperties, type ReactElement, type ReactNode } from "react";
import type { TextColorRole } from "@/types/resume";
import { resolveTextColor } from "@/lib/textColors";
import { useTemplateContext } from "../TemplateContext";

export const ResumeSectionContext = createContext("");

/** Shared text primitive used by every template and the PDF render tree. */
export default function ResumeText({ field, role = "body", children }: {
  field?: string;
  role?: TextColorRole;
  children: ReactNode;
}) {
  const settings = useTemplateContext()?.globalSettings;
  const section = useContext(ResumeSectionContext);
  const path = field ?? (role === "section" ? `sections.${section}.title` : undefined);
  const color = resolveTextColor(settings, path, role);
  if (role === "body" && isValidElement(children)) {
    const child = children as ReactElement<{ style?: CSSProperties }>;
    return cloneElement(child, { style: { ...child.props.style, ...(color ? { color } : {}) } });
  }
  return <span data-resume-field={path} data-text-role={role} style={{ color: resolveTextColor(settings, path, role) }}>{children}</span>;
}

export { ResumeText };
