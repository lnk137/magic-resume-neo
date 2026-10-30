/** Invalid or older optional dimensions use the original full-width, 1px line. */
export const dividerWidth = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 100 ? value : 100;
export const dividerThickness = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0.5 && value <= 5 ? value : 1;
export const dividerSpaceHeight = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 100 ? value : 16;

export const dividerSpacing = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 100 ? value : 12;
