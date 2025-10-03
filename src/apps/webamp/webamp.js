let webampInstance = null;

export async function launchWebampApp() {
  if (webampInstance) {
    // TODO: Maybe focus the window?
    return;
  }

  const Webamp = (await import("https://unpkg.com/webamp@^2")).default;
  const desktop = document.querySelector(".desktop");
  if (!desktop) {
    console.error("Could not find desktop element to render Webamp into.");
    return;
  }

  webampInstance = new Webamp({
    // Optional: initial tracks
    // initialTracks: [{
    //   metaData: {
    //     artist: "DJ Mike Llama",
    //     title: "Llama Whippin' Intro",
    //   },
    //   url: "https://cdn.rawgit.com/captbaritone/webamp/master/mp3/llama-2.91.mp3",
    // }],
  });

  await webampInstance.renderWhenReady(desktop);

  webampInstance.onClose(() => {
    webampInstance = null;
  });
}

export function getWebampMenuItems() {
  return [
    {
      label: "E&xit",
      action: () => {
        if (webampInstance) {
          webampInstance.close();
        }
      },
    },
  ];
}