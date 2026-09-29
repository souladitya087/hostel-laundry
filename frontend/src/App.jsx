import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NewBookingModal from './components/NewBookingModal';
import ReceiptModal from './components/ReceiptModal';

import DashboardView from './views/DashboardView';
import BookingsView from './views/BookingsView';
import SlotsView from './views/SlotsView';
import StudentsView from './views/StudentsView';
import ServicesView from './views/ServicesView';
import ReportsView from './views/ReportsView';
import DbmsSpecView from './views/DbmsSpecView';

import { api } from './services/api';
import './App.css';

export default function App() {
  const [role, setRole] = useState('admin'); // 'admin' or 'student'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar 
        role={role}
        setRole={setRole}
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
              key={`dash-${refreshKey}`}
              onOpenNewBooking={() => setIsNewBookingOpen(true)}
              onViewReceipt={handleOpenReceipt}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'bookings' && (
            <BookingsView 
              key={`book-${refreshKey}`}
              onOpenNewBooking={() => setIsNewBookingOpen(true)}
              onViewReceipt={handleOpenReceipt}
            />
          )}

          {currentTab === 'slots' && (
            <SlotsView 
              key={`slot-${refreshKey}`}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView 
              key={`stud-${refreshKey}`}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView 
              key={`serv-${refreshKey}`}
            />
          )}

          {currentTab === 'reports' && (
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
