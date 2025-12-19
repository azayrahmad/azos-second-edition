import { EditorView } from '@codemirror/view';

export const notepadTheme = EditorView.theme({
  '&': {
    color: 'black',
    backgroundColor: 'white',
    fontFamily: "'Fixedsys Excelsior 3.01', monospace",
    fontSize: '16px',
  },
  '.cm-content': {
    caretColor: '#000',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#000',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#00f !important',
    color: '#fff !important',
  },
  '.cm-gutters': {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
  },
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--button-face) var(--button-face)',
  },
  '.cm-scroller::-webkit-scrollbar': {
    width: '16px',
    height: '16px',
  },
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'var(--button-face)',
  },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: 'var(--button-face)',
    border: '1px solid',
    borderColor: 'var(--button-hilight) var(--button-shadow) var(--button-shadow) var(--button-hilight)',
    boxShadow: 'inset 1px 1px 0 0 var(--button-shadow), inset -1px -1px 0 0 var(--button-hilight)',
  },
  '.cm-scroller::-webkit-scrollbar-corner': {
    backgroundColor: 'var(--button-face)',
  },
}, { dark: false });
