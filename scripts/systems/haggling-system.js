/**
 * Faerûn Commerce - HagglingSystem
 * Assists the GM with skill-roll-based haggling. Never auto-applies results.
 */
import { PricingEngine } from "./pricing-engine.js";

export class HagglingSystem {

  static REACTION_THRESHOLDS = [
    { min: 25, reaction: "Deeply Impressed", emoji: "😲" },
    { min: 20, reaction: "Pleased",          emoji: "😊" },
    { min: 15, reaction: "Considering",      emoji: "🤔" },
    { min: 10, reaction: "Unmoved",          emoji: "😐" },
    { min:  5, reaction: "Annoyed",          emoji: "😒" },
    { min:  0, reaction: "Offended",         emoji: "😠" },
  ];

  static async initiateRoll(actorId, skillName, shopfrontDoc) {
    const validSkills = ["per", "dec", "itm"]; // dnd5e 3.x abbreviations
    if (!validSkills.includes(skillName)) {
      throw new Error(game.i18n.localize("FAERN.Haggling.InvalidSkill"));
    }
    const actor = game.actors.get(actorId);
    if (!actor) throw new Error(game.i18n.localize("FAERN.Error.ActorNotFound"));

    const rollResult = await HagglingSystem.rollSkill(actor, skillName);
    return HagglingSystem.generateSuggestion(rollResult, shopfrontDoc);
  }

  static async rollSkill(actor, skillName) {
    const roll = await actor.rollSkill(skillName, { chatMessage: true });
    return roll;
  }

  static generateSuggestion(rollResult, shopfrontDoc) {
    const total = rollResult.total ?? 0;
    const reaction = HagglingSystem.getMerchantReaction(total);
    const discountPct = HagglingSystem.#getDiscountPct(total);

    return {
      total,
      suggestedDiscount: discountPct,
      merchantReaction: reaction,
      notes: game.i18n.format("FAERN.Haggling.SuggestionNote", {
        total,
        reaction: reaction.reaction,
        discount: Math.abs(discountPct * 100).toFixed(0),
        direction: discountPct >= 0 ? "discount" : "markup",
      }),
    };
  }

  static getMerchantReaction(total) {
    return (
      HagglingSystem.REACTION_THRESHOLDS.find(t => total >= t.min)
      ?? HagglingSystem.REACTION_THRESHOLDS.at(-1)
    );
  }

  static #getDiscountPct(total) {
    if (total >= 25) return 0.25;
    if (total >= 20) return 0.15;
    if (total >= 15) return 0.10;
    if (total >= 10) return 0.05;
    if (total >=  5) return 0;
    return -0.10;
  }
}
