export function startTutorial(agent) {
  if (!agent || agent.isSpeaking) return;

  agent.stop();
  const ttsEnabled = agent.isTTSEnabled();
  const initialPos = agent._el.offset();

  const getElementTopLeft = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  };

  const getElementCenter = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const playGesture = (x, y, callback) => {
    const direction = agent._getDirection(x, y);
    const gestureAnim = "Gesture" + direction;
    const lookAnim = "Look" + direction;
    const animation = agent.hasAnimation(gestureAnim) ? gestureAnim : lookAnim;
    agent.play(animation, 3000, callback);
  };

  const toggleIconHighlight = (iconEl, highlight) => {
    if (!iconEl) return;
    const iconImg = iconEl.querySelector(".icon img");
    const iconLabel = iconEl.querySelector(".icon-label");
    const action = highlight ? "add" : "remove";
    if (iconImg) iconImg.classList[action]("highlighted-icon");
    if (iconLabel) {
      iconLabel.classList[action]("highlighted-label", "selected");
    }
  };

  const startButton = getElementCenter(".start-button");
  const iconsArea = { x: 40, y: 100 };

  const sequence = [];

  // 1. Welcome
  sequence.push((done) =>
    agent.speakAndAnimate(
      "Hi! I'm Clippy, your azOS assistant. Let me give you a quick tour of azOS.",
      "Explain",
      { useTTS: ttsEnabled, callback: done },
    ),
  );

  // 2. Start Menu
  if (startButton) {
    sequence.push((done) =>
      agent._el.animate(
        { top: startButton.y - 80, left: startButton.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) =>
      playGesture(startButton.x, startButton.y, () => {
        const startButtonEl = document.querySelector(".start-button");
        if (startButtonEl) {
          startButtonEl.classList.add("active");
          setTimeout(() => {
            startButtonEl.click(); // This opens the menu
            done(); // Done with opening the menu
          }, 500);
        } else {
          done();
        }
      }),
    );
    sequence.push((done) =>
      agent.speakAndAnimate(
        "The Start button gives you access to all your programs.",
        "Explain",
        {
          useTTS: ttsEnabled,
          callback: () => {
            const startButtonEl = document.querySelector(".start-button");
            if (startButtonEl) {
              startButtonEl.click(); // Click to close the menu
              startButtonEl.classList.remove("active"); // Remove the active class
            }
            done(); // Indicate that this sequence step is complete
          },
        },
      ),
    );
  }

  // 3. Desktop Icons
  sequence.push((done) =>
    agent._el.animate(
      { top: iconsArea.y, left: iconsArea.x + 100 },
      1500,
      done,
    ),
  );
  sequence.push((done) => playGesture(iconsArea.x, iconsArea.y, done));
  sequence.push((done) =>
    agent.speakAndAnimate(
      "On the left, you'll find desktop icons. Double-click them to launch any program.",
      "Explain",
      { useTTS: ttsEnabled, callback: done },
    ),
  );

  const internetExplorerIcon = getElementTopLeft(
    '.desktop-icon[data-app-id="internet-explorer"]',
  );
  const webampIcon = getElementTopLeft('.desktop-icon[data-app-id="webamp"]');
  const pinballIcon = getElementTopLeft('.desktop-icon[data-app-id="pinball"]');
  const briefcaseIcon = getElementTopLeft(
    '.desktop-icon[data-app-id="my-briefcase"]',
  );
  const coffeeIcon = getElementTopLeft(
    '.desktop-icon[data-app-id="buy-me-a-coffee"]',
  );
  const readmeIcon = getElementTopLeft(
    '.desktop-icon[data-app-id="file-readme"]',
  );

  // 4. Internet Explorer
  if (internetExplorerIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="internet-explorer"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: internetExplorerIcon.y, left: internetExplorerIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(internetExplorerIcon.x, internetExplorerIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "Surf the web like it's 1999. Open any URL and Internet Explorer will load the page as it was in 1999. Really.",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 5. Winamp
  if (webampIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="webamp"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: webampIcon.y, left: webampIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(webampIcon.x, webampIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "Got some mp3 files? Play it with Winamp! Customize the skin as well!",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 6. Pinball
  if (pinballIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="pinball"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: pinballIcon.y, left: pinballIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(pinballIcon.x, pinballIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "Try playing a round of the classic Space Cadet Pinball game.",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 7. My Briefcase
  if (briefcaseIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="my-briefcase"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: briefcaseIcon.y, left: briefcaseIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(briefcaseIcon.x, briefcaseIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "Drag files from your device to an open My Briefcase window to use it in azOS.",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 8. Buy me a coffee
  if (coffeeIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="buy-me-a-coffee"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: coffeeIcon.y, left: coffeeIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(coffeeIcon.x, coffeeIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "If you have some to spare, consider supporting azOS to keep it alive and well.",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 9. Readme.md
  if (readmeIcon) {
    const iconEl = document.querySelector(
      '.desktop-icon[data-app-id="file-readme"]',
    );
    sequence.push((done) =>
      agent._el.animate(
        { top: readmeIcon.y, left: readmeIcon.x + 80 },
        1500,
        done,
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, true);
      playGesture(readmeIcon.x, readmeIcon.y, () => {
        setTimeout(done, 500);
      });
    });
    sequence.push((done) =>
      agent.speakAndAnimate(
        "For more information about the project, read the README.md file here.",
        "Explain",
        { useTTS: ttsEnabled, callback: done },
      ),
    );
    sequence.push((done) => {
      toggleIconHighlight(iconEl, false);
      done();
    });
  }

  // 10. Return home
  sequence.push((done) =>
    agent._el.animate(
      { top: initialPos.top, left: initialPos.left },
      2000,
      done,
    ),
  );
  sequence.push((done) =>
    agent.speakAndAnimate(
      "That's the tour! Feel free to play around with azOS. If you have any questions or need assistance, feel free to ask. Just click me!",
      "Wave",
      { useTTS: ttsEnabled, callback: done },
    ),
  );

  // --- Sequence Executor ---
  let currentIndex = 0;
  function runNext() {
    if (currentIndex < sequence.length) {
      const step = sequence[currentIndex];
      currentIndex++;
      step(runNext); // Pass the executor as the 'done' callback
    }
  }

  runNext();
}
