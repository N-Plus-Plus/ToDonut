import { PRODUCTS } from "./bakeryCatalogue";
import { effectValue } from "./bakeryBusiness";

export const BAKERY_MARKET_SCHEMA_VERSION = 2;

export interface ProductMarketConfig {
  productId: string;
  neutralPrice: number;
  neutralDemand: number;
  minimumDemand: number;
  maximumDemand: number;
  unmetDemandCeiling: number;
  recoveryHalfLifeHours: number;
  unmetDemandHalfLifeHours: number;
  completedSaleImpact: number;
}

export interface ProductMarketState {
  productId: string;
  demand: number;
  unlockedAt: string;
  lastCalculatedAt: string;
  lastSaleAt?: string;
}

export interface EffectiveMarketModifiers {
  recoverySpeedMultiplier: number;
  unmetDemandCeilingIncrease: number;
  completedSaleImpactMultiplier: number;
  productValueMultiplier: number;
  advertisingCostMultiplier: number;
}

export interface MarketModifierSource {
  purchasedUpgrades: readonly { upgradeId: string; level: number }[];
}

export interface TimedMarketModifier {
  campaignId: string;
  targetProductId: string | null;
  startsAt: string;
  endsAt: string;
}

export interface MarketCalculationContext {
  modifiers?: EffectiveMarketModifiers;
  timedCampaigns?: readonly TimedMarketModifier[];
}

const DEFAULT_MARKET_MODIFIERS: EffectiveMarketModifiers = {
  recoverySpeedMultiplier: 1,
  unmetDemandCeilingIncrease: 0,
  completedSaleImpactMultiplier: 1,
  productValueMultiplier: 1,
  advertisingCostMultiplier: 1,
};

export const PRODUCT_MARKETS: readonly ProductMarketConfig[] = PRODUCTS.map((product) => ({ productId: product.id, neutralPrice: product.neutralPrice, neutralDemand: 50, minimumDemand: 0, maximumDemand: 100, unmetDemandCeiling: product.marketTier === "simple" ? 68 : product.marketTier === "filled" ? 72 : 78, recoveryHalfLifeHours: 24, unmetDemandHalfLifeHours: 96, completedSaleImpact: product.marketTier === "simple" ? 8 : product.marketTier === "filled" ? 7 : 6 }));

export const marketConfigFor = (productId: string) => PRODUCT_MARKETS.find((config) => config.productId === productId);
const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const hoursBetween = (from: string, to: Date) => Math.max(0, (to.getTime() - new Date(from).getTime()) / 3_600_000);
const activeAt = (campaign: TimedMarketModifier, productId: string, at: Date) => {
  const time = at.getTime();
  return new Date(campaign.startsAt).getTime() <= time && time < new Date(campaign.endsAt).getTime() && (campaign.targetProductId === null || campaign.targetProductId === productId);
};
const timedRecoveryMultiplier = (campaigns: readonly TimedMarketModifier[], productId: string, at: Date) => campaigns.some((campaign) => campaign.campaignId === "bakery-promotion" && activeAt(campaign, productId, at)) ? 1.35 : 1;
const timedTargetGrowthMultiplier = (campaigns: readonly TimedMarketModifier[], productId: string, at: Date) => campaigns.some((campaign) => campaign.campaignId === "window-promotion" && activeAt(campaign, productId, at)) ? 1.5 : 1;
const effectiveCeiling = (config: ProductMarketConfig, modifiers = DEFAULT_MARKET_MODIFIERS) => Math.min(config.maximumDemand, config.unmetDemandCeiling + modifiers.unmetDemandCeilingIncrease);
const contextModifiers = (context?: MarketCalculationContext) => context?.modifiers ?? DEFAULT_MARKET_MODIFIERS;
const contextCampaigns = (context?: MarketCalculationContext) => context?.timedCampaigns ?? [];

export function deriveEffectiveMarketModifiers(source: MarketModifierSource): EffectiveMarketModifiers {
  return {
    recoverySpeedMultiplier: 1 + effectValue(source.purchasedUpgrades, "wider-audience"),
    unmetDemandCeilingIncrease: effectValue(source.purchasedUpgrades, "customer-loyalty"),
    completedSaleImpactMultiplier: 1 - effectValue(source.purchasedUpgrades, "brand-resilience"),
    productValueMultiplier: 1 + effectValue(source.purchasedUpgrades, "premium-packaging"),
    advertisingCostMultiplier: 1 - effectValue(source.purchasedUpgrades, "advertising-efficiency"),
  };
}

export function createProductMarket(productId: string, at: Date): ProductMarketState {
  const config = marketConfigFor(productId);
  if (!config) throw new Error(`Missing market configuration for ${productId}.`);
  const timestamp = at.toISOString();
  return { productId, demand: config.neutralDemand, unlockedAt: timestamp, lastCalculatedAt: timestamp };
}

