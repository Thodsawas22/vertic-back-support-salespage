const CONFIG = {
  spreadsheetId: "1dJa71bTOoDhq5-dva81EjjhuRMgQFOYzHdYbQJxMpa8",
  sheetName: "Orders",
};

const ORDER_STATUSES = ["NEW", "CONFIRMED", "SHIPPED", "PAID", "CANCELLED", "RETURNED"];

// Keep the original 13 columns in place so existing order rows remain compatible.
const HEADERS = [
  "Created at",
  "Status",
  "Package",
  "Quantity",
  "Amount",
  "Customer",
  "Phone",
  "Address line",
  "Subdistrict",
  "District",
  "Province",
  "Postcode",
  "Full address",
  "Order ID",
  "Event ID",
  "_fbp",
  "_fbc",
  "Tracking number",
  "Confirmed at",
  "Shipped at",
  "Paid at",
  "COD amount received",
  "Return reason",
  "Meta Purchase sent at",
];

const COLUMNS = {
  status: 2,
  quantity: 4,
  amount: 5,
  phone: 7,
  postcode: 12,
  orderId: 14,
  eventId: 15,
  fbp: 16,
  fbc: 17,
  trackingNumber: 18,
  confirmedAt: 19,
  shippedAt: 20,
  paidAt: 21,
  codAmountReceived: 22,
};

function doGet() {
  return jsonResponse({ ok: true, service: "VERTIC order webhook" });
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const webhookSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("WEBHOOK_SECRET is not configured in Script properties");
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, error: "Missing request body" });
    }

    const payload = JSON.parse(event.postData.contents);
    if (payload.secret !== webhookSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const order = payload.order;
    validateOrder(order);

    const sheet = getOrderSheet();
    ensureHeaders(sheet);

    const rowNumber = sheet.getLastRow() + 1;
    const row = [[
      order.createdAt,
      order.orderStatus,
      order.package,
      order.quantity,
      order.amount,
      order.customerName,
      order.phone,
      order.addressLine,
      order.district,
      order.amphoe,
      order.province,
      order.zipcode,
      order.fullAddress,
      order.orderId,
      order.eventId,
      order.fbp || "",
      order.fbc || "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]];

    sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues(row);
    sheet.getRange(rowNumber, COLUMNS.quantity).setNumberFormat("0");
    sheet.getRange(rowNumber, COLUMNS.amount).setNumberFormat("#,##0");
    [COLUMNS.phone, COLUMNS.postcode, COLUMNS.orderId, COLUMNS.eventId, COLUMNS.fbp, COLUMNS.fbc, COLUMNS.trackingNumber]
      .forEach(function (column) {
        sheet.getRange(rowNumber, column).setNumberFormat("@");
      });

    return jsonResponse({ ok: true, row: rowNumber, orderId: order.orderId });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validateOrder(order) {
  const required = [
    "createdAt",
    "orderStatus",
    "package",
    "quantity",
    "amount",
    "customerName",
    "phone",
    "addressLine",
    "district",
    "amphoe",
    "province",
    "orderId",
    "eventId",
  ];
  if (!order) throw new Error("Missing order");

  required.forEach(function (field) {
    if (order[field] === undefined || order[field] === null || order[field] === "") {
      throw new Error("Missing order field: " + field);
    }
  });
}

function getOrderSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  return spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) {
    const legacyHeaders = sheet.getRange(1, 1, 1, 13).getValues()[0];
    if (legacyHeaders.join("|") !== HEADERS.slice(0, 13).join("|")) {
      throw new Error("The first 13 Orders sheet headers do not match the expected columns");
    }
  }

  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#082d63");
  headerRange.setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  applyStatusValidation(sheet);
}

function applyStatusValidation(sheet) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ORDER_STATUSES, true)
    .setAllowInvalid(false)
    .setHelpText("เลือกสถานะออเดอร์ VERTIC")
    .build();
  const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, COLUMNS.status, rowCount, 1).setDataValidation(rule);
}

// Run this once from the Apps Script editor after deploying the new version.
function setupOrderSheet() {
  const sheet = getOrderSheet();
  ensureHeaders(sheet);
  ensureStatusEditTrigger();
}

function ensureStatusEditTrigger() {
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === "handleOrderStatusEdit";
  });
  if (!exists) {
    ScriptApp.newTrigger("handleOrderStatusEdit")
      .forSpreadsheet(CONFIG.spreadsheetId)
      .onEdit()
      .create();
  }
}

// Automatically timestamps manual status changes in the Orders sheet.
function handleOrderStatusEdit(event) {
  if (!event || !event.range) return;
  const range = event.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.sheetName || range.getRow() <= 1 || range.getColumn() !== COLUMNS.status) return;

  const status = String(range.getValue()).trim().toUpperCase();
  const timestampColumns = {
    CONFIRMED: COLUMNS.confirmedAt,
    SHIPPED: COLUMNS.shippedAt,
    PAID: COLUMNS.paidAt,
  };
  const timestampColumn = timestampColumns[status];
  if (!timestampColumn) return;

  const timestampCell = sheet.getRange(range.getRow(), timestampColumn);
  if (!timestampCell.getValue()) {
    timestampCell.setValue(new Date());
    timestampCell.setNumberFormat("yyyy-mm-dd hh:mm:ss");
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
