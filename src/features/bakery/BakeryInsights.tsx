import { AppData } from "../../domain";
import { PRODUCTS } from "../../domain/bakeryCatalogue";
import { MARKET_INFORMATION_UPGRADES, ownedLevel } from "../../domain/bakeryBusiness";
import { MILESTONES, bakeryReputation, marketProximity, marketTrend, milestoneProgress, reputationTitle } from "../../domain/bakeryProgress";
import { Button } from "../../shared/components/Button";
import { CurrencyAmount } from "../../shared/components/CurrencyAmount";
import { displayCapacity, purchaseUpgradeWithProgress } from "./bakeryBusinessDomain";

export function BakeryInsights({ data, run, activeProduct, now }: { data: AppData; run: (fn: () => AppData, message: string) => void; activeProduct: string; now: Date }) {
  const bakery = data.bakery;
  const reputation = bakeryReputation(bakery);
  const owned = (id: string) => ownedLevel(bakery.purchasedUpgrades, id) > 0;
  const observations = bakery.marketPriceObservations.filter((item) => item.productId === activeProduct);
  const statistics = bakery.statistics.productSales[activeProduct];
  return <div role="tabpanel">
    <section className="bakery-section"><h4>{reputationTitle(reputation)}</h4><p><strong>{reputation.toLocaleString()}</strong> Bakery Reputation</p><p>Derived from sales, products, recipes, paid suppliers and milestones. Reputation cannot be spent.</p></section>
    <details className="bakery-section catalogue-section" open><summary><strong>Market intelligence</strong><span>{MARKET_INFORMATION_UPGRADES.filter((item) => owned(item.id)).length}/5</span></summary>
      {MARKET_INFORMATION_UPGRADES.map((upgrade) => {
        const bought = owned(upgrade.id);
        const locked = upgrade.prerequisites.some((id) => !owned(id));
        const level = upgrade.levels[0];
        return <div className="upgrade-row" key={upgrade.id}><span><strong>{upgrade.name}</strong><small>{bought ? "Owned" : upgrade.effectType.replaceAll("-", " ")}</small></span>{!bought && <Button disabled={locked || bakery.balances.coin < level.cost} onClick={() => run(() => purchaseUpgradeWithProgress(data, upgrade.id), `${upgrade.name} purchased`)}>{locked ? "Prerequisite required" : <CurrencyAmount amount={level.cost} />}</Button>}</div>;
      })}
      {owned("price-ledger") && <MarketHistory observations={observations} />}
      {owned("trend-indicator") && <p><strong>Trend:</strong> {marketTrend(bakery, activeProduct, now)}</p>}
      {owned("market-research") && <p><strong>Price outlook:</strong> {marketProximity(bakery, activeProduct, now)}</p>}
      {owned("sales-analytics") && <details><summary>Product sales analytics</summary><dl className="stats-grid"><dt>Units baked</dt><dd>{statistics?.lifetimeUnitsBaked ?? bakery.statistics.bakedByProduct[activeProduct] ?? 0}</dd><dt>Units sold</dt><dd>{statistics?.lifetimeUnitsSold ?? bakery.statistics.soldByProduct[activeProduct] ?? 0}</dd><dt>Finished stock</dt><dd>{bakery.finishedProducts[activeProduct] ?? 0}</dd><dt>Active contracts</dt><dd>{bakery.activeContracts.filter((item) => item.productId === activeProduct).length}</dd><dt>Queued or reserved</dt><dd>{bakery.displayQueue.filter((item) => item.productId === activeProduct).length}</dd><dt>Lifetime revenue</dt><dd><CurrencyAmount amount={statistics?.lifetimeCoinRevenue ?? bakery.statistics.coinByProduct[activeProduct] ?? 0} /></dd><dt>Last sale</dt><dd>{statistics?.lastSaleAt ? new Date(statistics.lastSaleAt).toLocaleString() : "Unavailable"}</dd></dl></details>}
    </details>
    <details className="bakery-section catalogue-section"><summary><strong>Business statistics</strong><span>Summary</span></summary><dl className="stats-grid"><dt>Current Coin</dt><dd><CurrencyAmount amount={bakery.balances.coin} /></dd><dt>Lifetime sale Coin</dt><dd><CurrencyAmount amount={bakery.statistics.lifetimeCoinEarned} /></dd><dt>Lifetime Coin spent</dt><dd><CurrencyAmount amount={bakery.statistics.lifetimeCoinSpent} /></dd><dt>Donuts baked / sold</dt><dd>{bakery.statistics.totalDonutsCrafted} / {bakery.statistics.totalDonutsSold}</dd><dt>Contracts completed / removed</dt><dd>{bakery.statistics.completedContracts} / {bakery.statistics.removedContracts}</dd><dt>Recipes / paid suppliers</dt><dd>{bakery.unlockedRecipeIds.length} / {bakery.unlockedSupplierIds.length}</dd><dt>Distinct products sold</dt><dd>{PRODUCTS.filter((product) => (bakery.statistics.soldByProduct[product.id] ?? 0) > 0).length}</dd><dt>Display capacity</dt><dd>{displayCapacity(bakery)}</dd><dt>Milestones complete</dt><dd>{bakery.completedMilestones.length}/{MILESTONES.length}</dd></dl></details>
    <details className="bakery-section catalogue-section" open><summary><strong>Milestones</strong><span>{bakery.completedMilestones.length}/{MILESTONES.length}</span></summary>{MILESTONES.map((milestone) => { const complete = bakery.completedMilestones.find((item) => item.milestoneId === milestone.id); const progress = milestoneProgress(bakery, milestone); const locked = milestone.prerequisiteIds?.some((id) => !bakery.completedMilestones.some((item) => item.milestoneId === id)); return <div className="milestone-row" key={milestone.id}><span><strong>{milestone.title}</strong><small>{milestone.description} · {Math.min(progress, milestone.threshold ?? 1)}/{milestone.threshold ?? 1}{complete ? ` · ${new Date(complete.completedAt).toLocaleDateString()}` : locked ? " · Locked" : ""}</small></span><b><CurrencyAmount amount={milestone.rewardCoin} /></b></div>; })}</details>
  </div>;
}

function MarketHistory({ observations }: { observations: AppData["bakery"]["marketPriceObservations"] }) {
  const points = observations.slice(-30);
  const min = Math.min(...points.map((item) => item.roundedMarketPrice), 0);
  const max = Math.max(...points.map((item) => item.roundedMarketPrice), 1);
  const coordinates = points.map((item, index) => `${points.length < 2 ? 50 : (index / (points.length - 1)) * 100},${90 - ((item.roundedMarketPrice - min) / Math.max(1, max - min)) * 80}`).join(" ");
  return <figure className="market-chart"><figcaption>Rounded 8-hour market prices · latest 30 observations</figcaption>{points.length < 2 ? <p>More observations are needed for a chart.</p> : <svg viewBox="0 0 100 100" role="img" aria-label={`Price history from ${points[0].roundedMarketPrice} to ${points.at(-1)?.roundedMarketPrice} Coin`}><polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>}<p className="sr-only">{points.map((item) => `${new Date(item.observedAt).toLocaleDateString()}: ${item.roundedMarketPrice} Coin`).join("; ")}</p></figure>;
}
