import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserAccount,
  Supporter,
  PollingStation,
  FilterState,
  MovementStats,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_SUPPORTERS,
  INITIAL_POLLING_STATIONS,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  supporters: Supporter[];
  pollingStations: PollingStation[];
  filters: FilterState;
  login: (cedula: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  registerUser: (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'>) => UserAccount;
  updateUser: (user: UserAccount) => void;
  deleteUser: (userId: string) => void;
  addSupporter: (data: Omit<Supporter, 'id' | 'createdAt'>) => { success: boolean; error?: string; supporter?: Supporter };
  updateSupporter: (supporter: Supporter) => void;
  deleteSupporter: (supporterId: string) => void;
  bulkAddSupporters: (data: Array<Omit<Supporter, 'id' | 'createdAt'>>) => { added: number; duplicates: number; duplicateCedulas: string[] };
  addPollingStation: (station: Omit<PollingStation, 'id'>) => void;
  updatePollingStation: (station: PollingStation) => void;
  deletePollingStation: (stationId: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  toggleWhatsappContacted: (supporterId: string) => void;
  toggleVotedStatus: (supporterId: string) => void;
  checkCedulaExists: (cedula: string) => Supporter | null;
  resetToDemoData: () => void;
  visibleSupporters: Supporter[];
  accessibleSupporters: Supporter[];
  visibleLeaders: UserAccount[];
  visibleSubleaders: UserAccount[];
  stats: MovementStats;
  allSectors: string[];
  allNeighborhoods: string[];
}

const initialFilters: FilterState = {
  searchQuery: '',
  pollingStationId: '',
  sector: '',
  neighborhood: '',
  gender: '',
  ageBracket: '',
  leaderId: '',
  subleaderId: '',
  votingCommitment: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage or mock data
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('sipol_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [supporters, setSupporters] = useState<Supporter[]>(() => {
    const saved = localStorage.getItem('sipol_supporters');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SUPPORTERS;
  });

  const [pollingStations, setPollingStations] = useState<PollingStation[]>(() => {
    const saved = localStorage.getItem('sipol_polling_stations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_POLLING_STATIONS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedId = localStorage.getItem('sipol_current_user_id');
    if (savedId) {
      const found = users.find(u => u.id === savedId);
      if (found) return found;
    }
    // Default to Super Admin for immediate rich view
    return users.find(u => u.role === 'SUPER_ADMIN') || users[0] || null;
  });

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sipol_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sipol_supporters', JSON.stringify(supporters));
  }, [supporters]);

  useEffect(() => {
    localStorage.setItem('sipol_polling_stations', JSON.stringify(pollingStations));
  }, [pollingStations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sipol_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('sipol_current_user_id');
    }
  }, [currentUser]);

  // Auth actions
  const login = (cedula: string, _password?: string): boolean => {
    const clean = cedula.replace(/\D/g, '');
    const user = users.find(u => u.cedula.replace(/\D/g, '') === clean);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      // Reset subleader & leader filters when switching user
      setFilters(prev => ({ ...prev, leaderId: '', subleaderId: '' }));
    }
  };

  const registerUser = (userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'>): UserAccount => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-sky-600',
    ];
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'ACTIVO',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      const fallback = users.find(u => u.id !== userId) || null;
      setCurrentUser(fallback);
    }
  };

  const checkCedulaExists = (cedula: string): Supporter | null => {
    const clean = cedula.replace(/\D/g, '');
    return supporters.find(s => s.cedula.replace(/\D/g, '') === clean) || null;
  };

  const addSupporter = (data: Omit<Supporter, 'id' | 'createdAt'>): { success: boolean; error?: string; supporter?: Supporter } => {
    const cleanCedula = data.cedula.replace(/\D/g, '');
    if (!cleanCedula) {
      return { success: false, error: 'La cédula es obligatoria.' };
    }
    const existing = checkCedulaExists(cleanCedula);
    if (existing) {
      return {
        success: false,
        error: `La cédula ${data.cedula} ya fue registrada por ${existing.registeredByLeaderName} ${existing.registeredBySubleaderName ? `(Sublíder: ${existing.registeredBySubleaderName})` : ''}.`,
      };
    }

    const newSupporter: Supporter = {
      ...data,
      cedula: cleanCedula,
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setSupporters(prev => [newSupporter, ...prev]);
    return { success: true, supporter: newSupporter };
  };

  const updateSupporter = (updated: Supporter) => {
    setSupporters(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSupporter = (supporterId: string) => {
    setSupporters(prev => prev.filter(s => s.id !== supporterId));
  };

  const bulkAddSupporters = (items: Array<Omit<Supporter, 'id' | 'createdAt'>>) => {
    const existingCedulas = new Set(supporters.map(s => s.cedula.replace(/\D/g, '')));
    const duplicateCedulas: string[] = [];
    const newItems: Supporter[] = [];

    items.forEach((item, index) => {
      const cleanCedula = item.cedula.replace(/\D/g, '');
      if (!cleanCedula || existingCedulas.has(cleanCedula)) {
        if (cleanCedula) duplicateCedulas.push(cleanCedula);
      } else {
        existingCedulas.add(cleanCedula);
        newItems.push({
          ...item,
          cedula: cleanCedula,
          id: `sup-bulk-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newItems.length > 0) {
      setSupporters(prev => [...newItems, ...prev]);
    }

    return {
      added: newItems.length,
      duplicates: duplicateCedulas.length,
      duplicateCedulas,
    };
  };

  const addPollingStation = (station: Omit<PollingStation, 'id'>) => {
    const newStation: PollingStation = {
      ...station,
      id: `ps-${Date.now()}`,
    };
    setPollingStations(prev => [...prev, newStation]);
  };

  const updatePollingStation = (station: PollingStation) => {
    setPollingStations(prev => prev.map(ps => ps.id === station.id ? station : ps));
  };

  const deletePollingStation = (stationId: string) => {
    setPollingStations(prev => prev.filter(ps => ps.id !== stationId));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const toggleWhatsappContacted = (supporterId: string) => {
    setSupporters(prev => prev.map(s => {
      if (s.id === supporterId) {
        return { ...s, contactedViaWhatsapp: !s.contactedViaWhatsapp };
      }
      return s;
    }));
  };

  const toggleVotedStatus = (supporterId: string) => {
    setSupporters(prev => prev.map(s => {
      if (s.id === supporterId) {
        return { ...s, votedStatus: !s.votedStatus };
      }
      return s;
    }));
  };

  const resetToDemoData = () => {
    setUsers(INITIAL_USERS);
    setSupporters(INITIAL_SUPPORTERS);
    setPollingStations(INITIAL_POLLING_STATIONS);
    setCurrentUser(INITIAL_USERS[0]);
    setFilters(initialFilters);
    localStorage.removeItem('sipol_users');
    localStorage.removeItem('sipol_supporters');
    localStorage.removeItem('sipol_polling_stations');
    localStorage.removeItem('sipol_current_user_id');
  };

  // Base dataset accessible to current user according to role
  const accessibleSupporters = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'SUPER_ADMIN') {
      return supporters;
    }

    if (currentUser.role === 'LIDER_COORDINADOR') {
      // Find sublíderes that belong to this leader
      const mySubleaderIds = new Set(
        users.filter(u => u.parentLeaderId === currentUser.id).map(u => u.id)
      );
      return supporters.filter(s =>
        s.registeredByLeaderId === currentUser.id ||
        (s.registeredBySubleaderId && mySubleaderIds.has(s.registeredBySubleaderId))
      );
    }

    if (currentUser.role === 'SUBLIDER') {
      return supporters.filter(s =>
        s.registeredBySubleaderId === currentUser.id ||
        (s.registeredByLeaderId === currentUser.id)
      );
    }

    return supporters;
  }, [currentUser, supporters, users]);

  // Visible sublíderes according to current user role
  const visibleSubleaders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'SUPER_ADMIN') {
      return users.filter(u => u.role === 'SUBLIDER');
    }
    if (currentUser.role === 'LIDER_COORDINADOR') {
      return users.filter(u => u.role === 'SUBLIDER' && u.parentLeaderId === currentUser.id);
    }
    if (currentUser.role === 'SUBLIDER') {
      return users.filter(u => u.id === currentUser.id);
    }
    return [];
  }, [currentUser, users]);

  // Visible leaders according to current user role
  const visibleLeaders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'SUPER_ADMIN') {
      return users.filter(u => u.role === 'LIDER_COORDINADOR');
    }
    if (currentUser.role === 'LIDER_COORDINADOR') {
      return users.filter(u => u.id === currentUser.id);
    }
    if (currentUser.role === 'SUBLIDER') {
      return users.filter(u => u.id === currentUser.parentLeaderId);
    }
    return [];
  }, [currentUser, users]);

  // Apply filters on accessible dataset
  const visibleSupporters = useMemo(() => {
    return accessibleSupporters.filter(item => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
        const cedula = item.cedula.toLowerCase();
        const phone = item.phone.toLowerCase();
        const neighborhood = item.neighborhood.toLowerCase();
        const station = item.pollingStationName.toLowerCase();
        const leader = item.registeredByLeaderName.toLowerCase();
        const subleader = (item.registeredBySubleaderName || '').toLowerCase();

        const matches =
          fullName.includes(query) ||
          cedula.includes(query) ||
          phone.includes(query) ||
          neighborhood.includes(query) ||
          station.includes(query) ||
          leader.includes(query) ||
          subleader.includes(query);

        if (!matches) return false;
      }

      if (filters.pollingStationId && item.pollingStationId !== filters.pollingStationId) {
        return false;
      }

      if (filters.sector && item.sector !== filters.sector) {
        return false;
      }

      if (filters.neighborhood && item.neighborhood !== filters.neighborhood) {
        return false;
      }

      if (filters.gender && item.gender !== filters.gender) {
        return false;
      }

      if (filters.ageBracket && item.ageBracket !== filters.ageBracket) {
        return false;
      }

      if (filters.leaderId && item.registeredByLeaderId !== filters.leaderId) {
        return false;
      }

      if (filters.subleaderId && item.registeredBySubleaderId !== filters.subleaderId) {
        return false;
      }

      if (filters.votingCommitment && item.votingCommitment !== filters.votingCommitment) {
        return false;
      }

      return true;
    });
  }, [accessibleSupporters, filters]);

  // Extract distinct sectors and neighborhoods
  const allSectors = useMemo(() => {
    const set = new Set<string>();
    supporters.forEach(s => { if (s.sector) set.add(s.sector); });
    pollingStations.forEach(ps => { if (ps.zone) set.add(ps.zone); });
    return Array.from(set).sort();
  }, [supporters, pollingStations]);

  const allNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    supporters.forEach(s => { if (s.neighborhood) set.add(s.neighborhood); });
    pollingStations.forEach(ps => { if (ps.neighborhood) set.add(ps.neighborhood); });
    return Array.from(set).sort();
  }, [supporters, pollingStations]);

  // Statistics calculation for the current scope
  const stats: MovementStats = useMemo(() => {
    const totalSupporters = visibleSupporters.length;
    let totalGoal = 0;

    if (currentUser?.role === 'SUPER_ADMIN') {
      totalGoal = users.filter(u => u.role === 'LIDER_COORDINADOR').reduce((acc, l) => acc + (l.targetCount || 0), 0) || 5000;
    } else if (currentUser?.role === 'LIDER_COORDINADOR') {
      totalGoal = currentUser.targetCount || 800;
    } else if (currentUser?.role === 'SUBLIDER') {
      totalGoal = currentUser.targetCount || 250;
    }

    const byGender: { [key: string]: number } = { MASCULINO: 0, FEMENINO: 0, OTRO: 0 };
    const byAgeBracket: { [key: string]: number } = {
      '18-25': 0,
      '26-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
    };
    const byPollingStation: { [key: string]: number } = {};
    const bySector: { [key: string]: number } = {};
    const byCommitment: { [key: string]: number } = {
      CONFIRMADO: 0,
      PENDIENTE: 0,
      POR_CONTACTAR: 0,
      DUDOSO: 0,
    };

    visibleSupporters.forEach(s => {
      if (s.gender) byGender[s.gender] = (byGender[s.gender] || 0) + 1;
      if (s.ageBracket) byAgeBracket[s.ageBracket] = (byAgeBracket[s.ageBracket] || 0) + 1;
      if (s.pollingStationName) byPollingStation[s.pollingStationName] = (byPollingStation[s.pollingStationName] || 0) + 1;
      if (s.sector) bySector[s.sector] = (bySector[s.sector] || 0) + 1;
      if (s.votingCommitment) byCommitment[s.votingCommitment] = (byCommitment[s.votingCommitment] || 0) + 1;
    });

    return {
      totalSupporters,
      totalGoal,
      totalLeaders: visibleLeaders.length,
      totalSubleaders: visibleSubleaders.length,
      totalPollingStations: Object.keys(byPollingStation).length || pollingStations.length,
      byGender,
      byAgeBracket,
      byPollingStation,
      bySector,
      byCommitment,
    };
  }, [visibleSupporters, currentUser, users, visibleLeaders, visibleSubleaders, pollingStations]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        supporters,
        pollingStations,
        filters,
        login,
        logout,
        switchUser,
        registerUser,
        updateUser,
        deleteUser,
        addSupporter,
        updateSupporter,
        deleteSupporter,
        bulkAddSupporters,
        addPollingStation,
        updatePollingStation,
        deletePollingStation,
        setFilters,
        resetFilters,
        toggleWhatsappContacted,
        toggleVotedStatus,
        checkCedulaExists,
        resetToDemoData,
        visibleSupporters,
        accessibleSupporters,
        visibleLeaders,
        visibleSubleaders,
        stats,
        allSectors,
        allNeighborhoods,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
