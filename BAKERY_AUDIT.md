# ToDonut Bakery implementation audit

Date: 2026-07-01  
Audit scope: the implemented core Bakery game against `GAME.md`  
Audit mode: read-only source/runtime evidence plus focused verification; no game code was changed

## 2026-07-03 corrective-pass status

The first Bakery corrective pass resolved the audit findings for Business-effect correctness and purchase-path integration. Normal Business upgrade and advertising purchases now call the progress-aware wrappers; Wider Audience, Customer Loyalty, Brand Resilience, Premium Packaging, Advertising Efficiency, Window Promotion, Bakery Promotion and Product Spotlight are connected to the pure market/sale calculations; Pantry ingredient quotes and purchases now use category discounts and Bulk Supplier Account 20-unit packs; supplier, recipe, ingredient, advertising and upgrade spending now contribute to `lifetimeCoinSpent`; and Bakery Diagnostics reports modifier, campaign, Spotlight, quote, purchase-path and statistics consistency health.

The pass deliberately did not implement Project-completion Icing integration, reward Undo changes, Multi-Unit Display stacks, migration-history backfill, malformed-state repair beyond the corrected fields, the 1,000-event offline guard change, daily Price Ledger scheduling, new content, seasonal systems, customer orders, art integration or final economic retuning.

## 1. Audit environment and limitations

- Repository: `C:\Users\troyn\OneDrive\Drive\myApps\ToDonut`
- Platform: Windows PowerShell, Node/Vite/React/TypeScript.
- Instructions read first: `CODEX.md`, then `GAME.md`, `README.md`, `DESIGN.md`, `STYLE.md`, `PATTERNS.md`, `docs/architecture.md`, and `docs/bakery-balance-report.md`.
- Evidence reviewed: Bakery domain registries and commands, Bakery screens, app mutation integration, canonical normalisation, persistence adapters, both Supabase migrations, focused tests, CSS, export/diagnostics code, balance harness/report, and existing visual-review artefacts.
- Authenticated production runtime was not available. The existing `visual-review/bakery-390x844.png` currently shows the owner sign-in gate rather than Bakery, so responsive and interaction findings are static-code findings, not a complete authenticated browser walkthrough.
- No hosted Supabase migration was applied or live production snapshot read. Migration findings are based on SQL and client normalisation.
- The known hanging legacy test and full test suite were not run. Five focused Bakery test files and the simulation test were run separately.
- `npm.cmd run build` succeeded. The combined command was reported non-zero only because the subsequent `rg` deliberately found no simulation symbols in `dist`; the Vite build itself completed successfully.

## 2. Executive summary

The Bakery has a substantial, playable vertical slice: productivity rewards for Tasks, Pantry purchasing, the complete 18-ingredient/5-supplier/32-recipe catalogue, discovery and crafting, hidden per-product markets, immutable sale contracts, up to four Display slots, FIFO queues, offline chronological sale resolution, upgrade/campaign registries, information screens, statistics, Reputation, milestones, canonical persistence, export, diagnostics, and a deterministic balance harness.

It is not yet the complete core game described by `GAME.md`. The most material gap is that several purchased business effects are recorded but never applied. Ingredient discounts and bulk packs are not used by the Pantry purchase path; most permanent market upgrades do not affect market calculations; timed advertising records do not affect recovery or unmet-demand growth; Product Spotlight is never consumed; Multi-Unit Display has only a state shape and catalogue entry. Project-completion Icing has a tested command but no application integration. The ordinary Business UI also bypasses the progress-aware purchase wrappers, producing incorrect spending/campaign/upgrade statistics and preventing the Second Display milestone from completing through normal use.

Core balance data validates and the basic sale economy is coherent, but the simulation is too shallow to substantiate its progression claims: its reported sale totals are identical across productivity profiles and strategies, and it does not prove the currently disconnected upgrade effects. Real-use testing is appropriate only as a controlled test of the implemented slice, not as acceptance of the complete economy.

## 3. Overall completion estimate

**Overall material completeness: approximately 72%.**

- Core catalogue, basic economy, crafting, single-unit contracts, hidden market baseline, persistence and canonical mutation safety: high completeness.
- Full business progression and advanced Display behavior: materially incomplete.
- Progress reporting and migration compatibility: usable but unreliable for existing schema-4 history.
- Visual asset replacement: largely incomplete; the production registry resolves no Bakery PNG assets in the current tree.

