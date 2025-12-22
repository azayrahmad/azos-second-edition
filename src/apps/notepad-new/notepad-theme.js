import { EditorView } from "@codemirror/view";

export const notepadTheme = EditorView.theme(
  {
    "&": {
      color: "black",
      backgroundColor: "white",
      fontFamily: '"Fixedsys Excelsior", monospace',
      fontSize: "16px",
    },
    ".cm-content": {
      caretColor: "#000",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#000",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--Hilight) !important",
        color: "var(--HilightText) !important",
      },
    ".cm-gutters": {
      backgroundColor: "#fff",
      color: "#000",
      border: "none",
    },
  },
  { dark: false },
);
