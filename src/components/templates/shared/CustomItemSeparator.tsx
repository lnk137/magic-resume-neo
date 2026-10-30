import type { CustomItem } from "@/types/resume";

/** Empty space is intentional and is preserved in the export DOM. */
export default function CustomItemSeparator({ item }: { item: CustomItem }) {
  if (!item.separatorAfter) return null;
  return (
    <div
      aria-hidden="true"
      data-custom-separator={item.separatorAfter}
      style={{ height: 16, marginTop: 8, boxSizing: "border-box", borderTop: item.separatorAfter === "line" ? "1px solid #e1e1e1" : "1px solid transparent" }}
    />
  );
}
