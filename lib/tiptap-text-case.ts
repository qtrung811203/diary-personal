import { Mark, mergeAttributes } from "@tiptap/core";

export type TextCaseValue = "upper" | "lower";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textCase: {
      toggleUpperCase: () => ReturnType;
      toggleLowerCase: () => ReturnType;
    };
  }
}

export const TextCase = Mark.create({
  name: "textCase",

  addAttributes() {
    return {
      case: {
        default: null,
        parseHTML: (element) => element.style.textTransform || null,
        renderHTML: (attributes) => {
          if (!attributes.case) return {};
          return {
            style: `text-transform: ${
              attributes.case === "upper" ? "uppercase" : "lowercase"
            }`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { style: "text-transform=uppercase", attrs: { case: "upper" } },
      { style: "text-transform=lowercase", attrs: { case: "lower" } },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleUpperCase:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name, { case: "upper" }),
      toggleLowerCase:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name, { case: "lower" }),
    };
  },
});
