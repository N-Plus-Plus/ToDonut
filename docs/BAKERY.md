<!-- Document ceiling: 135 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Bakery mechanics

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

Bakery state is part of the canonical AppData snapshot, not a separate store. Its schema and catalogue versions are 6; the executable catalogue in [bakeryCatalogue.ts](../src/domain/bakeryCatalogue.ts) owns current recipe, ingredient, supplier, cost, discovery and product data. New saves own Sugar Donut and reveal Glazed Donut. Legacy Sprinkles balances convert once to Sugar without rewriting historical reward records.

Dough, Sugar and Icing may be earned through productivity and purchased; Sprinkles are purchased only. Reward ledgers and idempotency keys prevent repeat awards. Proofing windows use Australia/Sydney wall-clock dates, including DST, with upgrades taking effect according to their stored effective date; [bakeryProofing.ts](../src/domain/bakeryProofing.ts) owns exact calculations.

Pantry purchases, recipe unlocks, crafting, listing and removal are domain commands committed through the shared mutation coordinator. Ingredient and product balances, ledgers, unlocked recipes, display contracts, upgrades and progress are persisted together. Stock follows supplier purchase order. Basic shop packs contain five of each eligible ingredient at 90% of equivalent individual prices, rounded up. Ordinary and bulk quotes use the same authoritative purchase paths. The Kitchen Bake action crafts one product.

Finished products are listed explicitly. A sale contract fixes asking price, reward and completion time at listing; later market changes, upgrades or advertising do not rewrite it. Removal returns the product without a sale or demand effect. Due completions resolve in deterministic time and ID order, exactly once, on relevant load or scheduled checks through the existing mutation path. See [market](BAKERY_MARKET.md) and [data](DATA.md).

Business, supplier and information upgrades, campaigns, milestones and statistics use [bakeryBusiness.ts](../src/domain/bakeryBusiness.ts) and [bakeryProgress.ts](../src/domain/bakeryProgress.ts). Price observations are bounded; milestones do not count as sale revenue. Optional art and fallbacks are owned by the existing asset registry. Do not infer unimplemented Project-completion Icing, multi-unit display stacks or historical backfill from old design proposals.
