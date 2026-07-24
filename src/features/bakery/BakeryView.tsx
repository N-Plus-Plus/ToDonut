import { Filter, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { AppData, DomainError } from "../../domain";
import { ingredientEntriesInPurchaseOrder, ingredientIdsInPurchaseOrder, INGREDIENTS, INGREDIENT_BY_ID, PRODUCTS, PRODUCT_BY_ID, RECIPES, RECIPE_CATEGORIES, SUPPLIERS, SUPPLIER_BY_ID } from "../../domain/bakeryCatalogue";
import { ADVERTISING, ALL_UPGRADES as UPGRADES, ownedLevel } from "../../domain/bakeryBusiness";
import { Button } from "../../shared/components/Button";
import { CurrencyAmount } from "../../shared/components/CurrencyAmount";
import { bakeryArtUrl, BakeryArt } from "./artRegistry";
import { BakeryInsights } from "./BakeryInsights";
import { ProductId, craft, currentProductMarket, ingredientPackQuote, listProduct, maxCraftable, maximumAskingPrice, purchaseIngredient, purchaseRecipe, purchaseSupplier, purchaseSupplierBasicPack, removeContract, supplierBasicPackQuote } from "./bakeryDomain";
import { advertisingCost, displayCapacity, hasUpgrade, listWithStrategy, purchaseCampaignWithProgress, purchaseUpgradeWithProgress, queueCapacity, queueProduct, removeQueueEntry } from "./bakeryBusinessDomain";
import { activeProofingScheduleLevel, formatProofingWindowLength, pendingProofingActivationDate, purchasedProofingScheduleLevel } from "../../domain/bakeryProofing";

type Tab = "pantry" | "kitchen" | "display" | "business" | "insights" | "donuts";

const tabLabels: Record<Tab, string> = { pantry: "Stock", kitchen: "Kitchen", display: "Display", business: "Business", insights: "Insights", donuts: "Donuts" };
const tabArtKeys: Record<Tab, string> = { pantry: "bakery-pantry", kitchen: "bakery-kitchen", display: "bakery-display", business: "bakery-business", insights: "bakery-storefront", donuts: "bakery-donuts" };
const ingredientSources: Record<string, string> = {
  dough: "Earned from Proofing Schedule windows. Also stocked by the Starting shop.",
  sugar: "Earned by completing Tasks. Also stocked by the Starting shop.",
  icing: "Earned by completing Projects. Also stocked by the Starting shop.",
  ...Object.fromEntries(INGREDIENTS.filter((ingredient) => !["dough", "sugar", "icing"].includes(ingredient.id)).map((ingredient) => [ingredient.id, `Stocked by ${SUPPLIER_BY_ID[ingredient.supplierId].name}.`])),
};

export function BakeryView({ data, commit, confirm }: {
  data: AppData;
  commit: (next: AppData, ids?: string[], message?: string) => Promise<boolean | void>;
  confirm: (request: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}) {
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem("todonut.bakery.tab") as Tab) || "pantry");
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
          <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => changeTab(item)}>
            <span className="bakery-tab-label">{tabArtKeys[item] && <BakeryArt assetKey={tabArtKeys[item]} />}{tabLabels[item]}</span>
          </button>
        ))}
      </div>
      {tab === "pantry" && <PantryPanel data={data} run={run} />}
      {tab === "kitchen" && <KitchenPanel data={data} run={run} now={now} />}
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
        <div className="donut-gallery__end-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}

