import { dividerWidth, dividerThickness, dividerSpaceHeight } from "@/lib/dividers";
import type { CustomItem } from "@/types/resume";

/** Empty space is intentional and is preserved in the export DOM. */
export default function CustomItemSeparator({ item }: { item: CustomItem }) {
  if (!item.separatorAfter) return null;
  return (
    <div
      aria-hidden="true"
      data-custom-separator={item.separatorAfter}
      style={{ height: item.separatorAfter === "space" ? dividerSpaceHeight(item.separatorHeight) : 16, marginTop: 8, boxSizing: "border-box", width: item.separatorAfter === "line" ? `${dividerWidth(item.separatorWidth)}%` : "100%", borderTop: item.separatorAfter === "line" ? `${dividerThickness(item.separatorThickness)}px solid #e1e1e1` : "1px solid transparent" }}
    />
  );
}
