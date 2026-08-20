import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AuthScreen } from './components/AuthScreen';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ContactosList } from './components/ContactosList';
import { LeadersManagement } from './components/LeadersManagement';
import { PollingStationsView } from './components/PollingStationsView';
import { AddContactoModal } from './components/AddContactoModal';
import { Contacto } from './types';

import { ExcelCenter } from './components/ExcelCenter';
import { WhatsAppCenter } from './components/WhatsAppCenter';
import { DesignThemeView } from './components/DesignThemeView';

const INACTIVITY_TIMEOUT = 7 * 60 * 1000; // 7 minutes in milliseconds

const MainContent: React.FC = () => {
  const { currentUser, isLoading, logout } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contactoToEdit, setContactoToEdit] = useState<Contacto | null>(null);

  // Inactivity Auto-Logout
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Inactivity timeout reached. Logging out...');
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    // Initialize timer
    resetTimer();

    // Listen to user interactions
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    events.forEach(event => document.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [currentUser, logout]);

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-sans">Cargando...</div>;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  const handleOpenAddModal = () => {
    setContactoToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditContacto = (contacto: Contacto) => {
    setContactoToEdit(contacto);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setContactoToEdit(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Navigation TopBar & BottomBar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddContactoModal={handleOpenAddModal}
      />

      {/* Main Tab Content */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-28 md:pb-16 max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenAddContactoModal={handleOpenAddModal}
          />
        )}
        {activeTab === 'contactos' && (
          <ContactosList
            onOpenAddModal={handleOpenAddModal}
            onEditContacto={handleEditContacto}
          />
        )}
        {activeTab === 'leaders' && <LeadersManagement />}
        {activeTab === 'polling-stations' && <PollingStationsView />}
        {activeTab === 'whatsapp' && <WhatsAppCenter />}
        {activeTab === 'excel' && <ExcelCenter />}
        {activeTab === 'design' && <DesignThemeView />}
      </main>

      {/* Add / Edit Contacto Modal */}
      <AddContactoModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        contactoToEdit={contactoToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <MainContent />
      </ConfirmProvider>
    </AppProvider>
  );
}