function PantryPanel({ data, run }: { data: AppData; run: (fn: () => AppData, message: string) => void }) {
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0].id);
  const [tooltipIngredientId, setTooltipIngredientId] = useState<string | null>(null);
  const supplier = SUPPLIER_BY_ID[supplierId];
  const unlocked = supplier.id === "starting-shop" || data.bakery.unlockedSupplierIds.includes(supplier.id);
  const availableSupplierIds = new Set(["starting-shop", ...data.bakery.unlockedSupplierIds]);
  return (
    <div role="tabpanel">
      <section className="bakery-section">
        <div className="bakery-section-heading"><h3>Ingredients</h3></div>
        <div className="stock-ingredient-grid">
          {ingredientIdsInPurchaseOrder(INGREDIENTS.filter((ingredient) => availableSupplierIds.has(ingredient.supplierId)).map((ingredient) => ingredient.id)).map((ingredientId) => <StockIngredient key={ingredientId} ingredientId={ingredientId} value={data.bakery.balances[ingredientId] ?? 0} open={tooltipIngredientId === ingredientId} setOpen={(open) => setTooltipIngredientId(open ? ingredientId : null)} />)}
        </div>
      </section>
      <section className="bakery-section">
        <div className="bakery-section-heading"><h3>Shops</h3></div>
        <div className="shop-tabs" role="tablist" aria-label="Ingredient shops">
          {SUPPLIERS.map((candidate) => {
            const available = candidate.id === "starting-shop" || data.bakery.unlockedSupplierIds.includes(candidate.id);
            return <button key={candidate.id} type="button" role="tab" aria-selected={supplier.id === candidate.id} aria-label={`${candidate.name}${available ? "" : ", locked"}`} className={`${supplier.id === candidate.id ? "active" : ""} ${available ? "" : "locked"}`} onClick={() => setSupplierId(candidate.id)}><SupplierTabVisual supplierName={candidate.name} /></button>;
          })}
        </div>
        <div className="shop-panel" role="tabpanel" aria-label={supplier.name}>
          {!unlocked && supplier.id !== "starting-shop" && <div className="supplier-action"><p>{supplier.prerequisiteSupplierId ? `Requires ${SUPPLIER_BY_ID[supplier.prerequisiteSupplierId].name}` : "Available"}</p><Button disabled={Boolean(supplier.prerequisiteSupplierId && !data.bakery.unlockedSupplierIds.includes(supplier.prerequisiteSupplierId)) || data.bakery.balances.coin < supplier.cost} onClick={() => run(() => purchaseSupplier(data, supplier.id), `${supplier.name} unlocked`)}>Unlock <CurrencyAmount amount={supplier.cost} /></Button></div>}
          {unlocked && ingredientIdsInPurchaseOrder(supplier.ingredientIds).map((id) => {
            const item = INGREDIENT_BY_ID[id];
            const ordinary = ingredientPackQuote(data.bakery, id, "ordinary");
            const bulk = ingredientPackQuote(data.bakery, id, "bulk");
            const bulkUnlocked = hasUpgrade(data.bakery, "bulk-supplier-account");
            return <div className="shop-row" key={id}><BakeryArt assetKey={item.assetKey} /><span><small>{ordinary.quantity}x</small>{item.name}</span><div className="ingredient-actions"><Button disabled={data.bakery.balances.coin < ordinary.price} onClick={() => run(() => purchaseIngredient(data, id, undefined, undefined, "ordinary"), `${item.name} purchased`)}>Buy <CurrencyAmount amount={ordinary.price} /></Button>{bulkUnlocked && <Button variant="ghost" disabled={data.bakery.balances.coin < bulk.price} onClick={() => run(() => purchaseIngredient(data, id, undefined, undefined, "bulk"), `${item.name} bulk pack purchased`)}>Buy <CurrencyAmount amount={bulk.price} /></Button>}</div></div>;
          })}
          {unlocked && (() => {
            const basicPack = supplierBasicPackQuote(data.bakery, supplier.id);
            const packArtKey = `basic-pack-${supplier.name.split(" ")[0].toLowerCase()}`;
            return <div className="shop-row shop-row--basic-pack"><BakeryArt assetKey={packArtKey} label={`${supplier.name} Basic Pack`} /><span><small>{basicPack.quantity}x</small>each of the above</span><div className="ingredient-actions"><Button aria-label={`Buy ${supplier.name} Basic Pack for ${basicPack.price} Coin`} disabled={data.bakery.balances.coin < basicPack.price} onClick={() => run(() => purchaseSupplierBasicPack(data, supplier.id), `${supplier.name} Basic Pack purchased`)}>Buy <CurrencyAmount amount={basicPack.price} /></Button></div></div>;
          })()}
        </div>
      </section>
    </div>
  );
}

