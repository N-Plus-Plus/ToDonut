# ToDonut Bakery Game Specification

## Catalogue-data version 5 economy

The core catalogue contains 26 purchasable ingredients and 100 recipes/products. Dough, Sugar and Icing are productivity-earned and also purchasable. Sprinkles are purchased-only. New saves own Sugar Donut and can see the locked Glazed Donut; legacy current Sprinkles balances convert once to Sugar without rewriting historical rewards.

## Implemented schema-6 progress and market intelligence

The permanent information upgrades are Price Ledger (40 Coin), Trend Indicator (120; requires Price Ledger), Market History (300; requires Price Ledger), Market Research (600; requires Trend Indicator and Market History), and Sales Analytics (900; requires Market History). Price Ledger retains at most 400 prospective whole-Coin observations per product. Trend is Stable below 0.75 demand points of projected 24-hour movement. Research reports qualitative proximity within 10% of one visible Coin band and never exposes demand.

Bakery Reputation is `Donuts sold + 5 × distinct products sold + 10 × recipes + 15 × paid supplier tiers + 25 × completed milestones`. Titles are Home Baker (0-24), Neighbourhood Baker (25-74), Local Favourite (75-174), Established Bakery (175-399), Destination Bakery (400-799), and Landmark Bakery (800+).

Core milestone rewards are: First Donut 1, First Sale 2, First New Recipe 3, First Ingredient Pack 5, Ten Sales 10, Five Products 20, Ten Recipes 40, First Premium Sale 25, One Hundred Coin 10, One Thousand Coin 50, Ten Thousand Coin 250, Second Display 20, All Suppliers 150, All Core Recipes 300, and Complete Catalogue 500 Coin. Milestone Coin is not sale revenue.

No existing economy values were changed during schema 5 because deterministic validation found no coherent evidence for retuning. See `docs/bakery-balance-report.md` for simulation version 1.0.0, scenarios and remaining uncertainties.

The first Bakery business-effect corrective pass connects the currently purchasable Business and Pantry effects without retuning core reward rates. Business UI upgrade and campaign purchases use progress-aware commands that update spending statistics, counters, Price Ledger observations where applicable and milestones through the Mutation Coordinator. Permanent market modifiers combine multiplicatively where applicable: Wider Audience multiplies demand recovery by 1.10, 1.20 or 1.35; Customer Loyalty adds 5, 10 or 15 to future unmet-demand ceilings capped at 100; Brand Resilience multiplies completed-sale pressure by 0.90, 0.80 or 0.70; Premium Packaging multiplies future neutral product value by 1.03, 1.06 or 1.10; Advertising Efficiency multiplies campaign cost by 0.90, 0.80 or 0.70. Window Promotion affects only unmet-demand target growth for its exact 24-hour interval. Bakery Promotion affects only actual recovery for its exact 24-hour interval. Product Spotlight is consumed once by the next eligible completed sale for the product; simultaneous same-product completions use stable contract ordering and only the first receives zero demand loss.

Ingredient category discounts now feed Pantry quotes and purchases. Ordinary packs use the rounded discounted pack price. Bulk Supplier Account keeps ordinary 10-unit packs available and adds 20-unit bulk packs priced from the unrounded discounted ordinary price times two times 0.90. Existing active sale contracts remain locked and are never repriced or rescheduled by these effects. Multi-Unit Display stacks, Project-completion Icing integration and migration-history backfill remain outside this pass.

## 1. Purpose

This document defines the intended completed core Bakery game for ToDonut.

The Bakery converts real productivity into a light economic and idle-management game:

1. Complete Tasks and Projects.
2. Earn Dough, Sprinkles and Icing.
3. Purchase ordinary ingredients using Coin.
4. Combine ingredients into finished Donuts.
5. List Donuts for sale.
6. Choose between a low price and fast sale or a high price and long sale.
7. Respond to changing product demand.
8. Reinvest Coin into ingredients, recipes, advertising and upgrades.

This document defines the complete core game.

It deliberately excludes:

* seasonal recipes;
* random market events;
* temporary demand surges;
* limited-time events;
* customer orders;
* competing bakeries;
* ingredient spoilage;
* cooking failure;
* product-quality randomness;
* debt or upkeep costs.

Those may be considered later.

## 2. Document relationship

`DESIGN.md` remains authoritative for the productivity application.

`GAME.md` is authoritative for the Bakery game.

`STYLE.md` governs visual presentation.

`PATTERNS.md` governs technical implementation.

Until Bakery implementation is explicitly scheduled, the Bakery is not a launch blocker for the core productivity application.

---

# 3. Design principles

The Bakery should be:

* connected to genuine productivity;
* easy to understand;
* tactically interesting;
* deterministic rather than random;
* non-punitive;
* playable in brief visits;
* capable of progressing while the application is closed;
* resistant to duplicate rewards and duplicate sales;
* configurable through data rather than hard-coded recipe logic.

The Bakery should not pressure the user to create meaningless Tasks.

Dough limits total production through regular engagement.

Sprinkles reward Task completion.

Icing rewards finishing larger structures.

Purchased ingredients and recipe unlocks create economic progression.

---

# 4. Core resources

## 4.1 Dough

Dough is earned from regularity through the permanent **Proofing Schedule**.

At Proofing Schedule level `N`:

```text
Maximum Dough opportunities per day = N
Window length = 24 hours / N
```

The player begins at Level 1, which preserves the original foundation rule: the first qualifying actionable leaf Task completed during the Sydney calendar day awards `+1 Dough`.

Paid permanent Business upgrades increase the schedule sequentially:

| Level | Status | Opportunities per day | Window duration | Upgrade cost |
| ----: | ------ | --------------------: | --------------- | -----------: |
| 1 | Foundation | 1 | 24 hours | Free |
| 2 | Paid | 2 | 12 hours | 200 Coin |
| 3 | Paid | 3 | 8 hours | 700 Coin |
| 4 | Paid | 4 | 6 hours | 2,000 Coin |
| 5 | Paid | 5 | 4 hours 48 minutes | 5,000 Coin |
| 6 | Paid | 6 | 4 hours | 12,000 Coin |

Exact Sydney wall-clock windows are:

