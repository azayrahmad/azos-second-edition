// This file defines "core" applications that are essential for the OS to function
// and for desktop shortcuts to work correctly. They are separated from the dynamic
// app generation in `generateProgramFiles.js` to ensure they are always present.

export const coreApps = [
  { id: "app-my-computer", type: "app", appId: "my-computer" },
  { id: "app-my-documents", type: "app", appId: "my-documents" },
  { id: "app-recycle-bin", type: "app", appId: "recycle-bin" },
  { id: "app-network-neighborhood", type: "app", appId: "network-neighborhood" },
];
