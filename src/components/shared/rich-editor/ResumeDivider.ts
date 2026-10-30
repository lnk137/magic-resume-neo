import { Node, mergeAttributes } from "@tiptap/core";
import { dividerWidth, dividerThickness, dividerSpaceHeight } from "@/lib/dividers";

/** A normal HTML hr keeps the separator portable to preview and export. */
export const ResumeDivider = Node.create({
  name: "resumeDivider",
  priority: 90,
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      width: { default: 100, parseHTML: (element) => dividerWidth(Number(element.getAttribute("data-divider-width"))), rendered: false },
      thickness: { default: 1, parseHTML: (element) => dividerThickness(Number(element.getAttribute("data-divider-thickness"))), rendered: false },
      height: { default: 16, parseHTML: (element) => dividerSpaceHeight(Number(element.getAttribute("data-divider-height"))), rendered: false },
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
    const width = dividerWidth(node.attrs.width);
    const thickness = dividerThickness(node.attrs.thickness);
    const height = dividerSpaceHeight(node.attrs.height);
    return ["hr", mergeAttributes(HTMLAttributes, {
      "data-resume-divider": space ? "space" : "line",
      ...(space ? { "data-divider-height": height } : { "data-divider-width": width, "data-divider-thickness": thickness }),
      style: space
        ? `border: 0; height: ${height}px; margin: 8px 0;`
        : `border: 0; border-top: ${thickness}px solid #e1e1e1; width: ${width}%; height: 0; margin: 12px 0;`,
    })];
  },
});