* Level 1: 00:00-23:59:59.999.
* Level 2: 00:00-11:59:59.999, 12:00-23:59:59.999.
* Level 3: 00:00-07:59:59.999, 08:00-15:59:59.999, 16:00-23:59:59.999.
* Level 4: 00:00-05:59:59.999, 06:00-11:59:59.999, 12:00-17:59:59.999, 18:00-23:59:59.999.
* Level 5: 00:00-04:47:59.999, 04:48-09:35:59.999, 09:36-14:23:59.999, 14:24-19:11:59.999, 19:12-23:59:59.999.
* Level 6: 00:00-03:59:59.999, 04:00-07:59:59.999, 08:00-11:59:59.999, 12:00-15:59:59.999, 16:00-19:59:59.999, 20:00-23:59:59.999.

Window calculation uses `Australia/Sydney` visible wall-clock hour, minute, second and millisecond. It does not divide elapsed UTC milliseconds between Sydney midnights, so daylight-saving transition days keep the same visible boundaries.

A Task may claim the current Dough window when it is an actionable leaf Task, completed for the first time, not Cancelled, the current window has not already produced unreversed Dough, and the completion mutation is confirmed. Tasks without Due Dates, overdue Tasks and generated recurring occurrences qualify normally. Aggregate parent completion, Project completion, Cancelled Tasks, reopening/recompletion of an already rewarded Task, and later Tasks in the same window do not claim Dough.

Unused opportunities expire. Missed windows do not carry forward, do not award retrospectively, cannot be claimed several at a time by one Task, and are never generated passively.

Purchased Proofing Schedule levels take effect at the next `Australia/Sydney` calendar midnight. Several same-day purchases are allowed when sequential prerequisites and Coin permit; the highest purchased level becomes active the next Sydney day, intermediate levels remain owned, and the current day is never repartitioned.

New window reward keys use:

```text
daily-dough:<local-date>:schedule-<window-count>:window-<zero-based-index>
```

Existing legacy `daily-dough:<local-date>` keys are preserved and treated as the claimed Level 1 daily window for that date. Historical dates are not split into additional windows and missed historical opportunities are not awarded.

Immediate Task-completion Undo reverses Dough only when the required Dough remains available. The reversal is immutable, marks the original claim as net-reversed, and makes the current window available again. If the Dough has been spent, completion Undo is prevented with an explanation that the earned Bakery resources have already been used. Ordinary later reopening does not restore historical window availability.

Dough is required by every core Donut recipe.

## 4.2 Sprinkles

Sprinkles are earned from actionable leaf Tasks.

```text
Task completed on time or without a Due Date: +2 Sprinkles
Overdue Task completed: +1 Sprinkle
```

A Task is overdue when its Due Date is earlier than the current Sydney date at the moment of first completion.

Aggregate parent Tasks do not grant Sprinkles for their own automatic completion.

## 4.3 Icing

Icing is earned from completing structures.

```text
Aggregate Task completed: +2 Icing
Project completed: +5 Icing
```

Rules:

* automatic aggregate closure qualifies;
* Cancelled aggregate Tasks award nothing;
* Cancelled Projects award nothing;
* reopening and recompleting the same aggregate or Project does not award again.

## 4.4 Coin

Coin is the sole spendable Bakery currency.

Coin is earned from completed Donut-sale contracts.

Coin is spent on:

* ingredient packs;
* recipe unlocks;
* supplier access;
* Display upgrades;
* Kitchen conveniences;
* market-information upgrades;
* advertising;
* permanent business upgrades.

The visible resource is called `Coin`.

Do not introduce a separate Gold resource.

---

# 5. Reward integrity

Rewards must be issued from confirmed domain events, not directly from Task-row button handlers.

Every reward transaction requires:

* stable transaction ID;
* resource type;
* amount;
* source entity type;
* source entity ID;
* reason;
* operation ID;
* idempotency key;
* timestamp.

Example idempotency keys:

```text
task:<task-id>:first-completion-sprinkles
task:<task-id>:daily-dough:<local-date>
aggregate:<task-id>:first-completion-icing
project:<project-id>:first-completion-icing
```

Rules:

* retries must not duplicate rewards;
* realtime confirmations must not duplicate rewards;
* refresh must not duplicate rewards;
* Undo during the ordinary completion Undo window reverses the associated reward;
* reopening later does not remove historical rewards;
* recompleting the same entity does not award it again;
* soft deletion does not erase historical rewards.

---

# 6. Bakery locations

The Bakery is a dedicated application destination.

It contains four main tabs.

## 6.1 Pantry

The Pantry contains:

* Dough;
* Sprinkles;
* Icing;
* purchased ingredients;
* current quantities;
* ingredient packs available for purchase;
* supplier catalogue upgrades;
* low-stock information where unlocked.

Ingredients do not expire.

There is no Pantry capacity limit.

## 6.2 Kitchen

The Kitchen contains:

* unlocked recipes;
* revealed recipes;
* hidden recipes where applicable;
* ingredient requirements;
* craftable quantities;
* quantity selector;
* finished Donut inventory.

Crafting is immediate.

There is no cooking timer and no chance of failure.

## 6.3 Display

The Display contains:

* available sale slots;
* finished Donuts available to list;
* current 8-hour market price;
* asking-price slider;
* expected sale duration;
* active locked contracts;
* contract price;
* time remaining;
* remove-from-sale action.

## 6.4 Business

Business contains:

* recipes available for purchase;
* upgrades;
* advertising;
* sale history;
* market information;
* business statistics;
* Bakery milestones.

---

# 7. Inventory model

The game distinguishes between:

## 7.1 Ingredients

Raw resources used for recipes.

Examples:

* Dough;
* Sugar;
* Chocolate;
* Icing.

## 7.2 Finished products

Crafted Donuts ready to be listed.

Each recipe has its own finished-product inventory count.

## 7.3 Listed products

A Donut currently assigned to a Display contract is removed from available finished inventory.

Removing the contract returns it to finished inventory.

## 7.4 Coin balance

Coin is stored separately from ingredients and products.

## 7.5 Immutable transaction ledger

All resource changes should also be represented by immutable transactions.

Transaction types include:

