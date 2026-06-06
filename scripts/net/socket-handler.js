/**
 * Faerûn Commerce - SocketHandler
 * All socket traffic. GM-authoritative: players emit, GM validates and writes.
 */
import { FAERN } from "../constants.js";
import { PurchaseManager } from "../systems/purchase-manager.js";

export class SocketHandler {

  /**
   * Bind the socket listener. Call once during "ready".
   */
  static initialize() {
    game.socket.on(FAERN.SOCKET_EVENT, SocketHandler.dispatch.bind(SocketHandler));
    console.log(`${FAERN.ID} | Socket listener registered`);
  }

  /**
   * Route an incoming socket message to the appropriate handler.
   * @param {{ event: string, payload: object, userId: string }} data
   */
  static async dispatch(data) {
    const { event, payload } = data;

    // Only the GM processes write events
    const gmEvents = [
      FAERN.SOCKET_EVENTS.SUBMIT_REQUEST,
      FAERN.SOCKET_EVENTS.APPROVE_REQUEST,
      FAERN.SOCKET_EVENTS.REJECT_REQUEST,
      FAERN.SOCKET_EVENTS.COUNTER_REQUEST,
      FAERN.SOCKET_EVENTS.ACCEPT_COUNTER,
      FAERN.SOCKET_EVENTS.DECLINE_COUNTER,
    ];

    if (gmEvents.includes(event) && !game.user.isGM) return;

    try {
      switch (event) {
        case FAERN.SOCKET_EVENTS.SUBMIT_REQUEST:
          return await SocketHandler.handleSubmitRequest(payload);
        case FAERN.SOCKET_EVENTS.APPROVE_REQUEST:
          return await SocketHandler.handleApproveRequest(payload);
        case FAERN.SOCKET_EVENTS.REJECT_REQUEST:
          return await SocketHandler.handleRejectRequest(payload);
        case FAERN.SOCKET_EVENTS.COUNTER_REQUEST:
          return await SocketHandler.handleCounterRequest(payload);
        case FAERN.SOCKET_EVENTS.ACCEPT_COUNTER:
          return await SocketHandler.handleAcceptCounter(payload);
        case FAERN.SOCKET_EVENTS.DECLINE_COUNTER:
          return await SocketHandler.handleDeclineCounter(payload);
        case FAERN.SOCKET_EVENTS.SHOP_UPDATE:
          return SocketHandler.#handleShopUpdate(payload);
        default:
          console.warn(`${FAERN.ID} | Unknown socket event: ${event}`);
      }
    } catch (err) {
      console.error(`${FAERN.ID} | Socket handler error for event "${event}":`, err);
      ui.notifications.error(`${FAERN.ID}: ${err.message}`);
    }
  }

  /* ─── GM handlers ────────────────────────────────────────────── */

  static async handleSubmitRequest(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestData"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.submitRequest(doc, payload.requestData);

    ui.notifications.info(
      game.i18n.format("FAERN.Notification.NewRequest", { shop: doc.name })
    );

    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  static async handleApproveRequest(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestId"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.approveRequest(doc, payload.requestId);
    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  static async handleRejectRequest(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestId"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.rejectRequest(doc, payload.requestId, payload.message ?? "");
    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  static async handleCounterRequest(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestId", "counterData"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.counterRequest(doc, payload.requestId, payload.counterData);
    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  static async handleAcceptCounter(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestId"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.acceptCounter(doc, payload.requestId);
    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  static async handleDeclineCounter(payload) {
    SocketHandler.#validateGM();
    SocketHandler.#validatePayload(payload, ["shopfrontId", "requestId"]);

    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) throw new Error(`Shop not found: ${payload.shopfrontId}`);

    await PurchaseManager.declineCounter(doc, payload.requestId);
    SocketHandler.emit(FAERN.SOCKET_EVENTS.SHOP_UPDATE, { shopfrontId: payload.shopfrontId });
  }

  /* ─── Emit helpers ───────────────────────────────────────────── */

  static emit(event, payload) {
    game.socket.emit(FAERN.SOCKET_EVENT, {
      event,
      payload,
      userId: game.userId,
    });
  }

  static emitToGM(event, payload) {
    game.socket.emit(FAERN.SOCKET_EVENT, {
      event,
      payload,
      userId: game.userId,
      toGM: true,
    });
  }

  /* ─── Private ────────────────────────────────────────────────── */

  static #validateGM() {
    if (!game.user.isGM) throw new Error("FAERN | Only the GM can execute this action.");
  }

  static #validatePayload(payload, required = []) {
    for (const key of required) {
      if (payload[key] === undefined || payload[key] === null) {
        throw new Error(`FAERN | Missing required payload field: ${key}`);
      }
    }
  }

  static #handleShopUpdate(payload) {
    const doc = game.journal.get(payload.shopfrontId);
    if (!doc) return;
    const sheet = doc.sheet;
    if (sheet?.rendered) sheet.render(false);
  }
}