This estimate weights usable player workflows and correctness more heavily than registry/type presence.

## 4. Feature-by-feature status

| Feature | Classification | Evidence / qualification |
| --- | --- | --- |
| Task productivity rewards | Implemented with limitations | `applyTaskCompletionRewards` in `src/features/bakery/bakeryDomain.ts`; wired by `completeWithRewards` in `src/app/App.tsx`; aggregate handling and 10-second Undo are present. |
| Project productivity rewards | Model or backend only | `applyProjectCompletionReward` exists and is unit-tested, but is not imported or called by the app. |
| Reward idempotency | Implemented with limitations | Stable ledger keys prevent repeated Task/aggregate/project rewards; retry/realtime writes are protected by canonical revision. Undo reversal can make a spent resource negative. |
| Pantry balances and ordinary packs | Implemented and usable | Pantry UI, `purchaseIngredient`, supplier gates, atomic balance/ledger updates. |
| Supplier prerequisites | Implemented and usable | `SUPPLIERS`, `purchaseSupplier`, and disabled UI prerequisites match the four paid tiers. |
| Ingredient discounts and bulk pack | Present but inaccessible | `ingredientPackPrice` calculates discounts, but Pantry displays/calls base `packPrice`/`purchaseIngredient`; no bulk purchase UI/command path. |
| Recipe discovery and ownership | Implemented and usable | `discoverableRecipeIds`, monotonic `revealedRecipeIds`, `purchaseRecipe`; 32 recipes. |
| Crafting and Multi-Craft | Implemented and usable | `maxCraftable`, `craft`, quantity input; foundation capability is always normalised in. |
| Recipe categories | Implemented and usable | Kitchen groups the five configured categories. |
| Product/ingredient registries | Implemented and usable | `bakeryCatalogue.ts`: 18 ingredients, 5 supplier tiers, 32 recipes and 32 products. |
| Economic/lineage validation | Implemented with limitations | `validateBakeryConfiguration` and catalogue tests cover references, neutral/weak profitability and lineage; runtime startup does not fail closed on invalid data. |
| Hidden demand and time recovery | Implemented and usable | `bakeryMarket.ts` has clock-explicit exponential unmet-demand and recovery calculations. |
| Completed-sale pressure | Implemented with limitations | `applyCompletedSale` reduces future demand exactly once; resilience and Spotlight modifiers are not applied. |
| Asking price/duration | Implemented and usable | `instantPrice`, quadratic `saleDurationMs`, 72-hour `maximumAskingPrice`; strategy Premium is capped at 32 hours. |
| Locked contract integrity | Implemented and usable | Contracts store asking price, market price, demand audit value, duration and completion time; later demand changes do not reprice them. |
| Display slots | Implemented and usable | Four stable slot records, sequential paid unlocking and slot-specific active contracts. |
| FIFO queues | Implemented and usable | Two paid positions; `fillAvailableSlots` prices only on activation. |
| Multi-unit stacks | Not implemented | `DisplaySlotState.stack` and upgrade definition exist, but no command or UI reads/writes a stack. |
| Offline chronological resolution | Implemented with limitations | `resolveBakeryTimeline` resolves earliest completion, fills a slot at that exact time, and repeats. Guard silently stops after 1,000 iterations, leaving extreme backlogs unresolved. |
| Immediate advertising boosts | Implemented and usable | `purchaseCampaign` applies immediate product/all/neglected boosts and clamps demand. |
| Timed advertising | Broken or regressed | Window/Bakery Promotion records are stored/expired but never influence market formulas. |
| Product Spotlight | Broken or regressed | Pending spotlights are purchased and stored but never suppress sale impact or get consumed. |
| Permanent market upgrades | Partially implemented | Registry, purchase and prerequisites exist; Premium Packaging, Wider Audience, Loyalty and Resilience do not feed pricing/market calculations. Advertising Efficiency works. |
| Pantry/Kitchen convenience upgrades | Partially implemented | Registry/purchase exists; sorting, low-stock, recipe-use preview, filters, favourites, ingredient preview and planned batches have no corresponding UI behavior. |
| Market information | Implemented with limitations | Price Ledger, Trend, Research, History and Analytics UI exist. Price observations are event-driven and may not receive the intended daily observation without another canonical mutation. |
| Statistics | Implemented with limitations | Sales/craft detail is materialised, but ordinary supplier/ingredient/recipe spending never increments `lifetimeCoinSpent`; normal Business upgrade/campaign purchases bypass progress wrappers. |
| Reputation | Implemented and usable | `bakeryReputation` and `reputationTitle` match the schema-5 formula and thresholds. |
| Milestones | Implemented with limitations | 15 idempotent definitions and rewards; normal Business purchases bypass evaluation, and older progress is not reconstructed. |
| Migration/normalisation | Implemented with limitations | `normaliseBakeryState` preserves known Bakery fields and adds schema-5 defaults, but does not reconstruct statistics/milestones from older ledgers and silently drops market states for recipes absent from the current registry. |
| Canonical revision/recovery | Implemented and usable | `MutationCoordinator`, local adapter, Supabase RPC and realtime revision reconciliation provide optimistic recovery and stale-write rejection. |
| Export | Implemented and usable | Full-fidelity guarded export includes Bakery state, including hidden audit data, only after canonical sync confidence. |
| Diagnostics | Implemented with limitations | Shared diagnostics/sanitisation and Bakery schema are included; no Bakery invariant/art-health summary is exposed. |
| Responsive layout | Implemented with limitations | CSS has responsive rules and Bakery grids collapse, but authenticated runtime was not verified in this audit. |
| Accessibility | Implemented with limitations | Native labels, buttons, confirmation modal and chart alternative text exist; tabs lack `aria-controls`/labelled panel linkage and arrow-key tab behavior. |
| Art registry | Assets pending | `artRegistry.tsx` expects 84 assets under `src/assets/bakery/**/*.png`; that directory is absent, so all registered keys currently use stable Lucide fallbacks. |
| Documentation | Implemented with limitations | Core documents cover the intended system, but `docs/architecture.md` contains stale scope claims and README overstates fully working upgrades/advertising. |
| Focused tests | Implemented with limitations | 35 focused Bakery/simulation tests pass; integration/UI/migration/effect tests are missing for major gaps. |
| Production build | Implemented and usable | Typecheck and Vite production build pass; one 607.02 kB JS chunk triggers a size warning. |
| Deterministic balance simulation | Implemented with limitations | Development-only harness and report exist and pass; no simulation symbol was found in `dist`, but scenario differentiation and effect coverage are insufficient. |
| Seasonal/events/orders | Intentionally deferred | Explicitly excluded by `GAME.md`; not defects. |