* productivity reward;
* ingredient purchase;
* recipe purchase;
* crafting consumption;
* crafting production;
* contract listing;
* contract removal;
* completed sale;
* advertising purchase;
* upgrade purchase;
* Undo reversal.

---

# 8. Economic invariants

All prices must preserve rational recipe progression.

## 8.1 Ingredient unit cost

Each ingredient pack defines:

```text
unit cost = pack price / pack quantity
```

Fractional effective unit costs are allowed internally, although pack prices and visible Coin values remain whole integers.

The initial catalogue below uses integer unit costs.

## 8.2 Recipe purchased-input cost

For each recipe:

```text
purchased input cost =
sum of the unit costs of all purchased ingredients consumed
```

Dough, Sprinkles and Icing do not have Coin purchase costs.

They remain economically valuable through scarcity.

## 8.3 Minimum profitability

At neutral demand, every recipe must satisfy:

```text
8-hour market price > purchased input cost
```

It should also retain a meaningful contribution margin after purchased ingredients.

The initial catalogue is balanced so that purchased ingredients are only part of product value. Dough scarcity, productivity ingredients, recipe ownership and Display time provide the remainder.

## 8.4 Upgrade-lineage rule

When Recipe B is Recipe A plus one or more additional purchased ingredients:

```text
neutral price of B - neutral price of A
>
unit cost of added purchased ingredients
```

Therefore, a higher recipe tier never reduces gross Coin contribution solely because it includes an additional purchased ingredient.

## 8.5 Weak-market safety

At the initial minimum market multiplier, every core recipe should still sell for more than its purchased input cost.

This prevents the market from creating a guaranteed ingredient loss at ordinary supported price levels.

The player may still choose an unusually low asking price for a faster contract, but the interface should make that choice visible.

## 8.6 Global percentage upgrades

Permanent price upgrades should apply proportionally across products.

This preserves relative recipe value and ingredient rationality.

## 8.7 Validation

Recipe and ingredient data should be validated automatically.

Validation should reject configuration where:

* purchased ingredient cost is not covered by neutral price;
* weak-market price falls below purchased ingredient cost;
* a direct recipe upgrade adds less sale value than the cost of its added purchased ingredients;
* pack quantity is zero;
* pack price is negative;
* recipe yield is zero;
* required ingredients are missing from the registry.

---

# 9. Ingredient catalogue

Basic flour, yeast, eggs, milk, salt and frying oil are abstracted into Dough.

Every purchased ingredient is sold in packs of ten for the initial core game.

| Ingredient    | Pack quantity | Pack price | Unit cost | Initial availability |
| ------------- | ------------: | ---------: | --------: | -------------------- |
| Sugar         |            10 |    10 Coin |         1 | Starting shop        |
| Cinnamon      |            10 |    20 Coin |         2 | Starting shop        |
| Cocoa         |            10 |    30 Coin |         3 | Common Supplier      |
| Vanilla       |            10 |    40 Coin |         4 | Common Supplier      |
| Chocolate     |            10 |    60 Coin |         6 | Filling Supplier     |
| Jam           |            10 |    70 Coin |         7 | Filling Supplier     |
| Custard       |            10 |    90 Coin |         9 | Filling Supplier     |
| Cream         |            10 |   100 Coin |        10 | Filling Supplier     |
| Coconut       |            10 |   120 Coin |        12 | Filling Supplier     |
| Caramel       |            10 |   110 Coin |        11 | Artisan Supplier     |
| Lemon Curd    |            10 |   120 Coin |        12 | Artisan Supplier     |
| Apple Filling |            10 |   130 Coin |        13 | Artisan Supplier     |
| Coffee        |            10 |   140 Coin |        14 | Artisan Supplier     |
| Maple Syrup   |            10 |   150 Coin |        15 | Artisan Supplier     |
| Biscuit Crumb |            10 |   160 Coin |        16 | Premium Supplier     |
| Peanut Butter |            10 |   170 Coin |        17 | Premium Supplier     |
| Hazelnut      |            10 |   180 Coin |        18 | Premium Supplier     |
| Berries       |            10 |   190 Coin |        19 | Premium Supplier     |

Ingredient-pack prices should remain data-driven and adjustable.

---

# 10. Supplier progression

## 10.1 Starting shop

Available immediately:

* Sugar;
* Cinnamon.

## 10.2 Common Supplier

Cost:

```text
25 Coin
```

Unlocks:

* Cocoa;
* Vanilla.

## 10.3 Filling Supplier

Cost:

```text
120 Coin
```

Requires Common Supplier.

Unlocks:

* Chocolate;
* Jam;
* Custard;
* Cream;
* Coconut.

## 10.4 Artisan Supplier

Cost:

```text
400 Coin
```

Requires Filling Supplier.

Unlocks:

* Caramel;
* Lemon Curd;
* Apple Filling;
* Coffee;
* Maple Syrup.

## 10.5 Premium Supplier

Cost:

```text
1,200 Coin
```

Requires Artisan Supplier.

Unlocks:

* Biscuit Crumb;
* Peanut Butter;
* Hazelnut;
* Berries.

---

# 11. Recipe states

A recipe can be:

## Hidden

The player has not discovered it.

## Revealed

The recipe is visible and displays:

* product name;
* required ingredients;
* yield;
* neutral base value;
* recipe purchase cost;
* unlock prerequisites.

## Unlocked

The player owns the recipe and may craft it.

## Starting recipe

Sprinkle Donut begins unlocked.

## Starting visible recipe

Iced Sprinkle Donut is revealed from the beginning.

Its recipe purchase cost equals the initial neutral 8-hour price of one Sprinkle Donut:

```text
3 Coin
```

---

# 12. Recipe catalogue

Every core recipe:

* consumes one Dough;
* produces one finished Donut;
* crafts immediately.

The neutral price is the 8-hour sale price at hidden demand 50 before permanent percentage upgrades.

The core catalogue contains 64 recipes and 64 corresponding finished products. Catalogue-data version 4 preserves the previous 32 and adds 32 registry-driven recipes.

