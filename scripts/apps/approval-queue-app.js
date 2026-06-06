/**
 * Faerûn Commerce - ApprovalQueueApp
 * Singleton GM panel listing all pending purchase requests across all shopfronts.
 */
import { FAERN } from "../constants.js";
import { SocketHandler } from "../net/socket-handler.js";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ApprovalQueueApp extends HandlebarsApplicationMixin(ApplicationV2) {

  static #instance = null;

  static DEFAULT_OPTIONS = {
    id: "faern-approval-queue",
    classes: ["faern-app", "approval-queue"],
    position: { width: 500, height: 620 },
    window: {
      frame: true,
      positioned: true,
      title: "FAERN.ApprovalQueue.Title",
      icon: "fas fa-inbox",
      resizable: true,
      minimizable: true,
    },
    actions: {
      openRequest:   ApprovalQueueApp.#onOpenRequest,
      quickApprove:  ApprovalQueueApp.#onQuickApprove,
      quickReject:   ApprovalQueueApp.#onQuickReject,
    },
  };

  static PARTS = {
    queue: {
      template: "modules/faer-n-commerce/templates/approval-queue.hbs",
      scrollable: [".queue-list"],
    },
  };

  static open() {
    if (!ApprovalQueueApp.#instance) {
      ApprovalQueueApp.#instance = new ApprovalQueueApp();
    }
    ApprovalQueueApp.#instance.render(true);
    return ApprovalQueueApp.#instance;
  }

  static refresh() {
    if (ApprovalQueueApp.#instance?.rendered) {
      ApprovalQueueApp.#instance.render(false);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const allRequests = [];
    for (const shopfront of game.journal.filter(j => j.type === "shopfront")) {
      for (const req of (shopfront.system?.purchaseRequests ?? [])) {
        if (!["pending", "countered"].includes(req.status)) continue;
        const actor = game.actors.get(req.actorId);
        const user = game.users.get(req.userId);
        allRequests.push({
          ...req,
          shopfrontId: shopfront.id,
          shopName: shopfront.name,
          actorName: actor?.name ?? "Unknown",
          actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
          userName: user?.name ?? "Unknown",
          statusInfo: FAERN.REQUEST_STATUS[req.status],
          formattedTime: new Date(req.timestamp).toLocaleTimeString(),
          itemCount: req.items?.length ?? 0,
          itemSummary: req.items?.map(i => `${i.itemName} ×${i.quantity}`).join(", ") ?? "",
        });
      }
    }

    allRequests.sort((a, b) => a.timestamp - b.timestamp);

    return { ...context, requests: allRequests, isEmpty: allRequests.length === 0 };
  }

  static async #onOpenRequest(event, target) {
    const shopfrontId = target.closest("[data-shopfront-id]")?.dataset.shopfrontId;
    const requestId   = target.closest("[data-request-id]")?.dataset.requestId;
    if (!shopfrontId || !requestId) return;
    const shopfront = game.journal.get(shopfrontId);
    if (!shopfront) return;
    const { RequestDetailApp } = await import("./request-detail-app.js");
    new RequestDetailApp(shopfront, requestId).render(true);
  }

  static async #onQuickApprove(event, target) {
    const shopfrontId = target.closest("[data-shopfront-id]")?.dataset.shopfrontId;
    const requestId   = target.closest("[data-request-id]")?.dataset.requestId;
    if (!shopfrontId || !requestId) return;
    SocketHandler.emit(FAERN.SOCKET_EVENTS.APPROVE_REQUEST, { shopfrontId, requestId });
  }

  static async #onQuickReject(event, target) {
    const shopfrontId = target.closest("[data-shopfront-id]")?.dataset.shopfrontId;
    const requestId   = target.closest("[data-request-id]")?.dataset.requestId;
    if (!shopfrontId || !requestId) return;
    SocketHandler.emit(FAERN.SOCKET_EVENTS.REJECT_REQUEST, { shopfrontId, requestId, message: "" });
  }
}
