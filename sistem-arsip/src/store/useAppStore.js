import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    arsipList: [],
    klasifikasiList: [],
    isLoading: false,
    loadingItems: new Set(), // Track individual items being processed
    
    // Actions
    setArsipList: (arsipList) => set({ arsipList }),
    setKlasifikasiList: (klasifikasiList) => set({ klasifikasiList }),
    setIsLoading: (isLoading) => set({ isLoading }),
    
    // Optimistic updates for Arsip
    addArsipOptimistic: (tempArsip) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticArsip = { ...tempArsip, id: tempId, isOptimistic: true };
      set(state => ({
        arsipList: [optimisticArsip, ...state.arsipList],
        loadingItems: new Set([...state.loadingItems, tempId])
      }));
      return tempId;
    },
    
    confirmArsipOptimistic: (tempId, realArsip) => {
      set(state => ({
        arsipList: state.arsipList.map(item => 
          item.id === tempId ? { ...realArsip, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },
    
    rollbackArsipOptimistic: (tempId) => {
      set(state => ({
        arsipList: state.arsipList.filter(item => item.id !== tempId),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },
    
    updateArsipOptimistic: (id, updates) => {
      set(state => ({
        arsipList: state.arsipList.map(item => 
          item.id === id ? { ...item, ...updates, isOptimistic: true } : item
        ),
        loadingItems: new Set([...state.loadingItems, id])
      }));
    },
    
    confirmArsipUpdate: (id, realArsip) => {
      set(state => ({
        arsipList: state.arsipList.map(item => 
          item.id === id ? { ...realArsip, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    rollbackArsipUpdate: (id, originalData) => {
      set(state => ({
        arsipList: state.arsipList.map(item => 
          item.id === id ? { ...originalData, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    deleteArsipOptimistic: (id) => {
      const originalItem = get().arsipList.find(item => item.id === id);
      set(state => ({
        arsipList: state.arsipList.filter(item => item.id !== id),
        loadingItems: new Set([...state.loadingItems, id])
      }));
      return originalItem;
    },
    
    rollbackArsipDelete: (originalItem) => {
      set(state => ({
        arsipList: [originalItem, ...state.arsipList].sort((a, b) => 
          new Date(b.tanggalSurat) - new Date(a.tanggalSurat)
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== originalItem.id))
      }));
    },
    
    confirmArsipDelete: (id) => {
      set(state => ({
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    // Optimistic updates for Klasifikasi
    addKlasifikasiOptimistic: (tempKlasifikasi) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticKlasifikasi = { ...tempKlasifikasi, id: tempId, isOptimistic: true };
      set(state => ({
        klasifikasiList: [...state.klasifikasiList, optimisticKlasifikasi]
          .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })),
        loadingItems: new Set([...state.loadingItems, tempId])
      }));
      return tempId;
    },
    
    confirmKlasifikasiOptimistic: (tempId, realKlasifikasi) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item => 
          item.id === tempId ? { ...realKlasifikasi, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },
    
    rollbackKlasifikasiOptimistic: (tempId) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.filter(item => item.id !== tempId),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== tempId))
      }));
    },
    
    updateKlasifikasiOptimistic: (id, updates) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item => 
          item.id === id ? { ...item, ...updates, isOptimistic: true } : item
        ),
        loadingItems: new Set([...state.loadingItems, id])
      }));
    },
    
    confirmKlasifikasiUpdate: (id, realKlasifikasi) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item => 
          item.id === id ? { ...realKlasifikasi, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    rollbackKlasifikasiUpdate: (id, originalData) => {
      set(state => ({
        klasifikasiList: state.klasifikasiList.map(item => 
          item.id === id ? { ...originalData, isOptimistic: false } : item
        ),
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    deleteKlasifikasiOptimistic: (id) => {
      const originalItem = get().klasifikasiList.find(item => item.id === id);
      set(state => ({
        klasifikasiList: state.klasifikasiList.filter(item => item.id !== id),
        loadingItems: new Set([...state.loadingItems, id])
      }));
      return originalItem;
    },
    
    rollbackKlasifikasiDelete: (originalItem) => {
      set(state => ({
        klasifikasiList: [...state.klasifikasiList, originalItem]
          .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })),
        loadingItems: new Set([...state.loadingItems].filter(id => id !== originalItem.id))
      }));
    },
    
    confirmKlasifikasiDelete: (id) => {
      set(state => ({
        loadingItems: new Set([...state.loadingItems].filter(itemId => itemId !== id))
      }));
    },
    
    // Utility functions
    isItemLoading: (id) => get().loadingItems.has(id),
    clearLoadingItems: () => set({ loadingItems: new Set() })
  }))
);

export default useAppStore;