| Recipe                        | Ingredients                                               | Purchased-input cost | Neutral 8-hour price |     Recipe cost | Discovery                                       |
| ----------------------------- | --------------------------------------------------------- | -------------------: | -------------------: | --------------: | ----------------------------------------------- |
| Sprinkle Donut                | 1 Dough, 6 Sprinkles                                      |                    0 |                    3 | Starting recipe | Unlocked                                        |
| Iced Sprinkle Donut           | 1 Dough, 4 Sprinkles, 1 Icing                             |                    0 |                    8 |               3 | Visible from start                              |
| Glazed Donut                  | 1 Dough, 1 Sugar, 1 Icing                                 |                    1 |                   14 |              18 | Buy Sugar                                       |
| Cinnamon Sugar Donut          | 1 Dough, 1 Sugar, 1 Cinnamon                              |                    3 |                   18 |              45 | Buy Sugar or Cinnamon                           |
| Cocoa Sugar Donut             | 1 Dough, 1 Sugar, 1 Cocoa                                 |                    4 |                   24 |              60 | Buy Cocoa                                       |
| Vanilla Glazed Donut          | Glazed Donut ingredients, plus 1 Vanilla                  |                    5 |                   30 |              90 | Own Glazed recipe and buy Vanilla               |
| Chocolate Iced Donut          | 1 Dough, 1 Chocolate, 1 Icing                             |                    6 |                   38 |             120 | Buy Chocolate                                   |
| Coconut Iced Donut            | 1 Dough, 1 Coconut, 1 Icing                               |                   12 |                   46 |             150 | Buy Coconut                                     |
| Jam Donut                     | 1 Dough, 1 Sugar, 1 Jam                                   |                    8 |                   44 |             140 | Buy Jam                                         |
| Custard Donut                 | 1 Dough, 1 Sugar, 1 Custard                               |                   10 |                   54 |             180 | Buy Custard                                     |
| Cream Donut                   | 1 Dough, 1 Sugar, 1 Cream                                 |                   11 |                   60 |             210 | Buy Cream                                       |
| Lemon Curd Donut              | 1 Dough, 1 Sugar, 1 Lemon Curd                            |                   13 |                   70 |             250 | Buy Lemon Curd                                  |
| Apple Cinnamon Donut          | 1 Dough, 1 Sugar, 1 Cinnamon, 1 Apple Filling             |                   16 |                   82 |             300 | Own Cinnamon Sugar recipe and buy Apple Filling |
| Caramel Glazed Donut          | Glazed Donut ingredients, plus 1 Caramel                  |                   12 |                   66 |             260 | Own Glazed recipe and buy Caramel               |
| Maple Glazed Donut            | Glazed Donut ingredients, plus 1 Maple Syrup              |                   16 |                   78 |             320 | Own Glazed recipe and buy Maple Syrup           |
| Coffee Cream Donut            | Cream Donut ingredients, plus 1 Coffee                    |                   25 |                   98 |             420 | Own Cream recipe and buy Coffee                 |
| Chocolate Custard Donut       | Custard Donut ingredients, plus 1 Chocolate               |                   16 |                  104 |             450 | Own Custard recipe and buy Chocolate            |
| Jam and Cream Donut           | Jam Donut ingredients, plus 1 Cream                       |                   18 |                  112 |             480 | Own Jam recipe and buy Cream                    |
| Lemon Cream Donut             | Lemon Curd Donut ingredients, plus 1 Cream                |                   23 |                  126 |             520 | Own Lemon Curd recipe and buy Cream             |
| Peanut Butter Chocolate Donut | Chocolate Iced ingredients, plus 1 Peanut Butter          |                   23 |                  150 |             650 | Own Chocolate Iced recipe and buy Peanut Butter |
| Hazelnut Chocolate Donut      | Chocolate Iced ingredients, plus 1 Hazelnut               |                   24 |                  158 |             680 | Own Chocolate Iced recipe and buy Hazelnut      |
| Cookies and Cream Donut       | Cream Donut ingredients, plus 1 Biscuit Crumb and 1 Icing |                   27 |                  172 |             720 | Own Cream recipe and buy Biscuit Crumb          |
| Berry Cream Donut             | Cream Donut ingredients, plus 1 Berries                   |                   30 |                  180 |             760 | Own Cream recipe and buy Berries                |
| Deluxe Jam Donut              | Jam and Cream ingredients, plus 1 Icing                   |                   18 |                  190 |             820 | Own Jam and Cream recipe                        |
| Mocha Donut                   | Coffee Cream ingredients, plus 1 Chocolate                |                   31 |                  210 |             900 | Own Coffee Cream recipe and buy Chocolate       |
| Lemon Meringue Donut          | Lemon Cream ingredients, plus 1 Sugar and 1 Icing         |                   24 |                  224 |             980 | Own Lemon Cream recipe                          |
| Triple Chocolate Donut        | Chocolate Iced ingredients, plus 1 Chocolate and 1 Cocoa  |                   15 |                  240 |           1,200 | Own Chocolate Iced and Cocoa Sugar recipes      |
| Caramel Coconut Donut         | 1 Dough, 1 Icing, 1 Caramel, 1 Coconut                    |                   23 |                  138 |             580 | Own Caramel Glazed and Coconut Iced recipes     |
| Maple Apple Donut             | 1 Dough, 1 Sugar, 1 Cinnamon, 1 Apple Filling, 1 Maple Syrup |                 31 |                  154 |             640 | Own Apple Cinnamon and Maple Glazed recipes     |
| Peanut Butter Biscuit Donut   | 1 Dough, 1 Sugar, 1 Icing, 1 Peanut Butter, 1 Biscuit Crumb |                 34 |                  180 |             780 | Own Peanut Butter Chocolate and Cookies and Cream recipes |
| Vanilla Berry Cream Donut     | 1 Dough, 1 Sugar, 1 Icing, 1 Vanilla, 1 Cream, 1 Berries  |                   34 |                  198 |             850 | Own Vanilla Glazed and Berry Cream recipes      |
| Hazelnut Coffee Cream Donut   | 1 Dough, 1 Sugar, 1 Cream, 1 Coffee, 1 Hazelnut           |                   43 |                  204 |             880 | Own Hazelnut Chocolate and Coffee Cream recipes |

The five premium-combination recipes are classified as Premium Combination products. At the initial weak-market multiplier of 0.65 their rounded prices are:

