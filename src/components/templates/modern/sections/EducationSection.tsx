import ResumeText from "@/components/templates/shared/ResumeText";
import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { useLocale } from "@/i18n/compat/client";
import { hasMeaningfulRichTextContent, normalizeRichTextContent } from "@/lib/richText";
import { formatDateRange, cn } from "@/lib/utils";
import SectionLogo from "../../shared/SectionLogo";

interface EducationSectionProps {
    education?: Education[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
    variant?: "default" | "sidebar";
}

const EducationSection = ({ education, globalSettings, showTitle = true, variant = "default" }: EducationSectionProps) => {
    const locale = useLocale();
    const visibleEducation = education?.filter((edu) => edu.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    const isSidebar = variant === "sidebar";

    return (
        <SectionWrapper sectionId="education" style={{ marginTop: isSidebar ? 0 : `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle
                type="education"
                globalSettings={globalSettings}
                showTitle={showTitle}
                variant={variant}
            />
            <AnimatePresence mode="popLayout">
                {visibleEducation?.map((edu) => (
                    <motion.div key={edu.id} layout="position" style={{ marginTop: isSidebar ? "12px" : `${globalSettings?.paragraphSpacing}px` }}>
                        <div className={cn("flex gap-4 items-center justify-between", isSidebar && "flex-col items-start gap-1")}>
                            <div className={cn("font-bold truncate flex items-center gap-2", !flexLayout && !isSidebar && "flex-1")}
                                style={{ fontSize: `${isSidebar ? (globalSettings?.baseFontSize || 14) + 2 : (globalSettings?.subheaderSize || 16)}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                <SectionLogo src={edu.logo} config={edu.logoConfig} size={isSidebar ? (globalSettings?.baseFontSize || 14) + 2 : (globalSettings?.subheaderSize || 16)} />
                                <ResumeText field={`education.${edu.id}.school`} role="title">{edu.school}</ResumeText>
                            </div>
                            {centerSubtitle && !isSidebar && (
                                <motion.div layout="position" className={cn("text-subtitleFont truncate", flexLayout ? "ml-[16px]" : "flex-1")}
                                    style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {["major", "degree"].filter((key) => edu[key as "major" | "degree"]).map((key, index) => <span key={key}>{index > 0 && " · "}<ResumeText field={`education.${edu.id}.${key}`} role="subtitle">{edu[key as "major" | "degree"]}</ResumeText></span>)}
                                    {edu.gpa && <ResumeText field={`education.${edu.id}.gpa`} role="subtitle">{` · GPA ${edu.gpa}`}</ResumeText>}
                                </motion.div>
                            )}
                            <span className={cn("text-subtitleFont shrink-0 whitespace-nowrap", !flexLayout && !isSidebar && "text-right", isSidebar && "opacity-80")}
                                suppressHydrationWarning
                                style={{ fontSize: isSidebar ? "12px" : `${globalSettings?.subheaderSize || 16}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                <ResumeText field={`education.${edu.id}.date`} role="date">{formatDateRange(edu.startDate, edu.endDate, locale, globalSettings?.dateFormat)}</ResumeText>
                            </span>
                        </div>
                        {(!centerSubtitle || isSidebar) && (
                            <div className={cn("text-subtitleFont mt-0.5", isSidebar ? "text-xs opacity-90" : "mt-1")}
                                style={{ fontSize: isSidebar ? "12px" : `${globalSettings?.subheaderSize || 16}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                {["major", "degree"].filter((key) => edu[key as "major" | "degree"]).map((key, index) => <span key={key}>{index > 0 && " · "}<ResumeText field={`education.${edu.id}.${key}`} role="subtitle">{edu[key as "major" | "degree"]}</ResumeText></span>)}
                                {edu.gpa && <ResumeText field={`education.${edu.id}.gpa`} role="subtitle">{` · GPA ${edu.gpa}`}</ResumeText>}
                            </div>
                        )}
                        {hasMeaningfulRichTextContent(edu.description) && (
                            <ResumeText field={`education.${edu.id}.description`} role="body"><motion.div layout="position" className={cn("mt-1 text-baseFont", isSidebar && " opacity-80")}
                                style={{
                                    fontSize: `${isSidebar ? (globalSettings?.baseFontSize || 14) - 2 : (globalSettings?.baseFontSize || 14)}px`,
                                    lineHeight: globalSettings?.lineHeight || 1.6,
                                    color: isSidebar ? "#fff" : "inherit"
                                }}
                                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(edu.description) }}
                            /></ResumeText>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default EducationSection;
