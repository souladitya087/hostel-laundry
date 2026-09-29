import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Database, 
  UserCheck, 
  ShieldCheck, 
  PlusCircle, 
  RotateCcw,
  Menu,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ 
  currentUser,
  onSignOut,
  onOpenNewBooking, 
  onToggleMobileMenu,
  onRefreshData
}) {
  const [dbStatus, setDbStatus] = useState(null);
  const [isReseeding, setIsReseeding] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await api.getDbStatus();
      setDbStatus(data);
    } catch (err) {
      console.error('Error fetching DB status:', err);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset and reseed database with fresh sample data for demonstration?')) return;
    setIsReseeding(true);
    try {
      await api.reseedDatabase();
      await fetchStatus();
      onRefreshData();
      alert('Database reseeded successfully with fresh data!');
    } catch (err) {
      alert(`Reseed failed: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div className="brand-logo">
          <div className="logo-icon">
            <Sparkles size={20} className="sparkle-anim" />
          </div>
          <div className="brand-text">
            <span className="brand-title">CampusLaundry</span>
            <span className="brand-subtitle">Slot & Billing System</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Live Database Engine Badge */}
        {dbStatus && (
          <div className="db-badge" title={`Active Database: ${dbStatus.engine} (${dbStatus.database || ''})`}>
            <Database size={14} className="db-icon" />
            <span className="db-text">{dbStatus.engine}</span>
            <span className="db-dot"></span>
          </div>
        )}

        {/* Current User Session Profile Badge */}
        {currentUser && (
          <div className={`user-session-badge ${isAdmin ? 'badge-admin' : 'badge-student'}`}>
            {isAdmin ? (
              <>
                <ShieldCheck size={16} className="user-badge-icon" />
                <div className="user-badge-text">
                  <span className="user-badge-title">Staff Admin</span>
                  <span className="user-badge-sub">Hostel Desk</span>
                </div>
              </>
            ) : (
              <>
                <GraduationCap size={16} className="user-badge-icon" />
                <div className="user-badge-text">
                  <span className="user-badge-title">{currentUser.name}</span>
                  <span className="user-badge-sub">{currentUser.register_no} • {currentUser.room_no}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin-only Database Reseed Action */}
        {isAdmin && (
          <button 
            className="btn btn-secondary btn-sm reseed-btn" 
            onClick={handleReseed}
            disabled={isReseeding}
            title="One-click DB Reset & Seed Data for Presentation Demo"
          >
            <RotateCcw size={14} className={isReseeding ? 'spin-anim' : ''} />
            <span className="hide-mobile">Reseed DB</span>
          </button>
        )}

        {/* Quick Booking Button */}
        <button 
          className="btn btn-primary btn-sm" 
          onClick={onOpenNewBooking}
          title={isAdmin ? "Create laundry booking for any student" : "Book laundry slot for yourself"}
        >
          <PlusCircle size={15} />
          <span>New Booking</span>
        </button>

        {/* Sign Out / Switch User Action */}
        <button 
          className="btn btn-ghost btn-sm signout-btn"
          onClick={onSignOut}
          title="Sign out or switch between Student & Admin portal"
        >
          <LogOut size={15} />
          <span className="hide-mobile">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