| Recipe                      | Purchased-input cost | Neutral price | Weak-market price |
| --------------------------- | -------------------: | ------------: | ----------------: |
| Caramel Coconut Donut       |                   23 |           138 |                90 |
| Maple Apple Donut           |                   31 |           154 |               100 |
| Peanut Butter Biscuit Donut |                   34 |           180 |               117 |
| Vanilla Berry Cream Donut   |                   34 |           198 |               129 |
| Hazelnut Coffee Cream Donut |                   43 |           204 |               133 |

Every purchased ingredient appears in at least two core recipes. Catalogue-data version 4 broadens those uses without changing ingredient prices or supplier tiers.

### Catalogue-data version 4 additions

`src/domain/bakeryCatalogue.ts` is the authoritative table for formulas, costs, neutral prices, categories, market tiers, discovery prerequisites, lineage, and art keys. All prerequisites use AND semantics; ingredient prerequisites mean purchased at least once. Sugar Donut is a free starting recipe. The 32 added recipe IDs, in progression order, are:

`sugar-donut` (0/6), `cinnamon-iced-donut` (75/30), `vanilla-sprinkle-donut` (110/40), `chocolate-sprinkle-donut` (135/46), `chocolate-vanilla-donut` (180/58), `lemon-glazed-donut` (220/66), `vanilla-custard-donut` (230/72), `chocolate-cream-donut` (320/90), `vanilla-cream-donut` (380/96), `cinnamon-cream-donut` (390/98), `chocolate-caramel-donut` (400/104), `chocolate-coconut-donut` (420/108), `jam-custard-donut` (440/112), `caramel-custard-donut` (460/116), `chocolate-biscuit-donut` (500/122), `peanut-butter-and-jam-donut` (520/126), `berry-jam-donut` (540/130), `berry-custard-donut` (560/132), `vanilla-hazelnut-donut` (620/146), `hazelnut-cream-donut` (650/152), `lemon-berry-donut` (680/158), `apple-crumble-donut` (760/176), `vanilla-latte-donut` (800/184), `chocolate-vanilla-cream-donut` (880/196), `vanilla-berry-custard-donut` (900/202), `lamington-donut` (930/208), `caramel-latte-donut` (960/214), `chocolate-hazelnut-cream-donut` (1,250/250), `chocolate-caramel-biscuit-donut` (1,350/260), `neapolitan-donut` (1,650/285), `black-forest-donut` (2,200/320), and `ultimate-apple-maple-crumble-donut` (2,500/340). Parentheses contain recipe cost / neutral 8-hour Coin price.

Simple, filled, and combination market tiers use unmet-demand ceilings 68, 72, and 78 and completed-sale impacts 8, 7, and 6. Grade and Rank are not stored or displayed. Every recipe consumes one Dough and yields one Donut; Vanilla Sprinkle and Chocolate Sprinkle consume two Sprinkles.

The neutral catalogue spans:

```text
3 Coin to 240 Coin
```

At the initial maximum demand multiplier, Triple Chocolate Donut can reach approximately:

```text
324 Coin
```

This gives the core catalogue a little over a 100-fold range between the initial neutral product and the most valuable highly demanded product.

---

# 13. Recipe-lineage validation

Direct upgrades must remain economically superior to their base recipe.

| Upgraded recipe         | Economic parent |  Added purchased cost | Neutral price increase |
| ----------------------- | --------------- | --------------------: | ---------------------: |
| Vanilla Glazed          | Glazed          |                     4 |                     16 |
| Apple Cinnamon          | Cinnamon Sugar  |                    13 |                     64 |
| Caramel Glazed          | Glazed          |                    11 |                     52 |
| Maple Glazed            | Glazed          |                    15 |                     64 |
| Coffee Cream            | Cream           |                    14 |                     38 |
| Chocolate Custard       | Custard         |                     6 |                     50 |
| Jam and Cream           | Jam             |                    10 |                     68 |
| Lemon Cream             | Lemon Curd      |                    10 |                     56 |
| Peanut Butter Chocolate | Chocolate Iced  |                    17 |                    112 |
| Hazelnut Chocolate      | Chocolate Iced  |                    18 |                    120 |
| Cookies and Cream       | Cream           |                    16 |                    112 |
| Berry Cream             | Cream           |                    19 |                    120 |
| Deluxe Jam              | Jam and Cream   | 0 purchased Coin cost |                     78 |
| Mocha                   | Coffee Cream    |                     6 |                    112 |
| Lemon Meringue          | Lemon Cream     |                     1 |                     98 |
| Triple Chocolate        | Chocolate Iced  |                     9 |                    202 |
| Caramel Coconut         | Coconut Iced    |                    11 |                     92 |
| Caramel Coconut         | Caramel Glazed  |                    12 |                     72 |
| Maple Apple             | Apple Cinnamon  |                    15 |                     72 |
| Maple Apple             | Maple Glazed    |                    15 |                     76 |
| Peanut Butter Biscuit   | Cookies and Cream |                   7 |                      8 |
| Peanut Butter Biscuit   | Peanut Butter Chocolate |             11 |                     30 |
| Vanilla Berry Cream     | Berry Cream     |                     4 |                     18 |
| Vanilla Berry Cream     | Vanilla Glazed  |                    29 |                    168 |
| Hazelnut Coffee Cream   | Coffee Cream    |                    18 |                    106 |
| Hazelnut Coffee Cream   | Hazelnut Chocolate |                 19 |                     46 |

These differences intentionally include substantial value for:

* recipe progression;
* scarce Dough;
* productivity-earned ingredients;
* higher recipe purchase cost;
* later supplier access;
* market risk;
* Display time.

---

# 14. Crafting

Crafting occurs in the Kitchen.

The player selects:

* recipe;
* quantity.

The interface shows:

* ingredients required per unit;
* total ingredients required;
* current stock;
* maximum craftable quantity;
* resulting finished-product quantity.

On confirmation:

1. Validate recipe ownership.
2. Validate ingredient quantities.
3. Consume ingredients.
4. Add finished Donuts.
5. Record transactions.
6. Save atomically.

Crafting has:

* no timer;
* no failure chance;
* no quality rating;
* no partial success.

---

# 15. Hidden market demand

## 15.0 Pass 2 implemented coefficients