function StockIngredient({ ingredientId, value, open, setOpen }: { ingredientId: string; value: number; open: boolean; setOpen: (open: boolean) => void }) {
  const ingredient = INGREDIENT_BY_ID[ingredientId];
  const tooltipId = `ingredient-source-${ingredientId}`;
  return <div className={`stock-ingredient${value === 0 ? " is-empty" : ""}`}><button type="button" className="stock-ingredient__trigger" aria-expanded={open} aria-describedby={open ? tooltipId : undefined} aria-label={`${ingredient.name}: ${value}. ${ingredientSources[ingredientId]}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(!open)}><BakeryArt assetKey={ingredient.assetKey} /><strong>{value}</strong></button>{open && <span id={tooltipId} className="stock-ingredient__tooltip" role="tooltip"><strong>{ingredient.name}</strong>{ingredientSources[ingredientId]}</span>}</div>;
}

function SupplierTabVisual({ supplierName }: { supplierName: string }) {
  const firstWord = supplierName.split(" ")[0];
  const src = bakeryArtUrl(`shop-${firstWord.toLowerCase()}`);
  if (!src) return <span className="supplier-tab-visual supplier-tab-visual--fallback" aria-hidden="true">{firstWord}</span>;
  return <span className="supplier-tab-visual" aria-hidden="true"><img src={src} alt="" /></span>;
}

function KitchenPanel({ data, run, now }: {
  data: AppData;
  run: (fn: () => AppData, message: string) => void;
  now: Date;
}) {
  const recipeOrder = (left: typeof RECIPES[number], right: typeof RECIPES[number]) => left.neutralPrice - right.neutralPrice || left.name.localeCompare(right.name);
  const unlockedRecipes = RECIPES.filter((recipe) => data.bakery.unlockedRecipeIds.includes(recipe.id)).sort(recipeOrder);
  const availableRecipes = RECIPES.filter((recipe) => data.bakery.revealedRecipeIds.includes(recipe.id) && !data.bakery.unlockedRecipeIds.includes(recipe.id)).sort(recipeOrder);
  const products = PRODUCTS.filter((product) => (data.bakery.finishedProducts[product.id] ?? 0) > 0).sort((left, right) => left.neutralPrice - right.neutralPrice || left.name.localeCompare(right.name));
  return (
    <div role="tabpanel">
      <section className="bakery-section kitchen-recipes-section">
        <div className="bakery-section-heading"><h3>Recipes</h3><span className="kitchen-filter-placeholder" role="img" aria-label="Recipe filters"><Filter aria-hidden="true" /></span></div>
        <div className="kitchen-recipe-list">
          {unlockedRecipes.map((recipe) => <KitchenRecipe key={recipe.id} recipe={recipe} data={data} run={run} now={now} />)}
          {availableRecipes.map((recipe) => <KitchenRecipe key={recipe.id} recipe={recipe} data={data} run={run} now={now} />)}
        </div>
      </section>
      <section className="bakery-section kitchen-products-section">
        <div className="bakery-section-heading"><h3>Products</h3></div>
        <div className="kitchen-product-grid">{products.map((product) => <KitchenProduct key={product.id} product={product} quantity={data.bakery.finishedProducts[product.id] ?? 0} />)}</div>
      </section>
    </div>
  );
}

function KitchenRecipe({ recipe, data, run, now }: { recipe: typeof RECIPES[number]; data: AppData; run: (fn: () => AppData, message: string) => void; now: Date }) {
  const owned = data.bakery.unlockedRecipeIds.includes(recipe.id);
  const craftable = owned && maxCraftable(data, recipe.id) > 0;
  const produced = (data.bakery.statistics.bakedByProduct[recipe.productId] ?? 0) > 0 || (data.bakery.statistics.soldByProduct[recipe.productId] ?? 0) > 0;
  const artState = !owned || !produced ? "silhouette" : craftable ? "ready" : "unavailable";
  return <article className="kitchen-recipe-row">
    <div className="kitchen-recipe-row__summary">
      <span className={`kitchen-recipe-row__art ${artState}`}><BakeryArt assetKey={recipe.productId} /></span>
      <div className="kitchen-recipe-row__details"><div className="kitchen-recipe-row__title-line"><strong>{recipe.name}</strong><MarketAmount value={owned ? currentProductMarketSafe(data, recipe.productId, now) : null} /></div></div>
      {owned ? <Button disabled={!craftable} onClick={() => run(() => craft(data, recipe.id, 1), `${recipe.name} baked`)}>Bake</Button> : <Button disabled={data.bakery.balances.coin < recipe.price} onClick={() => run(() => purchaseRecipe(data, recipe.id), `${recipe.name} recipe purchased`)}>Buy recipe <CurrencyAmount amount={recipe.price} /></Button>}
    </div>
    <div className="kitchen-recipe-row__ingredients">{ingredientEntriesInPurchaseOrder(recipe.ingredients).map(([ingredientId, amount], index) => <span className="kitchen-recipe-row__ingredient" key={ingredientId}>{index > 0 && <Plus aria-hidden="true" />}<strong>{amount}</strong><KitchenIngredient ingredientId={ingredientId} held={data.bakery.balances[ingredientId] ?? 0} supplierAvailable={INGREDIENT_BY_ID[ingredientId].supplierId === "starting-shop" || data.bakery.unlockedSupplierIds.includes(INGREDIENT_BY_ID[ingredientId].supplierId)} /> <span>({data.bakery.balances[ingredientId] ?? 0})</span></span>)}</div>
  </article>;
}

function KitchenIngredient({ ingredientId, held, supplierAvailable }: { ingredientId: string; held: number; supplierAvailable: boolean }) {
  const [open, setOpen] = useState(false);
  const ingredient = INGREDIENT_BY_ID[ingredientId];
  const tooltipId = `kitchen-ingredient-source-${ingredientId}`;
  const availability = supplierAvailable ? held > 0 ? "held" : "empty" : "locked";
  return <span className={`kitchen-ingredient kitchen-ingredient--${availability}`}><button type="button" aria-describedby={open ? tooltipId : undefined} aria-expanded={open} aria-label={`${ingredient.name}: ${held}. ${ingredientSources[ingredientId]}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}><BakeryArt assetKey={ingredient.assetKey} /></button>{open && <span id={tooltipId} className="stock-ingredient__tooltip" role="tooltip"><strong>{ingredient.name}</strong>{ingredientSources[ingredientId]}</span>}</span>;
}

