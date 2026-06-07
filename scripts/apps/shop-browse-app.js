/**
 * Faerûn Commerce - ShopBrowseApp
 * Player-facing storefront view.
 */
import { FAERN } from "../constants.js";
import { InventoryManager } from "../systems/inventory-manager.js";
import { PricingEngine } from "../systems/pricing-engine.js";
import { SocketHandler } from "../net/socket-handler.js";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class ShopBrowseApp extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @param {JournalEntry} shopfrontDoc */
  constructor(shopfrontDoc, options = {}) {
    super(options);
    this._shopfront = shopfrontDoc;
    this._cart = new Map();       // entryId → { entry, item, quantity }
    this._filter = "all";
    this._search = "";
  }

  static DEFAULT_OPTIONS = {
    classes: ["faern-app", "shop-browse"],
    position: { width: 980, height: 700 },
    window: {
      frame: true,
      positioned: true,
      title: "Shop",
      icon: "fas fa-store",
      resizable: true,
      minimizable: true,
    },
    actions: {
      addToCart:      ShopBrowseApp.#onAddToCart,
      removeFromCart: ShopBrowseApp.#onRemoveFromCart,
      submitRequest:  ShopBrowseApp.#onSubmitRequest,
      filterCategory: ShopBrowseApp.#onFilterCategory,
    },
  };

  static PARTS = {
    header: {
      template: "modules/faer-n-commerce/templates/partials/merchant-header.hbs",
    },
    browse: {
      template: "modules/faer-n-commerce/templates/shop-browse.hbs",
      scrollable: [".inventory-scroll"],
    },
  };

  get title() {
    return this._shopfront?.name ?? game.i18n.localize("FAERN.Shop.Title");
  }

  /* ─── Context ────────────────────────────────────────────────── */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const doc = this._shopfront;
    const sys = doc.system;

    const fullInventory = await InventoryManager.getFullInventory(doc);
    const showPrices = game.settings.get(FAERN.ID, FAERN.SETTINGS.SHOW_PRICES) ?? true;

    const items = fullInventory
      .filter(({ entry }) => entry.availability !== "unavailable")
      .map(({ entry, item }) => {
        const price = PricingEngine.getEffectivePrice(entry, item, doc);
        const cartEntry = this._cart.get(entry._id);
        return {
          entry,
          item,
          img: item.img,
          name: item.name,
          description: item.system?.description?.value ?? "",
          type: item.type,
          rarity: item.system?.rarity ?? "",
          price,
          formattedPrice: showPrices ? PricingEngine.formatPrice(price.value, price.denomination) : "—",
          isLimited: entry.availability === "limited",
          isInfinite: entry.quantity === -1,
          stockDisplay: entry.quantity === -1 ? "∞" : entry.quantity,
          cartQuantity: cartEntry?.quantity ?? 0,
          inCart: !!cartEntry,
        };
      })
      .filter(i => {
        if (this._filter !== "all" && i.type !== this._filter) return false;
        if (this._search && !i.name.toLowerCase().includes(this._search.toLowerCase())) return false;
        return true;
      });

    const cartItems = [...this._cart.values()].map(c => ({
      ...c,
      formattedPrice: PricingEngine.formatPrice(
        PricingEngine.getEffectivePrice(c.entry, c.item, doc).value * c.quantity,
        PricingEngine.getEffectivePrice(c.entry, c.item, doc).denomination
      ),
    }));

    const cartTotal = [...this._cart.values()].reduce((sum, c) => {
      const price = PricingEngine.getEffectivePrice(c.entry, c.item, doc);
      return sum + PricingEngine.convertToGp(price.value * c.quantity, price.denomination);
    }, 0);

    const description = await TextEditor.enrichHTML(sys.description ?? "", { async: true });

    // Gather item types for filter pills
    const itemTypes = [...new Set(fullInventory.map(({ item }) => item.type))];

    // Player's own actor(s)
    const myActors = game.user.character
      ? [game.user.character]
      : game.actors.filter(a => a.isOwner && a.type === "character");

    return {
      ...context,
      document: doc,
      system: sys,
      description,
      items,
      cartItems,
      cartTotal: Math.round(cartTotal * 100) / 100,
      cartEmpty: this._cart.size === 0,
      currentFilter: this._filter,
      searchQuery: this._search,
      itemTypes,
      myActors,
      hasActor: myActors.length > 0,
      isGM: game.user.isGM,
    };
  }

  /* ─── Render ─────────────────────────────────────────────────── */

  _onRender(context, options) {
    super._onRender?.(context, options);
    const searchInput = this.element.querySelector(".faern-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", foundry.utils.debounce(e => {
        this._search = e.target.value;
        this.render(false);
      }, 200));
    }

    // Quantity spinner changes
    this.element.querySelectorAll(".cart-qty-input").forEach(input => {
      input.addEventListener("change", e => {
        const entryId = e.target.closest("[data-entry-id]")?.dataset.entryId;
        if (!entryId) return;
        const qty = parseInt(e.target.value) || 1;
        const cartItem = this._cart.get(entryId);
        if (cartItem) {
          this._cart.set(entryId, { ...cartItem, quantity: Math.max(1, qty) });
          this.render(false);
        }
      });
    });
  }

  /* ─── Actions ────────────────────────────────────────────────── */

  static async #onAddToCart(event, target) {
    const entryId = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!entryId) return;

    const fullInventory = await InventoryManager.getFullInventory(this._shopfront);
    const found = fullInventory.find(({ entry }) => entry._id === entryId);
    if (!found) return;

    if (this._cart.has(entryId)) {
      const existing = this._cart.get(entryId);
      this._cart.set(entryId, { ...existing, quantity: existing.quantity + 1 });
    } else {
      this._cart.set(entryId, { ...found, quantity: 1 });
    }
    this.render(false);
  }

  static async #onRemoveFromCart(event, target) {
    const entryId = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!entryId) return;
    this._cart.delete(entryId);
    this.render(false);
  }

  static async #onFilterCategory(event, target) {
    this._filter = target.dataset.filter ?? "all";
    this.render(false);
  }

  static async #onSubmitRequest(event, target) {
    if (this._cart.size === 0) return;

    const actorSelect = this.element.querySelector("[name='actorId']");
    const actorId = actorSelect?.value ?? game.user.character?.id;
    if (!actorId) {
      ui.notifications.warn(game.i18n.localize("FAERN.Browse.NoActorSelected"));
      return;
    }

    const message = this.element.querySelector("[name='playerMessage']")?.value ?? "";

    const items = [...this._cart.values()].map(c => {
      const price = PricingEngine.getEffectivePrice(c.entry, c.item, this._shopfront);
      return {
        itemUuid: c.entry.itemUuid,
        itemName: c.item.name,
        quantity: c.quantity,
        unitPrice: price.value,
        denomination: price.denomination,
      };
    });

    SocketHandler.emit(FAERN.SOCKET_EVENTS.SUBMIT_REQUEST, {
      shopfrontId: this._shopfront.id,
      requestData: {
        userId: game.userId,
        actorId,
        type: "buy",
        items,
        playerMessage: message,
      },
    });

    this._cart.clear();
    ui.notifications.info(game.i18n.localize("FAERN.Browse.RequestSubmitted"));
    this.render(false);
  }
}