Bakery Pass 2 implements one hidden market per unlocked recipe. All current products use neutral demand 50, range 0–100, a 24-hour proportional recovery half-life and a 96-hour unmet-demand half-life. Sprinkle Donut and Iced Sprinkle Donut use unmet-demand ceiling 68 and completed-sale impact 8. Cinnamon Sugar Donut uses ceiling 72 and completed-sale impact 7.

The hidden price multiplier is `0.65 + 0.70 × (demand / 100)`. The visible 8-hour price is the whole-Coin value `max(1, round(neutralPrice × multiplier))`. Existing Pass 1 snapshots initialise every currently unlocked product at demand 50 at the migration timestamp, with that timestamp used for both unlock and calculation references, so no historical neglect growth is granted. Pass 1 contracts preserve all locked terms and do not infer hidden demand at listing.

## 15.1 Demand per product

Each unlocked recipe has its own hidden demand state.

Demand exists on a continuous scale:

```text
0 to 100
```

Neutral demand is:

```text
50
```

Demand begins only when the recipe becomes unlocked.

A hidden or merely revealed recipe does not accrue demand.

## 15.2 Player visibility

The player never sees the numerical demand value.

The player sees demand indirectly through:

* the rounded 8-hour market price;
* optional trend information after upgrades;
* historical rounded prices after upgrades.

Cheap products may appear unchanged through modest hidden movement.

## 15.3 Mean-reverting recovery

Demand recovers toward a current target using proportional mean reversion.

Conceptually:

```text
newDemand =
targetDemand
+ (oldDemand - targetDemand)
× e^(-recoveryRate × elapsedTime)
```

Consequences:

* demand far from the target moves quickly;
* demand moderately far from the target moves more slowly;
* demand close to the target moves very slowly;
* demand does not move at a fixed points-per-hour rate.

## 15.4 Unmet-demand pressure

The target is not permanently fixed at 50.

When a product remains unlocked without completed sales:

* its unmet-demand pressure rises;
* its target gradually rises above 50;
* the target approaches a recipe-specific ceiling;
* actual demand follows that target through mean reversion.

A completed sale:

* reduces current demand;
* reduces or resets unmet-demand pressure;
* begins a new neglect period.

This allows product rotation.

A product ignored for a long period can become highly profitable.

## 15.5 Default hidden balance ranges

Initial defaults should be data-driven.

Suggested core defaults:

```text
Neutral target: 50
Maximum unmet-demand target:
  starter products: 68
  standard products: 72
  premium products: 78

Minimum demand: 0
Maximum demand: 100
```

Premium products may be allowed stronger unmet-demand ceilings because they are produced less frequently.

## 15.6 Supply impact

Only completed sales reduce demand.

Supply impact is configurable per recipe.

Suggested starting values:

```text
Starter product completed sale: -8 demand
Standard product completed sale: -7 demand
Premium product completed sale: -6 demand
```

Several sales completed together each apply their own supply impact.

---

# 16. Market-price calculation

## 16.1 Demand multiplier

The initial demand multiplier is linear:

```text
multiplier = 0.65 + 0.70 × (demand / 100)
```

Therefore:

```text
Demand 0: ×0.65
Demand 50: ×1.00
Demand 100: ×1.35
```

## 16.2 Visible 8-hour price

```text
visible market price =
round(neutral base price × demand multiplier × permanent price upgrades)
```

The result is always a whole Coin integer.

Minimum visible price is one Coin.

## 16.3 Price stability for cheap products

Because prices are rounded:

* a Sprinkle Donut may remain at 3 Coin across a broad demand range;
* expensive products will show market movement more frequently;
* hidden demand still changes even when the rounded value remains the same.

---

# 17. Asking price and sale duration

## 17.1 Standard market price

The current visible market price is the asking price that produces an eight-hour contract.

## 17.2 Instant-sale price

For each current market price:

```text
instantPrice = max(1, round(marketPrice / 3))
```

An asking price at or below this amount completes immediately.

## 17.3 Sale-duration formula

For prices above the instant price:

```text
saleDurationHours =
8 × (
  (askingPrice - instantPrice)
  /
  (marketPrice - instantPrice)
)²
```

Example where market price is 3 Coin:

| Asking price |  Duration |
| -----------: | --------: |
|            1 | Immediate |
|            2 |   2 hours |
|            3 |   8 hours |
|            4 |  18 hours |
|            5 |  32 hours |

## 17.4 Maximum listing duration

The price slider must not allow a contract longer than:

```text
72 hours
```

The maximum asking price is the highest whole Coin price whose calculated duration does not exceed that cap.

## 17.5 Preview

Before listing, show:

* product;
* current 8-hour market price;
* selected asking price;
* expected sale duration;
* expected completion date and time.

The player does not need to understand the formula.

---

# 18. Locked sale contracts

Listing a Donut creates a deterministic contract.

The contract records:

* contract ID;
* product ID;
* asking price;
* market price at listing;
* hidden demand at listing;
* listed timestamp;
* fixed duration;
* fixed completion timestamp;
* completion state;
* idempotency key.

Once created:

* asking price is fixed;
* Coin reward is fixed;
* completion timestamp is fixed;
* demand changes do not affect it;
* later sales do not affect it;
* advertising does not affect it;
* newly purchased upgrades do not affect it.

Market state affects only future contracts.

## 18.1 Removal

The player may remove an active contract.

Removal:

* returns the Donut to finished inventory;
* grants no Coin;
* loses elapsed sale progress;
* does not affect demand;
* permits immediate relisting.

No extra penalty is applied.

---

# 19. Display capacity

The player begins with:

```text
1 Display slot
```

Each Display slot contains one active contract.

Finished inventory is not automatically listed.

A sale must be explicitly priced and placed.

## 19.1 Queues

A queued product does not lock:

* demand;
* market price;
* asking price;
* sale duration.

Its contract begins only when it enters an active Display slot.

---

# 20. Offline resolution

The Bakery does not require a continuously running server.

On authenticated load, reconnect or relevant Bakery access:

1. Load Bakery state.
2. Recalculate hidden demand from elapsed timestamps.
3. Identify completed contracts.
4. Sort completed contracts chronologically.
5. Resolve each exactly once.
6. Award fixed Coin.
7. Apply its demand effect.
8. Preserve all unfinished locked contracts unchanged.
9. Recalculate current rounded prices for new contracts.
10. Save through the normal mutation path.

