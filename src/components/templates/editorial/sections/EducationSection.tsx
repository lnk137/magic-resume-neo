import ResumeText from "@/components/templates/shared/ResumeText";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateRange } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";
import SectionLogo from "../../shared/SectionLogo";

interface EducationSectionProps {
  education?: Education[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const EducationSection: React.FC<EducationSectionProps> = ({ education, globalSettings, showTitle = true }) => {
  const locale = useLocale();
  const visibleEducation = education?.filter((edu) => edu.visible);
  const showTimeline = visibleEducation && visibleEducation.length > 2;

  return (
    <SectionWrapper sectionId="education" className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle type="education" globalSettings={globalSettings} showTitle={showTitle} />
      <AnimatePresence mode="popLayout">
        {visibleEducation?.map((edu) => (
          <motion.div key={edu.id} layout="position" className={cn("relative pb-6 last:border-0 last:pb-0", showTimeline ? "pl-5 border-l-[1.5px] border-[#e5e7eb]" : "")} style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
            {showTimeline && <div className="absolute left-[-2.25px] top-2.5 w-1.5 h-1.5 bg-black rounded-full" />}

            <motion.h4 layout="position" className="font-bold text-black flex items-center gap-2" style={{ fontSize: `${globalSettings?.subheaderSize || 18}px`, lineHeight: "1.2" }}>
              <SectionLogo src={edu.logo} config={edu.logoConfig} size={globalSettings?.subheaderSize || 18} />
              <ResumeText field={`education.${edu.id}.school`} role="title">{edu.school}</ResumeText>
            </motion.h4>

            <motion.div layout="position" className="uppercase tracking-[0.1em] text-gray-500 mt-2" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
              {["degree", "major"].filter((key) => edu[key as "degree" | "major"]).map((key, index) => <span key={key}>{index > 0 && " in "}<ResumeText field={`education.${edu.id}.${key}`} role="subtitle">{edu[key as "degree" | "major"]}</ResumeText></span>)}
              {(edu.degree || edu.major) ? " • " : ""}
              <ResumeText field={`education.${edu.id}.date`} role="date">{formatDateRange(edu.startDate, edu.endDate, locale, globalSettings?.dateFormat)}</ResumeText>
              {edu.gpa && <ResumeText field={`education.${edu.id}.gpa`} role="subtitle">{` • GPA: ${edu.gpa}`}</ResumeText>}
            </motion.div>

            {edu.description && (
              <ResumeText field={`education.${edu.id}.description`} role="body"><motion.div
                layout="position"
                className="mt-2 text-gray-800 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-0 [&>ul>li]:my-0.5 marker:text-black"
                style={{ fontSize: `${globalSettings?.baseFontSize || 13}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
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
