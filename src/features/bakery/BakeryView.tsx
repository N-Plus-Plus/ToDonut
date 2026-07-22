import { useState } from "react";
import { AppData, DomainError } from "../../domain";
import { INGREDIENTS, INGREDIENT_BY_ID, PRODUCTS, PRODUCT_BY_ID, RECIPES, RECIPE_CATEGORIES, SUPPLIERS, SUPPLIER_BY_ID } from "../../domain/bakeryCatalogue";
import { ADVERTISING, ALL_UPGRADES as UPGRADES, ownedLevel } from "../../domain/bakeryBusiness";
import { Button } from "../../shared/components/Button";
import { BakeryArt } from "./artRegistry";
import { BakeryInsights } from "./BakeryInsights";
import { ProductId, craft, currentProductMarket, ingredientPackQuote, listProduct, maxCraftable, maximumAskingPrice, purchaseIngredient, purchaseRecipe, purchaseSupplier, removeContract } from "./bakeryDomain";
import { advertisingCost, displayCapacity, hasUpgrade, listWithStrategy, purchaseCampaignWithProgress, purchaseUpgradeWithProgress, queueCapacity, queueProduct, removeQueueEntry } from "./bakeryBusinessDomain";
import { activeProofingScheduleLevel, formatProofingTime, formatProofingWindow, formatProofingWindowLength, nextProofingBoundary, pendingProofingActivationDate, proofingDaySegments, proofingWindowForTimestamp, purchasedProofingScheduleLevel } from "../../domain/bakeryProofing";

type Tab = "pantry" | "kitchen" | "display" | "business" | "insights" | "donuts";

const resourceNames: Record<string, string> = {
  dough: "Dough",
  sprinkles: "Sprinkles",
  sugar: "Sugar",
  icing: "Icing",
  coin: "Coin",
  ...Object.fromEntries(INGREDIENTS.map((item) => [item.id, item.name])),
};