Contract completion must be idempotent.

Refresh, retry and realtime processing must not award a sale twice.

---

# 21. Display upgrades

| Upgrade             |  Cost | Effect                                                             | Requirement          |
| ------------------- | ----: | ------------------------------------------------------------------ | -------------------- |
| Display Slot II     |    60 | Adds a second active contract slot                                 | None                 |
| Display Slot III    |   250 | Adds a third active contract slot                                  | Slot II              |
| Display Slot IV     |   800 | Adds a fourth active contract slot                                 | Slot III             |
| Contract Queue I    |   180 | Adds one waiting position                                          | Slot II              |
| Contract Queue II   |   600 | Adds a second waiting position                                     | Queue I              |
| Saved Price Presets |   100 | Adds Quick, Market and Premium presets                             | None                 |
| Multi-Unit Display  | 1,500 | Allows a stack of identical products to feed one slot sequentially | Slot IV and Queue II |

Multi-Unit Display does not lock every future unit at the first unit’s market price.

Each new unit forms a fresh contract when it reaches the active Display.

---

# 22. Market-information upgrades

| Upgrade         | Cost | Effect                                                             |
| --------------- | ---: | ------------------------------------------------------------------ |
| Price Ledger    |   40 | Records previous rounded market prices                             |
| Trend Indicator |  120 | Shows rising, stable or falling tendency                           |
| Market History  |  300 | Shows a simple rounded-price chart                                 |
| Market Research |  600 | Shows proximity to the next rounded price threshold                |
| Sales Analytics |  900 | Shows average price, highest price and average duration by product |

These upgrades do not expose the exact hidden demand number.

---

# 23. Permanent market upgrades

## 23.1 Wider Audience

| Level |  Cost | Effect                                 |
| ----- | ----: | -------------------------------------- |
| I     |   180 | Demand recovery is 10% faster          |
| II    |   500 | Demand recovery is 20% faster in total |
| III   | 1,400 | Demand recovery is 35% faster in total |

## 23.2 Customer Loyalty

| Level |  Cost | Effect                              |
| ----- | ----: | ----------------------------------- |
| I     |   250 | Unmet-demand ceilings increase by 5 |
| II    |   750 | Increase becomes 10 in total        |
| III   | 2,000 | Increase becomes 15 in total        |

Demand remains capped at 100.

## 23.3 Brand Resilience

| Level |  Cost | Effect                                      |
| ----- | ----: | ------------------------------------------- |
| I     |   300 | Completed-sale demand impact reduced by 10% |
| II    |   900 | Reduction becomes 20% in total              |
| III   | 2,400 | Reduction becomes 30% in total              |

## 23.4 Premium Packaging

| Level |  Cost | Effect                                    |
| ----- | ----: | ----------------------------------------- |
| I     |   500 | All neutral product values increase by 3% |
| II    | 1,500 | Increase becomes 6% in total              |
| III   | 4,000 | Increase becomes 10% in total             |

The percentage applies globally and preserves recipe relationships.

## 23.5 Advertising Efficiency

| Level |  Cost | Effect                           |
| ----- | ----: | -------------------------------- |
| I     |   400 | Advertising costs reduced by 10% |
| II    | 1,200 | Reduction becomes 20% in total   |
| III   | 3,000 | Reduction becomes 30% in total   |

---

# 24. Supplier upgrades

## 24.1 Bulk Supplier Account

Cost:

```text
600 Coin
```

Effect:

* allows purchase of double-sized ingredient packs;
* double packs cost 10% less than purchasing two ordinary packs.

## 24.2 Common Ingredient Discount

Applies to:

* Sugar;
* Cinnamon;
* Cocoa;
* Vanilla.

| Level |  Cost |  Discount |
| ----- | ----: | --------: |
| I     |   250 |        5% |
| II    |   700 | 10% total |
| III   | 1,800 | 15% total |

## 24.3 Filling Ingredient Discount

Applies to:

* Chocolate;
* Jam;
* Custard;
* Cream;
* Coconut;
* Caramel;
* Lemon Curd;
* Apple Filling;
* Coffee;
* Maple Syrup.

| Level |  Cost |  Discount |
| ----- | ----: | --------: |
| I     |   400 |        5% |
| II    | 1,100 | 10% total |
| III   | 2,800 | 15% total |

## 24.4 Premium Ingredient Discount

Applies to:

* Biscuit Crumb;
* Peanut Butter;
* Hazelnut;
* Berries.

| Level |  Cost |  Discount |
| ----- | ----: | --------: |
| I     |   800 |        5% |
| II    | 2,200 | 10% total |
| III   | 5,500 | 15% total |

## 24.5 Pantry conveniences

| Upgrade            | Cost | Effect                                         |
| ------------------ | ---: | ---------------------------------------------- |
| Pantry Sorting     |   40 | Sort by name, quantity, category or usefulness |
| Low-Stock Markers  |   80 | Highlights low ingredient quantities           |
| Recipe Use Preview |  120 | Shows recipes using an ingredient              |

---

# 25. Kitchen upgrades

| Upgrade            | Cost | Effect                                                    |
| ------------------ | ---: | --------------------------------------------------------- |
| Craftable Filter   |   40 | Shows only currently craftable recipes                    |
| Favourite Recipes  |   50 | Pins selected recipes                                     |
| Recipe Categories  |   60 | Groups recipes by tier                                    |
| Multi-Craft        |  100 | Crafts several copies in one action                       |
| Ingredient Preview |  120 | Shows total stock impact before crafting                  |
| Planned Batch      |  250 | Allows a desired quantity and reports missing ingredients |

Kitchen upgrades do not:

* reduce Dough cost;
* create free products;
* change product value;
* add cooking timers.

---

# 26. Advertising campaigns

Advertising affects hidden demand for future contracts only.

Existing contracts remain unchanged.

