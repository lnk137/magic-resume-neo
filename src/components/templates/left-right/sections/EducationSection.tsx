import ResumeText from "@/components/templates/shared/ResumeText";
import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { useLocale } from "@/i18n/compat/client";
import { hasMeaningfulRichTextContent, normalizeRichTextContent } from "@/lib/richText";
import { formatDateRange } from "@/lib/utils";
import SectionLogo from "../../shared/SectionLogo";

interface EducationSectionProps {
    education?: Education[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const EducationSection = ({ education, globalSettings, showTitle = true }: EducationSectionProps) => {
    const locale = useLocale();
    const visibleEducation = education?.filter((edu) => edu.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="education" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="education" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleEducation?.map((edu) => (
                    <motion.div key={edu.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                        <motion.div layout="position" className="flex items-center gap-2">
                            <SectionLogo src={edu.logo} config={edu.logoConfig} size={globalSettings?.subheaderSize || 16} />
                            <div className={`font-bold ${flexLayout ? "" : "flex-[1.5]"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                <ResumeText field={`education.${edu.id}.school`} role="title">{edu.school}</ResumeText>
                            </div>
                            {centerSubtitle && (
                                <motion.div layout="position" className={`text-subtitleFont ${flexLayout ? "ml-[16px]" : "flex-1"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {["major", "degree"].filter((key) => edu[key as "major" | "degree"]).map((key, index) => <span key={key}>{index > 0 && " · "}<ResumeText field={`education.${edu.id}.${key}`} role="subtitle">{edu[key as "major" | "degree"]}</ResumeText></span>)}
                                    {edu.gpa && <ResumeText field={`education.${edu.id}.gpa`} role="subtitle">{` · GPA ${edu.gpa}`}</ResumeText>}
                                </motion.div>
                            )}
                            <span className={`text-subtitleFont shrink-0 ${flexLayout ? "ml-auto" : "flex-1 text-right"}`} suppressHydrationWarning
                                style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                <ResumeText field={`education.${edu.id}.date`} role="date">{formatDateRange(edu.startDate, edu.endDate, locale, globalSettings?.dateFormat)}</ResumeText>
                            </span>
                        </motion.div>
                        {!centerSubtitle && (
                            <motion.div layout="position" className="text-subtitleFont mt-1" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                {["major", "degree"].filter((key) => edu[key as "major" | "degree"]).map((key, index) => <span key={key}>{index > 0 && " · "}<ResumeText field={`education.${edu.id}.${key}`} role="subtitle">{edu[key as "major" | "degree"]}</ResumeText></span>)}
                                {edu.gpa && <ResumeText field={`education.${edu.id}.gpa`} role="subtitle">{` · GPA ${edu.gpa}`}</ResumeText>}
                            </motion.div>
                        )}
                        {hasMeaningfulRichTextContent(edu.description) && (
                            <ResumeText field={`education.${edu.id}.description`} role="body"><motion.div layout="position" className="mt-1 text-baseFont"
                                style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
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
