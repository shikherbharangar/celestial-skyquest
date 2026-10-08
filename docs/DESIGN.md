# A small design system

CELESTIAL should feel like a pocket field journal carried by a tiny, earnest explorer.

| Token      | Value                    | Purpose                                     |
| ---------- | ------------------------ | ------------------------------------------- |
| Sky        | `#182a39`                | Quiet midnight-blue canvas                  |
| Deep sky   | `#142532`                | Expedition viewfinder                       |
| Warm paper | `#f2ead7`                | Collectible cards and primary actions       |
| Ink        | `#253b46`                | Text on paper                               |
| Starlight  | `#e7ca8d`                | Curiosity, XP, and active states            |
| Lavender   | `#b8b4ce`                | Rare finds and supporting accents           |
| Coral      | `#d89c87`                | Mochi's cheeks and warm details             |
| Display    | Fraunces 400, italic 400 | Storybook headings and one-line wonders     |
| Interface  | Nunito Sans 400–800      | Controls, field notes, and readable science |

Use one visual focus per screen. Surfaces are paper or sky rather than layered glass. Fine orbit lines, asymmetric tape, sparse four-point stars, and warm grain provide texture. Borders and modest 9–14 px corners hold the interface together. Planet silhouettes and all Mochi expressions are original vector art.

Buttons compress on press and spring back. Mochi has a slow, low-amplitude float on Tonight. The discovery choreography runs for approximately 2.3 seconds: collapse → orbit → anticipation → shake → burst → planet spring → title → XP → celebration → CTA bounce. Do not blanket every screen in fade-ins. Honor reduced motion by removing decorative loops, skipping reveal delays, and keeping the same information/actions available.

Earth is the first keepsake because it is home. Other collectibles are earned; no fabricated discovery history or artificially prefilled XP is shown. Demo status belongs close to consequential claims, especially image identification and collection entries.

On small screens, retain the distinctive title and art, then place the hunt before secondary collections. Use a three-item bottom navigation. Field tasks use a narrow content column; the mission workshop stacks its choices without horizontal scrolling. Dialogs trap keyboard focus and restore it when closed.
