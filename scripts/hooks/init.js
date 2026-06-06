/**
 * Faerûn Commerce - Init Hooks
 * Runs during the Foundry "init" hook — safe to touch CONFIG here.
 */
import { FAERN } from "../constants.js";
import { ShopfrontData } from "../data/shopfront-data.js";

export function registerInitHooks() {
  // ── Data model registration ─────────────────────────────────
  CONFIG.JournalEntry.dataModels ??= {};
  CONFIG.JournalEntry.dataModels["shopfront"] = ShopfrontData;

  CONFIG.JournalEntry.typeLabels ??= {};
  CONFIG.JournalEntry.typeLabels["shopfront"] = "FAERN.ShopfrontType";

  CONFIG.JournalEntry.typeIcons ??= {};
  CONFIG.JournalEntry.typeIcons["shopfront"] = "fas fa-store";

  // ── World Settings ──────────────────────────────────────────
  game.settings.register(FAERN.ID, FAERN.SETTINGS.DEFAULT_PRICE_TYPE, {
    name: "FAERN.Settings.DefaultPriceType.Name",
    hint: "FAERN.Settings.DefaultPriceType.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      book:   "FAERN.Settings.DefaultPriceType.Book",
      half:   "FAERN.Settings.DefaultPriceType.Half",
      double: "FAERN.Settings.DefaultPriceType.Double",
    },
    default: "book",
  });

  game.settings.register(FAERN.ID, FAERN.SETTINGS.REQUIRE_APPROVAL, {
    name: "FAERN.Settings.RequireApproval.Name",
    hint: "FAERN.Settings.RequireApproval.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(FAERN.ID, FAERN.SETTINGS.SHOW_PRICES, {
    name: "FAERN.Settings.ShowPrices.Name",
    hint: "FAERN.Settings.ShowPrices.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(FAERN.ID, FAERN.SETTINGS.TRANSACTION_LOG_LIMIT, {
    name: "FAERN.Settings.TransactionLogLimit.Name",
    hint: "FAERN.Settings.TransactionLogLimit.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 500,
  });

  game.settings.register(FAERN.ID, FAERN.SETTINGS.CURRENCY_MODE, {
    name: "FAERN.Settings.CurrencyMode.Name",
    hint: "FAERN.Settings.CurrencyMode.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      gp: "FAERN.Settings.CurrencyMode.GP",
      sp: "FAERN.Settings.CurrencyMode.SP",
      cp: "FAERN.Settings.CurrencyMode.CP",
    },
    default: "gp",
  });

  // ── Client Settings ─────────────────────────────────────────
  game.settings.register(FAERN.ID, FAERN.SETTINGS.PIN_SCALE, {
    name: "FAERN.Settings.PinScale.Name",
    hint: "FAERN.Settings.PinScale.Hint",
    scope: "client",
    config: true,
    type: Number,
    default: 1.0,
    range: { min: 0.5, max: 2, step: 0.1 },
  });

  game.settings.register(FAERN.ID, FAERN.SETTINGS.SHOW_PIN_LABELS, {
    name: "FAERN.Settings.ShowPinLabels.Name",
    hint: "FAERN.Settings.ShowPinLabels.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  console.log(`${FAERN.ID} | Init hooks registered`);
}
