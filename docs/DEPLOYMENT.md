# Vercel + Google AI Studio

Production is live at https://celestial-skyquest.vercel.app. The public API processed a blank image through Gemma 4 and correctly returned no match. Six public desktop/mobile checks passed for the complete game loop, persistence, offline practice, and automated accessibility. Real sky-photo identification accuracy and physical camera behavior still need evaluation. Do not paste credentials into chat or commit them.

## 1. Local live verification

Create a Google AI Studio API key with access to a vision-capable Gemma model. The default model is `gemma-4-26b-a4b-it`; `GEMMA_MODEL` can select another available vision-capable Gemma model. Gemma receives the instruction text and image in one user message, without relying on unsupported structured-output/system-message features.

Provide `GEMMA_API_KEY` through this cloud environment's secure settings, or an ignored local `.env.local`. In the cloud, save the added network destinations and secret requirement. Then restart:

```sh
npm run dev
```

The API listens only on loopback port 8787. Vite proxies same-origin `/api/*` requests from 5173. Node 24's environment proxy support is enabled for the API process so the cloud's injected authentication can work; TLS verification stays enabled.

Go to **Begin expedition → Live Gemma**. Read the photo-sharing disclosure and choose a recent sky image. A resolved Moon image is a more meaningful first check than a bright dot. A generic point of light should yield uncertainty, even if Jupiter is your selected target. A detected object is labelled **AI suggested match**; it is not a verified observation or a calibrated confidence probability.

Practice remains available if the credential, network, quota, or model is unavailable. It is a separate explicit mode; live failures never substitute a mock result.

## 2. Prepare the Vercel project

Create a Vercel token scoped to the account/team where this project should be hosted. Supply `VERCEL_TOKEN` securely in environment settings or `.env.local`. Set non-secret `VERCEL_TEAM_ID` only if a specific team is needed.

Run:

```sh
npm run deploy
```

The script creates or reuses **celestial-skyquest** in that account. If its Production Google key is missing, it stops with a precise message before deploying. Open that project's **Settings → Environment Variables** and add:

| Name            | Scope                | Value                                                         |
| --------------- | -------------------- | ------------------------------------------------------------- |
| `GEMMA_API_KEY` | Production           | Your Google AI Studio key, entered securely                   |
| `GEMMA_MODEL`   | Production, optional | `gemma-4-26b-a4b-it`, or another supported vision Gemma model |

Set the Google key directly in Vercel even if you also supplied it to the cloud environment. Cloud credentials may be proxy placeholders rather than transferable secrets. The deployment script deliberately never copies a cloud key into the hosting account.

Rerun `npm run deploy`. It bundles each API entry with esbuild for Node 24, then uploads an explicit allowlist of source/build configuration, excludes `.env*`, `.git`, caches, test artifacts, and credentials, then waits for Vercel to report READY. It prints a real deployment URL only after receiving one from Vercel and checking `/api/config` there. No public URL is fabricated. If Deployment Protection prevents public access, configure the intended production audience in Vercel before presenting it publicly.

## 3. Validate the deployed app

- Verify Tonight loads over HTTPS on the returned production URL.
- Complete a practice discovery and mission, then reload to check persistence.
- In Live Gemma mode, submit a real recent sky image and inspect the actual outcome; `/api/config` only proves a key is configured, not that the provider accepts it.
- Test a generic point of light or unrelated photo: it should not award a confident discovery.
- Deny geolocation once and verify that practice remains available. Optional live location is rounded to 0.1 degrees.
- After an online production load, reload offline and complete a practice find. API calls and live analysis are intentionally not cached.

Camera hardware and iOS installation need a check on the presentation device; cloud Chromium file-upload tests do not verify physical cameras or Safari.

## Runtime limits and data flow

Photos are decoded/resized on the device to at most 1568 pixels on the longest side, re-encoded as JPEG to remove metadata, and capped at 2 MB. The server also checks byte limits, image signatures, target IDs, observation freshness, coordinates, response schemas, and plausible solar positions. Model requests time out after 20 seconds. No image or provider credential is logged by the app.

The small in-memory limiter allows six requests per minute per hashed client address and two simultaneous model calls per function instance. Serverless instances do not share those counters: configure provider-side quotas or Vercel protection for a large public audience. A conservative prompt and validation reduce unsupported matches but cannot establish scientific accuracy; evaluate real sky images before making accuracy claims.

A credentialed Gemma 4 text request succeeded during setup. A blank-image check exercises the real provider separately from the automated tests, which use explicit provider fixtures. Public deployment and real sky-photo accuracy still require separate verification.
