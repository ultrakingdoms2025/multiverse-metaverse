# Ultra Kingdoms — Multiverse Metaverse Landing Page Design

## Overview

A single-page, no-scroll, immersive 3D marketing landing page for **Ultra Kingdoms**, a AAA cyberpunk multiverse metaverse game. The page functions like a game itself — players navigate a rail-based camera through a neon noir cityscape, encountering 6 holographic NPC characters who each present modal information about different game systems.

**Primary goal:** Marketing landing page to attract new players with sign-up, wishlist, and community links.

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
- Ground plane: dark reflective surface (MeshStandardMaterial, high metalness, low roughness) for rain-slicked street effect
- Neon signs: plane geometries with emissive materials + bloom
- Portal arches: torus geometries with animated energy shaders, placed between NPC stations
- Atmospheric fog: exponential fog in deep blue/purple
- Rain: particle system with streak geometry, ground splash effect

**Lighting:**
- No global ambient light — scene is dark by default
- Point lights at neon signs (magenta, cyan, purple) casting colored pools
- Volumetric god rays from portal arches
- Post-processing: UnrealBloomPass for emissives, chromatic aberration

### Rail Path

- CatmullRom spline winding at street level (~1.7m camera height)
- Curves between buildings, passes through portal arches
- 6 NPC stations as stop points along the spline
- ~3 second eased transition between stations
- Subtle mouse-driven parallax (±5 degrees from rail direction)

## NPC System

### NPC Visual Design

Each NPC is a holographic figure at their station:
- Humanoid silhouette from simple shapes (cylinder, sphere, planes)
- Hologram shader: translucent, scan-lines, slight flicker, color-coded glow
- Idle animation: sine-wave Y-axis bob, orbiting holographic particles
- Proximity activation: brighter glow, faces camera, interaction prompt appears

### The 6 Encounters

| # | NPC | Color | Station Setting | Topic |
|---|-----|-------|----------------|-------|
| 1 | The Architect | Cyan | Floating blueprint holograms | Multiverse lore, world-building, how realms connect |
| 2 | The Broker | Gold/Amber | Market stall with floating trade widgets | Economy, crafting, trading system |
| 3 | The Warden | Red | Arena gates with energy barriers | Combat mechanics, PvP, abilities |
| 4 | The Navigator | Blue/White | Dimensional portal hub | Realm travel, exploration, open world |
| 5 | The Syndicate Boss | Purple | Throne with faction banners | Guilds, factions, social systems |
| 6 | The Oracle | Green/Teal | Crystal sphere with data streams | Roadmap, upcoming features, launch info |

### Modal Design

- Slides in from right side (40% viewport width)
- Dark glass background (`rgba(0,0,0,0.85)`) with neon border matching NPC color
- Glitch-in animation on open, glitch-out on close
- Contents: NPC icon, title, 2-3 paragraphs of lore-styled text, feature bullets, visual area
- Close via: X button, click outside, Escape key
- Scene effect: camera holds, subtle depth-of-field blur behind modal

## HUD & Controls

### HUD Elements

- **Top left:** "ULTRA KINGDOMS" logo text with glitch animation + "Enter the Multiverse" tagline
- **Top right:** Audio toggle (ambient cyberpunk track, off by default)
- **Bottom center:** Left/right arrow navigation + keyboard hints (Arrow keys / A,D)
- **Bottom left:** Progress indicator — 6 dots for NPC stations (current glows, visited filled)
- **Bottom right:** Persistent "Join the Multiverse" CTA button

### Controls

| Input | Action |
|-------|--------|
| Arrow keys / A,D | Move forward/back along rail |
| Click on NPC | Open info modal |
| E key | Open modal when in NPC range |
| Escape | Close modal |
| Mouse movement | Subtle parallax look (±5°) |

## Final CTA Moment

After The Oracle's modal closes:
- Full-screen overlay fades in over the 3D scene
- Large "ULTRA KINGDOMS" title with cinematic reveal animation
- Three CTA buttons: "Wishlist on Steam" / "Join Discord" / "Sign Up for Beta"
- Background: scene continues rendering with heightened bloom, all portals pulse in sync

## Loading Screen

- Black screen with "ULTRA KINGDOMS" text
- Neon-styled loading progress bar
- Fast load expected (procedural geometry, no large textures/models)

## Performance Targets

- 60fps on mid-range hardware (GTX 1060 / M1 equivalent)
- < 3 second initial load (no external models)
- Single bundle deployment
- Responsive: works on desktop browsers (16:9 primary, ultrawide supported)
