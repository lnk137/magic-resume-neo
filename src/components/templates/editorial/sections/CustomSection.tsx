import CustomItemHeader from "../../shared/CustomItemHeader";
import { visibleCustomItems } from "@/lib/customItems";
import { ResumeText } from "@/components/templates/shared/ResumeText";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings, CustomItem } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";

interface CustomSectionProps {
  sectionId: string;
  title: string;
  items: CustomItem[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const CustomSection = ({ sectionId, title, items, globalSettings, showTitle = true }: CustomSectionProps) => {
  const visibleItems = visibleCustomItems(items);

  return (
    <SectionWrapper sectionId={sectionId} className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <motion.div key={item.id} layout="position" className="relative pb-6 last:pb-0" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            <CustomItemHeader item={item} sectionId={sectionId} globalSettings={globalSettings} />
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
