export const paintMenus = {
  "&File": [
    {
      label: "&New",
      action: "file-new",
    },
    {
      label: "&Open",
      action: "file-open",
    },
    {
      label: "&Save",
      action: "file-save",
    },
    {
      label: "Save &As",
      action: "file-save-as",
    },
  ],
  "&Edit": [
    {
      label: "&Undo",
      action: "edit-undo",
    },
    {
      label: "&Repeat",
      action: "edit-repeat",
    },
    {
      label: "&History",
      action: "edit-history",
    },
    {
      separator: true,
    },
    {
      label: "Cu&t",
      action: "edit-cut",
    },
    {
      label: "&Copy",
      action: "edit-copy",
    },
    {
      label: "&Paste",
      action: "edit-paste",
    },
    {
      label: "C&lear Selection",
      action: "edit-clear-selection",
    },
    {
      label: "Select &All",
      action: "edit-select-all",
    },
  ],
  "&View": [
    {
      label: "&Tool Box",
      action: "view-tool-box",
    },
    {
      label: "&Color Box",
      action: "view-color-box",
    },
    {
      label: "&Status Bar",
      action: "view-status-bar",
    },
    {
      separator: true,
    },
    {
      label: "&Zoom",
      submenu: [
        {
          label: "&Normal Size",
          action: "view-zoom-normal",
        },
        {
          label: "&Large Size",
          action: "view-zoom-large",
        },
        {
          label: "C&ustom...",
          action: "view-zoom-custom",
        },
      ],
    },
    {
      label: "&View Bitmap",
      action: "view-view-bitmap",
    },
  ],
  "&Image": [
    {
      label: "&Flip/Rotate",
      action: "image-flip-rotate",
    },
    {
      label: "&Stretch/Skew",
      action: "image-stretch-skew",
    },
    {
      label: "&Invert Colors",
      action: "image-invert-colors",
    },
    {
      label: "&Attributes...",
      action: "image-attributes",
    },
    {
      label: "&Clear Image",
      action: "image-clear-image",
    },
  ],
  "&Colors": [
    {
      label: "&Edit Colors...",
      action: "colors-edit-colors",
    },
  ],
  "&Help": [
    {
      label: "&Help Topics",
      action: "help-help-topics",
    },
    {
      separator: true,
    },
    {
      label: "&About Paint",
      action: "help-about-paint",
    },
  ],
};
