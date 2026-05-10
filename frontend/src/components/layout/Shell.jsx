import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../app/auth.jsx";
import { useCompany } from "../../app/company.jsx";

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: "D" },
  { label: "Reservas", path: "/reservations", icon: "R" },
  { label: "Hospedes", path: "/guests", icon: "H" },
  { label: "Pessoas", path: "/people", icon: "P" },
  { label: "Produtos", path: "/products", icon: "Pr" },
  { label: "PDV", path: "/pos", icon: "PDV" },
  { label: "Pedidos", path: "/orders", icon: "Pe" },
  { label: "Financeiro", path: "/finance", icon: "F" },
  { label: "Configuracoes", path: "/settings", icon: "C" }
];

function getInitials(name) {
  return String(name || "Click7 Systems")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Shell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const isPosRoute = location.pathname.startsWith("/pos");
  const isRoomsRoute = location.pathname.startsWith("/rooms");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.localStorage.getItem("hotel-erp-sidebar-collapsed") === "true");
  const [showBrandFallback, setShowBrandFallback] = useState(false);
  const [isRoomsMenuOpen, setIsRoomsMenuOpen] = useState(false);

  const roomSubmenu = [
    { label: "Todos os quartos", path: "/rooms" },
    { label: "Quartos ocupados", path: "/rooms/occupied" },
    { label: "Quartos livres", path: "/rooms/available" },
    { label: "Quartos em limpeza", path: "/rooms/cleaning" },
    { label: "Quartos em manutencao", path: "/rooms/maintenance" },
    { label: "Cadastro de quartos", path: "/rooms/new" },
    { label: "Tipos de acomodacao", path: "/rooms/accommodation-types" },
    { label: "Tipos de quarto", path: "/rooms/room-types" }
  ];

  useEffect(() => {
    if (isPosRoute) {
      setIsSidebarCollapsed(true);
    }
  }, [isPosRoute]);

  useEffect(() => {
    window.localStorage.setItem("hotel-erp-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setShowBrandFallback(false);
  }, [company.logo_url]);

  useEffect(() => {
    if (isRoomsRoute) {
      setIsRoomsMenuOpen(true);
    }
  }, [isRoomsRoute]);

  const companyName = company?.trade_name || "Click7 Systems";
  const subtitle = company?.subtitle || "Hotel ERP - Operacao e fiscal";
  const brandInitials = useMemo(() => getInitials(companyName), [companyName]);
  const userInitials = useMemo(() => getInitials(user?.nome || user?.email || "ERP"), [user]);

  return (
    <div className={`shell ${isSidebarCollapsed ? "shell-sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : "expanded"}`}>
        <div className="brand">
          <div className="brand-logo-shell" title={companyName}>
            {company?.logo_url && !showBrandFallback ? (
              <img
                src={company.logo_url}
                alt={companyName}
                className="brand-logo"
                onError={() => setShowBrandFallback(true)}
              />
            ) : (
              <span className="brand-mark">{brandInitials}</span>
            )}
          </div>
          <div className="brand-text">
            <strong>{companyName}</strong>
            <p className="sidebar-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="sidebar-user-card" title={user?.nome || user?.email || "Usuario logado"}>
          <span className="user-avatar">{userInitials}</span>
          <div className="brand-text">
            <strong>{user?.nome || "Usuario"}</strong>
            <p className="sidebar-subtitle">{user?.role || "admin"}</p>
          </div>
        </div>

        <nav className="menu">
          <div className={`menu-group ${isRoomsMenuOpen ? "open" : ""} ${isRoomsRoute ? "active" : ""}`}>
            <button
              type="button"
              className={`menu-link menu-group-trigger ${isRoomsRoute ? "active" : ""}`}
              onClick={() => setIsRoomsMenuOpen((current) => !current)}
              title={isSidebarCollapsed ? "Quartos" : ""}
            >
              <span className="menu-icon" aria-hidden="true">Q</span>
              <span className="menu-label">Quartos</span>
              {!isSidebarCollapsed ? <span className="menu-caret">{isRoomsMenuOpen ? "-" : "+"}</span> : null}
            </button>

            {!isSidebarCollapsed ? (
              <div className={`submenu ${isRoomsMenuOpen ? "open" : ""}`}>
                {roomSubmenu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => (isActive ? "submenu-link active" : "submenu-link")}
                  >
                    <span className="submenu-bullet" aria-hidden="true">&gt;</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}

            {isSidebarCollapsed && isRoomsMenuOpen ? (
              <div className="submenu-flyout">
                {roomSubmenu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => (isActive ? "submenu-link active" : "submenu-link")}
                    title={item.label}
                  >
                    <span className="submenu-bullet" aria-hidden="true">&gt;</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "menu-link active" : "menu-link")}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <span className="menu-icon" aria-hidden="true">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-main">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {isSidebarCollapsed ? ">>" : "<<"}
            </button>
            <div>
              <span className="eyebrow">{companyName}</span>
              <h1>Operacao em tempo real</h1>
            </div>
          </div>
          <div className="topbar-card">
            <div className="topbar-user">
              <span className="user-avatar">{userInitials}</span>
              <div>
                <span>Usuario logado</span>
                <strong>{user?.nome || user?.email || "Administrador"}</strong>
              </div>
            </div>
            <button type="button" className="ghost-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
