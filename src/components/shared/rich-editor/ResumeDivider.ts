import { Node, mergeAttributes } from "@tiptap/core";

/** A normal HTML hr keeps the separator portable to preview and export. */
export const ResumeDivider = Node.create({
  name: "resumeDivider",
  priority: 90,
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      kind: {
        default: "line",
        parseHTML: (element) => element.getAttribute("data-resume-divider") === "space" ? "space" : "line",
        rendered: false,
      },
    };
  },
  parseHTML() {
    return [{ tag: 'hr[data-resume-divider="line"]', priority: 110 }, { tag: 'hr[data-resume-divider="space"]', priority: 110 }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const space = node.attrs.kind === "space";
    return ["hr", mergeAttributes(HTMLAttributes, {
      "data-resume-divider": space ? "space" : "line",
      style: space
        ? "border: 0; height: 16px; margin: 8px 0;"
        : "border: 0; border-top: 1px solid #e1e1e1; height: 0; margin: 12px 0;",
    })];
  },
});
