<!-- Document ceiling: 135 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Bakery market and balance

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

The current executable balance is defined by [bakeryMarket.ts](../src/domain/bakeryMarket.ts), [bakeryCatalogue.ts](../src/domain/bakeryCatalogue.ts) and [bakeryBusiness.ts](../src/domain/bakeryBusiness.ts). Preserve current constants and saved contract semantics; do not retune by documentation adoption.

Each unlocked product has hidden demand from 0 to 100, initially 50. Simple, filled and combination products have unmet-demand ceilings 68, 72 and 78 and completed-sale impacts 8, 7 and 6 respectively. The unmet target and demand recover exponentially with respective 96-hour and 24-hour half-lives. Demand is not shown directly; upgrades may expose rounded price history and qualitative trends.

The visible whole-Coin price is max(1, round(neutral price × permanent value modifier × (0.65 + 0.70 × demand / 100))). Completed sales apply supply pressure; listing and removal do not. Advertisements and purchased upgrades change their defined future calculations, not active locked contracts. Window Promotion affects target growth, Bakery Promotion affects recovery and Product Spotlight is consumed by the next eligible completed sale in stable order.

Information upgrades and milestones are defined in [bakeryProgress.ts](../src/domain/bakeryProgress.ts). Price Ledger retains at most 400 observations per product. Catalogue and progress data are executable authorities; historical recipe tables, proposals and simulations are not evidence of current balance.

Instant price is max(1, round(market price / 3)); an asking price at or below it completes immediately. Above it, duration is 8 hours × ((asking price - instant price) / (market price - instant price))², bounded by the 72-hour maximum asking price. When market price equals instant price, the maximum asking price is the market price. See [bakeryDomain.ts](../src/features/bakery/bakeryDomain.ts) for exact rounding and edge cases.
