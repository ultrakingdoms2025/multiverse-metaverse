# Ultra Kingdoms — Multiverse Metaverse Landing Page Design

## Overview

A single-page, no-scroll, immersive 3D marketing landing page for **Ultra Kingdoms**, a AAA cyberpunk multiverse metaverse game. The page functions like a game itself — players navigate a rail-based camera through a neon noir cityscape, encountering 6 holographic NPC characters who each present modal information about different game systems.

**Primary goal:** Marketing landing page to attract new players with sign-up, wishlist, and community links.

**Platform target:** Desktop browsers only. Mobile visitors see a static fallback page with the game logo, a cinematic background image, key feature highlights, and CTA buttons. No 3D rendering on mobile.

## Technical Stack

- **Three.js** — 3D rendering, procedural geometry, shaders, post-processing
- **Custom CatmullRom spline rail system** — cinematic camera path through the city
- **HTML/CSS overlays** — HUD, modals, CTAs layered on top of the canvas
- **Vite** — development server and build tool, producing a single deployable bundle
- **No external 3D models** — all geometry is procedural for fast loading and self-containment

## Visual Style: Neon Noir

- Deep black backgrounds with hot magenta, cyan, and purple neon accents
- Rain-slicked reflective streets
- Holographic advertisements and signage
- Blade Runner-inspired atmosphere: moody, atmospheric, mysterious
- Dominant palette: `#000000`, `#0a0a1a`, `#ff00ff`, `#00ffff`, `#6600ff`, `#ff0066`

## Architecture

### Layer Stack (back to front)

1. **Three.js Canvas** — full viewport 3D cyberpunk city scene
2. **Particle systems** — rain, floating embers, digital dust (within Three.js scene)
3. **HUD layer** — HTML/CSS overlay with title, progress, navigation controls
4. **Modal layer** — HTML/CSS NPC info modals with neon styling
5. **CTA bar** — persistent bottom bar with action buttons

### Scene Composition

**Cyberpunk cityscape (procedural):**
- Buildings: box geometries of varying heights with emissive shader-based window grids
- Holographic billboards: plane geometries on building facades
- Ground plane: dark reflective surface using `MeshStandardMaterial` (metalness: 0.9, roughness: 0.1) with a static pre-baked `CubeRenderTarget` (128x128 resolution) captured once after scene init. Updated only on station transitions (6 total updates during the experience). This gives the wet-street neon reflection look without per-frame cost
- Neon signs: plane geometries with emissive materials + bloom
- Portal arches: torus geometries with animated emissive energy shader (pulsing glow + bloom), placed between NPC stations. No volumetric god rays — portal glow is achieved through high-intensity emissive material + UnrealBloomPass, which is performant and visually striking
- Atmospheric fog: exponential fog in deep blue/purple
- Rain: `BufferGeometry` point/streak particle system, max 5,000 particles, recycled via shader position reset. Ground splash effect: small additive-blended circle sprites generated from a runtime `CanvasTexture` (16x16 white radial gradient, created once at init) — no external texture files. Max 200 active splash sprites

**Lighting:**
- Minimal ambient light (`AmbientLight` intensity 0.02, deep blue `#000011`) — just enough to prevent pure-black geometry, scene reads as dark
- Point lights at neon signs (magenta, cyan, purple) casting colored pools on street
- Holographic billboards use emissive materials + bloom only (no `RectAreaLight` — saves draw calls and avoids the `RectAreaLightUniformsLib` dependency)
- Post-processing pipeline: `EffectComposer` → `RenderPass` → `UnrealBloomPass` (strength 1.5, radius 0.4, threshold 0.8) → `ShaderPass` (chromatic aberration, subtle)

### Rail Path

- CatmullRom spline with ~20 control points winding at street level (~1.7m camera height)
- Curves between buildings, passes through portal arches
- 6 NPC stations defined as parametric positions on the spline (t=0.0, 0.18, 0.36, 0.54, 0.72, 0.9)
- ~3 second eased transition between stations (cubic ease-in-out)
- Camera look-at: interpolates between spline tangent direction and NPC position when within trigger range
- Subtle mouse-driven parallax (±5 degrees from rail direction via quaternion slerp)

### NPC Proximity Trigger

NPCs activate based on the camera's parametric position on the spline. Each NPC has a trigger zone of ±0.04 on the t parameter (roughly ±8% of the distance between stations). When camera enters this zone:
1. NPC glow intensifies (emissive multiplier 1.0 → 3.0 over 0.5s)
2. NPC rotates to face camera (slerp over 0.3s)
3. Interaction prompt appears: "Click or press E to interact" (HTML overlay, positioned above NPC head via `Vector3.project()` to screen coordinates, clamped to stay within viewport bounds). Click detection uses an invisible `SphereGeometry` (radius 2.0) centered on each NPC for raycasting — much more reliable than hitting the thin holographic geometry directly

## NPC System