export function unmetDemandTarget(config: ProductMarketConfig, market: ProductMarketState, at: Date, context?: MarketCalculationContext): number {
  const reference = market.lastSaleAt ?? market.unlockedAt;
  const elapsed = hoursBetween(reference, at);
  const ceiling = effectiveCeiling(config, contextModifiers(context));
  const target = config.neutralDemand + (ceiling - config.neutralDemand) * (1 - Math.exp(-Math.LN2 * elapsed / config.unmetDemandHalfLifeHours));
  return clamp(target, config.minimumDemand, config.maximumDemand);
}

export function meanRevertDemand(demand: number, target: number, elapsedHours: number, config: ProductMarketConfig, recoverySpeedMultiplier = 1): number {
  const boundedDemand = clamp(demand, config.minimumDemand, config.maximumDemand);
  const boundedTarget = clamp(target, config.minimumDemand, config.maximumDemand);
  if (elapsedHours <= 0) return boundedDemand;
  return clamp(boundedTarget + (boundedDemand - boundedTarget) * Math.exp(-Math.LN2 * elapsedHours * recoverySpeedMultiplier / config.recoveryHalfLifeHours), config.minimumDemand, config.maximumDemand);
}

function advanceProductMarketResult(market: ProductMarketState, at: Date, context?: MarketCalculationContext): { state: ProductMarketState; targetDemand: number } {
  const config = marketConfigFor(market.productId);
  if (!config) throw new Error(`Missing market configuration for ${market.productId}.`);
  if (at.getTime() <= new Date(market.lastCalculatedAt).getTime()) return { state: market, targetDemand: unmetDemandTarget(config, market, at, context) };
  const modifiers = contextModifiers(context);
  const campaigns = contextCampaigns(context);
  let cursor = new Date(market.lastCalculatedAt);
  let state = { ...market };
  let target = unmetDemandTarget(config, state, cursor, context);
  const boundaries = campaigns
    .filter((campaign) => campaign.targetProductId === null || campaign.targetProductId === market.productId)
    .flatMap((campaign) => [new Date(campaign.startsAt), new Date(campaign.endsAt)])
    .filter((boundary) => boundary.getTime() > cursor.getTime() && boundary.getTime() < at.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  for (const segmentEnd of [...boundaries, at]) {
    const elapsed = Math.max(0, (segmentEnd.getTime() - cursor.getTime()) / 3_600_000);
    const segmentRecovery = modifiers.recoverySpeedMultiplier * timedRecoveryMultiplier(campaigns, market.productId, cursor);
    const segmentTargetGrowth = timedTargetGrowthMultiplier(campaigns, market.productId, cursor);
    const ceiling = effectiveCeiling(config, modifiers);
    target = clamp(ceiling + (target - ceiling) * Math.exp(-Math.LN2 * elapsed * segmentTargetGrowth / config.unmetDemandHalfLifeHours), config.minimumDemand, config.maximumDemand);
    state = { ...state, demand: meanRevertDemand(state.demand, target, elapsed, config, segmentRecovery), lastCalculatedAt: segmentEnd.toISOString() };
    cursor = segmentEnd;
  }
  return { state, targetDemand: target };
}

export function advanceProductMarket(market: ProductMarketState, at: Date, context?: MarketCalculationContext): ProductMarketState {
  return advanceProductMarketResult(market, at, context).state;
}

export function marketPriceForDemand(config: ProductMarketConfig, demand: number, modifiers?: EffectiveMarketModifiers): number {
  const multiplier = 0.65 + 0.70 * (clamp(demand, config.minimumDemand, config.maximumDemand) / 100);
  return Math.max(1, Math.round(config.neutralPrice * (modifiers?.productValueMultiplier ?? 1) * multiplier));
}

export function deriveProductMarket(market: ProductMarketState, at: Date, context?: MarketCalculationContext) {
  const advanced = advanceProductMarketResult(market, at, context);
  const config = marketConfigFor(market.productId);
  if (!config) throw new Error(`Missing market configuration for ${market.productId}.`);
  return { state: advanced.state, targetDemand: advanced.targetDemand, marketPrice: marketPriceForDemand(config, advanced.state.demand, contextModifiers(context)) };
}

export function applyCompletedSale(market: ProductMarketState, at: Date, context?: MarketCalculationContext, suppressImpact = false): ProductMarketState {
  const config = marketConfigFor(market.productId);
  if (!config) throw new Error(`Missing market configuration for ${market.productId}.`);
  const advanced = advanceProductMarket(market, at, context);
  const impact = suppressImpact ? 0 : config.completedSaleImpact * contextModifiers(context).completedSaleImpactMultiplier;
  return { ...advanced, demand: clamp(advanced.demand - impact, config.minimumDemand, config.maximumDemand), lastSaleAt: at.toISOString(), lastCalculatedAt: at.toISOString() };
}
