import assert from "node:assert/strict";
import test from "node:test";
import { contrastOnWhite, isTextColor, resolveTextColor } from "../src/lib/textColors";

test("field colors override semantic colors and absent colors preserve old templates", () => {
  assert.equal(resolveTextColor(undefined, "basic.name", "name"), undefined);
  const settings = { textColors: { name: "#334155", title: "#166534" }, fieldColors: { "basic.name": "#9D174D" } };
  assert.equal(resolveTextColor(settings, "basic.name", "name"), "#9D174D");
  assert.equal(resolveTextColor(settings, "projects.stable-id.name", "title"), "#166534");
  assert.equal(resolveTextColor({ ...settings, fieldColors: { "basic.name": "invalid" } }, "basic.name", "name"), "#334155");
});

test("paper contrast and strict color validation", () => {
  assert.equal(isTextColor("#aBcD12"), true);
  for (const value of ["#fff", "red", "#GG0000", "url(https://x)", undefined]) assert.equal(isTextColor(value), false);
  assert.equal(contrastOnWhite("#000000"), 21);
  assert.equal(contrastOnWhite("#FFFFFF"), 1);
  assert.ok(contrastOnWhite("#166534") > 4.5);
});