### NPC Visual Design

Each NPC is a holographic figure at their station:
- Humanoid silhouette from simple shapes (cylinder torso, sphere head, plane cloak/coat)
- Hologram shader: custom `ShaderMaterial` — translucent (opacity 0.7), animated horizontal scan-lines (vertex UV + time uniform), slight flicker (random opacity modulation), color-coded emissive glow
- Idle animation: sine-wave Y-axis bob (amplitude 0.1m, period 3s), orbiting holographic particles (8-12 small sprites per NPC)
- Each NPC's station has unique environmental props (described in encounter table)

### The 6 Encounters

| # | NPC | Color | Station Setting | Topic |
|---|-----|-------|----------------|-------|
| 1 | The Architect | Cyan `#00ffff` | Floating blueprint holograms | Multiverse lore, world-building, how realms connect |
| 2 | The Broker | Gold `#ffaa00` | Market stall with floating trade widgets | Economy, crafting, trading system |
| 3 | The Warden | Red `#ff0044` | Arena gates with energy barriers | Combat mechanics, PvP, abilities |
| 4 | The Navigator | Blue/White `#4488ff` | Dimensional portal hub | Realm travel, exploration, open world |
| 5 | The Syndicate Boss | Purple `#aa00ff` | Throne with faction banners | Guilds, factions, social systems |
| 6 | The Oracle | Teal `#00ffaa` | Crystal sphere with data streams | Roadmap, upcoming features, beta info |

### NPC Modal Content

Each modal contains lore-styled text written from the NPC's perspective, key feature bullets, and an animated CSS visual element (not a 3D sub-viewport — a styled div with CSS animations matching the NPC theme).

**1. The Architect (Cyan)**
> "I designed the bridges between worlds. Each realm is a living dimension — its own physics, its own rules, its own dangers. The Nexus binds them together, and from it, infinite paths diverge."
- Procedurally generated realms with unique biomes and physics rules
- Persistent world state — your actions reshape the multiverse
- Discover hidden rifts connecting secret dimensions
- *Visual:* CSS animated blueprint grid with glowing connection lines

**2. The Broker (Gold)**
> "Everything has a price in the Nexus. Rare alloys from the Ember Wastes, data crystals from the Neon Spires — I move it all. Smart traders build empires. The rest... well, they work for the smart ones."
- Cross-realm trading economy driven by supply and demand
- Craft legendary gear from materials found across dimensions
- Player-run marketplaces and auction houses
- *Visual:* CSS animated ticker tape with floating price widgets

**3. The Warden (Red)**
> "The arenas don't care where you're from. Step through the gate and prove yourself. Solo duels, faction wars, realm sieges — there's always someone who needs to be put down."
- Skill-based combat with deep ability customization
- PvP arenas, ranked ladders, and seasonal tournaments
- Large-scale realm siege warfare (50v50)
- *Visual:* CSS animated combat ability icons with energy pulse effects

**4. The Navigator (Blue/White)**
> "Most people see walls between dimensions. I see doors. The Riftwalker's gift lets us slip between worlds — each one stranger and more beautiful than the last. Ready to see what's out there?"
- Seamless realm transitions through dimensional portals
- Open-world exploration with verticality and hidden areas
- Dynamic events that alter the landscape in real-time
- *Visual:* CSS animated portal swirl with dimension previews

**5. The Syndicate Boss (Purple)**
> "Power isn't taken alone. My syndicate controls three realms and counting. We protect our own, crush our enemies, and split the profits. Join us or stay out of our way."
- Create or join factions with territory control
- Guild halls, shared resources, and faction progression
- Political alliances and betrayals shape the multiverse
- *Visual:* CSS animated faction crest with orbiting alliance icons

**6. The Oracle (Teal)**
> "I see the threads of what's coming. New realms forming in the void. Technologies that will reshape how you fight, trade, and explore. The multiverse is expanding, and you can be there from the beginning."
- Early access beta launching soon
- Regular content drops: new realms, abilities, and events
- Community-driven development — your feedback shapes the game
- *Visual:* CSS animated timeline with glowing milestone nodes

### Modal Design

- Slides in from right side, occupying 40% viewport width (min-height: 100vh, internally scrollable via `overflow-y: auto` if content exceeds viewport height on short screens). The left 60% is covered by a semi-transparent backdrop (`rgba(0,0,0,0.4)`) — clicking the backdrop closes the modal. Canvas pointer-events are disabled while modal is open
- Dark glass background (`rgba(5, 5, 20, 0.92)`) with 1px neon border matching NPC color + outer box-shadow glow
- **Glitch-in animation (0.4s):** CSS keyframes — rapid translateX jitter (±10px, ±5px, 0) combined with opacity flash and a clip-path reveal. **Glitch-out (0.3s):** reverse with horizontal collapse
- Contents: NPC color-coded icon (CSS-drawn), NPC name + title, lore quote (italic), feature bullet list, animated visual element
- Close via: X button (top-right), click outside modal area, Escape key
- Scene effect: camera holds position, post-processing bloom intensity increases slightly (1.5 → 2.0) for a soft-focus feel. No depth-of-field pass (too expensive for the 60fps target)

