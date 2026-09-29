import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NewBookingModal from './components/NewBookingModal';
import ReceiptModal from './components/ReceiptModal';

import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import BookingsView from './views/BookingsView';
import SlotsView from './views/SlotsView';
import StudentsView from './views/StudentsView';
import ServicesView from './views/ServicesView';
import ReportsView from './views/ReportsView';
import DbmsSpecView from './views/DbmsSpecView';

import { api } from './services/api';
import './App.css';

const AUTH_STORAGE_KEY = 'campus_laundry_auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // If role is student and current tab is admin-only, reset to dashboard
  useEffect(() => {
    if (currentUser?.role === 'student' && ['students', 'reports'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCurrentTab('dashboard');
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  const handleOpenReceipt = async (bookingId) => {
    try {
      const data = await api.getBooking(bookingId);
      setReceiptBooking(data);
    } catch (err) {
      alert(`Could not load receipt: ${err.message}`);
    }
  };

  const handleBookingCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const role = currentUser.role; // 'admin' or 'student'

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar 
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenNewBooking={() => setIsNewBookingOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onRefreshData={handleRefreshData}
      />

      <div className="app-body">
        {/* Sidebar & Mobile Drawer */}
        <Sidebar 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          role={role}
        />

        {/* Main Content Area */}
        <main className="main-content">
          {currentTab === 'dashboard' && (
            <DashboardView 
              key={`dash-${refreshKey}-${currentUser.student_id || currentUser.username}`}
              currentUser={currentUser}
              onOpenNewBooking={() => setIsNewBookingOpen(true)}
              onViewReceipt={handleOpenReceipt}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'bookings' && (
            <BookingsView 
              key={`book-${refreshKey}-${currentUser.student_id || currentUser.username}`}
              currentUser={currentUser}
              onOpenNewBooking={() => setIsNewBookingOpen(true)}
              onViewReceipt={handleOpenReceipt}
            />
          )}

          {currentTab === 'slots' && (
            <SlotsView 
              key={`slot-${refreshKey}`}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'students' && role === 'admin' && (
            <StudentsView 
              key={`stud-${refreshKey}`}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView 
              key={`serv-${refreshKey}`}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'reports' && role === 'admin' && (
            <ReportsView 
              key={`rep-${refreshKey}`}
            />
          )}

          {currentTab === 'dbms' && (
            <DbmsSpecView />
          )}
        </main>
      </div>

      {/* Booking Wizard Modal */}
      <NewBookingModal 
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onBookingCreated={handleBookingCreated}
        currentUser={currentUser}
      />

      {/* Official Receipt Printable Modal */}
      {receiptBooking && (
        <ReceiptModal 
          booking={receiptBooking}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
