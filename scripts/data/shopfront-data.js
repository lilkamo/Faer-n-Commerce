/**
 * Faerûn Commerce - ShopfrontData TypeDataModel
 */
import { FAERN } from "../constants.js";

const fields = foundry.data.fields;

export class ShopfrontData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      // ── Identity ──────────────────────────────────────────────
      merchantName:    new fields.StringField({ blank: true, label: "FAERN.Field.MerchantName" }),
      merchantPortrait: new fields.StringField({ blank: true, label: "FAERN.Field.MerchantPortrait" }),
      storeBanner:     new fields.StringField({ blank: true, label: "FAERN.Field.StoreBanner" }),
      storeType:       new fields.StringField({
        choices: Object.fromEntries(Object.entries(FAERN.STORE_TYPES).map(([k, v]) => [k, v.label])),
        initial: "general",
        label: "FAERN.Field.StoreType",
      }),
      description: new fields.HTMLField({ blank: true, label: "FAERN.Field.Description" }),

      // ── Operations ────────────────────────────────────────────
      isOpen:        new fields.BooleanField({ initial: true, label: "FAERN.Field.IsOpen" }),
      manualOverride: new fields.BooleanField({ initial: false, label: "FAERN.Field.ManualOverride" }),
      operatingHours: new fields.SchemaField({
        enabled:  new fields.BooleanField({ initial: false }),
        schedule: new fields.ObjectField({ initial: {} }),
      }),

      // ── Links ─────────────────────────────────────────────────
      linkedActorId:     new fields.StringField({ blank: true }),
      linkedRollTableId: new fields.StringField({ blank: true }),
      linkedQuestId:     new fields.StringField({ blank: true }),

      // ── Commerce ──────────────────────────────────────────────
      buyingCategories:     new fields.ArrayField(new fields.StringField()),
      defaultPriceMultiplier: new fields.NumberField({ initial: 1.0, min: 0, label: "FAERN.Field.PriceMultiplier" }),
      acceptsSell:          new fields.BooleanField({ initial: true, label: "FAERN.Field.AcceptsSell" }),

      // ── Finance ───────────────────────────────────────────────
      currency: new fields.SchemaField({
        pp: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
        gp: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
        ep: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
        sp: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
        cp: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
      }),
      totalRevenue:  new fields.NumberField({ initial: 0 }),
      totalExpenses: new fields.NumberField({ initial: 0 }),

      // ── Inventory ─────────────────────────────────────────────
      inventory: new fields.ArrayField(new fields.SchemaField({
        _id:          new fields.StringField({ required: true, blank: false }),
        itemUuid:     new fields.StringField({ required: true, blank: false }),
        quantity:     new fields.NumberField({ integer: true, initial: 1, min: -1 }),
        priceOverride: new fields.SchemaField({
          enabled:      new fields.BooleanField({ initial: false }),
          value:        new fields.NumberField({ initial: 0, min: 0 }),
          denomination: new fields.StringField({ initial: "gp" }),
        }),
        availability: new fields.StringField({
          choices: Object.fromEntries(Object.entries(FAERN.ITEM_AVAILABILITY).map(([k, v]) => [k, v.label])),
          initial: "available",
        }),
        notes: new fields.StringField({ blank: true }),
      })),

      // ── Purchase Requests ─────────────────────────────────────
      purchaseRequests: new fields.ArrayField(new fields.SchemaField({
        _id:     new fields.StringField({ blank: false }),
        userId:  new fields.StringField({ blank: false }),
        actorId: new fields.StringField({ blank: false }),
        type: new fields.StringField({
          choices: Object.fromEntries(Object.entries(FAERN.REQUEST_TYPES).map(([k, v]) => [k, v.label])),
          initial: "buy",
        }),
        status: new fields.StringField({
          choices: Object.fromEntries(Object.entries(FAERN.REQUEST_STATUS).map(([k, v]) => [k, v.label])),
          initial: "pending",
        }),
        items: new fields.ArrayField(new fields.SchemaField({
          itemUuid:    new fields.StringField({ blank: false }),
          itemName:    new fields.StringField({ blank: true }),
          quantity:    new fields.NumberField({ integer: true, min: 1, initial: 1 }),
          unitPrice:   new fields.NumberField({ min: 0, initial: 0 }),
          denomination: new fields.StringField({ initial: "gp" }),
        })),
        playerMessage: new fields.StringField({ blank: true }),
        timestamp:     new fields.NumberField({ initial: () => Date.now() }),
        gmResponse: new fields.SchemaField({
          message:      new fields.StringField({ blank: true }),
          counterItems: new fields.ArrayField(new fields.SchemaField({})),
          respondedAt:  new fields.NumberField({ nullable: true, initial: null }),
        }),
      })),

      // ── Transaction Log ───────────────────────────────────────
      transactionLog: new fields.ArrayField(new fields.SchemaField({
        _id:          new fields.StringField({ blank: false }),
        timestamp:    new fields.NumberField({ initial: () => Date.now() }),
        type:         new fields.StringField({ blank: true }),
        actorId:      new fields.StringField({ blank: true }),
        userId:       new fields.StringField({ blank: true }),
        items:        new fields.ArrayField(new fields.SchemaField({})),
        totalValueGp: new fields.NumberField({ initial: 0 }),
        notes:        new fields.StringField({ blank: true }),
      })),

      // ── Phase scaffolding (not active in 0.1) ─────────────────
      reputation:      new fields.ObjectField({ initial: {} }),
      specialOrders:   new fields.ArrayField(new fields.SchemaField({})),
      economicData:    new fields.ObjectField({ initial: {} }),
      personalityData: new fields.ObjectField({ initial: {} }),
      factionData:     new fields.ObjectField({ initial: {} }),
    };
  }

  /* ─── Migration ─────────────────────────────────────────────── */

  static migrateData(source) {
    // Migration stub — extend in future versions
    return super.migrateData(source);
  }

  /* ─── Getters ────────────────────────────────────────────────── */

  get inventoryCount() {
    return this.inventory.length;
  }

  get pendingRequestCount() {
    return this.purchaseRequests.filter(r => r.status === "pending").length;
  }

  get totalValueGp() {
    return (this.totalRevenue ?? 0) - (this.totalExpenses ?? 0);
  }
}
