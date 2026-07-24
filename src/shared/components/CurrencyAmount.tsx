import coin from "../../assets/bakery/currencies/coin.png";

export function CurrencyAmount({ amount, className = "" }: { amount: number; className?: string }) {
  const formatted = amount.toLocaleString();
  return (
    <span className={`currency-amount ${className}`.trim()} aria-label={`${formatted} Coin`}>
      <img src={coin} alt="" aria-hidden="true" />
      <span>{formatted}</span>
    </span>
  );
}
