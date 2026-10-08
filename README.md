# CELESTIAL

**Little explorer, big universe.** Go stargazing with Mochi, collect planets in your field journal, and dream up a mission to visit them.

[Play CELESTIAL](https://celestial-skyquest.vercel.app)

Start with **Begin expedition → Try a practice sky**. You’ll find Jupiter, learn something about it, and unlock the mission workshop. Your journal saves on this device, so you can pick up where you left off.

## Run it locally

Use Node 24 LTS and npm. The project has been tested with Node 24.19.0.

```sh
npm ci
npm run dev
```

The app runs on port **5173**, with its API on **8787**. Practice works without an account or API key. For live photo analysis, add a Google AI Studio key as `GEMMA_API_KEY` in an ignored `.env.local` file, then restart the dev server. Use `.env.example` as a starting point. Never put a secret in a `VITE_` variable: those values reach the browser.

```sh
npm run build        # Check TypeScript and build the app and offline cache
npm run preview      # Serve the build on port 4173
npm test             # Check rewards, missions, astronomy, and API behavior
npm run test:e2e     # Run desktop and small-screen browser tests
npm run format:check
```

Build before running browser tests. They use system Chromium if it’s installed; otherwise, run `npx playwright install chromium`. You can also set `CHROMIUM_PATH` to your browser executable. Preview serves the frontend; start `npm run dev:api` separately if you need live mode there.

## What’s in the game

- Thirteen objects to collect, eight planets to complete, six ranks, and six badges. Earth is already in your journal because it’s home.
- A discovery reveal with orbiting stars, a planet reveal, and an excited Mochi. Reduced-motion settings skip the extra movement.
- One XP reward per discovery and one per mission destination. Finding an old favourite still counts towards your observing streak.
- A mission workshop where you choose a crew, a goal, and how adventurous you’re feeling. Gas planets get orbital missions; distant galaxies get a telescope in Earth orbit.
- A sky guide that calculates where the Moon and planets are right now, using your approximate location if you share it.
- An exportable journal, optional sound, keyboard navigation, and offline practice after your first online visit.

## Practice and live photos

**Practice** is there to let you try the whole game. It returns your selected target even if you upload an unrelated photo. The faint-signal button lets you try an unsuccessful search. Practice photos stay on your device and aren’t saved in the journal.

**Live Gemma** sends a resized photo to Google AI Studio through our API. The browser removes image metadata first. The request includes the current time and your approximate location only if you’ve already shared it in the sky guide. Choose a recent photo; the app doesn’t read its original capture time.

Gemma can be wrong. A bright dot usually doesn’t contain enough detail to identify a planet, and a high confidence score isn’t proof. The server requires clear visual evidence, checks the returned object against the candidate list, and uses our reference data for the accompanying facts. Failed live requests show an error rather than awarding a practice discovery. Our app doesn’t store uploaded photos; Google’s data-use terms apply to live requests.

The default model is `gemma-4-26b-a4b-it`. Set `GEMMA_MODEL` on the server to use another available Gemma model that accepts images. `/api/config` tells the app whether live mode is configured; it doesn’t test the Google key.

## A note on the science

Sky positions come from [Astronomy Engine](https://github.com/cosinekitty/astronomy). The guide includes the Moon and seven observable planets above 10° altitude. Weather, trees, daylight, and equipment still affect what you can see. Stars and deep-sky objects have finding tips, but don’t yet have local rise/set calculations. Location is rounded to 0.1 degrees and kept in memory.

Missions are imaginary trips built around real facts. Travel times and danger ratings are game estimates, not calculated trajectories. Crewed trips to the outer planets are marked speculative, and there’s no landing on Jupiter.

## Deployment and checks

The app is live on Vercel. The public game loop, saved progress, offline practice, and automated accessibility checks passed on desktop and a 320px screen. The public Gemma API also correctly returned no match for a blank image. That confirms the connection works; real sky-photo accuracy, phone cameras, and Safari still need hands-on testing.

See [deployment instructions](docs/DEPLOYMENT.md) for keys and `npm run deploy`. The script bundles the API functions before uploading them. A static `dist/` host can run practice mode, but live mode needs the server functions.

The offline cache includes the app, fonts, and practice sky—not API responses or your photos. Close and reopen existing tabs to pick up an update. On iPhone, use **Safari → Share → Add to Home Screen** to install. The app expects to be hosted at the domain root.

## Finding your way around

```text
src/components/   Mochi, planets, shared controls, dialogs, and sky guide
src/screens/      Tonight, expedition, discovery, journal, and missions
src/data/         Astronomy facts and sources
src/game/         Rewards, badges, saved progress, and mission templates
src/services/     Photo preparation, identification, sky positions, and sound
src/hooks/        Saved state, live connection status, and installation
src/types/        Shared types
src/styles.css    Colours, layouts, and motion
server/           Google requests, HTTP handlers, and local API server
api/              Vercel function entry points
scripts/          Local startup and deployment
public/           Icons and practice sky
tests/           Unit, API, and browser tests
```

The [demo walkthrough](docs/DEMO.md) takes about 90 seconds. The [design notes](docs/DESIGN.md) cover the artwork and motion.

## Sources and credits

Reference values are rounded from the [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [NASA Solar System Exploration](https://science.nasa.gov/solar-system/), and [NASA Universe](https://science.nasa.gov/universe/). You can find these links in the app’s sky guide too.

Mochi, the planets, and the practice sky were drawn for this project. Fonts are Fraunces and Nunito Sans, distributed through Fontsource under the OFL. Icons are from Lucide, under the ISC licence.
