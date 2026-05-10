export const rolePermissions = {
  admin: ["*"],
  gerente: [
    "dashboard.read",
    "rooms.read",
    "rooms.manage",
    "reservations.read",
    "reservations.manage",
    "guests.read",
    "guests.manage",
    "stay.read",
    "stay.manage",
    "products.read",
    "products.manage",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "finance.manage",
    "fiscal.emit",
    "fiscal.cancel",
    "settings.read",
    "settings.manage",
    "logs.read"
  ],
  recepcao: [
    "dashboard.read",
    "rooms.read",
    "reservations.manage",
    "guests.manage",
    "stay.manage",
    "pos.read",
    "orders.read",
    "finance.read"
  ],
  supervisor: [
    "dashboard.read",
    "products.read",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "finance.manage",
    "fiscal.emit",
    "fiscal.cancel",
    "logs.read"
  ],
  fiscal: [
    "dashboard.read",
    "finance.read",
    "fiscal.emit",
    "fiscal.cancel",
    "settings.read",
    "logs.read"
  ],
  caixa: [
    "dashboard.read",
    "products.read",
    "pos.read",
    "pos.manage",
    "orders.read",
    "orders.manage",
    "finance.read",
    "fiscal.emit"
  ]
};

export function buildPermissions(role) {
  return rolePermissions[role] || [];
}
