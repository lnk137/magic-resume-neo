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
    const centerSubtitle = globalSettings?.centerSubtitle;
    const themeColor = globalSettings?.themeColor || "#E31C24";

    return (
        <SectionWrapper sectionId={sectionId} style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle title={title} type="custom" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-6" style={{ marginTop: `${globalSettings?.paragraphSpacing || 16}px` }}>
                    {visibleItems.map((item) => (
                        <motion.div key={item.id} layout="position" className="group">
                            {item.layoutMode === "free" ? <CustomItemHeader item={item} sectionId={sectionId} globalSettings={globalSettings} /> : <div data-custom-legacy-header={item.id}>
                            {/* 不对称网格对齐头部 */}
                            <div className="flex items-baseline justify-between gap-3">
                                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
                                    {item.title && (<h4
                                        className="font-extrabold text-slate-800 tracking-tight"
                                        style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                    >
                                        {<ResumeText field={`customData.${sectionId}.${item.id}.title`} role="title"><span style={{ fontWeight: (item.fieldBold?.title ?? true) ? 700 : 400 }}>{item.title}</span></ResumeText>}
                                    </h4>)}
                                    {centerSubtitle && item.subtitle && (
                                        <span
                                            className="font-medium text-slate-500 border-l border-slate-300 pl-3 text-[14px]"
                                            style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 1}px` }}
                                        >
                                            {<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle"><span style={{ fontWeight: (item.fieldBold?.subtitle ?? false) ? 700 : 400 }}>{item.subtitle}</span></ResumeText>}
                                        </span>
                                    )}
                                </div>
                                {item.dateRange && (<div
                                    className="ml-auto self-center font-mono text-slate-400 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
                                >
                                    <ResumeText field={`customData.${sectionId}.${item.id}.dateRange`} role="date"><span style={{ fontWeight: (item.fieldBold?.dateRange ?? false) ? 700 : 400 }}>{item.dateRange}</span></ResumeText>
                                </div>)}
                            </div>

                            {/* 非居中模式下的副标题展示 */}
                            {!centerSubtitle && item.subtitle && (
                                <div
                                    className="font-semibold text-slate-500 mt-1 uppercase tracking-wider"
                                    style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 2}px` }}
                                >
                                    {<ResumeText field={`customData.${sectionId}.${item.id}.subtitle`} role="subtitle"><span style={{ fontWeight: (item.fieldBold?.subtitle ?? false) ? 700 : 400 }}>{item.subtitle}</span></ResumeText>}
                                </div>
                            )}

                            </div>}
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