| Campaign          | Base cost | Effect                                                           |
| ----------------- | --------: | ---------------------------------------------------------------- |
| Local Flyers      |        15 | Moderate immediate demand increase for one product               |
| Product Spotlight |        40 | The selected product’s next completed sale causes no demand loss |
| Social Campaign   |        75 | Small immediate increase for every unlocked product              |
| Window Promotion  |        60 | Unmet-demand growth for one product is 50% faster for 24 hours   |
| Bakery Promotion  |       150 | Demand recovery is 35% faster for all products for 24 hours      |
| Variety Campaign  |       100 | Strong boost to products not sold within the previous 72 hours   |
| Grand Reopening   |       300 | Large one-time increase for all unlocked products                |

Advertising should show:

* affected products;
* duration;
* qualitative effect;
* final Coin cost.

It should not show hidden demand numbers.

---

# 27. Business statistics

Track:

## Product statistics

* lifetime baked;
* lifetime sold;
* current finished stock;
* current active contracts;
* lifetime Coin revenue;
* highest sale price;
* average sale price;
* average sale duration;
* last sale time.

## Business statistics

* lifetime Coin earned;
* current Coin;
* total Donuts baked;
* total Donuts sold;
* recipes unlocked;
* ingredients purchased;
* contracts removed;
* advertising campaigns purchased;
* upgrades purchased.

## Market history

Where unlocked, store rounded market-price observations rather than exposing exact demand.

---

# 28. Milestones

Milestones are non-random, one-time achievements.

Core milestones include:

* Bake the first Donut.
* Complete the first sale.
* Unlock the first new recipe.
* Purchase the first ingredient pack.
* Complete ten sales.
* Sell five different products.
* Unlock ten recipes.
* Complete the first premium sale.
* Earn 100 lifetime Coin.
* Earn 1,000 lifetime Coin.
* Earn 10,000 lifetime Coin.
* Purchase the second Display slot.
* Purchase every Supplier catalogue.
* Unlock every core recipe.
* Sell every core product at least once.

Milestone rewards may include:

* small Coin rewards;
* recipe reveals;
* upgrade availability;
* cosmetic display changes.

Milestones should not grant large quantities of Dough, Sprinkles or Icing.

---

# 29. Feedback

## Productivity rewards

Completion feedback should briefly show:

```text
+1 Dough
+2 Sprinkles
+2 Icing
```

as applicable.

## Crafting

Show:

* product created;
* quantity;
* ingredients consumed.

## Listing

Show:

* product;
* fixed asking price;
* fixed expected sale time.

## Sale completion

Show:

* product sold;
* Coin earned.

## Removal

Show:

* product returned to inventory;
* sale progress lost.

Feedback must use the shared feedback architecture.

Reduced-motion preferences must be respected.

---

# 30. Non-punitive rules

The core game does not include:

* ingredient spoilage;
* forced daily play;
* Dough streak loss;
* random contract failure;
* random customer behaviour;
* product-quality rolls;
* loss of a Donut when removing it from sale;
* debt;
* rent;
* wages;
* maintenance costs;
* negative Coin;
* permanent mistakes.

The cost of an unwise listing is elapsed time.

---

# 31. Data-driven configuration

All of the following should be configuration data:

* ingredient definitions;
* pack sizes;
* pack prices;
* supplier categories;
* recipe definitions;
* recipe prices;
* recipe discovery conditions;
* neutral product values;
* demand recovery parameters;
* unmet-demand ceilings;
* supply impacts;
* advertising definitions;
* upgrade effects;
* upgrade costs;
* Display limits;
* sale-duration cap.

Do not implement each product through bespoke code.

---

# 32. Required core data entities

The completed core game requires data equivalent to:

* Bakery Profile;
* Ingredient Definition;
* Ingredient Inventory;
* Product Definition;
* Product Inventory;
* Recipe Definition;
* Recipe Ownership;
* Supplier Unlock;
* Display Slot;
* Sale Contract;
* Product Market State;
* Ingredient Transaction;
* Coin Transaction;
* Reward Ledger Entry;
* Upgrade Definition;
* Purchased Upgrade;
* Advertising Campaign;
* Active Campaign Effect;
* Product Statistics;
* Business Statistics;
* Milestone Definition;
* Completed Milestone.

Every mutation must follow the established canonical revision and conflict-recovery architecture.

---

# 33. Core acceptance criteria

The core Bakery is complete when:

1. Dough, Sprinkles and Icing are awarded correctly.
2. Rewards cannot be duplicated.
3. Coin exists as the sole game currency.
4. Pantry inventory persists.
5. Ingredient packs can be purchased.
6. Supplier catalogues unlock correctly.
7. All core recipes can be discovered and purchased.
8. All recipes validate against economic rules.
9. Crafting consumes the correct ingredients.
10. Crafting creates the correct product.
11. Finished inventory persists.
12. Display slots accept finished products.
13. The price slider shows deterministic sale times.
14. Contracts lock price and completion time.
15. Later market changes do not alter active contracts.
16. Removing a contract returns the product.
17. Removing a contract loses only elapsed time.
18. Completed contracts award Coin exactly once.
19. Completed sales alter only future market contracts.
20. Hidden demand uses proportional mean reversion.
21. Neglected products accumulate unmet-demand pressure.
22. Visible market prices are rounded whole Coin values.
23. Cheap products can remain visibly stable through small hidden changes.
24. Ingredient prices and recipe values remain rational.
25. Higher direct recipe tiers add more value than their added purchased ingredient costs.
26. Weak-market prices remain above purchased input costs.
27. Advertising affects only future contracts.
28. Upgrades persist and apply their defined effects.
29. Offline contract resolution works.
30. Pantry, Kitchen, Display and Business are usable on mobile and desktop.
31. All required game state is included in full JSON Export.
32. No seasonal, random-event or advanced expansion feature is required for core completion.
## Bakery business implementation (schema 4)

Display capacity progresses from one stable slot to four. Queue I and II provide two FIFO positions; queued products reserve inventory without locking price or duration. Quick uses the instant price, Market the current eight-hour price, and Premium the highest whole-Coin price no longer than 32 hours. Multi-Craft and Recipe Categories are foundation-provided and never purchasable.

Permanent upgrades and campaigns are data-driven. Advertising Efficiency uses `max(1, round(base cost × (1 - discount)))`. Ingredient category discounts apply before bulk discount; the double pack uses `round(discounted ordinary base × 2 × 0.90)`. Existing active contract terms remain immutable.
