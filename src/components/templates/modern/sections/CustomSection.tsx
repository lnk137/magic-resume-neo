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
        <SectionWrapper sectionId={sectionId} style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleItems.map((item) => (
                    <motion.div key={item.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            <CustomItemHeader item={item} sectionId={sectionId} globalSettings={globalSettings} />
                            {item.description && (
                            <ResumeText field={`customData.${sectionId}.${item.id}.description`} role="body">
                            <motion.div layout="position" className="mt-1 text-baseFont"
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
