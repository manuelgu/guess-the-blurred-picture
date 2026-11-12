# Guess the Blurred Picture — Spec

A party game for people in the same room. A laptop screen-shares the **display** to a TV. A picture slowly reveals itself; players buzz on their phones and shout out who/what it is. The host judges on their own phone, which is the only device that knows the answers.

## Platform

- One Cloudflare Worker serving a Vite + React + TypeScript SPA (static assets) plus `/api/*`.
- **Durable Object per room** (`Room`) holds all game state; every device connects via WebSocket. The DO is the single authority for buzz order.
- **R2** stores images. **D1** stores decks.
- UI languages: **English, German, Swedish** (switchable, remembered per device).

## Devices & roles

| Role | Device | Sees answers? | Auth |
|---|---|---|---|
| Display | Laptop → TV | Never (only after a picture is solved/revealed) | `displayToken` issued at room creation |
| Host | Host's phone | Yes | One-time pairing QR → long-lived `hostToken` |
| Player | Each phone (= one player or one team) | No | `playerId` + `playerToken` (reconnect) |

The server never sends answers to the display or players until the picture is over. The host token survives page refresh / phone lock.

## Setup flow

1. On the laptop: pick (or build) a deck → **Create game**. Laptop opens `/tv/CODE`.
2. Laptop shows a **one-time host QR**. Do this *before* screen sharing. Phone scans → becomes host; the QR stops working.
   - "Re-pair host" is available from the display menu (shows a fresh QR, invalidates the old host).
3. Start screen sharing. Display shows the **join QR** + 4-letter room code (no ambiguous letters).
4. Players open the link, type a player/team name, and get a big buzzer.
5. Host taps **Start game** on the phone.

## Decks

- No accounts. A deck has a secret **edit key**; the link `/decks/:id#key` grants access, and decks are also remembered in browser localStorage.
- Deck settings: title, default reveal mode, default reveal duration.
- Picture: image, answer, optional mode override, optional duration override, optional credit.
- Add pictures by: **uploading photos** (resized in the browser before upload), **Wikimedia Commons search** (imported into R2, credit stored), or **built-in packs** (Wikimedia-sourced).

## Reveal modes

`blur`, `pixelate`, `tiles` (random tiles disappear), `zoom` (starts zoomed into a detail and zooms out), `spotlight` (wandering, growing circle), and `random` (server picks per picture).

## Round rules

- Host advances → 3-2-1 countdown on TV → reveal runs over the picture's duration.
- **Buzz** freezes the reveal. The buzzer gets a **5-second countdown** on the TV to say the answer.
- Other players can still buzz while frozen; they're queued in order ("You're #2 in line").
- Host taps **✓ / ✗**:
  - ✓ → points by how revealed it was at the buzz: **3** (< ⅓), **2** (< ⅔), **1** (otherwise). Answer shown on TV.
  - ✗ → **−1** and that player is **locked out** for the rest of the picture. Next in queue gets their 5 s; if the queue is empty, the reveal resumes.
- The countdown is a guide; the host always makes the call.
- **Host decides** when a picture ends: pause/resume, reveal the answer (no points), skip, next. When fully revealed, the picture just stays until the host acts.
- Host can adjust scores ±1 and kick players.
- After the last picture: final scoreboard / podium.

## Look & feel

Toggleable on the display: **Game-show** (bold, buzzer/tick/correct/wrong sounds, animated scoreboard, podium) or **Minimal** (clean, quiet, picture-first).

## Build phases

1. Room core: room creation, host pairing, players joining, buzzer queue, judging, scoring.
2. Reveal modes.
3. Decks: editor, upload, Wikimedia search, built-in packs.
4. Polish: game-show style, sounds, i18n, podium.
