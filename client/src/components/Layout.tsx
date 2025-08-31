import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Container, Button, Offcanvas, Nav } from "react-bootstrap";
import { can, Role } from "../utils/rbac";

/** simple media query hook */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const mql = matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export default function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  const isMdUp = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (
      !token &&
      !loc.pathname.startsWith("/login") &&
      !loc.pathname.startsWith("/register")
    ) {
      nav("/login");
    }
  }, [token, loc.pathname, nav]);

  // mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  // desktop collapse state (mini sidebar)
  const [collapsed, setCollapsed] = useState(false);

  // close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  const user = useMemo(
    () =>
      JSON.parse(localStorage.getItem("user") || "null") as {
        name?: string;
        email?: string;
      } | null,
    [loc.pathname]
  );

  const userRole = (user?.role || "viewer") as Role;

  const links = [
    { to: "/", label: "Dashboard", icon: "🏠" },
    { to: "/companies", label: "Companies", icon: "🏢" },
    // { to: '/contacts',  label: 'Contacts',  icon: '👤' },
    // { to: '/deals',     label: 'Deals',     icon: '💼' },
    // { to: '/deals-board', label: 'Deals Board', icon: '🗂️' },
    // { to: '/activities', label: 'Activities',   icon: '✅' },
    { to: "/purchase-orders", label: "Purchase Orders", icon: "🧾" },
    { to: "/invoices", label: "Invoices", icon: "🧾" },
    { to: "/grns", label: "GRNs", icon: "🧾" },
  ];

  const filtered = links.filter((l) => {
    const res = l.to === "/" ? "dashboard" : (l.to.slice(1) as any);
    return can(userRole, "read", res);
  });

  return (
    <>
      {/* Top bar */}
      <Navbar bg="dark" data-bs-theme="dark" className="px-2 sticky-top">
        <Container fluid className="justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {!isMdUp && (
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </Button>
            )}
            <Navbar.Brand className="ms-1">CRM</Navbar.Brand>
          </div>
          <div className="text-white-50 small">{user?.email}</div>
        </Container>
      </Navbar>

      {/* Desktop sidebar */}
      {isMdUp && (
        <aside className={`crm-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="crm-sidebar__head">
            <span className="brand">Menu</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Collapse sidebar"
            >
              {collapsed ? "›" : "‹"}
            </Button>
          </div>
          <Nav className="flex-column crm-sidebar__nav">
            {links.map((l) => (
              <Nav.Link
                key={l.to}
                as={NavLink}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `crm-link ${isActive ? "active" : ""}`
                }
              >
                <span className="icon">{l.icon}</span>
                <span className="label">{l.label}</span>
              </Nav.Link>
            ))}
          </Nav>
        </aside>
      )}

      {/* Mobile drawer (Offcanvas) */}
      {!isMdUp && (
        <Offcanvas
          show={mobileOpen}
          onHide={() => setMobileOpen(false)}
          placement="start"
          backdrop
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title>Navigation</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <Nav className="flex-column p-2">
              {links.map((l) => (
                <Nav.Link
                  key={l.to}
                  as={NavLink}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `crm-link mobile ${isActive ? "active" : ""}`
                  }
                >
                  <span className="icon">{l.icon}</span>
                  <span className="label">{l.label}</span>
                </Nav.Link>
              ))}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>
      )}

      {/* Main content area */}
      <main
        className={`crm-main ${
          isMdUp ? (collapsed ? "is-collapsed" : "is-open") : ""
        }`}
      >
        <div className="container-fluid py-4">
          <Outlet />
          <div className="text-center text-muted mt-5" style={{ fontSize: 12 }}>
            RTK Query + React-Bootstrap Drawer + RHF + Zod + DnD
          </div>
        </div>
      </main>
    </>
  );
}
