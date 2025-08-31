export type Role = "admin" | "manager" | "sales" | "agent" | "viewer";

type Action = "read" | "create" | "update" | "delete" | "manage";
type Resource =
  | "dashboard"
  | "companies"
  | "contacts"
  | "deals"
  | "activities"
  | "purchaseOrders"
  | "invoices"
  | "grns";

/** Human-readable matrix. 'manage' = full CRUD on that resource. */
const policy: Record<Role, Partial<Record<Resource, Action[]>>> = {
  admin: {
    dashboard: ["read", "manage"],
    companies: ["read", "manage"],
    contacts: ["read", "manage"],
    deals: ["read", "manage"],
    activities: ["read", "manage"],
    purchaseOrders: ['read','create','update','delete'],
    invoices: ['read','create','update','delete'],
    grns: ['read','create','update','delete'],
  },
  manager: {
    dashboard: ["read"],
    companies: ["read", "create", "update"],
    contacts: ["read", "create", "update"],
    deals: ["read", "create", "update"],
    activities: ["read", "create", "update"],
    purchaseOrders: ["read", "create", "update"],
    invoices: ["read", "create", "update"],
    grns: ["read", "create", "update"],
  },
  sales: {
    dashboard: ["read"],
    companies: ["read"],
    contacts: ["read", "create", "update"],
    deals: ["read", "create", "update"],
    activities: ["read", "create", "update"],
    purchaseOrders: ["read"],
    invoices: ["read"],
    grns: ["read"],
  },
  agent: {
    dashboard: ["read"],
    companies: ["read"],
    contacts: ["read"],
    deals: ["read", "create", "update"],
    activities: ["read", "create", "update"],
    purchaseOrders: ["read"],
    invoices: ["read"],
    grns: ["read"],
  },
  viewer: {
    dashboard: ["read"],
    companies: ["read"],
    contacts: ["read"],
    deals: ["read"],
    activities: ["read"],
    purchaseOrders: ["read"],
    invoices: ["read"],
    grns: ["read"],
  },
};

export function can(
  role: Role | undefined,
  action: Action,
  resource: Resource
) {
  if (!role) return false;
  const allowed = policy[role]?.[resource] || [];
  return allowed.includes(action) || allowed.includes("manage");
}
