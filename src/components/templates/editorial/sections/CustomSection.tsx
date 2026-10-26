import { visibleCustomItems } from "@/lib/customItems";
import { ResumeText } from "@/components/templates/shared/ResumeText";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings, CustomItem } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";

interface CustomSectionProps {
  sectionId: string;
  title: string;
  items: CustomItem[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const CustomSection = ({ sectionId, title, items, globalSettings, showTitle = true }: CustomSectionProps) => {
  const locale = useLocale();
  const visibleItems = visibleCustomItems(items);

  return (
    <SectionWrapper sectionId={sectionId} className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <motion.div key={item.id} layout="position" className="relative pb-6 last:pb-0" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
            <motion.div layout="position" className="flex items-center gap-2">
              <div className="flex-[1.5]">
                {item.title && (<h4 className="font-bold text-black" style={{ fontSize: `${globalSettings?.subheaderSize || 18}px` }}>{<ResumeText field={`customData.${sectionId}.${item.id}.title`} role="title">{item.title}</ResumeText>}</h4>)}
              </div>
              {item.subtitle && (
                <motion.div layout="position" className="flex-1 text-gray-500" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                  {<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle">{item.subtitle}</ResumeText>}
                </motion.div>
              )}
              {item.dateRange && (<span className="flex-1 text-right text-gray-500 shrink-0" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    <ResumeText field={`customData.${sectionId}.${item.id}.dateRange`} role="date">{formatDateString(item.dateRange, locale, globalSettings?.dateFormat)}</ResumeText>
                                </span>)}
            </motion.div>
            {item.description && (
              <ResumeText field={`customData.${sectionId}.${item.id}.description`} role="body">
              <motion.div
                layout="position"
                className="mt-2 text-gray-800 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-0 [&>ul>li]:my-0.5 marker:text-black"
                style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6, textAlign: item.alignment }}
                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(item.description) }}
              />
              </ResumeText>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </SectionWrapper>
  );
};

export default CustomSection;