## HUD & Controls

### HUD Elements

- **Top left:** "ULTRA KINGDOMS" logo text with CSS glitch animation (text-shadow flicker + clip-path slice, 8s cycle) + "Enter the Multiverse" tagline in smaller text
- **Top right:** Audio toggle button (speaker icon, off by default). Audio does NOT autoplay. The MP3 file (~500KB) is fetched lazily when the user first clicks the toggle. If the fetch fails, the toggle silently disables. This avoids browser autoplay restrictions entirely
- **Bottom center:** Previous/Next station arrows + keyboard hint text ("Use Arrow Keys or A/D"). Arrows disable at first/last station. Rail is strictly linear (not looping) — hard stops at t=0.0 and t=0.9
- **Bottom left:** Progress indicator — 6 dots for NPC stations. Current station dot pulses with NPC color, visited dots are filled white, unvisited dots are hollow outlines
- **Bottom right:** Persistent "Join the Multiverse" CTA button (hidden during Final CTA overlay)

### Controls

| Input | Action |
|-------|--------|
| Right arrow / D | Move to next station along rail |
| Left arrow / A | Move to previous station along rail |
| Click on NPC | Open info modal |
| E key | Open modal when in NPC range |
| Escape | Close modal |
| Mouse movement | Subtle parallax look (±5°) |

## Final CTA Moment

**State machine:**
- **Trigger:** The Oracle's modal is closed AND it was the user's first time viewing it
- **Repeatable:** No. Once triggered and dismissed, it does not fire again (tracked via in-memory JS boolean — intentionally not persisted to `sessionStorage` so a page refresh gives a fresh experience). The user can still revisit The Oracle's modal normally
- **Dismissible:** Click anywhere outside the CTA buttons or press Escape to dismiss

**Presentation:**
- Full-screen overlay fades in (0.8s ease) over the 3D scene
- Large "ULTRA KINGDOMS" title with cinematic letter-by-letter reveal animation (CSS)
- "The Multiverse Awaits" subtitle
- Three CTA buttons styled as neon-bordered cards:
  - "Wishlist on Steam" → `#` (placeholder, TBD)
  - "Join Discord" → `#` (placeholder, TBD)
  - "Sign Up for Beta" → `#` (placeholder, TBD)
- Background: scene continues rendering, bloom intensity raised to 2.5, all portal arches pulse in sync (shared time uniform)
- Persistent bottom-right CTA button is hidden during this overlay

## Loading Screen

- Black screen with "ULTRA KINGDOMS" text (CSS glitch animation)
- Neon-styled loading progress bar (tracks Three.js `LoadingManager` progress)
- Fast load expected (procedural geometry, no large textures/models, audio lazy-loaded)
- **Transition to scene:** On `LoadingManager.onLoad`, loading bar completes to 100%, holds for 0.5s, then fades out (opacity 0 over 0.8s) revealing the 3D scene underneath. Scene rendering begins during load but is hidden behind the loading overlay

## Fallback States

- **No WebGL:** Detect via `WebGLRenderer` creation try/catch. Show static fallback page: dark background, game logo, feature highlights as styled cards, CTA buttons. Same content as mobile fallback.
- **Mobile detection:** `window.innerWidth < 1024 || 'ontouchstart' in window`. Show mobile fallback page (no 3D).

## Performance Targets

- 60fps on mid-range hardware (GTX 1060 / M1 equivalent)
- < 3 second initial load (no external models, audio lazy-loaded)
- Single bundle deployment (static hosting — Vercel, Netlify, or any CDN)
- Max particle counts: 5,000 rain streaks, 200 splash sprites, ~60 NPC orbit particles (10 per NPC)
- Post-processing budget: RenderPass + UnrealBloomPass + ChromaticAberration only. No DoF, no SSAO, no SSR
- Desktop only for 3D experience (16:9 primary, ultrawide supported — camera FOV stays at 60°, scene naturally extends to fill wider viewports; HUD elements use fixed pixel offsets from corners, not percentage-based)

## Bloom State Table

| State | Bloom Strength | Bloom Radius | Bloom Threshold |
|-------|---------------|-------------|----------------|
| Default (exploring) | 1.5 | 0.4 | 0.8 |
| Modal open | 2.0 | 0.4 | 0.8 |
| Final CTA overlay | 2.5 | 0.6 | 0.6 |

Transitions between bloom states are lerped over 0.5s.

## Out of Scope

- **Analytics/tracking:** Not included in this spec. Can be added as a follow-up (e.g., GA4 events for modal opens, CTA clicks, station visits)
- **Backend/accounts:** No server-side components
- **Gameplay:** This is a marketing page, not a playable demo
