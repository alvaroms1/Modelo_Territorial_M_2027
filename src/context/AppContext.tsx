import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserAccount,
  Contacto,
  PollingStation,
  FilterState,
  Actividad,
  AsignacionPuesto
} from '../types';
import { LOCALIDADES_CARTAGENA, CARTAGENA_POLLING_STATIONS } from '../data/cartagenaData';

export type AppTheme = 'dark' | 'pantone-9064' | 'pantone-200081' | 'pantone-124611';

interface AppContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  contactos: Contacto[];
  pollingStations: PollingStation[];
  actividades: Actividad[];
  asignaciones: AsignacionPuesto[];
  filters: FilterState;
  isLoading: boolean;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  login: (cedula: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (userData: Partial<UserAccount>) => Promise<{ success: boolean; error?: string }>;
  updateUserStatus: (userId: string, newEstado: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, updates: Partial<UserAccount>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  visibleContactos: Contacto[];
  visibleUsers: UserAccount[];
  fetchData: () => Promise<void>;
  addContacto: (contacto: Omit<Contacto, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateContacto: (id: string, updates: Partial<Contacto>) => Promise<{ success: boolean; error?: string }>;
  deleteContacto: (id: string) => Promise<{ success: boolean; error?: string }>;
  addActividad: (actividad: Omit<Actividad, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateActividad: (id: string, updates: Partial<Actividad>) => Promise<{ success: boolean; error?: string }>;
  deleteActividad: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPollingStation: (station: Omit<PollingStation, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updatePollingStation: (id: string, updates: Partial<PollingStation>) => Promise<{ success: boolean; error?: string }>;
  deletePollingStation: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const initialFilters: FilterState = {
  searchQuery: '',
  puesto_id: '',
  comuna_localidad: '',
  barrio: '',
  estado: '',
  lider_id: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [pollingStations, setPollingStations] = useState<PollingStation[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionPuesto[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('mendozismo_theme') as AppTheme) || 'dark';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('mendozismo_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-login from session storage token
  useEffect(() => {
    const savedUserId = sessionStorage.getItem('mendozismo_current_user_id');
    if (savedUserId && users.length > 0) {
      const user = users.find(u => u.id === savedUserId);
      if (user) setCurrentUser(user);
    }
  }, [users]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: usersData },
        { data: contactosData },
        { data: puestosData },
        { data: actData },
        { data: asigData }
      ] = await Promise.all([
        supabase.from('lideres').select('*'),
        supabase.from('contactos').select('*'),
        supabase.from('puestos_votacion').select('*'),
        supabase.from('actividades').select('*'),
        supabase.from('asignacion_puestos').select('*'),
      ]);

      if (usersData) setUsers(usersData as UserAccount[]);
      if (contactosData) setContactos(contactosData as Contacto[]);
      
      // Combine database polling stations with seed polling stations
      const dbStations = (puestosData || []) as PollingStation[];
      const combinedMap = new Map<string, PollingStation>();

      // 1. First add seed stations
      CARTAGENA_POLLING_STATIONS.forEach(seed => {
        combinedMap.set(seed.nombre_puesto.trim().toUpperCase(), {
          ...seed,
          comuna_localidad: seed.comuna_localidad || '',
          barrio_corregimiento: seed.barrio_corregimiento || ''
        } as PollingStation);
      });

      // 2. Override or add from database
      dbStations.forEach(db => {
        const key = (db.nombre_puesto || '').trim().toUpperCase();
        if (combinedMap.has(key)) {
          const existing = combinedMap.get(key)!;
          combinedMap.set(key, {
            ...existing,
            ...db,
            // Only override if db value is non-empty, or preserve updated values
            comuna_localidad: db.comuna_localidad ?? existing.comuna_localidad,
            barrio_corregimiento: db.barrio_corregimiento ?? existing.barrio_corregimiento,
            direccion: db.direccion ?? existing.direccion
          });
        } else {
          combinedMap.set(db.id, db);
        }
      });

      const combinedStations = Array.from(combinedMap.values()).sort((a, b) => 
        (a.nombre_puesto || '').localeCompare(b.nombre_puesto || '')
      );

      setPollingStations(combinedStations);

      if (actData) setActividades(actData as Actividad[]);
      if (asigData) setAsignaciones(asigData as AsignacionPuesto[]);
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const login = async (cedula: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.cedula === cedula && u.password === password);
    if (user) {
      if (user.estado !== 'ACTIVO' && user.rol !== 'ADMIN' && user.rol !== 'LIDER_PRINCIPAL') {
        return { success: false, error: 'Su cuenta está pendiente de aprobación por el Administrador.' };
      }
      setCurrentUser(user);
      sessionStorage.setItem('mendozismo_current_user_id', user.id);
      return { success: true };
    }
    return { success: false, error: 'Credenciales incorrectas o usuario no encontrado.' };
  };

  const registerUser = async (userData: Partial<UserAccount>) => {
    if (!userData.cedula || !userData.password || !userData.nombre_completo) {
      return { success: false, error: 'Faltan campos obligatorios' };
    }
    if (!userData.consentimiento_datos) {
      return { success: false, error: 'Debe aceptar el uso de datos (Habeas Data)' };
    }
    
    // Check if cedula already exists locally
    if (users.some(u => u.cedula === userData.cedula)) {
      return { success: false, error: 'La cédula ya está registrada.' };
    }

    const newUser = {
      cedula: userData.cedula,
      password: userData.password,
      nombre_completo: userData.nombre_completo,
      telefono: userData.telefono || null,
      correo: userData.correo || null,
      consentimiento_datos: userData.consentimiento_datos,
      rol: 'LIDER_PRINCIPAL',
      estado: 'EN_PAUSA'
    };

    const { data, error } = await supabase.from('lideres').insert([newUser]).select();
    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const createdUser = data[0] as UserAccount;
      setUsers(prev => [...prev, createdUser]);
      // Do NOT set current user, they must be approved first.
      return { success: true };
    }
    
    return { success: false, error: 'Error al registrar usuario.' };
  };

  const updateUserStatus = async (userId: string, newEstado: string) => {
    const { error } = await supabase.from('lideres').update({ estado: newEstado }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: newEstado as any } : u));
    return { success: true };
  };

  const updateUser = async (userId: string, updates: Partial<UserAccount>) => {
    const { error } = await supabase.from('lideres').update(updates).eq('id', userId);
    if (error) return { success: false, error: error.message };
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    return { success: true };
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('lideres').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };
    
    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('mendozismo_current_user_id');
  };

  const resetFilters = () => setFilters(initialFilters);

  const addContacto = async (contacto: Omit<Contacto, 'id' | 'created_at'>) => {
    if (!contacto.consentimiento_datos) {
      return { success: false, error: 'El consentimiento de datos es obligatorio.' };
    }
    const { data, error } = await supabase.from('contactos').insert([contacto]).select();
    if (error) return { success: false, error: error.message };
    if (data) setContactos(prev => [data[0] as Contacto, ...prev]);
    return { success: true };
  };

  const updateContacto = async (id: string, updates: Partial<Contacto>) => {
    const { data, error } = await supabase.from('contactos').update(updates).eq('id', id).select();
    if (error) return { success: false, error: error.message };
    if (data) {
      setContactos(prev => prev.map(c => c.id === id ? { ...c, ...data[0] } : c));
    }
    return { success: true };
  };

  const deleteContacto = async (id: string) => {
    const { error } = await supabase.from('contactos').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    setContactos(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  const addActividad = async (actividad: Omit<Actividad, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('actividades').insert([actividad]).select();
    if (error) return { success: false, error: error.message };
    if (data) setActividades(prev => [data[0] as Actividad, ...prev]);
    return { success: true };
  };

  const updateActividad = async (id: string, updates: Partial<Actividad>) => {
    const { data, error } = await supabase.from('actividades').update(updates).eq('id', id).select();
    if (error) return { success: false, error: error.message };
    if (data) {
      setActividades(prev => prev.map(a => a.id === id ? { ...a, ...data[0] } : a));
    }
    return { success: true };
  };

  const deleteActividad = async (id: string) => {
    const { error } = await supabase.from('actividades').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    setActividades(prev => prev.filter(a => a.id !== id));
    return { success: true };
  };

  const addPollingStation = async (station: Omit<PollingStation, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('puestos_votacion').insert([station]).select();
    if (error) return { success: false, error: error.message };
    if (data) setPollingStations(prev => [...prev, data[0] as PollingStation]);
    return { success: true };
  };

  const updatePollingStation = async (id: string, updates: Partial<PollingStation>) => {
    try {
      const station = pollingStations.find(p => p.id === id);
      if (!station) return { success: false, error: 'Puesto no encontrado' };

      const updatedStation = { ...station, ...updates };

      // Upsert to Supabase
      const { error: dbError } = await supabase
        .from('puestos_votacion')
        .upsert({
          id: updatedStation.id,
          codigo_puesto: updatedStation.codigo_puesto,
          nombre_puesto: updatedStation.nombre_puesto,
          comuna_localidad: updatedStation.comuna_localidad || '',
          barrio_corregimiento: updatedStation.barrio_corregimiento || '',
          direccion: updatedStation.direccion || '',
          zona_influencia: updatedStation.zona_influencia || ''
        });

      if (dbError) {
        console.error('Error updating polling station in Supabase:', dbError);
      }

      setPollingStations(prev => prev.map(p => p.id === id ? updatedStation : p));
      return { success: true };
    } catch (err: any) {
      console.error('Error in updatePollingStation:', err);
      return { success: false, error: err.message || 'Error al actualizar puesto' };
    }
  };

  const deletePollingStation = async (id: string) => {
    try {
      const { error } = await supabase.from('puestos_votacion').delete().eq('id', id);
      if (error) {
        console.error('Error deleting in Supabase:', error);
      }
      setPollingStations(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const visibleContactos = useMemo(() => {
    if (!currentUser) return [];
    
    // Filter by role access
    let accessible = contactos;
    if (currentUser.rol === 'LIDER_PRINCIPAL_INVITADO') {
      const mySubleaders = users.filter(u => u.lider_principal_id === currentUser.id).map(u => u.id);
      accessible = contactos.filter(c => c.lider_id === currentUser.id || mySubleaders.includes(c.lider_id));
    } else if (currentUser.rol === 'SUBLIDER' || currentUser.rol === 'LIDER') {
      accessible = contactos.filter(c => c.lider_id === currentUser.id);
    }

    // Apply UI filters
    return accessible.filter(item => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const fullName = `${item.nombres || ''} ${item.apellidos || ''}`.toLowerCase();
        if (!fullName.includes(q) && !(item.cedula && item.cedula.includes(q))) return false;
      }
      if (filters.puesto_id && item.puesto_id !== filters.puesto_id) return false;
      if (filters.comuna_localidad && item.comuna_localidad !== filters.comuna_localidad) return false;
      if (filters.barrio && item.barrio !== filters.barrio) return false;
      if (filters.estado && item.estado !== filters.estado) return false;
      if (filters.lider_id && item.lider_id !== filters.lider_id) return false;
      return true;
    });
  }, [contactos, currentUser, filters, users]);

  const visibleUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.rol === 'ADMIN' || currentUser.rol === 'LIDER_PRINCIPAL') return users;
    if (currentUser.rol === 'LIDER_PRINCIPAL_INVITADO') return users.filter(u => u.id === currentUser.id || u.lider_principal_id === currentUser.id);
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        contactos,
        pollingStations,
        actividades,
        asignaciones,
        filters,
        isLoading,
        theme,
        setTheme,
        login,
        registerUser,
        updateUserStatus,
        updateUser,
        deleteUser,
        logout,
        setFilters,
        resetFilters,
        visibleContactos,
        visibleUsers,
        fetchData,
        addContacto,
        updateContacto,
        deleteContacto,
        addActividad,
        updateActividad,
        deleteActividad,
        addPollingStation,
        updatePollingStation,
        deletePollingStation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
