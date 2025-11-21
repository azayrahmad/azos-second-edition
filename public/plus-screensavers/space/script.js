import Starfield from "./Starfield.js";
import HubbleTelescope from "./HubbleTelescope.js";
import Astronaut from "./Astronaut.js";
import AudioPlayer from "./AudioPlayer.js";

document.addEventListener("DOMContentLoaded", function () {
  const starfield = new Starfield(document.body);
  starfield.start();

  const hubbleElement = document.querySelector(".hubble-telescope");
  const astronautElement = document.querySelector(".astronaut");
  const audioElement = document.getElementById("background-audio");

  // Only proceed if critical elements are found
  if (!hubbleElement || !astronautElement || !audioElement) {
    console.error(
      "Missing one or more critical elements: .hubble-telescope, .astronaut, #background-audio",
    );
    return;
  }

  const hubble = new HubbleTelescope(hubbleElement);
  const astronaut = new Astronaut(astronautElement);
  const audioPlayer = new AudioPlayer(audioElement);

  // Wait for all critical images to load before starting animations
  Promise.all([hubble.loadInitialImage(), astronaut.loadInitialImage()])
    .then(() => {
      // Now it's safe to get dimensions and start animations
      hubble.resetPosition(); // Initial positioning after load
      hubble.startAnimation();

      astronaut.resetPosition(true); // Initial positioning after load
      astronaut.startAnimation();

      audioPlayer.start();
    })
    .catch((error) => {
      console.error("An error occurred during initial setup:", error);
      // Even if an error occurs, try to start animations with available data
      hubble.resetPosition();
      hubble.startAnimation();
      astronaut.resetPosition(true);
      astronaut.startAnimation();
      audioPlayer.start();
    });
});
