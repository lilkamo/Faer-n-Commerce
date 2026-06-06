/**
 * Faerûn Commerce - RequestDetailApp
 * Full GM view for a single purchase request with approve/counter/reject actions.
 */
import { FAERN } from "../constants.js";
import { PricingEngine } from "../systems/pricing-engine.js";
import { SocketHandler } from "../net/socket-handler.js";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class RequestDetailApp extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(shopfrontDoc, requestId, options = {}) {
    super(options);
    this._shopfront = shopfrontDoc;
    this._requestId = requestId;
    this._showCounter = false;
  }

  static DEFAULT_OPTIONS = {
    classes: ["faern-app", "request-detail"],
    position: { width: 580, height: 540 },
    window: {
      frame: true,
      positioned: true,
      title: "FAERN.RequestDetail.Title",
      icon: "fas fa-file-invoice",
      resizable: true,
    },
    actions: {
      approve:       RequestDetailApp.#onApprove,
      reject:        RequestDetailApp.#onReject,
      toggleCounter: RequestDetailApp.#onToggleCounter,
      submitCounter: RequestDetailApp.#onSubmitCounter,
    },
  };

  static PARTS = {
    detail: {
      template: "modules/faer-n-commerce/templates/request-detail.hbs",
      scrollable: [".detail-scroll"],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const request = this._shopfront.system.purchaseRequests.find(r => r._id === this._requestId);
    if (!request) return { ...context, error: true };

    const actor = game.actors.get(request.actorId);
    const user  = game.users.get(request.userId);

    const totalGp = request.items.reduce((sum, i) =>
      sum + PricingEngine.convertToGp(i.unitPrice * i.quantity, i.denomination), 0
    );

    return {
      ...context,
      request,
      shopfront: this._shopfront,
      actorName: actor?.name ?? "Unknown",
      actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
      userName: user?.name ?? "Unknown",
      totalGp: Math.round(totalGp * 100) / 100,
      totalFormatted: PricingEngine.formatPrice(Math.round(totalGp * 100) / 100, "gp"),
      statusInfo: FAERN.REQUEST_STATUS[request.status],
      formattedTime: new Date(request.timestamp).toLocaleString(),
      showCounter: this._showCounter,
      isCountered: request.status === "countered",
    };
  }

  static async #onApprove(event, target) {
    SocketHandler.emit(FAERN.SOCKET_EVENTS.APPROVE_REQUEST, {
      shopfrontId: this._shopfront.id,
      requestId: this._requestId,
    });
    this.close();
  }

  static async #onReject(event, target) {
    const message = this.element.querySelector("[name='gmMessage']")?.value ?? "";
    SocketHandler.emit(FAERN.SOCKET_EVENTS.REJECT_REQUEST, {
      shopfrontId: this._shopfront.id,
      requestId: this._requestId,
      message,
    });
    this.close();
  }

  static async #onToggleCounter(event, target) {
    this._showCounter = !this._showCounter;
    this.render(false);
  }

  static async #onSubmitCounter(event, target) {
    const message = this.element.querySelector("[name='counterMessage']")?.value ?? "";
    const request = this._shopfront.system.purchaseRequests.find(r => r._id === this._requestId);
    if (!request) return;

    // Read per-item counter prices from form
    const counterItems = request.items.map((item, i) => {
      const priceInput = this.element.querySelector(`[name="counterPrice_${i}"]`);
      const denomInput = this.element.querySelector(`[name="counterDenom_${i}"]`);
      return {
        ...item,
        unitPrice: parseFloat(priceInput?.value ?? item.unitPrice),
        denomination: denomInput?.value ?? item.denomination,
      };
    });

    SocketHandler.emit(FAERN.SOCKET_EVENTS.COUNTER_REQUEST, {
      shopfrontId: this._shopfront.id,
      requestId: this._requestId,
      counterData: { message, items: counterItems },
    });
    this.close();
  }
}
