import { ICONS } from './icons.js';

export const fileAssociations = {
  // Text files
  txt: {
    appId: 'notepad',
    icon: ICONS.notepad,
  },
  js: {
    appId: 'notepad',
    icon: ICONS.notepad,
  },
  json: {
    appId: 'notepad',
    icon: ICONS.notepad,
  },
  md: {
    appId: 'notepad',
    icon: ICONS.notepad,
  },
  // Image files
  png: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  jpg: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  jpeg: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  gif: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  bmp: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  ico: {
    appId: 'image-viewer',
    icon: ICONS.image,
  },
  // PDF files
  pdf: {
    appId: 'pdfviewer',
    icon: ICONS.pdf,
  },
  // Default
  default: {
    appId: 'notepad',
    icon: ICONS.file,
  },
};
