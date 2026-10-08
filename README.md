# CELESTIAL

**Little explorer, big universe.** A mobile-first stargazing game with original illustrated artwork, tactile discovery reveals, collectible field notes, and playful mission planning.

## Play and develop

Use Node 24 LTS (tested with 24.19.0) and npm. Node 22.12+ also satisfies the toolchain requirements.

```sh
npm ci
npm run dev
```

Vite listens on port **5173**. Practice mode needs no account or credentials. `npm run dev` starts the web app on 5173 and its private API on 8787; live identification additionally needs a Google AI Studio key. The complete game is available immediately through **Begin expedition → Try a practice sky**. Camera capture uses the mobile browser's native file/camera picker; desktop users can upload an image or use the illustrated practice sky.

```sh
npm run build       # strict TypeScript check + production bundle + PWA
npm run preview     # serve dist on port 4173
npm test            # progression, science constraints, provider and astronomy tests
npm run test:e2e    # production browser tests at 1440px and 320px
npm run format:check
```

Build before running the browser tests. They use system Chromium when available; otherwise run `npx playwright install chromium`. Set `CHROMIUM_PATH` if your browser lives elsewhere. Camera hardware, iOS installation, and a production hosting provider have not been exercised in the cloud browser.

See [the 90-second demo guide](docs/DEMO.md) for a presentation route and [the design system](docs/DESIGN.md) for the art direction.

## What works

- **Tonight → expedition → camera/upload/sample → scan → reveal → XP → collection → mission builder → launch → next hunt.**
- A roughly 2.3-second discovery sequence: photo collapse, orbiting scan stars, anticipation/shake, particle burst, spring reveal, XP count-up, celebrating Mochi, and a single button bounce.
- Thirteen collectible objects, including Earth as a starting home-world keepsake; eight-planet completion tracking, six ranks, and six achievements.
- Exactly one discovery reward per object and one mission reward per destination. Repeat finds still count as observation days. The three-night badge uses consecutive local calendar dates.
- Device-local persistence, an exportable JSON journal, guarded reset, and recovery from malformed stored data. If browser storage is unavailable, gameplay continues with a visible persistence notice.
- Robotic/human crew, three goals, and three risk attitudes. Science-informed mission templates handle gas planets, speculative crewed travel, and distant objects observed from Earth orbit.
- Optional approximate geolocation, current-time astronomical positions, compass directions, above-horizon filtering, and daylight guidance. Location is rounded to 0.1 degrees, computed locally, and retained only in memory.
- Original SVG planets and Mochi expressions; self-hosted fonts; restrained synthesized sound effects, off by default; reduced-motion support; keyboard navigation and focus-trapped dialogs.
- Production PWA manifest, generated icons, and service-worker precaching of the app, fonts, and practice sky. The practice loop works offline after the first successful production load.

## Honest demo boundaries

**Practice identification is mocked.** Every normal practice attempt—including an uploaded photo—returns the selected target with a simulated confidence score. The faint-signal action returns uncertainty. Neither the score nor a collectible verifies an actual observation. The app labels demo mode and demo discoveries explicitly. Practice photos stay in memory on the device and are not uploaded or written to localStorage. In explicitly selected Live Gemma mode, the browser removes metadata, resizes the photo, and sends it through our server to Google AI Studio. Live matches are labelled AI suggestions, not verified observations.

**Sky positions are calculated, not mocked.** Astronomy Engine computes the Moon and seven observable planets relative to time and approximate location. A target above 10° altitude is a candidate, not a guarantee of visibility: weather, terrain, sunlight, faintness, and equipment still matter. Stars and deep-sky objects currently have educational finding hints, not location-based rise/set calculations.

**Mission launches are simulated.** Objectives use local templates; durations and danger ratings are illustrative game design, not optimized flight trajectories. Facts and physical constants come from curated structured data. Moon counts are deliberately omitted because they change as new satellites are confirmed.

**The live Gemma integration is implemented.** `/api/identify` calls Google AI Studio's `gemma-4-26b-a4b-it` through a server-only credential. It validates image size/signature, time and coordinates, recomputes above-horizon solar candidates when location is shared, enforces per-instance request/concurrency limits, and rejects malformed, ambiguous, or out-of-candidate model results. Unresolved bright dots must remain uncertain. Facts always come from structured data. Live failures never turn into demo results.

An API key and provider access are still required. The default model is configurable through server-side `GEMMA_MODEL`; it must be a vision-capable Gemma model available to your Google AI Studio project. `/api/config` reports configuration availability, not a successful provider health check. Integration tests substitute provider responses; a credentialed real-photo request is the remaining end-to-end live validation.

For local live mode, set `GEMMA_API_KEY` securely in the environment or an ignored `.env.local` (see `.env.example`), then restart `npm run dev`. Choose **Live Gemma** before selecting a photo. Do not use `VITE_` variables for any secret. Use a recent photo: this version supplies the current observation time, not EXIF capture time. Approximate coordinates are sent only after the player shares location in the sky guide. Google AI Studio's data-use terms apply to live submissions; our code does not log or retain image payloads.

## Project map

```text
src/
  components/       original SVG art, buttons, accessible dialogs, local sky guide
  screens/          tonight, expedition, discovery, collection, mission workshop
  data/             sourced, rounded astronomical reference values
  game/             progression, reward idempotency, achievements, mission templates
  services/         identification, local image preparation, sky calculations, audio
  hooks/            local persistence and PWA installation
  types/            shared game/provider contracts
  styles.css        tokens, art direction, all responsive layouts, reduced motion
server/             validated Gemini API/Gemma requests, HTTP handlers, local API server
api/                Vercel serverless entry points
scripts/            development orchestration and credential-safe Vercel deployment
public/             original icons and illustrated practice sky
 tests/unit/        progression and service checks
 tests/e2e/         complete production gameplay and offline browser checks
```

## Deployment

See [the Vercel deployment guide](docs/DEPLOYMENT.md). `vercel.json` prepares the Vite frontend and two Node serverless functions. `npm run deploy` builds locally, then uses the Vercel API to create/reuse `celestial-skyquest`, checks for its Production `GEMMA_API_KEY`, uploads only an explicit source-file list, and waits for the deployment result. `VERCEL_TOKEN` authorizes deployment; it is never placed in the deployed app. Cloud proxy-held Google credentials cannot be copied into Vercel; add that key directly to the project's encrypted environment settings.

A static-only deployment of `dist/` still supports the practice game, but cannot run `/api/identify`. Deploy through Vercel for live mode. HTTPS is required for camera/location features outside local development.

The production service worker caches the UI and practice sky, not API responses or user images. It does not force mid-game updates. Close and reopen existing app tabs to activate a new version. Offline play requires a previously cached production build. Live photo analysis requires connectivity. On iPhone, installation uses Safari → Share → Add to Home Screen.

The app is configured for the domain root. Change asset references, Vite base, manifest scope, and API routing together if using a subdirectory.

## Sources and credits

Astronomical reference values are rounded from the [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [NASA Solar System Exploration](https://science.nasa.gov/solar-system/), and [NASA Universe](https://science.nasa.gov/universe/). Positions use [Astronomy Engine](https://github.com/cosinekitty/astronomy). The same source links are available in the in-app explorer's guide.

Mochi, planets, orbit illustrations, and the practice sky were drawn specifically for this project. No copyrighted character art is used. Fonts are Fraunces and Nunito Sans (OFL, distributed through Fontsource); interface icons are Lucide (ISC).
