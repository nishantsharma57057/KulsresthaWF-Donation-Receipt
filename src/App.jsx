import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { FirestoreService } from './services/firestoreService';
import { testFirestoreConnection } from './lib/firebase';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardView } from './components/DashboardView.jsx';
import { DonationsListView } from './components/DonationsListView.jsx';
import { ReportsView } from './components/ReportsView.jsx';
import { SettingsSyncView } from './components/SettingsSyncView.jsx';
import { UserAccessView } from './components/UserAccessView.jsx';
import { LoginView } from './components/LoginView.jsx';
import { NewDonationModal } from './components/NewDonationModal.jsx';
import { ReceiptViewModal } from './components/ReceiptViewModal.jsx';
import { WhatsAppModal } from './components/WhatsAppModal.jsx';
import { EmailModal } from './components/EmailModal.jsx';
import { Calendar, ChevronRight, Cloud } from 'lucide-react';

export default function App() {
  const [donations, setDonations] = useState(() => StorageService.getDonations());
  const [settings, setSettings] = useState(() => StorageService.getNgoSettings());
  const [currentUser, setCurrentUser] = useState(() => StorageService.getCurrentUser());
  const [isCloudConnected, setIsCloudConnected] = useState(true);

  // Navigation tab matching Image 2 & 3: 'dashboard' | 'donations' | 'reports' | 'settings' | 'users'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isNewDonationOpen, setIsNewDonationOpen] = useState(false);
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState(null);
  const [selectedDonationForWhatsApp, setSelectedDonationForWhatsApp] = useState(null);
  const [selectedDonationForEmail, setSelectedDonationForEmail] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Real-time Firestore subscription on boot
  useEffect(() => {
    testFirestoreConnection()
      .then((ok) => setIsCloudConnected(ok))
      .catch(() => setIsCloudConnected(false));

    const unsubscribe = FirestoreService.subscribeDonations((cloudDonations) => {
      if (cloudDonations && cloudDonations.length > 0) {
        setDonations(cloudDonations);
        localStorage.setItem('kwf_donations_records_v1', JSON.stringify(cloudDonations));
      } else {
        // Initial seeding if cloud DB is completely fresh
        const localRecords = StorageService.getDonations();
        localRecords.forEach((item) => {
          FirestoreService.saveDonation(item).catch(console.warn);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshDonations = () => {
    setDonations(StorageService.getDonations());
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await StorageService.syncAllPendingToGoogleSheet();
      refreshDonations();
      showToast(`Google Sheets Sync: ${res.syncedCount} rows synced.`);
    } catch (err) {
      showToast(`Sync Failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingle = async (donationId) => {
    try {
      const res = await StorageService.syncToGoogleSheet(donationId);
      refreshDonations();
      showToast(res.message);
    } catch (err) {
      showToast(`Sync error: ${err.message}`);
    }
  };

  const handleDonationRecorded = (newDonation) => {
    refreshDonations();
    showToast(`Receipt ${newDonation.receiptNo} created successfully!`);
  };

  // If not logged in, render exact Image 1 split-screen Login/Register view
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}`);
        }}
      />
    );
  }

  // Breadcrumb label for the active tab (Image 2 & 3)
  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'donations':
        return 'Donations';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      case 'users':
        return 'Users';
      default:
        return 'Dashboard';
    }
  };

  // Formatted date (Image 2: "03 Oct 2026")
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NS';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Persistent Dark Navy Left Sidebar (Image 2 & 3) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewDonation={() => setIsNewDonationOpen(true)}
        onLogout={() => {
          StorageService.setCurrentUser(null);
          setCurrentUser(null);
          showToast('Signed out successfully.');
        }}
        currentUser={currentUser}
        donationsCount={donations.length}
      />

      {/* Main View Area with Top Breadcrumb Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Breadcrumb & User Bar (Image 2 & 3) */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          {/* Left: Breadcrumbs (Image 2 & 3) */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">{getBreadcrumbLabel()}</span>
          </div>

          {/* Right: Date & User Avatar (Image 2 & 3) */}
          <div className="flex items-center gap-4">
            {/* Cloud Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Cloud className="w-3 h-3 text-emerald-500" />
              <span>Cloud DB Active</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>

            <div
              className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs font-mono border border-sky-200 shadow-2xs"
              title={`${currentUser.name} (${currentUser.username || 'admin'})`}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* View Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              donations={donations}
              settings={settings}
              onOpenNewDonation={() => setIsNewDonationOpen(true)}
              onSelectDonation={(d) => setSelectedDonationForReceipt(d)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'donations' && (
            <DonationsListView
              donations={donations}
              settings={settings}
              onOpenNewDonation={() => setIsNewDonationOpen(true)}
              onSelectDonation={(d) => setSelectedDonationForReceipt(d)}
              onOpenWhatsApp={(d) => setSelectedDonationForWhatsApp(d)}
              onOpenEmail={(d) => setSelectedDonationForEmail(d)}
              onDonationUpdated={refreshDonations}
              onSyncSingle={handleSyncSingle}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              donations={donations}
              settings={settings}
              onSelectDonation={(d) => setSelectedDonationForReceipt(d)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSyncView
              donations={donations}
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={(updated) => {
                setSettings(updated);
                showToast('Settings saved successfully.');
              }}
              onSyncAll={handleSyncAll}
              isSyncing={isSyncing}
              onSyncSingle={handleSyncSingle}
              onSelectDonation={(d) => setSelectedDonationForReceipt(d)}
            />
          )}

          {activeTab === 'users' && (
            <UserAccessView currentUser={currentUser} />
          )}
        </main>

      </div>

      {/* Modals */}
      {/* 1. Exact Image 4 Receipt Modal */}
      <ReceiptViewModal
        donation={selectedDonationForReceipt}
        onClose={() => setSelectedDonationForReceipt(null)}
        settings={settings}
        onOpenWhatsApp={(d) => {
          setSelectedDonationForReceipt(null);
          setSelectedDonationForWhatsApp(d);
        }}
        onOpenEmail={(d) => {
          setSelectedDonationForReceipt(null);
          setSelectedDonationForEmail(d);
        }}
      />

      {/* 2. New Donation Modal */}
      <NewDonationModal
        isOpen={isNewDonationOpen}
        onClose={() => setIsNewDonationOpen(false)}
        onSuccess={handleDonationRecorded}
        settings={settings}
      />

      {/* 3. WhatsApp Direct Transmission Modal */}
      <WhatsAppModal
        donation={selectedDonationForWhatsApp}
        settings={settings}
        onClose={() => setSelectedDonationForWhatsApp(null)}
        onSent={() => {
          refreshDonations();
          showToast('WhatsApp transmission logged.');
        }}
      />

      {/* 4. Email Transmission Modal */}
      <EmailModal
        donation={selectedDonationForEmail}
        settings={settings}
        onClose={() => setSelectedDonationForEmail(null)}
        onSent={() => {
          refreshDonations();
          showToast('Email transmission logged.');
        }}
      />
    </div>
  );
}
