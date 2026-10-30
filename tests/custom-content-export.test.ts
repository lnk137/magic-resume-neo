import assert from "node:assert/strict";
import test from "node:test";
import { generateResumeMarkdown } from "../src/utils/markdown.ts";
import { blankResumeState } from "../src/config/initialResumeData.ts";
import type { ResumeData } from "../src/types/resume.ts";

test("custom markdown retains free right content, emphasis and field visibility", () => {
  const resume = {
    ...structuredClone(blankResumeState),
    id: "free", title: "Resume", createdAt: "", updatedAt: "", templateId: null,
    menuSections: [{id: "custom-1", title: "Awards", icon: "", enabled: true, order: 0}],
    customData: {"custom-1": [{id: "a", title: "Project", subtitle: "Hidden", dateRange: "2026/02 - 2027/05", description: "", visible: true, hiddenFields: ["subtitle"], fieldBold: {title: false, dateRange: true}}]},
    globalSettings: {dateFormat: "short-month"},
  } as ResumeData;
  const markdown = generateResumeMarkdown(resume);
  assert.ok(markdown.includes("Project | **2026/02 - 2027/05**"));
  assert.ok(!markdown.includes("Hidden"));
  resume.customData["custom-1"][0].separatorAfter = "line";
  assert.ok(generateResumeMarkdown(resume).includes("\n\n---"));
  assert.ok(!markdown.includes("**Project**"));
  resume.customData["custom-1"][0].dateRange = "Any right text";
  assert.ok(generateResumeMarkdown(resume).includes("**Any right text**"));
});

test("Markdown exports a visible divider without turning transparent space into a line", () => {
  const resume = {
    ...structuredClone(blankResumeState), id: "dividers", title: "Resume", createdAt: "", updatedAt: "", templateId: null,
    menuSections: [{ id: "custom-1", title: "Awards", icon: "", enabled: true, order: 0 }],
    customData: { "custom-1": [{ id: "a", title: "Project", subtitle: "", dateRange: "", visible: true, description: '<p>Alpha</p><hr data-resume-divider="space" style="height:16px"><p>Beta</p><hr data-resume-divider="line"><p>Gamma</p>' }] },
  } as ResumeData;
  const markdown = generateResumeMarkdown(resume);
  assert.match(markdown, /Alpha\s+Beta\s+---\s+Gamma/);
  assert.equal((markdown.match(/---/g) || []).length, 1);
});
