/**
 * Faerûn Commerce - TransactionHistoryApp
 */
import { FAERN } from "../constants.js";
import { TransactionLogger } from "../systems/transaction-logger.js";
import { PricingEngine } from "../systems/pricing-engine.js";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class TransactionHistoryApp extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(shopfrontDoc, options = {}) {
    super(options);
    this._shopfront = shopfrontDoc;
    this._filters = { type: "all", actorId: "", search: "" };
  }

  static DEFAULT_OPTIONS = {
    classes: ["faern-app", "transaction-history"],
    position: { width: 740, height: 580 },
    window: {
      frame: true,
      positioned: true,
      title: "FAERN.History.Title",
      icon: "fas fa-scroll",
      resizable: true,
    },
    actions: {
      applyFilter: TransactionHistoryApp.#onApplyFilter,
      exportLog:   TransactionHistoryApp.#onExportLog,
    },
  };

  static PARTS = {
    history: {
      template: "modules/faer-n-commerce/templates/transaction-history.hbs",
      scrollable: [".history-table-wrap"],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const log = TransactionLogger.getLog(this._shopfront, this._filters);

    const enrichedLog = log.map(r => {
      const actor = game.actors.get(r.actorId);
      return {
        ...r,
        actorName: actor?.name ?? r.actorId ?? "—",
        formattedDate: new Date(r.timestamp).toLocaleDateString(),
        formattedTime: new Date(r.timestamp).toLocaleTimeString(),
        formattedTotal: PricingEngine.formatPrice(r.totalValueGp, "gp"),
        itemSummary: r.items?.map(i => `${i.itemName ?? "?"} ×${i.quantity}`).join(", ") ?? "—",
      };
    });

    const actors = [...new Set(
      (this._shopfront.system.transactionLog ?? []).map(r => r.actorId).filter(Boolean)
    )].map(id => ({ id, name: game.actors.get(id)?.name ?? id }));

    return {
      ...context,
      log: enrichedLog,
      isEmpty: enrichedLog.length === 0,
      filters: this._filters,
      actors,
      shopName: this._shopfront.name,
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const search = this.element.querySelector("[name='search']");
    if (search) {
      search.addEventListener("input", foundry.utils.debounce(e => {
        this._filters.search = e.target.value;
        this.render(false);
      }, 200));
    }
  }

  static async #onApplyFilter(event, target) {
    const typeSelect = this.element.querySelector("[name='filterType']");
    const actorSelect = this.element.querySelector("[name='filterActor']");
    this._filters.type = typeSelect?.value ?? "all";
    this._filters.actorId = actorSelect?.value ?? "";
    this.render(false);
  }

  static async #onExportLog(event, target) {
    const text = await TransactionLogger.exportLog(this._shopfront);
    new Dialog({
      title: game.i18n.localize("FAERN.History.ExportTitle"),
      content: `<textarea style="width:100%;height:300px;font-family:monospace;font-size:12px;">${text}</textarea>`,
      buttons: {
        close: { label: game.i18n.localize("Close"), icon: '<i class="fas fa-times"></i>' },
      },
      default: "close",
    }).render(true);
  }
}