## 5. Detailed findings with evidence

### 5.1 Rewards and duplicate protection

`applyTaskCompletionRewards` uses ledger idempotency keys for first-completion Sprinkles, daily Sydney Dough, and aggregate Icing. `completeWithRewards` creates the reward in the same candidate snapshot as Task completion and commits it through the canonical revision coordinator. A retry cannot overwrite a newer snapshot because both adapters require the originally read revision; a realtime echo at the confirmed/same revision is ignored by application reconciliation. Completed sales likewise use both `completedSaleIds` and `completionIdempotencyKey` checks in `resolveDueContracts`.

Two limitations remain:

1. `applyProjectCompletionReward` is never integrated. Project completion therefore yields no Icing in the real UI.
2. `reverseRewards` subtracts without checking available balance. During the 10-second Undo window the player can spend a rewarded ingredient in another rapid action, then Undo and produce a negative Dough/Sprinkles/Icing balance. This violates the no-negative-balance requirement.

Reward keys are durable and stored in the canonical snapshot, so reload/realtime duplication risk is otherwise low. Supplier and recipe purchases return unchanged if already owned. Ingredient/craft/upgrade/campaign commands use operation-scoped idempotency, while the canonical revision is the primary protection against submitting the same candidate twice.

### 5.2 Catalogue, reachability and economy

`src/domain/bakeryCatalogue.ts` is internally complete: 18 purchased ingredients, five supplier tiers, 32 recipes/products, discovery rules, lineage and neutral prices. The focused catalogue test confirms all counts and a valid configuration. Supplier prerequisites form one reachable chain. Recipe discovery uses purchased-ingredient history plus owned recipes, and all prerequisite ingredients are reachable through that chain.

