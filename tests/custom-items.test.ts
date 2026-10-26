import assert from "node:assert/strict";
import test from "node:test";
import { visibleCustomItems } from "../src/lib/customItems.ts";

test("hidden custom fields stay in storage but never reach the renderer", () => {
  const item = { id: "a", title: "Award", subtitle: "Gold", dateRange: "2025", description: "<p>Details</p>", visible: true, hiddenFields: ["subtitle", "dateRange"] as ("subtitle" | "dateRange")[], alignment: "center" as const };
  const [rendered] = visibleCustomItems([item]);
  assert.equal(rendered.subtitle, "");
  assert.equal(rendered.dateRange, "");
  assert.equal(rendered.title, "Award");
  assert.equal(rendered.alignment, "center");
  assert.equal(item.subtitle, "Gold");
  assert.equal(item.dateRange, "2025");
});

test("subtitle-only and date-only entries render; hidden and empty entries do not", () => {
  const base = { id: "a", title: "", subtitle: "", dateRange: "", description: "", visible: true };
  assert.equal(visibleCustomItems([{ ...base, subtitle: "Gold" }]).length, 1);
  assert.equal(visibleCustomItems([{ ...base, dateRange: "2025" }]).length, 1);
  assert.equal(visibleCustomItems([{ ...base, title: "Award", visible: false }]).length, 0);
  assert.equal(visibleCustomItems([{ ...base, title: "Award", hiddenFields: ["title"] }]).length, 0);
  assert.deepEqual(visibleCustomItems(), []);
});

test("cloning entries gives independent IDs, nested settings and color overrides", async () => {
  const { cloneCustomItems } = await import("../src/lib/customItems.ts");
  const source = { id: "a", title: "Award", subtitle: "Gold", dateRange: "2025", description: "Details", visible: true, hiddenFields: ["dateRange"] as "dateRange"[], fieldLabels: { subtitle: "Prize" } };
  const colors = { "customData.custom-1.a.title": "#123456", "basic.name": "#333333" };
  const cloned = cloneCustomItems([source], "custom-1", "custom-2", colors);
  assert.notEqual(cloned.items[0].id, source.id);
  assert.equal(cloned.fieldColors[`customData.custom-2.${cloned.items[0].id}.title`], "#123456");
  assert.equal(cloned.fieldColors["basic.name"], "#333333");
  cloned.items[0].fieldLabels!.subtitle = "Changed";
  cloned.items[0].hiddenFields!.push("title");
  assert.equal(source.fieldLabels.subtitle, "Prize");
  assert.deepEqual(source.hiddenFields, ["dateRange"]);
  assert.equal(Object.keys(colors).length, 2);
});
