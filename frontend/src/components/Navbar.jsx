import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Database, 
  UserCheck, 
  ShieldCheck, 
  PlusCircle, 
  RotateCcw,
  Menu
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ 
  role, 
  setRole, 
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

        {/* Role Switcher */}
        <div className="role-switcher">
          <button 
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
            title="Full Management & Staff Controls"
          >
            <ShieldCheck size={14} />
            <span>Staff Admin</span>
          </button>
          <button 
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
            title="Student Slot Booking & Pickup View"
          >
            <UserCheck size={14} />
            <span>Student</span>
          </button>
        </div>

        {/* Quick Actions */}
        <button 
          className="btn btn-secondary btn-sm reseed-btn" 
          onClick={handleReseed}
          disabled={isReseeding}
          title="One-click DB Reset & Seed Data for Presentation Demo"
        >
          <RotateCcw size={14} className={isReseeding ? 'spin-anim' : ''} />
          <span className="hide-mobile">Reseed DB</span>
        </button>

        <button 
          className="btn btn-primary btn-sm" 
          onClick={onOpenNewBooking}
        >
          <PlusCircle size={15} />
          <span>New Booking</span>
        </button>
      </div>
    </header>
  );
}
