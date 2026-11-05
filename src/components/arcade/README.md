# Rewards Arcade

Gamified rewards for the participant site: participants earn tokens through program activities and spend them on games. Every play wins a prize (points, merchandise or other). Built on the same stack as the rest of this library: React Aria, Tailwind v4 and `cx`.

**Storybook:** `Arcade/Experience` (full flow inside the AppShell), `Arcade/Screens`, `Arcade/Games/Plinko`, `Arcade/Components`, plus `Base/AppShell › Points won counter`.

## What's here

| Path | What it is |
| --- | --- |
| `arcade-experience.tsx` | Enter → Choose Your Game → Plinko, wired to the API. Navigation lives in state so it runs anywhere. In the platform, mount each branch on a route (`ARCADE_ROUTES`). |
| `api/` | `ArcadeApi` interface, HTTP adapter (`createHttpArcadeApi`), mock API with scenarios, mock prize engine, `ArcadeApiProvider` and hooks (`arcade-session.ts`). |
| `screens/` | Enter and Choose Your Game screens. Presentational: data and callbacks come in as props. |
| `games/plinko/` | Pure engine (`plinko-engine.ts`), canvas board, and the screen. |
| `components/` | Header, neon button (`hoverEffect="swipe"`), token counter, game card, `GameStage` (layout template for every game screen), prize modal, sound toggle, nav badge, icons. |
| `styles/arcade-theme.css` | Self-hosted fonts and every `arcade-*` token and utility. Imported from `src/styles/globals.css`. Nothing in it restyles the rest of the library. |
| `assets/` | Backgrounds, wordmark letters, game art (webp) and fonts (woff2). |

## Integration

1. **Implement `ArcadeApi`** (`api/arcade-api.ts`) against the Core Rewards endpoints, or adapt `createHttpArcadeApi()`. Wrap the participant app in `<ArcadeApiProvider api={realApi} onPointsAwarded={refreshPointsBalance}>`.
2. **Routes:** `/arcade` → `ArcadeEnterScreen`, `/arcade/games` → `ArcadeLobbyScreen`, `/arcade/games/:gameId` → `PlinkoScreen` (see `arcade-experience.tsx` for exactly what each one gets). Without `onNavigate`, the header's Achievements and Jackpot items link to `ARCADE_ROUTES`.
3. **Nav item:** add Rewards Arcade to the sidebar only when `status.isEnabled`, with `badge: <ArcadeNavBadge tokens={status.tokenBalance} />`.
4. **Full-bleed content:** give the AppShell `contentClassName="flex min-h-full max-w-none flex-col p-0 lg:p-0 [--app-header-height:3.5rem]"` on Arcade pages.
5. **Points won:** when a game finishes (one play, or every ball of a multi-play), the provider's `lastAward` updates. Pass it to the sidebar as `pointsAward`, with the refreshed `pointsBalance`. The account card flashes "+N", counts up and holds for 3.5 s, then fades out while the balance rolls up.

## Rules the UI assumes

- **The server decides every outcome.** The play endpoint spends the token, picks the prize and returns it (plus an optional `presentation.plinkoBin`). The client only animates toward that result.
- **Idempotency:** every play sends a fresh `Idempotency-Key`, so a double tap never spends two tokens.
- **Tokens come only from program activities.** There is no buy or earn-more CTA in the Arcade.
- **Plinko layout** comes from the game: `board.tiers` lists bin positions from the outer pair to the single center bin, and each entry names the prize tier shown there (0 = rarest). Current board, edges to center: 100, 250, 500, 1K, then the gear prize in the middle.

## Licenses

Barlow Condensed and JetBrains Mono: SIL Open Font License. Icons in `components/arcade-icons.tsx`: Font Awesome Free 7.3.1, CC BY 4.0.
