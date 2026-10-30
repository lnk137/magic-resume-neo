import CustomItemHeader from "../../shared/CustomItemHeader";
import { cn } from "@/lib/utils";
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
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId={sectionId} style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleItems.map((item) => (
                    <motion.div key={item.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            {item.layoutMode === "free" ? <CustomItemHeader item={item} sectionId={sectionId} globalSettings={globalSettings} /> : <div data-custom-legacy-header={item.id}>
                        <motion.div layout="position" className="flex items-center justify-between gap-4">
                            <div className={cn("flex items-center gap-2 truncate", flexLayout ? "" : "flex-1")}>
                                {item.title && (<h4 className="font-bold truncate" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{<ResumeText field={`customData.${sectionId}.${item.id}.title`} role="title"><span style={{ fontWeight: (item.fieldBold?.title ?? true) ? 700 : 400 }}>{item.title}</span></ResumeText>}</h4>)}
                            </div>
                            {centerSubtitle && item.subtitle && (
                                <motion.div layout="position" className={cn("text-subtitleFont truncate", flexLayout ? "ml-[16px]" : "flex-1")} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle"><span style={{ fontWeight: (item.fieldBold?.subtitle ?? false) ? 700 : 400 }}>{item.subtitle}</span></ResumeText>}
                                </motion.div>
                            )}
                            {item.dateRange && (<span className={cn("text-subtitleFont shrink-0 whitespace-nowrap", flexLayout ? "ml-auto" : "text-right")} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    <ResumeText field={`customData.${sectionId}.${item.id}.dateRange`} role="date"><span style={{ fontWeight: (item.fieldBold?.dateRange ?? false) ? 700 : 400 }}>{item.dateRange}</span></ResumeText>
                                </span>)}
                        </motion.div>
                        {!centerSubtitle && item.subtitle && (
                            <motion.div layout="position" className="text-subtitleFont mt-1" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle"><span style={{ fontWeight: (item.fieldBold?.subtitle ?? false) ? 700 : 400 }}>{item.subtitle}</span></ResumeText>}</motion.div>
                        )}
                            </div>}
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
