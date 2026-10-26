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
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId={sectionId} style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleItems.map((item) => (
                    <motion.div key={item.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                        <motion.div layout="position" className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 ${flexLayout ? "" : "flex-[1.5]"}`}>
                                {item.title && (<h4 className="font-bold" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{<ResumeText field={`customData.${sectionId}.${item.id}.title`} role="title">{item.title}</ResumeText>}</h4>)}
                            </div>
                            {centerSubtitle && item.subtitle && (
                                <motion.div layout="position" className={`text-subtitleFont ${flexLayout ? "ml-[16px]" : "flex-1"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle">{item.subtitle}</ResumeText>}
                                </motion.div>
                            )}
                            {item.dateRange && (<span className={`text-subtitleFont shrink-0 ${flexLayout ? "ml-auto" : "flex-1 text-right"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    <ResumeText field={`customData.${sectionId}.${item.id}.dateRange`} role="date">{formatDateString(item.dateRange, locale, globalSettings?.dateFormat)}</ResumeText>
                                </span>)}
                        </motion.div>
                        {!centerSubtitle && item.subtitle && (
                            <motion.div layout="position" className="text-subtitleFont mt-1" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle">{item.subtitle}</ResumeText>}</motion.div>
                        )}
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
