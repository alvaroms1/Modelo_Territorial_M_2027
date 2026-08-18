import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SupportersList } from './components/SupportersList';
import { LeadersManagement } from './components/LeadersManagement';
import { PollingStationsView } from './components/PollingStationsView';
import { WhatsappMessaging } from './components/WhatsappMessaging';
import { ExcelManager } from './components/ExcelManager';
import { AddSupporterModal } from './components/AddSupporterModal';
import { Supporter } from './types';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supporterToEdit, setSupporterToEdit] = useState<Supporter | null>(null);

  if (!currentUser) {
    return <AuthScreen />;
  }

  const handleOpenAddModal = () => {
    setSupporterToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditSupporter = (supporter: Supporter) => {
    setSupporterToEdit(supporter);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSupporterToEdit(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Navigation TopBar & BottomBar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddSupporterModal={handleOpenAddModal}
      />

      {/* Main Tab Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 pb-16 max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenAddSupporterModal={handleOpenAddModal}
          />
        )}
        {activeTab === 'supporters' && (
          <SupportersList
            onOpenAddModal={handleOpenAddModal}
            onEditSupporter={handleEditSupporter}
          />
        )}
        {activeTab === 'leaders' && <LeadersManagement />}
        {activeTab === 'polling-stations' && <PollingStationsView />}
        {activeTab === 'whatsapp' && <WhatsappMessaging />}
        {activeTab === 'excel' && <ExcelManager />}
      </main>

      {/* Add / Edit Supporter Modal */}
      <AddSupporterModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        supporterToEdit={supporterToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