Basic pack and recipe purchases are atomic candidate-snapshot mutations and prevent insufficient-Coin subtraction. Craft validates an integer quantity against `maxCraftable`; no normal craft path can make ingredient balances negative.

The configured basic economy passes neutral, weak-market and direct-lineage checks. However, the advanced supplier economy is disconnected: `ingredientPackPrice` implements discounts/bulk math, but `BakeryView` always displays `item.packPrice` and calls `purchaseIngredient`, which always charges `SHOP[ingredient].cost`. Players can buy discount upgrades that do nothing.

### 5.3 Market, contracts and offline processing

`bakeryMarket.ts` correctly keeps numerical demand out of ordinary player-facing market views. The number remains in canonical state, contract audit data and full-fidelity Export, which is appropriate diagnostic/export data rather than a gameplay UI leak. `BakeryInsights` exposes only rounded prices, Rising/Stable/Falling, and qualitative boundary proximity.

Contracts are genuinely locked. `contractFor`/`listCustomInSlot` persist market and asking prices, duration and completion timestamp. Completion awards the stored asking price. No later upgrade or market calculation rewrites active terms.

`resolveBakeryTimeline` is correctly chronological for ordinary backlogs: it selects the earliest due contract by completion time then ID, resolves at that timestamp, fills free slots from the FIFO queue at that timestamp, then repeats. This allows newly activated queued contracts to complete during the same offline interval. The 1,000-iteration guard is a safety limit but is silent and can leave a very large offline backlog partially resolved.

The business-effect layer is incomplete. `purchaseCampaign` adds timed records, but `deriveProductMarket`, `unmetDemandTarget`, `meanRevertDemand` and `applyCompletedSale` accept no Bakery upgrade/campaign context. Consequently timed recovery/growth campaigns and permanent recovery/ceiling/resilience/value upgrades do not work. `productSpotlights` is never read by sale resolution.

### 5.4 Display, queues and business UI

Stable slots and FIFO queues are usable. Queue entries reserve one finished item but lock neither price nor duration; activation creates a fresh contract. This matches `GAME.md`.

Multi-Unit Display is not implemented beyond `stack` state and an upgrade. Buying the 1,500-Coin upgrade produces no stack controls or repeat-contract behavior.

`BusinessPanel` imports and calls `purchaseUpgrade` and `purchaseCampaign`, not `purchaseUpgradeWithProgress` and `purchaseCampaignWithProgress`. Therefore normal Business actions do not update lifetime spending, category spending, campaigns purchased or upgrade levels purchased, do not create market observations through the wrapper, and do not evaluate milestones. Information upgrades use the correct wrapper because they are bought in `BakeryInsights`. The Second Display milestone is consequently inaccessible through normal play even though its model works.

### 5.5 Statistics, milestones and migration

Sale/craft statistics and per-product analytics are updated in `withBakery`; milestone rewards are immutable and idempotent. Milestone Coin correctly does not advance `lifetimeCoinEarned`.

Spending totals are not coherent. `purchaseSupplier`, `purchaseIngredient` and `purchaseRecipe` update category counters but never `lifetimeCoinSpent`. Business purchases through the UI bypass even their category/stat wrapper. Displayed lifetime spend is therefore materially understated.

`migrateAppData` calls `normaliseBakeryState` prospectively. It preserves existing balances, inventories, ledgers, contracts, purchases and known markets, and does not reset the whole Bakery. It does not derive schema-5 statistics, market observations or milestones from pre-schema-5 transactions. Existing Bakery progress is safe from broad deletion, but historical stats/milestones can start at zero/incomplete and remain inaccurate. The `compatibilityAward` parameter exists only in milestone evaluation/tests; no migration invokes it.

Normalization also trusts many numeric values without finite/non-negative checks. A corrupt or older malformed snapshot can preserve negative balances or invalid statistics. Active contracts are assigned slots by array position when missing a slot ID; terms remain unchanged.

### 5.6 Canonical revisions, mutation recovery and duplicate sales