function KitchenProduct({ product, quantity }: { product: typeof PRODUCTS[number]; quantity: number }) {
  const [open, setOpen] = useState(false);
  const tooltipId = `kitchen-product-${product.id}`;
  return <div className="kitchen-product"><button type="button" aria-describedby={open ? tooltipId : undefined} aria-expanded={open} aria-label={`${product.name}: ${quantity}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}><BakeryArt assetKey={product.assetKey} /><strong>{quantity}</strong></button>{open && <span id={tooltipId} className="stock-ingredient__tooltip" role="tooltip"><strong>{product.name}</strong></span>}</div>;
}

function currentProductMarketSafe(data: AppData, id: string, now: Date): number | null {
  return data.bakery.productMarkets.some((market) => market.productId === id) ? currentProductMarket(data, id, now).marketPrice : null;
}

function MarketAmount({ value }: { value: number | null }) {
  return value === null ? <span className="kitchen-recipe-row__market-lock" role="img" aria-label="Recipe locked"><Lock aria-hidden="true" /></span> : <CurrencyAmount amount={value} />;
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
                  <p><strong><CurrencyAmount amount={contract.askingPrice} /> fixed</strong></p>
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
        <p>Current 8-hour market price: <CurrencyAmount amount={market} /></p>
        <label>Custom asking price: <CurrencyAmount amount={price} /><input className="price-slider" type="range" min="1" max={maximumAskingPrice(market)} value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label>
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
      <section className="business-stats">
        <p><strong><CurrencyAmount amount={data.bakery.balances.coin} /></strong></p>
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
                  {nextSchedule && <Button disabled={data.bakery.balances.coin < nextSchedule.cost} onClick={() => run(() => purchaseUpgradeWithProgress(data, upgrade.id), "Proofing Schedule purchased")}><CurrencyAmount amount={nextSchedule.cost} /></Button>}
                </div>
              );
            }
            return (
              <div className="upgrade-row" key={upgrade.id}>
                <span><strong>{upgrade.name}</strong><small>{foundation ? "Included by default" : next ? `Level ${level + 1} - ${upgrade.effectType}` : "Maximum level reached"}</small></span>
                {next && !foundation && <Button disabled={locked || data.bakery.balances.coin < next.cost} onClick={() => run(() => purchaseUpgradeWithProgress(data, upgrade.id), `${upgrade.name} purchased`)}>{locked ? "Prerequisite required" : <CurrencyAmount amount={next.cost} />}</Button>}
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
                <CurrencyAmount amount={cost} />
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
