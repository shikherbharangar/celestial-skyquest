# A 90-second walk through CELESTIAL

Open the production build on a phone-sized screen. Sound is optional and starts muted. For a fresh run, open **Explorer edition → Start a fresh journal → Start a fresh journal**. Reset removes only the local demo journal; export it first if you want to retain a copy.

1. **0–15 seconds — The invitation.** “CELESTIAL turns the curiosity of looking up into a little collecting adventure.” Show Tonight, Mochi, the Jupiter hunt, and the mostly undiscovered solar system.
2. **15–30 seconds — Go outside, in spirit.** Choose **Begin expedition**. Explain that the outdoor screen keeps the focus on the sky. Choose **Try a practice sky** for a reliable demonstration. Camera capture/upload is also available.
3. **30–40 seconds — The moment.** Let the scanning and discovery reveal finish. Jupiter earns 250 XP, the player reaches Stargazer, and a single memorable science fact appears.
4. **40–65 seconds — A bigger question.** Select **Build a mission**. Try Human, Explore, and Unhinged to see Mochi's reaction. Generate the flight plan. Point out that the science note keeps Jupiter missions orbital and labels crewed outer-planet travel as speculative.
5. **65–80 seconds — Close the loop.** Launch the concept, earn 700 XP, and open the field journal. Jupiter and Mission Architect are saved. Reload to demonstrate persistence.
6. **80–90 seconds — The next night.** Return to Tonight: the next hunt is the Moon. “The goal is a little less scrolling and a little more stargazing.”

## Show if time permits

- **Faint signal:** Expedition → Try a faint signal → recover with a new photo. Uncertainty is part of the game and earns no XP.
- **Real astronomy:** Tonight → What's actually up tonight? → explicitly allow approximate location. The guide computes local sky positions; daylight guidance explains why an above-horizon object may still be invisible.
- **Offline:** Load the production app online once, let its service worker cache assets, then go offline and reload. The full practice loop remains available.
- **Careful science:** Choose Andromeda. Missions observe it from Earth orbit, rather than pretending a spacecraft can reach it in six years.

## Explain what’s real

“Practice lets you try the whole game without going outside. Live Gemma can look at a photo, though a bright dot often isn’t enough to identify. The sky guide calculates real planet positions. Missions are imaginary trips, with real space facts guiding the choices.”

Do not describe simulated confidence as image accuracy, demo collectibles as verified observations, or mission launches as real simulations of spacecraft dynamics. Use practice for the main walkthrough so a slow connection won’t interrupt it.

## Before presenting

- Run `npm run build`, `npm test`, and `npm run test:e2e`.
- Use the production preview/build for offline demonstrations; the development server does not install a service worker.
- Test camera permissions and installation on the actual presentation device. The cloud validation covers Chromium file upload, not physical camera hardware or Safari.
- Live mode is connected on the public app. Before showing it, try the actual sky photo you plan to use. We’ve checked that a blank image returns no match; that doesn’t establish accuracy on real observations.