The local provider and `todonut_replace_snapshot` both compare `expectedRevision`, increment once, and reject stale writes. The application keeps unresolved optimistic operations visible and reloads newer realtime snapshots only when safe. This substantially reduces duplicate purchase/reward/sale risk.

The SQL stores operation IDs only as function inputs; there is no server operation-result ledger. That is acceptable under the revision contract for confirmed/retried whole-snapshot writes, but an ambiguous network success must be reconciled by authoritative reload rather than blindly retried against a stale baseline. The coordinator is designed for that recovery model.

The migrations alter one owner snapshot in place and have no retained recovery checkpoint. Manual testing against valuable production data should begin with a safe full-fidelity Export. No evidence was available that migration `0002` is applied to the hosted project.

### 5.7 Export and Diagnostics

`buildSafeExport` uses the shared export guard and includes the confirmed canonical revision. Export intentionally contains complete Bakery state, including hidden demand and contract audit fields, but those are not exposed by gameplay UI. Auth secrets are excluded and Diagnostics passes through shared redaction.

Diagnostics does not currently surface Bakery-specific validation, unresolved timeline backlog, negative balances, art fallback count or catalogue/balance versions as a dedicated health section. This limits owner diagnosis of the defects above.

### 5.8 Responsive behavior and accessibility

The Bakery uses native controls, labelled form fields, a shared accessible confirmation/modal path, semantic headings, and accessible SVG history text. CSS includes mobile grid collapsing. The existing 390x844 artefact only proves the authentication gate fits the viewport, not the Bakery itself.

The Bakery tabs implement `role=tablist`, `role=tab` and `aria-selected`, but omit stable tab/panel IDs, `aria-controls`, `aria-labelledby`, roving focus and arrow-key navigation. Tab state is read directly from `sessionStorage` without validating the stored value; an obsolete value can render no panel.

### 5.9 Art coverage

`artRegistry.tsx` eagerly globs `src/assets/bakery/**/*.png`, but no `src/assets` directory exists. All 84 registered interface, navigation, business, currency, ingredient and product keys therefore use fallback icons. The many PNGs under `artRaw/` are source/reference files and are not loaded by production code.

## 6. Material defects

### Launch-blocking for declaring the complete core Bakery

1. Permanent market upgrade effects, timed campaigns and Product Spotlight do not affect market/sale resolution.
2. Ingredient discount and bulk-account upgrades do not affect Pantry prices or purchases.
3. Multi-Unit Display is not implemented.
4. Project completion never awards Icing through the application.
5. Business UI bypasses progress-aware wrappers, corrupting statistics/milestone progression.

These do not block launching the productivity app; `GAME.md` explicitly separates that launch decision.

### Important corrections

1. Prevent reward Undo from producing negative balances.
2. Backfill or explicitly mark unavailable pre-schema-5 statistics/milestones.
3. Correct lifetime Coin spending for every purchase class.
4. Add integration tests around UI purchase routes, offline queue chronology, conflict/reload, and migration preservation.
5. Make the 1,000-sale offline limit observable/recoverable.

### Ordinary refinement

- Add regular/daily price-ledger observation scheduling without leaking demand.
- Validate finite/non-negative Bakery state during normalisation.
- Expose Bakery invariant versions and fallback count in Diagnostics.
- Split the production bundle; current JS is 607.02 kB minified.

### Visual polish

- Move approved art into the production asset registry and add coverage for suppliers, campaigns, upgrades and milestones.
- Complete an authenticated mobile/desktop visual pass.
- Finish WAI-ARIA tab keyboard/linkage behavior.

### Intentionally deferred future content

Seasonal recipes, random market events/surges, limited-time events, customer orders, competing bakeries, spoilage, cooking failure/randomness, debt/upkeep and server scheduling are explicitly deferred and are not defects.

## 7. Data-loss or duplicate-reward risks

