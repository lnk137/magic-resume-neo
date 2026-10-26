import type { CustomItem } from "@/types/resume";

/** Mask fields for rendering only. The editor and exported JSON keep the original data. */
export function visibleCustomItems(items: CustomItem[] = []): CustomItem[] {
  return items.filter((item) => item.visible !== false).map((item) => {
    const rendered = { ...item };
    for (const field of item.hiddenFields ?? []) rendered[field] = "";
    return rendered;
  }).filter((item) => item.title || item.subtitle || item.dateRange || item.description);
}

/** Duplicate data and stable-ID color overrides without retaining mutable references. */
export function cloneCustomItems(
  items: CustomItem[],
  sourceSection: string,
  targetSection: string,
  colors: Record<string, string> = {},
): { items: CustomItem[]; fieldColors: Record<string, string> } {
  const fieldColors = { ...colors };
  const copies = items.map((item) => {
    const copy = structuredClone(item);
    copy.id = crypto.randomUUID();
    const prefix = `customData.${sourceSection}.${item.id}.`;
    for (const [path, color] of Object.entries(colors)) {
      if (path.startsWith(prefix)) fieldColors[`customData.${targetSection}.${copy.id}.${path.slice(prefix.length)}`] = color;
    }
    return copy;
  });
  return { items: copies, fieldColors };
}
