import { Sequelize, DataTypes } from "sequelize";
import configAll from "../config/database.js";
import "dotenv/config";
import dayjs from "dayjs";

const env = "development";
const config = configAll[env];

function norm(v) {
  if (!v) return null;
  // use the same logic; here with dayjs for brevity
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Models
export const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "manager", "sales", "agent", "viewer"),
      allowNull: false,
      defaultValue: "viewer",
    },
  },
  { tableName: "Users" }
);

export const Company = sequelize.define(
  "Company",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    domain: DataTypes.STRING,
    phone: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
  },
  { tableName: "Companies" }
);

export const Contact = sequelize.define(
  "Contact",
  {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
  },
  { tableName: "Contacts" }
);

export const Deal = sequelize.define(
  "Deal",
  {
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    stage: {
      type: DataTypes.ENUM("new", "qualified", "proposal", "won", "lost"),
      allowNull: false,
      defaultValue: "new",
    },
  },
  { tableName: "Deals" }
);

export const Activity = sequelize.define(
  "Activity",
  {
    type: {
      type: DataTypes.ENUM("call", "email", "meeting", "task"),
      allowNull: false,
      defaultValue: "task",
    },
    subject: { type: DataTypes.STRING, allowNull: false },
    dueDate: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM("todo", "done"),
      allowNull: false,
      defaultValue: "todo",
    },
  },
  { tableName: "Activities" }
);

export const PurchaseOrder = sequelize.define(
  "PurchaseOrder",
  {
    number: { type: DataTypes.STRING, allowNull: false },
    vendor: { type: DataTypes.STRING, allowNull: false },
    orderDate: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM("draft", "approved", "received", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    
    documentDate: DataTypes.DATEONLY,
    supplierCode: DataTypes.STRING,
    currency: DataTypes.STRING,
    paymentTerms: DataTypes.STRING,
    plantLocation: DataTypes.STRING,
  },
  { tableName: "PurchaseOrders" }
);

export const PurchaseOrderItem = sequelize.define(
  "PurchaseOrderItem",
  {
    product: { type: DataTypes.STRING, allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    itemNo: DataTypes.INTEGER,
    materialCode: DataTypes.STRING,
    description: DataTypes.STRING,

    qtyRequisitioned: DataTypes.INTEGER,
    qtyOrdered: DataTypes.INTEGER,
    qtyReceived: { type: DataTypes.INTEGER, defaultValue: 0 },
    qtyInvoiced: { type: DataTypes.INTEGER, defaultValue: 0 },

    uom: DataTypes.STRING,
    deliveryDate: DataTypes.DATEONLY,
    netPrice: DataTypes.DECIMAL(12, 2),

    storageLocation: DataTypes.STRING,
    prReference: DataTypes.STRING,
    poReference: DataTypes.STRING,
  },
  { tableName: "PurchaseOrderItems" }
);

export const Invoice = sequelize.define(
  "Invoice",
  {
    number: { type: DataTypes.STRING, allowNull: false },
    customer: { type: DataTypes.STRING, allowNull: false },
    invoiceDate: { type: DataTypes.DATEONLY },
    dueDate: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM("draft", "sent", "paid", "void"),
      defaultValue: "draft",
    },
    subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    tax: { type: DataTypes.FLOAT, defaultValue: 0 },
    total: { type: DataTypes.FLOAT, defaultValue: 0 },
  },
  { tableName: "Invoices" }
);

export const InvoiceItem = sequelize.define(
  "InvoiceItem",
  {
    description: { type: DataTypes.STRING, allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  },
  { tableName: "InvoiceItems" }
);

export const GRN = sequelize.define(
  "GRN",
  {
    number: { type: DataTypes.STRING, allowNull: false },
    receivedDate: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM("draft", "approved", "cancelled"),
      defaultValue: "draft",
    },
  },
  { tableName: "GRNs" }
);

export const GRNItem = sequelize.define(
  "GRNItem",
  {
  GRNId: DataTypes.INTEGER,
  PurchaseOrderItemId: DataTypes.INTEGER,

  product: DataTypes.STRING,        // if you had this already
  qtyOrdered: DataTypes.INTEGER,    // optional snapshot
  qtyReceived: DataTypes.INTEGER,   // “received now” or total on that GRN row
  acceptedQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectedQty: { type: DataTypes.INTEGER, defaultValue: 0 },

  // optional mirrors for traceability
  uom: DataTypes.STRING,
  materialCode: DataTypes.STRING,
  description: DataTypes.STRING,
  storageLocation: DataTypes.STRING,
  },
  { tableName: "GRNItems" }
);

// Associations
Company.hasMany(Contact);
Contact.belongsTo(Company);
Company.hasMany(Deal);
Deal.belongsTo(Company);
Contact.hasMany(Deal);
Deal.belongsTo(Contact);

Company.hasMany(Activity);
Activity.belongsTo(Company);
Contact.hasMany(Activity);
Activity.belongsTo(Contact);
Deal.hasMany(Activity);
Activity.belongsTo(Deal);
Company.hasMany(PurchaseOrder);
PurchaseOrder.belongsTo(Company);
PurchaseOrder.hasMany(PurchaseOrderItem, {
  as: "items",
  foreignKey: "PurchaseOrderId",
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: "PurchaseOrderId",
});
PurchaseOrder.beforeCreate(async (po, opts) => {
  // generate PO number like PO-2025-00001
  const last = await PurchaseOrder.findOne({ order: [["id", "DESC"]] });
  const nextId = last ? last.id + 1 : 1;
  const year = new Date().getFullYear();
  po.number = po.number || `PO-${year}-${String(nextId).padStart(5, "0")}`;
});
PurchaseOrder.beforeValidate((po) => {
  po.orderDate = norm(po.orderDate);
});
Invoice.hasMany(InvoiceItem, { as: "items", foreignKey: "InvoiceId" });
InvoiceItem.belongsTo(Invoice, { foreignKey: "InvoiceId" });

Invoice.beforeCreate(async (inv) => {
  const last = await Invoice.findOne({ order: [["id", "DESC"]] });
  const nextId = last ? last.id + 1 : 1;
  const y = new Date().getFullYear();
  if (!inv.number) inv.number = `INV-${y}-${String(nextId).padStart(5, "0")}`;
});

GRN.belongsTo(PurchaseOrder, { foreignKey: "PurchaseOrderId" });
PurchaseOrder.hasMany(GRN, { as: "grns", foreignKey: "PurchaseOrderId" });

GRN.hasMany(GRNItem, { as: "items", foreignKey: "GRNId" });
GRNItem.belongsTo(GRN, { foreignKey: "GRNId" });

GRNItem.belongsTo(PurchaseOrderItem, { foreignKey: "PurchaseOrderItemId" });

GRN.beforeCreate(async (grn) => {
  const last = await GRN.findOne({ order: [["id", "DESC"]] });
  const nextId = last ? last.id + 1 : 1;
  const y = new Date().getFullYear();
  if (!grn.number) grn.number = `GRN-${y}-${String(nextId).padStart(5, "0")}`;
});

export async function syncDb() {
  await sequelize.sync();
}
