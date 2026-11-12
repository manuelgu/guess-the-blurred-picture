# Blur Buzz

A party game for one room: a picture slowly un-blurs on the TV, everyone buzzes on their phone, and the host judges answers on a phone that's the only device that knows the solutions. See [SPEC.md](SPEC.md) for the rules and design.

Stack: Cloudflare Worker + Durable Objects (one per room, WebSockets) + R2 (images) + D1 (decks), with a Vite + React + TypeScript frontend.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173 (pass --port to change)
```

**Testing with real phones:** phones can't reach `localhost`. Open the laptop's page through its LAN address instead (Vite prints a `Network:` URL, e.g. `http://192.168.1.20:5173`). The QR codes use whatever address the laptop page was opened with.

Local D1/R2/Durable Object state lives in `.wrangler/` (git-ignored). The `decks` table is created automatically on first use.

## Deploy

```sh
npx wrangler login
npm run deploy
```

`wrangler.jsonc` declares the R2 bucket (`guess-the-blurred-picture-images`) and D1 database (`guess-the-blurred-picture`) without IDs. Recent Wrangler versions provision missing resources on first deploy; if yours doesn't, create them and add the D1 `database_id`:

```sh
npx wrangler r2 bucket create guess-the-blurred-picture-images
npx wrangler d1 create guess-the-blurred-picture
```

## How a game runs

1. Laptop: home page → pick a deck (or a built-in pack) → **Play** → **Create game**.
2. Laptop shows a one-time **host QR**. Scan it with your phone *before* screen sharing (or use **Copy host link** and send it to your phone).
3. Share the laptop screen to the TV. Players scan the join QR (or go to `/join` and type the code).
4. Start the game from your phone. Judge buzzes with ✓/✗.

## Layout

| Path | What |
|---|---|
| `shared/types.ts` | Protocol + deck types, scoring rule |
| `worker/room.ts` | `Room` Durable Object — all game logic |
| `worker/index.ts` | API routes (rooms, decks, images, Commons search, packs) |
| `worker/commons.ts` | Wikimedia Commons search/import |
| `worker/packs.ts` | Built-in packs (Wikipedia lead images on Commons) |
| `src/pages/Display.tsx` | TV view |
| `src/pages/Host.tsx` | Host phone |
| `src/pages/Player.tsx` | Player buzzer |
| `src/pages/DeckEditor.tsx` | Deck editor |
| `src/reveal/render.ts` | The 5 reveal modes (canvas, seeded) |
| `src/i18n.tsx` | EN / DE / SV strings |
