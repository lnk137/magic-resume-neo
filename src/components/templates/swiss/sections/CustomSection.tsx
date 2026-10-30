import CustomItemHeader from "../../shared/CustomItemHeader";
import { visibleCustomItems } from "@/lib/customItems";
import { ResumeText } from "@/components/templates/shared/ResumeText";
import React from "react";
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
    const themeColor = globalSettings?.themeColor || "#E31C24";

    return (
        <SectionWrapper sectionId={sectionId} style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-6" style={{ marginTop: `${globalSettings?.paragraphSpacing || 16}px` }}>
                    {visibleItems.map((item) => (
                        <motion.div key={item.id} layout="position" className="group">
                            <CustomItemHeader item={item} sectionId={sectionId} globalSettings={globalSettings} />
                            {item.description && (
                                <motion.div layout="position" className="relative pl-4 mt-2.5">
                                    <div 
                                        className="absolute left-0 top-1 bottom-1 w-[1.5px] opacity-20 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: themeColor }}
                                    />
                                    <ResumeText field={`customData.${sectionId}.${item.id}.description`} role="body">
                                    <div 
                                        className="text-slate-600 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-1 [&>ul>li]:my-0.5 marker:text-slate-400"
                                        dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(item.description) }}
                                        style={{ 
                                            fontSize: `${globalSettings?.baseFontSize || 13}px`, 
                                            lineHeight: globalSettings?.lineHeight || 1.6, textAlign: item.alignment
                                        }}
                                    />
                                    </ResumeText>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default CustomSection;
