import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Clock, 
  Users, 
  Shirt, 
  BarChart3, 
  FileCode2, 
  X,
  Smartphone,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  isMobileOpen, 
  setIsMobileOpen,
  role 
}) {
  const isAdmin = role === 'admin';

  const adminNavItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings & Orders', icon: CalendarCheck },
    { id: 'slots', label: 'Slot Schedules', icon: Clock },
    { id: 'students', label: 'Hostel Students', icon: Users },
    { id: 'services', label: 'Services & Rates', icon: Shirt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'dbms', label: 'DBMS SQL & Views', icon: FileCode2 },
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'My Orders & Receipts', icon: CalendarCheck },
    { id: 'slots', label: 'Available Slots', icon: Clock },
    { id: 'services', label: 'Services & Rates', icon: Shirt },
    { id: 'dbms', label: 'DBMS Specifications', icon: FileCode2 },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const handleSelectTab = (id) => {
    setCurrentTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar & Mobile Slide-over Drawer */}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header hide-desktop">
          <span className="sidebar-header-title">Navigation</span>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-role-indicator">
          {isAdmin ? (
            <div className="role-pill-admin">
              <ShieldCheck size={14} />
              <span>STAFF ADMIN CONSOLE</span>
            </div>
          ) : (
            <div className="role-pill-student">
              <GraduationCap size={14} />
              <span>STUDENT PORTAL</span>
            </div>
          )}
        </div>

        <div className="sidebar-section-title">MAIN MENU</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectTab(item.id)}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Mobile App Ready Callout Card */}
        <div className="sidebar-footer-card">
          <div className="callout-icon">
            <Smartphone size={16} />
          </div>
          <div className="callout-text">
            <strong>Mobile-Ready API</strong>
            <span>Ready for React Native / Android client connection</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (App Experience) */}
      <nav className="mobile-bottom-bar">
        <button 
          className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>
        <button 
          className={`bottom-nav-item ${currentTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('bookings')}
        >
          <CalendarCheck size={20} />
          <span>Orders</span>
        </button>
        <button 
          className={`bottom-nav-item ${currentTab === 'slots' ? 'active' : ''}`}
          onClick={() => setCurrentTab('slots')}
        >
          <Clock size={20} />
          <span>Slots</span>
        </button>
        {isAdmin ? (
          <button 
            className={`bottom-nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentTab('reports')}
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </button>
        ) : (
          <button 
            className={`bottom-nav-item ${currentTab === 'services' ? 'active' : ''}`}
            onClick={() => setCurrentTab('services')}
          >
            <Shirt size={20} />
            <span>Pricing</span>
          </button>
        )}
      </nav>
    </>
  );
}
