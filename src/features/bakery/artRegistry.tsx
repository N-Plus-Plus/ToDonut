import { CakeSlice, CircleDollarSign, CookingPot, Package } from "lucide-react";
import type { ComponentType } from "react";
import { INGREDIENTS, PRODUCTS } from "../../domain/bakeryCatalogue";

const paths = import.meta.glob("../../assets/bakery/**/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const interfaceKeys = ["currencies", "ingredients", "products", "locations", "upgrades", "effects", "milestones"] as const;
const navigationKeys = ["bakery-pantry", "bakery-kitchen", "bakery-display", "bakery-business", "bakery-storefront", "bakery-donuts"] as const;
const businessKeys = [
  "recipe-book", "locked-recipe",
  "supplier-crate-common", "supplier-crate-filling", "supplier-crate-artisan", "supplier-crate-premium",
  "display-slot", "display-queue", "price-ledger",
  "advertising-flyers", "advertising-spotlight", "advertising-social", "advertising-window",
  "advertising-bakery", "advertising-variety", "advertising-grand-reopening",
  "premium-packaging", "bulk-supplier",
] as const;
const shopKeys = ["starting", "common", "filling", "artisan", "premium"] as const;
const basicPackKeys = ["starting", "common", "filling", "artisan", "premium"] as const;
const basicPackAssetFiles: Record<(typeof basicPackKeys)[number], string> = { starting: "basic", common: "common", filling: "filling", artisan: "artisan", premium: "premium" };

const explicitAssetPaths: Record<string, string> = {
  ...Object.fromEntries(interfaceKeys.map((key) => [key, `interface/${key}.png`])),
  ...Object.fromEntries(navigationKeys.map((key) => [key, `navigation/${key}.png`])),
  ...Object.fromEntries(businessKeys.map((key) => [key, `business/${key}.png`])),
  ...Object.fromEntries(shopKeys.map((key) => [`shop-${key}`, `shops/${key}.png`])),
  ...Object.fromEntries(basicPackKeys.map((key) => [`basic-pack-${key}`, `packs/${basicPackAssetFiles[key]}.png`])),
  coin: "currencies/coin.png",
};

export const bakeryArtKeys = [
  ...interfaceKeys,
  ...navigationKeys,
  ...businessKeys,
  ...basicPackKeys.map((key) => `basic-pack-${key}`),
  "coin", "dough", "sprinkles", "icing",
  ...INGREDIENTS.map((item) => item.assetKey),
  ...PRODUCTS.map((item) => item.assetKey),
] as const;

export function expectedBakeryArtPath(key: string): string {
  const relativePath = explicitAssetPaths[key]
    ?? (key.includes("donut") ? `products/${key}.png` : `ingredients/${key}.png`);
  return `../../assets/bakery/${relativePath}`;
}

export function bakeryArtUrl(key: string): string | undefined {
  return paths[expectedBakeryArtPath(key)];
}

export function missingBakeryArtCount() {
  return bakeryArtKeys.filter((key) => !paths[expectedBakeryArtPath(key)]).length;
}

export function BakeryArt({ assetKey, label }: { assetKey: string; label?: string }) {
  const src = bakeryArtUrl(assetKey);
  if (src) return <img className="bakery-art" src={src} alt={label ?? ""} />;
  const Icon: ComponentType<{ "aria-hidden"?: boolean }> = assetKey === "coin"
    ? CircleDollarSign
    : assetKey.includes("donut")
      ? CakeSlice
      : assetKey === "dough"
        ? CookingPot
        : Package;
  return <span className="bakery-art bakery-art--fallback" role={label ? "img" : undefined} aria-label={label}><Icon aria-hidden /></span>;
}
