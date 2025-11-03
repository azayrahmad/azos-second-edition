const directory = [
  {
    id: "drive-c",
    name: "C:",
    type: "drive",
    children: [
      {
        id: "folder-program-files",
        name: "Program Files",
        type: "folder",
        children: [
          { id: "app-about", type: "app", appId: "about" },
          { id: "app-tipOfTheDay", type: "app", appId: "tipOfTheDay" },
          { id: "app-pdfviewer", type: "app", appId: "pdfviewer" },
          { id: "app-notepad", type: "app", appId: "notepad" },
          { id: "app-image-viewer", type: "app", appId: "image-viewer" },
          { id: "app-clippy", type: "app", appId: "clippy" },
          { id: "app-webamp", type: "app", appId: "webamp" },
          { id: "app-appmaker", type: "app", appId: "appmaker" },
          { id: "app-alertTest", type: "app", appId: "alertTest" },
          { id: "app-themetocss", type: "app", appId: "themetocss" },
          {
            id: "app-soundschemeexplorer",
            type: "app",
            appId: "soundschemeexplorer",
          },
          { id: "app-explorer", type: "app", appId: "explorer" },
          { id: "app-my-computer", type: "app", appId: "my-computer" },
          { id: "app-my-documents", type: "app", appId: "my-documents" },
        ],
      },
      {
        id: "folder-user",
        name: "user",
        type: "folder",
        children: [
          {
            id: "folder-desktop",
            name: "desktop",
            type: "folder",
            children: [
              {
                id: "shortcut-to-about",
                type: "shortcut",
                targetId: "app-about",
                name: "About",
              },
              {
                id: "shortcut-to-tipOfTheDay",
                type: "shortcut",
                targetId: "app-tipOfTheDay",
                name: "Tip of the Day",
              },
              {
                id: "shortcut-to-pdfviewer",
                type: "shortcut",
                targetId: "app-pdfviewer",
                name: "PDF Viewer",
              },
              {
                id: "shortcut-to-notepad",
                type: "shortcut",
                targetId: "app-notepad",
                name: "Notepad",
              },
              {
                id: "shortcut-to-image-viewer",
                type: "shortcut",
                targetId: "app-image-viewer",
                name: "Image Viewer",
              },
              {
                id: "shortcut-to-clippy",
                type: "shortcut",
                targetId: "app-clippy",
                name: "Assistant",
              },
              {
                id: "shortcut-to-webamp",
                type: "shortcut",
                targetId: "app-webamp",
                name: "Winamp",
              },
              {
                id: "shortcut-to-appmaker",
                type: "shortcut",
                targetId: "app-appmaker",
                name: "App Maker",
              },
              {
                id: "shortcut-to-alertTest",
                type: "shortcut",
                targetId: "app-alertTest",
                name: "Alert Test",
              },
              {
                id: "shortcut-to-themetocss",
                type: "shortcut",
                targetId: "app-themetocss",
                name: "Theme to CSS",
              },
              {
                id: "file-resume",
                type: "file",
                name: "Resume.pdf",
                openwith: "pdfviewer",
                contentUrl: "public/files/Resume.pdf",
              },
              {
                id: "shortcut-to-soundschemeexplorer",
                type: "shortcut",
                targetId: "app-soundschemeexplorer",
                name: "Sound Scheme Explorer",
              },
              {
                id: "shortcut-to-my-computer",
                type: "shortcut",
                targetId: "app-my-computer",
                name: "My Computer",
              },
              {
                id: "shortcut-to-my-documents",
                type: "shortcut",
                targetId: "app-my-documents",
                name: "My Documents",
              },
            ],
          },
          {
            id: "folder-documents",
            name: "Documents",
            type: "folder",
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "drive-d",
    name: "D:",
    type: "drive",
    children: [],
  },
];

export default directory;
