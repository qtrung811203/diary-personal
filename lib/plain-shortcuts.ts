import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

// Markdown-style block shortcuts TipTap would otherwise apply while typing:
// "- " / "+ " / "* " / "1. " (lists), "> " (quote), "# " (heading),
// "``` " (code block) and "---" / "***" / "___" (horizontal rule). A diary
// isn't markdown: someone typing "- đi chợ" wants to see the dash, not have
// it swallowed into a list the editor doesn't even style.
const AT_LINE_START_THEN_SPACE = /^\s*(?:[-+*]|\d+[.)]|>|#{1,6}|(?:```|~~~)[a-z]*)$/i;
const RULE_PREFIX = /^(?:--|\*\*|__)$/;

export function isBlockShortcut(textBefore: string, typed: string): boolean {
  if (typed === " ") return AT_LINE_START_THEN_SPACE.test(textBefore);
  if (typed === "-" || typed === "*" || typed === "_") {
    return RULE_PREFIX.test(textBefore) && textBefore[0] === typed;
  }
  return false;
}

// Runs before the node extensions' input rules (higher priority) and, when a
// shortcut is about to fire, inserts the typed character as plain text and
// stops the rule from running.
export const PlainShortcuts = Extension.create({
  name: "plainShortcuts",
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            const $from = view.state.doc.resolve(from);
            if (!$from.parent.isTextblock) return false;
            const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
            if (!isBlockShortcut(before, text)) return false;
            view.dispatch(view.state.tr.insertText(text, from, to));
            return true;
          },
        },
      }),
    ];
  },
});
