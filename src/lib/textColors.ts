import type { GlobalSettings, TextColorRole } from "@/types/resume";

export const isTextColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export function resolveTextColor(settings: GlobalSettings | undefined, field: string | undefined, role: TextColorRole): string | undefined {
  const override = field ? settings?.fieldColors?.[field] : undefined;
  if (isTextColor(override)) return override;
  const semantic = settings?.textColors?.[role];
  return isTextColor(semantic) ? semantic : undefined;
}

export function contrastOnWhite(color: string): number {
  if (!isTextColor(color)) return 1;
  const channels = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 1.05 / (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 + 0.05);
}
