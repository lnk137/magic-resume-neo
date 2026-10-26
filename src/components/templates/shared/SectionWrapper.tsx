import { ResumeSectionContext } from "./ResumeText";
import { useTemplateContext } from "../TemplateContext";
import { resolveTextColor } from "@/lib/textColors";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
    sectionId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Thin interaction wrapper for all section components.
 * Provides hover highlight + click-to-select behavior.
 */
const SectionWrapper: React.FC<SectionWrapperProps> = ({
    sectionId,
    children,
    className = "",
    style,
}) => {
    const { setActiveSection } = useResumeStore();
    const settings = useTemplateContext()?.globalSettings;

    return (
        <motion.div
            data-resume-section-id={sectionId}
            className={cn(
                "hover:cursor-pointer rounded-md transition-all duration-300 ease-in-out hover:shadow-md",
                "hover:bg-[#f9f8f3]",
                className
            )}
            style={{ color: resolveTextColor(settings, undefined, "body"), ...style }}
            onClick={() => setActiveSection(sectionId)}
        >
            <ResumeSectionContext.Provider value={sectionId}>{children}</ResumeSectionContext.Provider>
        </motion.div>
    );
};

export default SectionWrapper;
