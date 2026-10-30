import { dividerWidth, dividerThickness, dividerSpaceHeight, dividerSpacing } from "@/lib/dividers";
import type { CustomItem } from "@/types/resume";

export default function CustomItemSeparator({ item }: { item: CustomItem }) {
  if (!item.separatorAfter) return null;
  if (item.separatorAfter === "space") return <div aria-hidden="true" data-custom-separator="space" style={{ height: dividerSpaceHeight(item.separatorHeight) }} />;
  return (
    <div aria-hidden="true" data-custom-separator={item.separatorAfter} style={{ padding: `${dividerSpacing(item.separatorSpacing)}px 0` }}>
      <div style={{ width: `${dividerWidth(item.separatorWidth)}%`, borderTop: `${dividerThickness(item.separatorThickness)}px ${item.separatorAfter === "dashed" ? "dashed" : "solid"} #e1e1e1` }} />
    </div>
  );
}
