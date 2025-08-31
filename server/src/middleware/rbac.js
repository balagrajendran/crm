const policy = {
  admin: {
    dashboard: ["read", "manage"],
    companies: ["read", "manage"],
    contacts: ["read", "manage"],
    deals: ["read", "manage"],
    activities: ["read", "manage"],
    purchaseOrders: ["read", "manage"],
    invoices: ["read", "create", "update", "delete"],
    grns: ["read", "create", "update", "delete"],
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

function can(role, action, resource) {
  const allowed = (policy[role] && policy[role][resource]) || [];
  return allowed.includes(action) || allowed.includes("manage");
}

export function authorize(resource, action = "read") {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !can(role, action, resource)) {
      return res.status(403).json({ error: "Forbidden", resource, action });
    }
    next();
  };
}
