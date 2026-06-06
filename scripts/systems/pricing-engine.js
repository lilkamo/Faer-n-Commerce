/**
 * Faerûn Commerce - PricingEngine
 */
export class PricingEngine {

  static getBasePrice(item) {
    const price = item?.system?.price;
    if (!price) return { value: 0, denomination: "gp" };
    return { value: price.value ?? 0, denomination: price.denomination ?? "gp" };
  }

  static applyShopMultiplier(basePrice, multiplier) {
    return { value: Math.round(basePrice.value * multiplier * 100) / 100, denomination: basePrice.denomination };
  }

  static applyOverride(entry, item) {
    if (entry.priceOverride?.enabled) {
      return { value: entry.priceOverride.value, denomination: entry.priceOverride.denomination };
    }
    return PricingEngine.getBasePrice(item);
  }

  static getEffectivePrice(entry, item, shopfrontDoc) {
    if (entry.priceOverride?.enabled) {
      return { value: entry.priceOverride.value, denomination: entry.priceOverride.denomination };
    }
    const base = PricingEngine.getBasePrice(item);
    const multiplier = shopfrontDoc?.system?.defaultPriceMultiplier ?? 1.0;
    return PricingEngine.applyShopMultiplier(base, multiplier);
  }

  static convertToGp(value, denomination) {
    const rates = { pp: 10, gp: 1, ep: 0.5, sp: 0.1, cp: 0.01 };
    return value * (rates[denomination] ?? 1);
  }

  static formatPrice(value, denomination) {
    if (value === 0) return "—";
    return `${value} ${denomination}`;
  }

  static suggestHagglingDiscount(roll, modifier, currentPrice) {
    const total = roll + modifier;
    let discount = 0;
    let merchantReaction = "";

    if (total >= 25) { discount = 0.25; merchantReaction = "Impressed"; }
    else if (total >= 20) { discount = 0.15; merchantReaction = "Pleased"; }
    else if (total >= 15) { discount = 0.10; merchantReaction = "Considering"; }
    else if (total >= 10) { discount = 0.05; merchantReaction = "Unmoved"; }
    else if (total >= 5)  { discount = 0;    merchantReaction = "Annoyed"; }
    else                  { discount = -0.10; merchantReaction = "Offended"; }

    const newPrice = Math.round(currentPrice * (1 - discount) * 100) / 100;
    return { total, discount, newPrice, merchantReaction };
  }
}