export function BakeryView({ data, commit, confirm }: {
  data: AppData;
  commit: (next: AppData, ids?: string[], message?: string) => Promise<boolean | void>;
  confirm: (request: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}) {
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem("todonut.bakery.tab") as Tab) || "pantry");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [product, setProduct] = useState<ProductId>(data.bakery.unlockedRecipeIds[0] ?? "sprinkle-donut");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const now = new Date();
  const activeProduct = data.bakery.unlockedRecipeIds.includes(product) ? product : (data.bakery.unlockedRecipeIds[0] ?? "sprinkle-donut");
  const market = currentProductMarket(data, activeProduct, now).marketPrice;
  const price = Math.min(prices[activeProduct] ?? market, maximumAskingPrice(market));
  const changeTab = (next: Tab) => {
    setTab(next);
    sessionStorage.setItem("todonut.bakery.tab", next);
  };
  const run = (fn: () => AppData, message: string) => {
    try {
      void commit(fn(), [], message);
    } catch (error) {
      throw error instanceof DomainError ? error : new DomainError("Bakery action failed.");
    }
  };

  return (
    <section className="bakery-view">
      <div className="bakery-tabs" role="tablist" aria-label="Bakery sections">
        {(["pantry", "kitchen", "display", "business", "insights", "donuts"] as Tab[]).map((item) => (
          <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => changeTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === "pantry" && <PantryPanel data={data} run={run} />}
      {tab === "kitchen" && <KitchenPanel data={data} run={run} now={now} quantities={quantities} setQuantities={setQuantities} />}
      {tab === "display" && <DisplayPanel data={data} run={run} confirm={confirm} now={now} product={activeProduct} setProduct={setProduct} price={price} market={market} setPrice={(value) => setPrices({ ...prices, [activeProduct]: value })} />}
      {tab === "business" && <BusinessPanel data={data} run={run} activeProduct={activeProduct} />}
      {tab === "insights" && <BakeryInsights data={data} run={run} activeProduct={activeProduct} now={now} />}
      {tab === "donuts" && <DonutGalleryPanel data={data} />}
    </section>
  );
}

function DonutGalleryPanel({ data }: { data: AppData }) {
  const productsByValue = [...PRODUCTS].sort((a, b) => a.neutralPrice - b.neutralPrice || a.name.localeCompare(b.name));
  const produced = new Set(
    PRODUCTS
      .filter((product) =>
        (data.bakery.statistics.bakedByProduct[product.id] ?? 0) > 0
        || (data.bakery.finishedProducts[product.id] ?? 0) > 0
        || (data.bakery.statistics.soldByProduct[product.id] ?? 0) > 0,
      )
      .map((product) => product.id),
  );
  return (
    <div className="donut-gallery" role="tabpanel" aria-label="Produced donuts">
      <div className="donut-gallery__count">{produced.size} / {PRODUCTS.length}</div>
      <div className="donut-gallery__grid">
        {productsByValue.map((product) => (
          <div
            className={`donut-gallery__item ${produced.has(product.id) ? "produced" : "silhouette"}`}
            key={product.id}
            aria-label={product.name}
          >
            <BakeryArt assetKey={product.assetKey} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Resource({ id, value }: { id: string; value: number }) {
  return <div className="resource-row"><BakeryArt assetKey={id} /><span>{resourceNames[id]}</span><strong>{value}</strong></div>;
}

function PantryPanel({ data, run }: { data: AppData; run: (fn: () => AppData, message: string) => void }) {
  const now = new Date();
  const proofingSegments = proofingDaySegments(data.bakery, now);
  const currentWindow = proofingWindowForTimestamp(data.bakery, now);
  const currentSegment = proofingSegments[currentWindow.index];
  const nextBoundary = nextProofingBoundary(data.bakery, now);
  const claimed = proofingSegments.filter((segment) => segment.state === "claimed" || segment.state === "current-claimed").length;
  const scheduleLevel = activeProofingScheduleLevel(data.bakery, now);
  const proofingSummary = `Proofing Schedule level ${scheduleLevel}. ${claimed} of ${proofingSegments.length} windows claimed today. Current window ${formatProofingWindow(currentWindow)}. Current opportunity ${currentSegment?.state === "current-claimed" ? "claimed" : "available"}. ${nextBoundary === null ? "No next same-day window." : `Next window starts at ${formatProofingTime(nextBoundary)}.`}`;
  return (
    <div role="tabpanel">
      <h3>Pantry</h3>
      <section className="bakery-section">
        <h4>Productivity ingredients</h4>
        <p>Earned through productivity and also purchasable</p>
        <div className="resource-grid">{["dough", "sugar", "icing"].map((id) => <Resource key={id} id={id} value={data.bakery.balances[id]} />)}</div>
        <div className="proofing-summary" aria-label={proofingSummary}>
          <p><strong>Proofing Schedule {scheduleLevel}</strong></p>
          <p>Today: {claimed} of {proofingSegments.length} windows claimed</p>
          <p>Current window: {formatProofingWindow(currentWindow)}</p>
          <p>Current opportunity: {currentSegment?.state === "current-claimed" ? "Claimed" : "Available"}</p>
          {nextBoundary !== null && <p>Next window: {formatProofingTime(nextBoundary)}</p>}
          <div className="proofing-segments" aria-hidden="true">
            {proofingSegments.map((segment) => (
              <span className={`proofing-segment ${segment.state}`} key={segment.rewardKey} title={`Window ${segment.index + 1}: ${segment.state.replaceAll("-", " ")}`}>
                <span>{segment.state === "current-available" ? "Now" : segment.state === "current-claimed" ? "Done now" : segment.state === "claimed" ? "Done" : segment.state === "expired-unclaimed" ? "Missed" : "Next"}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="bakery-section">
        <h4>Currency</h4>
        <Resource id="coin" value={data.bakery.balances.coin} />
      </section>
      {SUPPLIERS.map((supplier) => {
        const unlocked = supplier.id === "starting-shop" || data.bakery.unlockedSupplierIds.includes(supplier.id);
        return (
          <details className="bakery-section catalogue-section" key={supplier.id} open={supplier.id === "starting-shop"}>
            <summary><strong>{supplier.name}</strong><span>{unlocked ? "Available" : "Locked"}</span></summary>
            {supplier.id !== "starting-shop" && !unlocked && (
              <div className="supplier-action">
                <p>{supplier.prerequisiteSupplierId ? `Requires ${SUPPLIER_BY_ID[supplier.prerequisiteSupplierId].name}` : "Available"}</p>
                <Button disabled={Boolean(supplier.prerequisiteSupplierId && !data.bakery.unlockedSupplierIds.includes(supplier.prerequisiteSupplierId)) || data.bakery.balances.coin < supplier.cost} onClick={() => run(() => purchaseSupplier(data, supplier.id), `${supplier.name} unlocked`)}>
                  {supplier.cost.toLocaleString()} Coin
                </Button>
              </div>
            )}
            {unlocked && supplier.ingredientIds.map((id) => {
              const item = INGREDIENT_BY_ID[id];
              const ordinary = ingredientPackQuote(data.bakery, id, "ordinary");
              const bulk = ingredientPackQuote(data.bakery, id, "bulk");
              const bulkUnlocked = hasUpgrade(data.bakery, "bulk-supplier-account");
              return (
                <div className="shop-row" key={id}>
                  <BakeryArt assetKey={item.assetKey} />
                  <span>{item.name}<small>{data.bakery.balances[id] ?? 0} owned - pack of {ordinary.quantity}{ordinary.discount ? ` - ${Math.round(ordinary.discount * 100)}% discount` : ""}</small></span>
                  <div className="ingredient-actions">
                    <Button disabled={data.bakery.balances.coin < ordinary.price} onClick={() => run(() => purchaseIngredient(data, id, undefined, undefined, "ordinary"), `${item.name} purchased`)}>
                      Buy {ordinary.quantity} - {ordinary.price} Coin
                    </Button>
                    {bulkUnlocked && (
                      <Button variant="ghost" disabled={data.bakery.balances.coin < bulk.price} onClick={() => run(() => purchaseIngredient(data, id, undefined, undefined, "bulk"), `${item.name} bulk pack purchased`)}>
                        Buy {bulk.quantity} - {bulk.price} Coin
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}

function KitchenPanel({ data, run, now, quantities, setQuantities }: {
  data: AppData;
  run: (fn: () => AppData, message: string) => void;
  now: Date;
  quantities: Record<string, number>;
  setQuantities: (value: Record<string, number>) => void;
}) {
  return (
    <div role="tabpanel">
      <h3>Kitchen</h3>
      {RECIPE_CATEGORIES.map((category) => {
        const visible = RECIPES.filter((recipe) => recipe.category === category && data.bakery.revealedRecipeIds.includes(recipe.id)).sort((a, b) => Number(data.bakery.unlockedRecipeIds.includes(b.id)) - Number(data.bakery.unlockedRecipeIds.includes(a.id)));
        if (!visible.length) return null;
        return (
          <details className="bakery-section catalogue-section" key={category} open={category === "Starting"}>
            <summary><strong>{category}</strong><span>{visible.length}</span></summary>
            {visible.map((recipe) => {
              const owned = data.bakery.unlockedRecipeIds.includes(recipe.id);
              const max = owned ? maxCraftable(data, recipe.id) : 0;
              const qty = Math.min(quantities[recipe.id] ?? 1, Math.max(1, max));
              return (
                <article className="recipe-row" key={recipe.id}>
                  <BakeryArt assetKey={recipe.productId} />
                  <div>
                    <h4>{recipe.name}<small>{data.bakery.finishedProducts[recipe.productId] ?? 0} finished - {currentProductMarketSafe(data, recipe.productId, now)} Coin market</small></h4>
                    <p>{Object.entries(recipe.ingredients).map(([id, amount]) => `${amount} ${resourceNames[id]} (${data.bakery.balances[id] ?? 0})`).join(" - ")}</p>
                    {owned ? (
                      <div className="recipe-actions">
                        <label>Quantity <input type="number" min="1" max={Math.max(1, max)} value={qty} onChange={(event) => setQuantities({ ...quantities, [recipe.id]: Number(event.target.value) })} /></label>
                        <Button disabled={!max} onClick={() => run(() => craft(data, recipe.id, qty), `${qty} ${recipe.name} baked`)}>Bake</Button>
                        <span>Max {max}</span>
                      </div>
                    ) : (
                      <Button disabled={data.bakery.balances.coin < recipe.price} onClick={() => run(() => purchaseRecipe(data, recipe.id), `${recipe.name} recipe purchased`)}>
                        Buy recipe - {recipe.price} Coin
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}

function currentProductMarketSafe(data: AppData, id: string, now: Date) {
  return data.bakery.productMarkets.some((market) => market.productId === id) ? currentProductMarket(data, id, now).marketPrice : "Locked";
}

function DisplayPanel({ data, run, confirm, now, product, setProduct, price, market, setPrice }: {
  data: AppData;
  run: (fn: () => AppData, message: string) => void;
  confirm: (request: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
  now: Date;
  product: string;
  setProduct: (id: string) => void;
  price: number;
  market: number;
  setPrice: (value: number) => void;
}) {
  const available = data.bakery.displaySlots.some((slot) => slot.unlocked && !data.bakery.activeContracts.some((contract) => (contract.slotId ?? "display-1") === slot.id));
  const presets = ownedLevel(data.bakery.purchasedUpgrades, "saved-price-presets") > 0;
  return (
    <div role="tabpanel">
      <h3>Display</h3>
      <div className="display-grid">
        {data.bakery.displaySlots.map((slot) => {
          const contract = data.bakery.activeContracts.find((item) => (item.slotId ?? "display-1") === slot.id);
          return (
            <section className={`bakery-section display-slot ${slot.unlocked ? "" : "locked"}`} key={slot.id}>
              <h4>{slot.id.replace("display-", "Display ")}</h4>
              {!slot.unlocked ? <p>Locked - purchase in Business</p> : contract ? (
                <>
                  <BakeryArt assetKey={contract.productId} />
                  <p>{PRODUCT_BY_ID[contract.productId]?.name}</p>
                  <p><strong>{contract.askingPrice} Coin fixed</strong></p>
                  <p>{Math.max(0, (new Date(contract.completesAt).getTime() - now.getTime()) / 3_600_000).toFixed(1)} hours remaining</p>
                  <Button variant="ghost" onClick={() => confirm({ title: "Remove sale contract", message: "The product returns to inventory and elapsed progress is lost.", confirmLabel: "Remove", onConfirm: () => run(() => removeContract(data, contract.id), "Contract removed") })}>Remove</Button>
                </>
              ) : <p>Empty</p>}
            </section>
          );
        })}
      </div>
      <section className="bakery-section">
        <label>Finished product <select value={product} onChange={(event) => setProduct(event.target.value)}>{PRODUCTS.filter((item) => data.bakery.unlockedRecipeIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name} ({data.bakery.finishedProducts[item.id] ?? 0})</option>)}</select></label>
        <p>Current 8-hour market price: {market} Coin</p>
        <label>Custom asking price: {price} Coin<input className="price-slider" type="range" min="1" max={maximumAskingPrice(market)} value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label>
        <Button disabled={!available || !(data.bakery.finishedProducts[product] ?? 0)} onClick={() => run(() => listProduct(data, product, price, now), "Donut listed")}>List custom price</Button>
        {presets && <div className="strategy-actions">{(["quick", "market", "premium"] as const).map((strategy) => <Button key={strategy} disabled={!available || !(data.bakery.finishedProducts[product] ?? 0)} onClick={() => run(() => listWithStrategy(data, product, strategy), `${strategy} listing created`)}>{strategy}</Button>)}</div>}
        {queueCapacity(data.bakery) > 0 && <Button variant="ghost" disabled={data.bakery.displayQueue.length >= queueCapacity(data.bakery) || !(data.bakery.finishedProducts[product] ?? 0)} onClick={() => run(() => queueProduct(data, product, "market"), "Product queued")}>Queue at future market price</Button>}
      </section>
      {queueCapacity(data.bakery) > 0 && (
        <section className="bakery-section">
          <h4>Queue {data.bakery.displayQueue.length}/{queueCapacity(data.bakery)}</h4>
          {data.bakery.displayQueue.map((entry) => <div className="upgrade-row" key={entry.id}><span>{PRODUCT_BY_ID[entry.productId]?.name}<small>Not yet priced - {entry.strategy}</small></span><Button variant="ghost" onClick={() => run(() => removeQueueEntry(data, entry.id), "Queued product returned")}>Remove</Button></div>)}
        </section>
      )}
    </div>
  );
}

function BusinessPanel({ data, run, activeProduct }: { data: AppData; run: (fn: () => AppData, message: string) => void; activeProduct: string }) {
  return (
    <div role="tabpanel">
      <h3>Business</h3>
      <section className="business-stats">
        <p><strong>{data.bakery.balances.coin}</strong> Coin</p>
        <p><strong>{displayCapacity(data.bakery)}</strong> Display slots</p>
        <p><strong>{queueCapacity(data.bakery)}</strong> queue positions</p>
      </section>
      {["business", "display", "market", "suppliers", "pantry", "kitchen"].map((category) => (
        <details className="bakery-section catalogue-section" key={category}>
          <summary><strong>{category[0].toUpperCase() + category.slice(1)}</strong><span>Upgrades</span></summary>
          {UPGRADES.filter((upgrade) => upgrade.category === category).map((upgrade) => {
            const level = ownedLevel(data.bakery.purchasedUpgrades, upgrade.id);
            const next = upgrade.levels[level];
            const foundation = upgrade.foundationProvided || data.bakery.foundationCapabilities.includes(upgrade.id);
            const locked = upgrade.prerequisites.some((id) => !data.bakery.foundationCapabilities.includes(id) && !ownedLevel(data.bakery.purchasedUpgrades, id));
            if (upgrade.id === "proofing-schedule") {
              const activeLevel = activeProofingScheduleLevel(data.bakery);
              const purchasedLevel = purchasedProofingScheduleLevel(data.bakery);
              const nextSchedule = upgrade.levels[purchasedLevel - 1];
              const activation = pendingProofingActivationDate(data.bakery) ?? "next Sydney day";
              return (
                <div className="upgrade-row" key={upgrade.id}>
                  <span><strong>Proofing Schedule {roman(activeLevel)}</strong><small>Current: {activeLevel} Dough opportunities per day - {formatProofingWindowLength(activeLevel)}</small><small>{nextSchedule ? `Next: ${purchasedLevel + 1} Dough opportunities per day - ${formatProofingWindowLength(purchasedLevel + 1)} - takes effect ${activation}` : "Maximum level reached"}</small></span>
                  {nextSchedule && <Button disabled={data.bakery.balances.coin < nextSchedule.cost} onClick={() => run(() => purchaseUpgradeWithProgress(data, upgrade.id), "Proofing Schedule purchased")}>{nextSchedule.cost.toLocaleString()} Coin</Button>}
                </div>
              );
            }
            return (
              <div className="upgrade-row" key={upgrade.id}>
                <span><strong>{upgrade.name}</strong><small>{foundation ? "Included by default" : next ? `Level ${level + 1} - ${upgrade.effectType}` : "Maximum level reached"}</small></span>
                {next && !foundation && <Button disabled={locked || data.bakery.balances.coin < next.cost} onClick={() => run(() => purchaseUpgradeWithProgress(data, upgrade.id), `${upgrade.name} purchased`)}>{locked ? "Prerequisite required" : `${next.cost.toLocaleString()} Coin`}</Button>}
              </div>
            );
          })}
        </details>
      ))}
      <details className="bakery-section catalogue-section" open>
        <summary><strong>Advertising</strong><span>{data.bakery.activeCampaigns.length} active</span></summary>
        {ADVERTISING.map((campaign) => {
          const cost = advertisingCost(data.bakery, campaign.baseCost);
          return (
            <div className="upgrade-row" key={campaign.id}>
              <span><strong>{campaign.name}</strong><small>{campaign.effectType.replaceAll("-", " ")}{campaign.durationMs ? " - 24 hours" : ""}</small></span>
              <Button disabled={data.bakery.balances.coin < cost} onClick={() => run(() => purchaseCampaignWithProgress(data, campaign.id, campaign.targetType === "product" ? activeProduct : null), `${campaign.name} purchased`)}>
                {cost} Coin
              </Button>
            </div>
          );
        })}
      </details>
    </div>
  );
}

function roman(value: number) {
  return ["", "I", "II", "III", "IV", "V", "VI"][value] ?? String(value);
}
