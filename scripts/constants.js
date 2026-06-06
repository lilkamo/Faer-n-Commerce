/**
 * Faerûn Commerce - Module Constants
 */

const FAERN = Object.freeze({
  ID: "faer-n-commerce",
  SOCKET_EVENT: "module.faer-n-commerce",

  STORE_TYPES: Object.freeze({
    general:    { label: "FAERN.StoreType.General",    icon: "modules/faer-n-commerce/assets/icons/store-types/general.svg" },
    blacksmith:  { label: "FAERN.StoreType.Blacksmith", icon: "modules/faer-n-commerce/assets/icons/store-types/blacksmith.svg" },
    apothecary:  { label: "FAERN.StoreType.Apothecary", icon: "modules/faer-n-commerce/assets/icons/store-types/apothecary.svg" },
    magic:       { label: "FAERN.StoreType.Magic",      icon: "modules/faer-n-commerce/assets/icons/store-types/magic.svg" },
    tavern:      { label: "FAERN.StoreType.Tavern",     icon: "modules/faer-n-commerce/assets/icons/store-types/tavern.svg" },
    stable:      { label: "FAERN.StoreType.Stable",     icon: "modules/faer-n-commerce/assets/icons/store-types/stable.svg" },
    market:      { label: "FAERN.StoreType.Market",     icon: "modules/faer-n-commerce/assets/icons/store-types/market.svg" },
    jeweller:    { label: "FAERN.StoreType.Jeweller",   icon: "modules/faer-n-commerce/assets/icons/store-types/jeweller.svg" },
    temple:      { label: "FAERN.StoreType.Temple",     icon: "modules/faer-n-commerce/assets/icons/store-types/temple.svg" },
  }),

  ITEM_AVAILABILITY: Object.freeze({
    available:   { label: "FAERN.Availability.Available",   icon: "fas fa-check-circle" },
    limited:     { label: "FAERN.Availability.Limited",     icon: "fas fa-exclamation-circle" },
    unavailable: { label: "FAERN.Availability.Unavailable", icon: "fas fa-times-circle" },
  }),

  REQUEST_STATUS: Object.freeze({
    pending:   { label: "FAERN.RequestStatus.Pending",   icon: "fas fa-clock",          cssClass: "status--pending" },
    approved:  { label: "FAERN.RequestStatus.Approved",  icon: "fas fa-check",          cssClass: "status--approved" },
    rejected:  { label: "FAERN.RequestStatus.Rejected",  icon: "fas fa-times",          cssClass: "status--rejected" },
    countered: { label: "FAERN.RequestStatus.Countered", icon: "fas fa-exchange-alt",   cssClass: "status--countered" },
    completed: { label: "FAERN.RequestStatus.Completed", icon: "fas fa-check-double",   cssClass: "status--completed" },
    expired:   { label: "FAERN.RequestStatus.Expired",   icon: "fas fa-hourglass-end",  cssClass: "status--expired" },
  }),

  REQUEST_TYPES: Object.freeze({
    buy:           { label: "FAERN.RequestType.Buy" },
    sell:          { label: "FAERN.RequestType.Sell" },
    barter:        { label: "FAERN.RequestType.Barter" },
    "special-order": { label: "FAERN.RequestType.SpecialOrder" },
  }),

  REPUTATION_LEVELS: Object.freeze({
    hostile:    { label: "FAERN.Reputation.Hostile",    value: -2 },
    suspicious: { label: "FAERN.Reputation.Suspicious", value: -1 },
    neutral:    { label: "FAERN.Reputation.Neutral",    value:  0 },
    friendly:   { label: "FAERN.Reputation.Friendly",   value:  1 },
    trusted:    { label: "FAERN.Reputation.Trusted",    value:  2 },
  }),

  SOCKET_EVENTS: Object.freeze({
    SUBMIT_REQUEST:  "submitRequest",
    APPROVE_REQUEST: "approveRequest",
    REJECT_REQUEST:  "rejectRequest",
    COUNTER_REQUEST: "counterRequest",
    ACCEPT_COUNTER:  "acceptCounter",
    DECLINE_COUNTER: "declineCounter",
    REQUEST_UPDATE:  "requestUpdate",
    SHOP_UPDATE:     "shopUpdate",
  }),

  SETTINGS: Object.freeze({
    DEFAULT_PRICE_TYPE:     "defaultPriceType",
    REQUIRE_APPROVAL:       "requireApproval",
    SHOW_PRICES:            "showPrices",
    TRANSACTION_LOG_LIMIT:  "transactionLogLimit",
    CURRENCY_MODE:          "currencyMode",
    PIN_SCALE:              "pinScale",
    SHOW_PIN_LABELS:        "showPinLabels",
  }),

  TEMPLATES: Object.freeze({
    // Partials
    MERCHANT_HEADER:   "modules/faer-n-commerce/templates/partials/merchant-header.hbs",
    INVENTORY_ROW:     "modules/faer-n-commerce/templates/partials/inventory-row.hbs",
    REQUEST_CARD:      "modules/faer-n-commerce/templates/partials/request-card.hbs",
    CURRENCY_DISPLAY:  "modules/faer-n-commerce/templates/partials/currency-display.hbs",
    // Main templates
    GM_SHEET:          "modules/faer-n-commerce/templates/shopfront-gm-sheet.hbs",
    SHOP_BROWSE:       "modules/faer-n-commerce/templates/shop-browse.hbs",
    APPROVAL_QUEUE:    "modules/faer-n-commerce/templates/approval-queue.hbs",
    REQUEST_DETAIL:    "modules/faer-n-commerce/templates/request-detail.hbs",
    TRANSACTION_HISTORY: "modules/faer-n-commerce/templates/transaction-history.hbs",
  }),

  PERMISSIONS: Object.freeze({
    OBSERVER: 2,
    LIMITED:  1,
    OWNER:    3,
  }),
});

export { FAERN };
