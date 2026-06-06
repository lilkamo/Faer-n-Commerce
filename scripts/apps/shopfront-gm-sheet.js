/**
 * Faerûn Commerce - ShopfrontGMSheet
 * Full GM configuration sheet for a Shopfront (JournalEntry type "shopfront").
 */
import { FAERN } from "../constants.js";
import { InventoryManager } from "../systems/inventory-manager.js";
import { PricingEngine } from "../systems/pricing-engine.js";
import { TransactionLogger } from "../systems/transaction-logger.js";

const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;

export class ShopfrontGMSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

  static DEFAULT_OPTIONS = {
    id: "shopfront-gm-sheet",
    classes: ["faern-app", "shopfront-gm-sheet"],
    position: { width: 900, height: 720 },
    window: {
      frame: true,
      positioned: true,
      title: "FAERN.GMSheet.Title",
      icon: "fas fa-store",
      resizable: true,
      minimizable: true,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    actions: {
      removeInventoryItem:  ShopfrontGMSheet.#onRemoveInventoryItem,
      toggleOpen:           ShopfrontGMSheet.#onToggleOpen,
      setAvailability:      ShopfrontGMSheet.#onSetAvailability,
      openRequest:          ShopfrontGMSheet.#onOpenRequest,
      openHistory:          ShopfrontGMSheet.#onOpenHistory,
      pickPortrait:         ShopfrontGMSheet.#onPickPortrait,
      pickBanner:           ShopfrontGMSheet.#onPickBanner,
      pickIcon:             ShopfrontGMSheet.#onPickIcon,
      placePin:             ShopfrontGMSheet.#onPlacePin,
    },
  };

  static PARTS = {
    header: {
      template: "modules/faer-n-commerce/templates/partials/merchant-header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    identity: {
      template: "modules/faer-n-commerce/templates/tabs/gm-identity.hbs",
      scrollable: [".tab-content"],
    },
    inventory: {
      template: "modules/faer-n-commerce/templates/tabs/gm-inventory.hbs",
      scrollable: [".inventory-list"],
    },
    commerce: {
      template: "modules/faer-n-commerce/templates/tabs/gm-commerce.hbs",
    },
    requests: {
      template: "modules/faer-n-commerce/templates/tabs/gm-requests.hbs",
      scrollable: [".requests-list"],
    },
    history: {
      template: "modules/faer-n-commerce/templates/tabs/gm-history.hbs",
      scrollable: [".history-list"],
    },
  };

  tabGroups = { primary: "identity" };

  /* ─── Tabs ───────────────────────────────────────────────────── */

  _getTabs() {
    const tabs = {
      identity:  { id: "identity",  group: "primary", icon: "fas fa-user",          label: "FAERN.Tab.Identity"  },
      inventory: { id: "inventory", group: "primary", icon: "fas fa-boxes-stacked",  label: "FAERN.Tab.Inventory" },
      commerce:  { id: "commerce",  group: "primary", icon: "fas fa-coins",          label: "FAERN.Tab.Commerce"  },
      requests:  { id: "requests",  group: "primary", icon: "fas fa-inbox",          label: "FAERN.Tab.Requests"  },
      history:   { id: "history",   group: "primary", icon: "fas fa-scroll",         label: "FAERN.Tab.History"   },
    };
    for (const [k, tab] of Object.entries(tabs)) {
      tab.active = this.tabGroups[tab.group] === k;
      tab.cssClass = tab.active ? "active" : "";
    }
    return tabs;
  }

  /* ─── Context ────────────────────────────────────────────────── */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const doc = this.document;
    const sys = doc.system;

    const storeTypeChoices = Object.fromEntries(
      Object.entries(FAERN.STORE_TYPES).map(([k, v]) => [k, game.i18n.localize(v.label)])
    );

    const fullInventory = await InventoryManager.getFullInventory(doc);
    const enrichedInventory = fullInventory.map(({ entry, item }) => ({
      entry,
      item,
      effectivePrice: PricingEngine.getEffectivePrice(entry, item, doc),
      formattedPrice: PricingEngine.formatPrice(
        PricingEngine.getEffectivePrice(entry, item, doc).value,
        PricingEngine.getEffectivePrice(entry, item, doc).denomination,
      ),
      availabilityLabel: game.i18n.localize(FAERN.ITEM_AVAILABILITY[entry.availability]?.label ?? ""),
    }));

    const enrichedRequests = await Promise.all(
      (sys.purchaseRequests ?? [])
        .filter(r => r.status === "pending" || r.status === "countered")
        .map(async r => {
          const actor = game.actors.get(r.actorId);
          const user = game.users.get(r.userId);
          return { ...r, actorName: actor?.name ?? "Unknown", userName: user?.name ?? "Unknown", actorImg: actor?.img };
        })
    );

    const description = await TextEditor.enrichHTML(sys.description ?? "", { async: true });

    return {
      ...context,
      document: doc,
      system: sys,
      tabs: this._getTabs(),
      storeTypeChoices,
      fullInventory: enrichedInventory,
      pendingRequests: enrichedRequests,
      transactionLog: TransactionLogger.getLog(doc).slice(0, 50),
      description,
      availabilityChoices: Object.fromEntries(
        Object.entries(FAERN.ITEM_AVAILABILITY).map(([k, v]) => [k, game.i18n.localize(v.label)])
      ),
    };
  }

  /* ─── Drag-drop ──────────────────────────────────────────────── */

  _onRender(context, options) {
    super._onRender?.(context, options);
    const inventoryZone = this.element.querySelector(".faern-drop-zone");
    if (inventoryZone) {
      inventoryZone.addEventListener("dragover", e => e.preventDefault());
      inventoryZone.addEventListener("drop", this.#onDropItem.bind(this));
    }
  }

  async #onDropItem(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch { return; }

    if (data.type !== "Item") return;
    const uuid = data.uuid;
    if (!uuid) return;

    await InventoryManager.addItem(this.document, uuid);
    this.render(false);
  }

  /* ─── Actions ────────────────────────────────────────────────── */

  static async #onRemoveInventoryItem(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!id) return;
    await InventoryManager.removeItem(this.document, id);
  }

  static async #onToggleOpen(event, target) {
    await this.document.update({ "system.isOpen": !this.document.system.isOpen });
  }

  static async #onSetAvailability(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    const value = target.value;
    if (!id || !value) return;
    await InventoryManager.setAvailability(this.document, id, value);
  }

  static async #onOpenRequest(event, target) {
    const id = target.closest("[data-request-id]")?.dataset.requestId;
    if (!id) return;
    const { RequestDetailApp } = await import("./request-detail-app.js");
    new RequestDetailApp(this.document, id).render(true);
  }

  static async #onOpenHistory(event, target) {
    const { TransactionHistoryApp } = await import("./transaction-history-app.js");
    new TransactionHistoryApp(this.document).render(true);
  }

  static async #onPickPortrait(event, target) {
    const picker = new FilePicker({
      type: "image",
      current: this.document.system.merchantPortrait,
      callback: path => this.document.update({ "system.merchantPortrait": path }),
    });
    picker.render(true);
  }

  static async #onPickBanner(event, target) {
    const picker = new FilePicker({
      type: "image",
      current: this.document.system.storeBanner,
      callback: path => this.document.update({ "system.storeBanner": path }),
    });
    picker.render(true);
  }

  static async #onPickIcon(event, target) {
    const id = target.closest("[data-entry-id]")?.dataset.entryId;
    if (!id) return;
    // Pin icon override — future feature placeholder
  }

  static async #onPlacePin(event, target) {
    const layer = canvas?.shopfronts;
    if (!layer) {
      ui.notifications.warn(game.i18n.localize("FAERN.Canvas.NoCanvas"));
      return;
    }
    layer.activatePlacementMode(this.document.id);
    this.close();
    ui.notifications.info(game.i18n.localize("FAERN.Canvas.ClickToPlaceInfo"));
  }
}
