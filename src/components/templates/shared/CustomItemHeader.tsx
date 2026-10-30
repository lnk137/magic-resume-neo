import type { CustomItem, GlobalSettings, TextColorRole } from "@/types/resume";
import { ResumeText } from "./ResumeText";
import { isCustomFieldBold } from "@/lib/customItems";

const COLUMNS = [
  { field: "title", align: "left", role: "title" },
  { field: "subtitle", align: "center", role: "subtitle" },
  { field: "dateRange", align: "right", role: "date" },
] as const;

/** Free-form slots keep their stable storage/color keys for older resumes and MCP. */
export default function CustomItemHeader({ item, sectionId, globalSettings }: {
  item: CustomItem;
  sectionId: string;
  globalSettings?: GlobalSettings;
}) {
  const columns = COLUMNS.filter(({ field }) => !item.hiddenFields?.includes(field));
  if (!columns.length) return null;
  return (
    <div data-custom-header={item.id} style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
      {columns.map(({ field, align, role }) => (
        <div key={field} data-custom-column={align} className={field === "title" ? undefined : "text-subtitleFont"} style={{ flex: "1 1 auto", minWidth: item[field] ? 0 : "3em", textAlign: align, overflowWrap: "anywhere", whiteSpace: "pre-wrap", fontWeight: isCustomFieldBold(item, field) ? 700 : 400 }}>
          <ResumeText field={`customData.${sectionId}.${item.id}.${field}`} role={role as TextColorRole}>{item[field]}</ResumeText>
        </div>
      ))}
    </div>
  );
}
