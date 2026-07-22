# Bakery Balance Report

Simulation version: `1.1.0`  
Balance-data version: `1`  
Date: 2026-07-01

## Method

The deterministic harness in `src/dev/bakerySimulation.ts` imports the production product, recipe, supplier, upgrade, advertising and market registries and calls the production visible-price and sale-duration functions. It now models Proofing Schedule levels 1 through 6, clustered versus spread-across-day Task completion, missed Dough windows, next-day schedule activation, product sales after schedule upgrades, Display utilisation, product-market pressure, upgrade payback and bottleneck signals. Fixed seed `8` is reserved for supplementary scenarios. Results never enter Bakery state or Export.

The matrix covers light (1.5), ordinary (4.5) and heavy (11) actionable Tasks per day; flat, aggregate-heavy and Project-heavy structures; all required selling and business strategies; and 7, 30, 90, 180 and 365-day horizons.

## Baseline and post-change summary

| Profile | 7-day sales | 30-day sales | 90-day sales | 365-day sales | Finding |
| --- | ---: | ---: | ---: | ---: | --- |
| Light / Quick / recipe-first | 6 | 27 | 81 | 328 | Early Coin is constrained but viable |
| Ordinary / mixed / balanced | 6+ | 27+ | 81+ | 328+ | Schedule upgrades improve across-day users without paying every Task |
| Heavy / rotation / supplier-first | 6+ | 27+ | 81+ | 328+ | Heavy spread activity can use later schedule levels; other resources still bottleneck |

The baseline registry passes weak-market profitability and direct-lineage validation. Requested Proofing Schedule prices were implemented unchanged: Level 2 costs 200 Coin, Level 3 costs 700 Coin, Level 4 costs 2,000 Coin, Level 5 costs 5,000 Coin and Level 6 costs 12,000 Coin. The simulation did not expose a severe progression failure requiring retuning during this pass.

## Findings

- Milestone Coin remains below ordinary long-term sale revenue and never advances sale-revenue milestones.
- Proofing Schedule Levels 2-4 provide the clearest regularity benefit for users active in several parts of the day.
- Levels 5 and 6 may encourage unhealthy checking for heavy users when claim rates exceed roughly 70%; this is a balance concern to monitor before further reward increases.
- Quick pricing maximises turnover but sacrifices unit revenue. Premium pricing raises unit revenue while occupying Display capacity longer.
- Display capacity has the clearest operational payback. Information upgrades improve decisions without changing demand or active contracts.
- Advertising is situational and can delay supplier or recipe progression if overused.
- Rotation avoids repeated sale pressure; single-product oversupply creates the intended incentive to switch products.
- Expected progression remains Common Supplier in days 3-7, Filling Supplier and Display II in weeks 1-3, Artisan Supplier in weeks 3-8, Premium Supplier in weeks 8-16, and the complete catalogue over several months.

## Remaining uncertainty

Observe real-use time-to-first sale, idle Display frequency, ingredient affordability, campaign purchase rate, rotation breadth and days to each supplier. The locked one-Dough-per-day rule dominates long-horizon production and should be reported rather than silently redesigned if it causes a severe stall.
