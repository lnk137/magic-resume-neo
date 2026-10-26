import ResumeText from "@/components/templates/shared/ResumeText";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";
import SectionLogo from "../../shared/SectionLogo";

interface ExperienceSectionProps {
  experiences?: Experience[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences, globalSettings, showTitle = true }) => {
  const locale = useLocale();
  const visibleExperiences = experiences?.filter((exp) => exp.visible);
  const showTimeline = visibleExperiences && visibleExperiences.length > 2;

  return (
    <SectionWrapper sectionId="experience" className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle type="experience" globalSettings={globalSettings} showTitle={showTitle} />
      <AnimatePresence mode="popLayout">
        {visibleExperiences?.map((exp) => (
          <motion.div key={exp.id} layout="position" className={cn("relative pb-6 last:border-0 last:pb-0", showTimeline ? "pl-5 border-l-[1.5px] border-[#e5e7eb]" : "")} style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
            {/* Timeline Dot */}
            {showTimeline && <div className="absolute left-[-2.25px] top-2.5 w-1.5 h-1.5 bg-black rounded-full" />}

            {/* Title: Company as Priority */}
            <motion.h4 layout="position" className="font-bold text-black flex items-center gap-2" style={{ fontSize: `${globalSettings?.subheaderSize || 18}px`, lineHeight: "1.2" }}>
              <SectionLogo src={exp.logo} config={exp.logoConfig} size={globalSettings?.subheaderSize || 18} />
              <ResumeText field={`experience.${exp.id}.company`} role="title">{exp.company}</ResumeText>
            </motion.h4>

            {/* Position & Date */}
            <motion.div layout="position" className="uppercase tracking-[0.1em] text-gray-500 mt-2" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
              {exp.position ? <span className="font-semibold text-black"><ResumeText field={`experience.${exp.id}.position`} role="subtitle">{exp.position}</ResumeText></span> : null}
              {exp.position && " • "}
              <ResumeText field={`experience.${exp.id}.date`} role="date">{formatDateString(exp.date, locale, globalSettings?.dateFormat)}</ResumeText>
            </motion.div>

            {/* Details */}
            {exp.details && (
              <ResumeText field={`experience.${exp.id}.details`} role="body"><motion.div
                layout="position"
                className="mt-2 text-gray-800 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-2 [&>ul]:mb-0 [&>ul>li]:my-0.5 marker:text-black"
                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(exp.details) }}
                style={{ fontSize: `${globalSettings?.baseFontSize || 13}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
              /></ResumeText>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </SectionWrapper>
  );
};

export default ExperienceSection;