| Risk | Severity | Assessment |
| --- | --- | --- |
| Duplicate Task reward after retry/realtime/reload | Low | Durable idempotency keys plus canonical revision checks. |
| Duplicate completed sale | Low | Contract completion ID/key checks plus canonical revision; focused test passes. |
| Purchase applied twice | Low | Revision conflict is primary protection; operation-scoped checks cover ingredient/craft/upgrade/campaign candidate replay. |
| Active contract repriced/rescheduled | Low | Terms are stored and completion uses stored values. |
| Reward Undo creates negative resource | High | Direct subtraction in `reverseRewards`; reproducible by code path if reward is spent before Undo. |
| Older Bakery statistics/milestones lost/reset | Medium | Core balances/progress are preserved, but missing schema-5 derived progress defaults to zero and is not reconstructed. |
| Destructive migration recovery | Medium | One canonical snapshot, zero checkpoints; Export is the only practical pre-test backup. |
| Unknown registry product market dropped on load | Medium | Normalisation rebuilds markets from current `unlockedRecipeIds` and current registry only. |

## 8. Economic and balance findings

- Current base catalogue is internally coherent: all 32 recipes pass neutral profitability, weak-market safety and direct-lineage validation.
- Whole-Coin asking prices and deterministic durations are coherent; quick/market/premium strategies preserve the expected time/revenue tradeoff.
- Basic Coin balances cannot go negative through normal purchase commands because affordability is checked before subtraction.
- Advanced pricing is not economically testable as specified because purchased supplier discounts, Premium Packaging, Customer Loyalty, Brand Resilience, Wider Audience and timed advertising are disconnected.
- The deterministic report's identical sales counts (6/27/81/328) for light, ordinary and heavy profiles show the one-Dough-per-day cap dominates. That is a useful finding, but the harness does not establish differentiated strategy outcomes or end-to-end progression timing strongly enough to justify the report's detailed week ranges.
- The economy is coherent enough for controlled real-use testing of base packs, recipes, crafting and ordinary locked sales. It is not coherent enough to validate the full upgrade/advertising endgame until effect wiring is corrected.

## 9. Missing or fallback art assets

- Registered production keys: 54 (Coin, Dough, Sprinkles, Icing, 18 ingredients, 32 products).
- Resolved PNGs in expected `src/assets/bakery` path: 0.
- Result: 84/84 registered keys use Lucide fallbacks.
- Additional unregistered raw categories: supplier crates, advertising, Display/queue, locations, recipe book/locked recipe, milestones, price ledger, upgrades and general effects.
- Classification: visual polish for gameplay correctness, but the claim that final Bakery art is present would be false.

## 10. Documentation conflicts

1. `docs/architecture.md` says “Market history, trends, advertising and upgrades remain later scope” in its schema-2 section, while later sections and current source describe schema 5. This is stale and internally contradictory.
2. `README.md` describes “data-driven upgrades ... deterministic pricing and advertising” as Bakery foundation without disclosing that many effects are unconnected.
3. `README.md` correctly says final art replacement is deferred; this matches the actual all-fallback production registry.
4. `docs/bakery-balance-report.md` presents progression windows more confidently than the small deterministic harness supports.
5. `GAME.md`'s schema-4/5 implementation notes imply completed business functionality, but the UI wrappers and effect plumbing do not satisfy those claims.

## 11. Test and verification results

### Commands run

```text
npm.cmd test -- src/features/bakery/bakeryCatalogue.test.ts src/features/bakery/bakeryDomain.test.ts src/features/bakery/bakeryMarket.test.ts src/features/bakery/bakeryBusinessDomain.test.ts src/features/bakery/bakeryProgress.test.ts
npm.cmd test -- src/dev/bakerySimulation.test.ts
npm.cmd run typecheck
npm.cmd run build
rg -n "SIMULATION_VERSION|runBakerySimulation|bakerySimulation" dist
```

### Results

- Focused Bakery domain tests: **32/32 passed across 5 files**.
- Deterministic simulation: **3/3 passed**, run once.
- Typecheck: **passed**.
- Production build: **passed**, 1,670 modules transformed; JS 607.02 kB / 170.28 kB gzip; chunk-size warning only.
- Production bundle simulation scan: **no simulation symbols found**. The `rg` exit code was 1 because no match is the expected result.
- Full suite: **not run**.
- Known hanging legacy test: **not run**.

### Important coverage gaps

- No Bakery screen interaction test verifies the actual imports/routes used by `BusinessPanel`.
- No tests prove each upgrade/campaign changes production market behavior.
- No project-completion integration test.
- No negative-balance Undo test.
- No schema-4-to-5 fixture test for preserving/backfilling realistic Bakery history.
- No long offline queue/backlog test through the app scheduler and persistence coordinator.
- No authenticated responsive/accessibility interaction test.
- No art-registry test asserting expected production coverage.

