import { profiles } from '../config/profiles.js';

let currentProfileName = 'default';
let currentProfile = profiles.default;

function parseProfileFromUrl() {
  const hash = window.location.hash;
  if (hash.startsWith('#/')) {
    const profileName = hash.substring(2);
    if (profiles[profileName]) {
      currentProfileName = profileName;
      currentProfile = profiles[profileName];
      return;
    }
  }
  // Fallback to default if no valid profile is found
  window.location.hash = '#/default';
}

function getProfileName() {
  return currentProfileName;
}

function getProfile() {
  return currentProfile;
}

function init() {
  parseProfileFromUrl();
  window.addEventListener('hashchange', parseProfileFromUrl);
}

export const profileManager = {
  init,
  getProfileName,
  getProfile,
};