## 12. Recommended corrective passes in priority order

1. **Business-effect correctness pass:** route all UI purchases through progress-aware commands; apply all permanent/timed market effects and Spotlight during clock-explicit market/sale resolution; connect ingredient discounts/bulk packs; add focused effect and locked-contract regression tests.
2. **Reward/progress integrity pass:** wire Project completion, make Undo non-negative/atomic, correct all spending statistics, and verify milestones through actual UI commands.
3. **Display completion pass:** implement Multi-Unit Display stacks as sequential fresh contracts, including offline chronology, removal/reservation semantics and tests.
4. **Migration safety pass:** add realistic schema fixtures, preserve or deliberately backfill historical statistics/milestones, validate malformed numeric state, and document/export before hosted testing.
5. **Runtime integration pass:** authenticated desktop/mobile manual workflow, realtime conflict/reload scenarios, offline queue catch-up, Diagnostics checks and accessibility tab behavior.
6. **Art pass:** promote approved assets from `artRaw` into the production asset structure, extend registry coverage, and verify fallback count is intentional.
7. **Documentation/balance pass:** correct stale architecture/README claims, then expand the deterministic simulation to exercise actual upgrade/campaign effects and differentiated strategies before revising balance conclusions.

## 13. Manual testing checklist for the owner

Before testing valuable data, create a full-fidelity Export and retain it outside the browser.

- [ ] Confirm Diagnostics reports a known canonical revision and zero pending/retrying/failed/conflicted mutations.
- [ ] Complete one on-time leaf Task: +1 Dough and +2 Sprinkles; reload and confirm no duplicate.
- [ ] Complete a second Task the same Sydney day: no additional Dough.
- [ ] Complete an overdue Task: +1 Sprinkle.
- [ ] Complete an aggregate Task: +2 Icing exactly once.
- [ ] Complete a Project and confirm the known defect: no +5 Icing until corrected.
- [ ] Exercise Task Undo without spending rewards; verify ledger reversal and reload persistence. Do not intentionally spend then Undo on valuable data.
- [ ] Buy each supplier in order and verify later suppliers cannot be bought early.
- [ ] Buy one ingredient pack; verify Coin and stock once after reload/realtime reconnect.
- [ ] Verify recipe reveal triggers and buy/craft representative base, lineage and premium recipes.
- [ ] List quick, market and custom/premium contracts; record locked terms and verify later campaigns/upgrades do not alter active contracts.
- [ ] Remove a contract; verify exactly one finished product returns and demand is unchanged.
- [ ] Fill multiple slots and queues, close the app past multiple completion times, reopen and verify chronological sales and fresh queue contracts.
- [ ] Confirm each completed sale awards Coin once across reload/reconnect.
- [ ] Observe that hidden numerical demand is absent from Bakery screens.
- [ ] Treat discount, timed campaign, Spotlight, permanent market effect and Multi-Unit testing as expected failures until corrective pass 1/3.
- [ ] Compare displayed lifetime spending/campaign/upgrade statistics with actual purchases; expect known discrepancies.
- [ ] Test Export only when sync is safe; inspect that Bakery state is present and authentication material absent.
- [ ] Test Bakery at 320, 390, 768 and desktop widths with keyboard-only navigation and a screen reader.
- [ ] Verify art fallbacks are acceptable for the current test phase; no Bakery production PNGs currently resolve.

## Final disposition

- **Highest-risk defects:** disconnected paid upgrade/campaign effects, negative reward Undo possibility, missing Project rewards, incomplete Multi-Unit Display, and incorrect progress/spending statistics through normal UI purchases.
- **Existing Bakery data safety:** broadly safe for careful manual testing after Export; canonical revision protection is strong and core progress is preserved, but schema-5 historical statistics/milestones may be incomplete and there are no recovery checkpoints.
- **Economy readiness:** coherent for base catalogue/crafting/single-unit sales; not ready for full real-use balance acceptance of upgrades, advertising or endgame Display behavior.
- **Next pass:** business-effect correctness and UI command integration, with focused regression tests before any retuning.
