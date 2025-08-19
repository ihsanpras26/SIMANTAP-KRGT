import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import useAppStore from './store/useAppStore';

// UI Components
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Input, Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter,
  Sidebar, Header, StatCard, Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from './components/ui';

// Legacy Components (will be updated)
import { 
  ArsipSkeleton, 
  KlasifikasiSkeleton, 
  StatCardSkeleton, 
  FormSkeleton,
  ChartSkeleton 
} from './components/SkeletonLoader';
import LoadingSpinner, { 
  ButtonSpinner, 
  OverlaySpinner, 
  InlineSpinner, 
  CardSpinner 
} from './components/LoadingSpinner';

// Charts and Icons
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, Archive, FilePlus, FolderKanban, Bell, Search, Trash2, Edit, 
  XCircle, LogOut, Info, FileDown, Layers, Filter, X, Paperclip, FileText, 
  CheckCircle, AlertCircle, ChevronRight, Home, Plus, Download, Upload,
  Calendar, Clock, User, Eye, Bookmark
} from 'lucide-react';

import DevIndicator from './components/DevIndicator.jsx'
import './animations.css'

// Add line-clamp utility styles
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = lineClampStyles;
  document.head.appendChild(styleElement);
}
import InputField from './InputField.jsx'
import GoogleDriveUpload from './components/GoogleDriveUpload.jsx'
import { parseGoogleDriveLink, isValidGoogleDriveLink } from './utils/googleDriveUtils.js'

// --- Konfigurasi Supabase ---
// Pastikan Anda membuat file .env dan mengisinya
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Inisialisasi Klien Supabase (hanya jika environment variables tersedia) ---
let supabase = null;
const isValidConfig = supabaseUrl && supabaseAnonKey && 
    !supabaseUrl.includes('your_supabase_project_url_here') && 
    !supabaseAnonKey.includes('your_supabase_anon_key_here');

if (isValidConfig) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error('Missing or invalid Supabase configuration. Please check your .env file.');
}

// Komponen untuk menampilkan pesan konfigurasi
const ConfigurationMessage = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md border border-yellow-200 animate-scaleIn">
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                    <AlertCircle className="text-yellow-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Konfigurasi Diperlukan</h2>
                <p className="text-gray-600 mb-6">
                    Silakan konfigurasi file .env dengan kredensial Supabase Anda.
                </p>
                <div className="text-left bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm">
                    <p className="font-mono text-gray-700 mb-1">VITE_SUPABASE_URL=your_url_here</p>
                    <p className="font-mono text-gray-700">VITE_SUPABASE_ANON_KEY=your_key_here</p>
                </div>
            </div>
        </div>
    </div>
);

// --- Fungsi Helper ---

// --- Komponen Utama Aplikasi ---
export default function App() {
    // --- State Management (must be at the top before any conditional logic) ---
    const [currentView, setCurrentView] = useState('dashboard');
    
    // Zustand store for optimistic updates
    const {
        arsipList,
        klasifikasiList,
        isLoading: storeLoading,
        setArsipList,
        setKlasifikasiList,
        setIsLoading: setStoreLoading
    } = useAppStore();
    const [editingArsip, setEditingArsip] = useState(null);
    const [editingKlasifikasi, setEditingKlasifikasi] = useState(null);
    const [showKlasifikasiModal, setShowKlasifikasiModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    // Removed dark mode state - using light mode only
    // Notification state removed - using react-hot-toast instead
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, id: null, message: '' });
    
    // Search functionality state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    // Sidebar state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Auth admin-only
    const [session, setSession] = useState(null);
    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

    // Cek konfigurasi environment variables dipindahkan ke JSX agar urutan hooks tetap konsisten

    // --- Search Functionality ---
    const performSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            
            // Search in arsip
            const arsipResults = (arsipList || []).filter(arsip => {
                const searchableText = `${arsip.perihal || ''} ${arsip.nomorSurat || ''} ${arsip.tujuanSurat || ''} ${arsip.kodeKlasifikasi || ''}`.toLowerCase();
                return searchTerms.some(term => searchableText.includes(term));
            }).map(arsip => ({ ...arsip, type: 'arsip' }));

            // Search in klasifikasi (use deskripsi field)
            const klasifikasiResults = (klasifikasiList || []).filter(klasifikasi => {
                const searchableText = `${klasifikasi.kode || ''} ${klasifikasi.deskripsi || ''}`.toLowerCase();
                return searchTerms.some(term => searchableText.includes(term));
            }).map(klasifikasi => ({ ...klasifikasi, type: 'klasifikasi' }));

            const allResults = [...arsipResults, ...klasifikasiResults];
            setSearchResults(allResults);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Terjadi kesalahan saat mencari');
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, arsipList, klasifikasiList]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowSearchResults(false);
            }
        };
        
        if (showSearchResults) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSearchResults]);

    // --- Efek untuk Mengambil Data Awal & Berlangganan Perubahan ---
    useEffect(() => {
        if (!supabase) return;
        // Sinkronisasi session
        supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));
        // Fungsi untuk mengambil data awal
        const fetchData = async () => {
            setStoreLoading(true);
            // Ambil data arsip
            const { data: arsipData, error: arsipError } = await supabase.from('arsip').select('*').order('tanggalSurat', { ascending: false });
            if (arsipError) {
                console.error("Error fetching arsip:", arsipError);
                showNotification(`Gagal memuat data arsip: ${arsipError.message || 'Terjadi kesalahan'}`, 'error');
            } else {
                setArsipList(arsipData || []);
            }

            // Ambil data klasifikasi
            const { data: klasifikasiData, error: klasifikasiError } = await supabase.from('klasifikasi').select('*').order('kode', { ascending: true });
            if (klasifikasiError) {
                console.error("Error fetching klasifikasi:", klasifikasiError);
                showNotification(`Gagal memuat data klasifikasi: ${klasifikasiError.message || 'Terjadi kesalahan'}`, 'error');
            } else {
                setKlasifikasiList(klasifikasiData || []);
            }
            
            setStoreLoading(false);
        };

        fetchData();

        // Menyiapkan langganan real-time untuk tabel 'arsip'
        const arsipChannel = supabase.channel('public:arsip')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip' }, 
                (payload) => {
                    // Handle real-time changes for arsip table
                    if (payload.eventType === 'INSERT') {
                        setArsipList(prev => [payload.new, ...prev]);
                        showNotification('Data arsip baru ditambahkan!', 'success');
                    } else if (payload.eventType === 'UPDATE') {
                        setArsipList(prev => prev.map(item => 
                            item.id === payload.new.id ? payload.new : item
                        ));
                        showNotification('Data arsip diperbarui!', 'success');
                    } else if (payload.eventType === 'DELETE') {
                        setArsipList(prev => prev.filter(item => item.id !== payload.old.id));
                        showNotification('Data arsip dihapus!', 'success');
                    }
                }
            )
            .subscribe();
            
        // Menyiapkan langganan real-time untuk tabel 'klasifikasi'
        const klasifikasiChannel = supabase.channel('public:klasifikasi')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'klasifikasi' }, 
                (payload) => {
                    // Handle real-time changes for klasifikasi table
                    if (payload.eventType === 'INSERT') {
                        setKlasifikasiList(prev => [...prev, payload.new].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                        // Tidak tampilkan notifikasi untuk INSERT karena sudah ada di form
                    } else if (payload.eventType === 'UPDATE') {
                        setKlasifikasiList(prev => prev.map(item => 
                            item.id === payload.new.id ? payload.new : item
                        ).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                        // Tidak tampilkan notifikasi untuk UPDATE karena sudah ada di form
                    } else if (payload.eventType === 'DELETE') {
                        setKlasifikasiList(prev => prev.filter(item => item.id !== payload.old.id));
                        // Notifikasi delete sudah ditangani di confirmDelete
                    }
                }
            )
            .subscribe();

        // Membersihkan subscription saat komponen di-unmount
        return () => {
            authListener?.subscription?.unsubscribe?.();
            supabase.removeChannel(arsipChannel);
            supabase.removeChannel(klasifikasiChannel);
        };
    }, []);
    
    // --- Fungsi Notifikasi dengan react-hot-toast ---
    const showNotification = (message, type = 'success') => {
        if (type === 'success') {
            toast.success(message, {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#10B981',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#10B981',
                },
            });
        } else if (type === 'error') {
            toast.error(message, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#EF4444',
                },
            });
        } else {
            toast(message, {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#F8FAFC',
                    color: '#1E293B',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
            });
        }
    };

    const confirmDelete = async () => {
        const { deleteKlasifikasiOptimistic, confirmKlasifikasiDelete, rollbackKlasifikasiDelete } = useAppStore.getState();
        
        // Find the original data for potential rollback
        const originalData = klasifikasiList.find(k => k.id === deleteConfirmModal.id);
        
        try {
            // Optimistic delete
            deleteKlasifikasiOptimistic(deleteConfirmModal.id);
            
            const { error } = await supabase.from('klasifikasi').delete().eq('id', deleteConfirmModal.id);
            if (error) {
                rollbackKlasifikasiDelete(originalData);
                throw error;
            }
            
            confirmKlasifikasiDelete(deleteConfirmModal.id);
            showNotification('Kode klasifikasi berhasil dihapus!', 'success');
            setDeleteConfirmModal({ show: false, id: null, message: '' });
        } catch (error) {
            console.error("Error deleting klasifikasi:", error);
            showNotification(`Gagal menghapus kode klasifikasi: ${error.message}`, 'error');
            setDeleteConfirmModal({ show: false, id: null, message: '' });
        }
    };

    // --- Fungsi Navigasi ---
    const navigate = (view) => {
        setCurrentView(view);
        if (view !== 'tambah') setEditingArsip(null);
        if (view !== 'klasifikasi') setEditingKlasifikasi(null);
    };

    const handleSearchSubmit = (value) => {
        setSearchQuery(value ?? '');
        setCurrentView('cari');
    };

    // Move useMemo outside of any conditional logic
    const { activeArchives, inactiveArchives, archivesByYear } = useMemo(() => {
        const today = new Date();
        const active = [];
        const inactive = [];
        const byYear = {};

        arsipList.forEach(arsip => {
            const retensiDate = new Date(arsip.tanggalRetensi);
            const year = new Date(arsip.tanggalSurat).getFullYear();
            
            if (year && !isNaN(year)) {
                if (!byYear[year]) byYear[year] = { name: year, Aktif: 0, Inaktif: 0 };
            }

            if (retensiDate && today > retensiDate) {
                inactive.push(arsip);
                if(year && !isNaN(year)) byYear[year].Inaktif += 1;
            } else {
                active.push(arsip);
                if(year && !isNaN(year)) byYear[year].Aktif += 1;
            }
        });

        return { 
            activeArchives: active, 
            inactiveArchives: inactive,
            archivesByYear: Object.values(byYear).sort((a,b) => a.name - b.name)
        };
    }, [arsipList]);

    if (storeLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100 animate-scaleIn">
                    <div className="flex flex-col items-center gap-4">
                        <LoadingSpinner type="ring" size={40} color="#3B82F6" />
                        <div className="text-xl font-semibold text-gray-800">Memuat Sistem...</div>
                        <div className="text-sm text-gray-500">Mohon tunggu sebentar</div>
                    </div>
                </div>
            </div>
        );
    }

    const renderView = () => {
        const props = { supabase, klasifikasiList, setEditingArsip, editingKlasifikasi, setEditingKlasifikasi, navigate, arsipList, activeArchives, inactiveArchives, showNotification, setDeleteConfirmModal };
        switch (currentView) {
            case 'tambah':
                return <ArsipForm {...props} arsipToEdit={editingArsip} onFinish={() => navigate('dashboard')} />;
            case 'klasifikasi':
                return <KlasifikasiManager {...props} openModal={() => setShowKlasifikasiModal(true)} />;
            case 'cari':
                 return <AdvancedSearchView {...props} />;
            case 'semua':
                 return <ArsipList {...props} title="Semua Arsip" arsipList={arsipList} setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} listType="semua" />;
            case 'laporan':
                 return <ReportingView {...props} />;
            default:
                return <Dashboard {...props} stats={{ total: arsipList.length, active: activeArchives.length, inactive: inactiveArchives.length }} archivesByYear={archivesByYear} />;
        }
    };

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
        { id: 'tambah', label: 'Tambah Arsip', icon: FilePlus, view: 'tambah' },
        { id: 'semua', label: 'Semua Arsip', icon: Layers, view: 'semua' },
        { id: 'klasifikasi', label: 'Kode Klasifikasi', icon: FolderKanban, view: 'klasifikasi' },
        { id: 'cari', label: 'Pencarian Lanjutan', icon: Search, view: 'cari' },
        { id: 'laporan', label: 'Laporan', icon: FileText, view: 'laporan' },
    ];

    const handleLogout = async () => {
        try {
            await supabase?.auth?.signOut();
            setSession(null);
            showNotification('Berhasil logout', 'success');
        } catch (e) {}
    };

    const handleAdminLogin = async (email, password) => {
        if (!supabase) return;
        try {
            if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
                showNotification('ENV admin belum diset', 'error');
                return;
            }
            if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
                showNotification('Kredensial tidak valid', 'error');
                return;
            }
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                showNotification(error.message, 'error');
                return;
            }
            showNotification('Login berhasil', 'success');
        } catch (e) {
            showNotification('Login gagal', 'error');
        }
    };

    if (isValidConfig && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login Admin</h2>
                    <AdminLoginForm onSubmit={handleAdminLogin} />
                </div>
                <Toaster position="top-right" />
            </div>
        );
    }

    return (
        <>
        {!isValidConfig ? (
            <ConfigurationMessage />
        ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans text-gray-900">
            <div className="flex min-h-screen">
                <Sidebar 
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    navigationItems={navigationItems}
                    currentView={currentView}
                    onNavigate={navigate}
                    onShowInfo={() => setShowInfoModal(true)}
                />
                
                <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px', transition: 'margin-left 0.3s ease-in-out' }}>
                    <Header 
                        title={
                            currentView === 'dashboard' ? 'Dashboard' :
                            currentView === 'tambah' ? 'Tambah Arsip' :
                            currentView === 'semua' ? 'Semua Arsip' :
                            currentView === 'klasifikasi' ? 'Kode Klasifikasi' :
                            currentView === 'cari' ? 'Pencarian Lanjutan' :
                            currentView === 'laporan' ? 'Laporan' : 'Sistem Arsip'
                        }
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearchSubmit={handleSearchSubmit}
                        onLogout={handleLogout}
                    />

                    <main className="flex-1 p-6 overflow-auto">
                        {import.meta.env.DEV && <DevIndicator />}
                        
                        <div className="max-w-7xl mx-auto">
                            {renderView() || (
                                <Card className="p-8 text-center">
                                    <CardContent>
                                        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Halaman Tidak Ditemukan</h3>
                                        <p className="text-gray-500">Halaman yang Anda cari tidak tersedia.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            
            <AnimatePresence>
                {showInfoModal && (
                    <InfoModal onClose={() => setShowInfoModal(false)} />
                )}
                {deleteConfirmModal.show && (
                    <DeleteConfirmModal 
                        message={deleteConfirmModal.message} 
                        onConfirm={confirmDelete} 
                        onCancel={() => setDeleteConfirmModal({ show: false, id: null, message: '' })} 
                    />
                )}
            </AnimatePresence>
            
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#374151',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                    },
                }}
            />

            {/* Modal Tambah/Edit Klasifikasi */}
            <Modal isOpen={showKlasifikasiModal} onClose={() => { setShowKlasifikasiModal(false); setEditingKlasifikasi(null); }} size="lg">
                <ModalHeader onClose={() => { setShowKlasifikasiModal(false); setEditingKlasifikasi(null); }}>
                    <ModalTitle>{editingKlasifikasi ? 'Edit Kode Klasifikasi' : 'Tambah Kode Klasifikasi'}</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <KlasifikasiForm 
                        supabase={supabase}
                        klasifikasiToEdit={editingKlasifikasi}
                        onFinish={() => { setEditingKlasifikasi(null); setShowKlasifikasiModal(false); }}
                        showNotification={showNotification}
                    />
                </ModalContent>
            </Modal>
        </div>
        )}
        </>
    );
}

// Toast component removed - using react-hot-toast instead

// --- Komponen Modal Konfirmasi Delete ---
const DeleteConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 animate-slideUp">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <AlertCircle className="text-red-500" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Konfirmasi Hapus</h3>
                <p className="text-gray-600 mb-6 text-center">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArsipForm = ({ supabase, klasifikasiList, arsipToEdit, onFinish, showNotification }) => {
    const {
        addArsipOptimistic,
        confirmArsipOptimistic,
        rollbackArsipOptimistic,
        updateArsipOptimistic,
        confirmArsipUpdate,
        rollbackArsipUpdate
    } = useAppStore();
    
    const [formData, setFormData] = useState({
        nomorSurat: '',
        tanggalSurat: '',
        pengirim: '',
        tujuanSurat: '',
        perihal: '',
        kodeKlasifikasi: '',
        googleDriveLink: '',
    });
    const [googleDriveInfo, setGoogleDriveInfo] = useState({
        fileId: '',
        viewLink: '',
        downloadLink: ''
    });
    const [manualKodeInput, setManualKodeInput] = useState('');
    const [useManualKode, setUseManualKode] = useState(false);
    const [existingFile, setExistingFile] = useState({ fileName: '', filePath: '' });
    const [googleDriveFile, setGoogleDriveFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (arsipToEdit) {
            setFormData({
                nomorSurat: arsipToEdit.nomorSurat || '',
                tanggalSurat: arsipToEdit.tanggalSurat ? new Date(arsipToEdit.tanggalSurat).toISOString().split('T')[0] : '',
                pengirim: arsipToEdit.pengirim || '',
                tujuanSurat: arsipToEdit.tujuanSurat || '',
                perihal: arsipToEdit.perihal || '',
                kodeKlasifikasi: arsipToEdit.kodeKlasifikasi || '',
                googleDriveLink: arsipToEdit.googleDriveLink || '',
            });
            setExistingFile({ fileName: arsipToEdit.fileName, filePath: arsipToEdit.filePath });
            
            // Set Google Drive file if exists
            if (arsipToEdit.googleDriveFileId) {
                setGoogleDriveFile({
                    id: arsipToEdit.googleDriveFileId,
                    name: arsipToEdit.fileName,
                    webViewLink: arsipToEdit.googleDriveViewLink,
                    downloadLink: arsipToEdit.googleDriveLink
                });
            }
            
            // Process existing Google Drive link to extract info
            if (arsipToEdit.googleDriveLink && isValidGoogleDriveLink(arsipToEdit.googleDriveLink)) {
                const driveInfo = parseGoogleDriveLink(arsipToEdit.googleDriveLink);
                if (driveInfo && driveInfo.success) {
                    setGoogleDriveInfo({
                        fileId: driveInfo.fileId || '',
                        viewLink: driveInfo.links?.viewLink || '',
                        downloadLink: driveInfo.links?.downloadLink || ''
                    });
                }
            }
            
            // Cek apakah kode klasifikasi ada di daftar atau manual
            if (arsipToEdit.kodeKlasifikasi) {
                const existsInList = klasifikasiList.find(k => k.kode === arsipToEdit.kodeKlasifikasi);
                if (!existsInList) {
                    setUseManualKode(true);
                    setManualKodeInput(arsipToEdit.kodeKlasifikasi);
                }
            }
        }
    }, [arsipToEdit, klasifikasiList]);

    // Fungsi untuk mengidentifikasi kode klasifikasi dari nomor surat
    const identifyKlasifikasiFromNomor = (nomorSurat) => {
        if (!nomorSurat || !klasifikasiList || klasifikasiList.length === 0) return null;
        
        // Cari pola kode klasifikasi dalam nomor surat (contoh: 001.1, 002.3.1, dll)
        const kodePattern = /\b(\d{3}(?:\.\d+)*)/g;
        const matches = nomorSurat.match(kodePattern);
        
        if (matches && matches.length > 0) {
            // Cari kode yang paling cocok dengan klasifikasi yang ada
            for (const match of matches) {
                const foundKlasifikasi = klasifikasiList.find(k => k && k.kode === match);
                if (foundKlasifikasi) {
                    return match;
                }
                
                // Coba cari kode parent jika kode lengkap tidak ditemukan
                const parts = match.split('.');
                for (let i = parts.length - 1; i > 0; i--) {
                    const parentKode = parts.slice(0, i).join('.');
                    const parentKlasifikasi = klasifikasiList.find(k => k && k.kode === parentKode);
                    if (parentKlasifikasi) {
                        return parentKode;
                    }
                }
            }
        }
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Auto-identifikasi kode klasifikasi dari nomor surat
        if (name === 'nomorSurat' && !useManualKode) {
            const identifiedKode = identifyKlasifikasiFromNomor(value);
            if (identifiedKode) {
                setFormData(prev => ({ ...prev, kodeKlasifikasi: identifiedKode }));
                showNotification(`Kode klasifikasi ${identifiedKode} teridentifikasi dari nomor surat`, 'success');
            }
        }
        
        // Auto-ekstrak Google Drive file ID dan view link
        if (name === 'googleDriveLink') {
            const trimmedValue = (value || '').trim();
            if (trimmedValue) {
                const driveInfo = parseGoogleDriveLink(trimmedValue);
                if (driveInfo && driveInfo.success) {
                    setGoogleDriveInfo({
                        fileId: driveInfo.fileId || '',
                        viewLink: driveInfo.links?.viewLink || '',
                        downloadLink: driveInfo.links?.downloadLink || ''
                    });
                    
                    // Normalisasi link ke format view yang konsisten
                    if (driveInfo.links?.viewLink && trimmedValue !== driveInfo.links.viewLink) {
                        setFormData(prev => ({ ...prev, googleDriveLink: driveInfo.links.viewLink }));
                        showNotification('Link Google Drive dinormalisasi ke format standar', 'info');
                    }
                } else {
                    setGoogleDriveInfo({ fileId: '', viewLink: '', downloadLink: '' });
                }
            } else {
                // Reset Google Drive info jika link dikosongkan
                setGoogleDriveInfo({ fileId: '', viewLink: '', downloadLink: '' });
                // Clear validation errors for Google Drive link
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.googleDriveLink;
                    return newErrors;
                });
            }
        }
    };

    const handleGoogleDriveFileUploaded = (fileData) => {
        if (fileData && typeof fileData === 'object') {
            setGoogleDriveFile(fileData);
        }
    };
    
    const handleGoogleDriveFileRemoved = () => {
        setGoogleDriveFile(null);
    };

    const validateForm = () => {
        const errors = {};
        
        // Hanya tanggal surat dan perihal yang wajib diisi
        if (!formData?.tanggalSurat) errors.tanggalSurat = 'Tanggal surat wajib diisi';
        if (!formData?.perihal || !(formData.perihal || '').trim()) errors.perihal = 'Perihal / isi surat wajib diisi';
        
        // Validasi kode klasifikasi jika diisi (baik manual maupun dropdown)
        const kodeToValidate = useManualKode ? (manualKodeInput || '') : (formData?.kodeKlasifikasi || '');
        if (kodeToValidate && useManualKode) {
            // Validasi format kode manual (harus berupa angka dengan titik)
            const kodePattern = /^\d{3}(\.\d+)*$/;
            if (!kodePattern.test(kodeToValidate.trim())) {
                errors.kodeKlasifikasi = 'Format kode klasifikasi tidak valid (contoh: 001.1 atau 002.3.1)';
            }
        }
        
        // Validasi Google Drive link jika diisi
        const googleDriveLink = formData?.googleDriveLink || '';
        if (googleDriveLink.trim()) {
            const trimmedLink = googleDriveLink.trim();
            if (!isValidGoogleDriveLink(trimmedLink)) {
                errors.googleDriveLink = 'Link Google Drive tidak valid. Pastikan menggunakan link sharing yang benar.';
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleNextStep = () => {
        if (validateForm()) {
            setCurrentStep(2);
        }
    };
    
    const handlePrevStep = () => {
        setCurrentStep(1);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showNotification("Mohon lengkapi semua field yang diperlukan", 'error');
            return;
        }
        
        setIsLoading(true);

        let fileData = {
            filePath: arsipToEdit?.filePath || null,
            fileName: arsipToEdit?.fileName || null,
        };

        // Handle Google Drive file upload only
        if (googleDriveFile) {
            // Use Google Drive file data
            fileData = {
                filePath: null, // No Supabase storage path for Google Drive files
                fileName: googleDriveFile.name,
                googleDriveFileId: googleDriveFile.id,
                googleDriveViewLink: googleDriveFile.webViewLink,
                googleDriveLink: googleDriveFile.downloadLink || googleDriveFile.webContentLink,
            };
        }

        // Tentukan kode klasifikasi yang akan digunakan
        const finalKodeKlasifikasi = useManualKode ? manualKodeInput : formData.kodeKlasifikasi;
        
        let selectedKlasifikasi = null;
        let retensiAktif = 5; // Default retensi 5 tahun jika tidak ada klasifikasi
        
        if (finalKodeKlasifikasi) {
            selectedKlasifikasi = klasifikasiList.find(k => k.kode === finalKodeKlasifikasi);
            if (selectedKlasifikasi) {
                retensiAktif = selectedKlasifikasi.retensiAktif;
            } else if (useManualKode) {
                // Jika menggunakan kode manual yang tidak ada di database, gunakan retensi default
                showNotification('Kode klasifikasi manual akan menggunakan retensi default 5 tahun', 'info');
            }
        }
        const tglSurat = new Date(formData.tanggalSurat);
        if (isNaN(tglSurat.getTime())) {
            showNotification('Tanggal surat tidak valid.', 'error');
            setIsLoading(false);
            return;
        }
        const retensiDate = new Date(new Date(tglSurat).setFullYear(tglSurat.getFullYear() + Number(retensiAktif)));

        // Ensure all data is properly sanitized and validated
        const dataToSave = { 
            nomorSurat: formData.nomorSurat?.trim() || null,
            tanggalSurat: tglSurat.toISOString(),
            pengirim: formData.pengirim?.trim() || null,
            tujuanSurat: formData.tujuanSurat?.trim() || null,
            perihal: formData.perihal?.trim() || '',
            kodeKlasifikasi: finalKodeKlasifikasi || null,
            tanggalRetensi: retensiDate.toISOString(),
            filePath: fileData.filePath,
            fileName: fileData.fileName,
            googleDriveFileId: (googleDriveInfo?.fileId || fileData.googleDriveFileId) || null,
            googleDriveViewLink: (googleDriveInfo?.viewLink || fileData.googleDriveViewLink) || null,
            googleDriveLink: formData.googleDriveLink?.trim() || null,
        };

        try {
            let tempId;
            const originalData = arsipToEdit ? { ...arsipToEdit } : null;
            
            if (arsipToEdit) {
                // Optimistic update for existing arsip
                updateArsipOptimistic(arsipToEdit.id, dataToSave);
                
                const { data, error } = await supabase.from('arsip').update(dataToSave).eq('id', arsipToEdit.id).select().single();
                if (error) {
                    rollbackArsipUpdate(arsipToEdit.id, originalData);
                    throw error;
                }
                confirmArsipUpdate(arsipToEdit.id, data);
                showNotification('Data arsip berhasil diperbarui!', 'success');
            } else {
                // Optimistic insert for new arsip
                tempId = addArsipOptimistic(dataToSave);
                
                const { data, error } = await supabase.from('arsip').insert([dataToSave]).select().single();
                if (error) {
                    rollbackArsipOptimistic(tempId);
                    throw error;
                }
                confirmArsipOptimistic(tempId, data);
                showNotification('Data arsip berhasil disimpan!', 'success');
            }
            onFinish();
        } catch (error) {
            console.error("Error saving document:", error);
            const errorMessage = error?.message || 'Terjadi kesalahan yang tidak diketahui';
            showNotification(`Gagal menyimpan data: ${errorMessage}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // ... (sisa JSX dari ArsipForm tidak berubah signifikan, hanya logic handler)
    // (Kode JSX dari komponen ArsipForm, NavItem, StatCard, Dashboard, dll. dimasukkan di sini)
    // ... (Saya akan memasukkan JSX yang relevan di bawah ini)
    const groupedKlasifikasi = useMemo(() => {
        const sortedList = [...klasifikasiList].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
        const mainCategories = sortedList.filter(k => k.kode.length === 3);
        const grouped = mainCategories.map(main => ({
            ...main,
            subItems: sortedList.filter(sub => sub.kode.startsWith(main.kode + '.') && sub.kode.length > 3)
        }));
        // Tambahkan item yang tidak memiliki kategori utama
        const orphanItems = sortedList.filter(item => {
            const hasParent = mainCategories.some(main => item.kode.startsWith(main.kode + '.'));
            return !hasParent && item.kode.length > 3;
        });
        return [...grouped, ...orphanItems.map(item => ({ ...item, subItems: [] }))];
    }, [klasifikasiList]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-7xl mx-auto overflow-hidden">
            {/* Header dengan Progress */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6 text-white">
                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-6">
                    <div className={`flex items-center ${currentStep >= 1 ? 'text-white' : 'text-primary-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep >= 1 ? 'bg-white text-primary-600' : 'bg-primary-400'
                        }`}>
                            1
                        </div>
                        <span className="ml-2 text-sm font-medium">Informasi Dasar</span>
                    </div>
                    <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-white' : 'bg-primary-400'}`}></div>
                    <div className={`flex items-center ${currentStep >= 2 ? 'text-white' : 'text-primary-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            currentStep >= 2 ? 'bg-white text-primary-600' : 'bg-primary-400'
                        }`}>
                            2
                        </div>
                        <span className="ml-2 text-sm font-medium">Lampiran & Review</span>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="px-8 py-6">
                {/* Step 1: Informasi Dasar */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                <FileText size={28} className="text-primary-600" />
                                Informasi Dasar Arsip
                            </h2>
                            <p className="text-gray-600 text-sm">Lengkapi informasi dasar dokumen arsip dengan teliti</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <InputField 
                                    name="nomorSurat" 
                                    label="Nomor Surat" 
                                    value={formData.nomorSurat} 
                                    onChange={handleChange}
                                    placeholder="Opsional - sistem akan mencoba mengidentifikasi kode klasifikasi"
                                />
                                {validationErrors.nomorSurat && (
                                    <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.nomorSurat}</p>
                                )}
                            </div>
                            <div>
                                <InputField 
                                    name="tanggalSurat" 
                                    label="Tanggal Surat" 
                                    type="date" 
                                    value={formData.tanggalSurat} 
                                    onChange={handleChange} 
                                    required 
                                />
                                {validationErrors.tanggalSurat && (
                                    <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.tanggalSurat}</p>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <InputField 
                                name="pengirim" 
                                label="Pengirim / Asal Surat" 
                                value={formData.pengirim} 
                                onChange={handleChange}
                                placeholder="Opsional"
                            />
                            {validationErrors.pengirim && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.pengirim}</p>
                            )}
                        </div>
                        
                        <div>
                            <InputField 
                                name="tujuanSurat" 
                                label="Tujuan Surat" 
                                value={formData.tujuanSurat} 
                                onChange={handleChange}
                                placeholder="Opsional"
                            />
                            {validationErrors.tujuanSurat && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.tujuanSurat}</p>
                            )}
                        </div>
                        
                        <div className="md:col-span-2">
                            <InputField 
                                name="perihal" 
                                label="Perihal / Isi Surat" 
                                value={formData.perihal} 
                                onChange={handleChange} 
                                required 
                                placeholder="Wajib diisi - ringkasan isi surat"
                            />
                            {validationErrors.perihal && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.perihal}</p>
                            )}
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1">
                                Kode Klasifikasi
                                <span className="text-gray-500 text-xs">(Opsional)</span>
                            </label>
                            
                            {/* Toggle Switch untuk memilih mode input */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 mb-6">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <span className="text-sm font-semibold text-gray-700">Mode Input:</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm transition-all duration-200 ${!useManualKode ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                                            📋 Pilih dari Daftar
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setUseManualKode(!useManualKode)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:shadow-md ${
                                                useManualKode ? 'bg-primary-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                                                    useManualKode ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                        <span className={`text-sm transition-all duration-200 ${useManualKode ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                                            ✏️ Input Manual
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border">
                                    {useManualKode ? '💡 Ketik kode klasifikasi secara manual' : '💡 Pilih dari daftar yang tersedia'}
                                </div>
                            </div>
                            
                            {/* Input berdasarkan mode yang dipilih */}
                            {useManualKode ? (
                                <InputField
                                    name="manualKodeInput"
                                    value={manualKodeInput}
                                    onChange={(e) => setManualKodeInput(e.target.value)}
                                    placeholder="Contoh: 001.1 atau 002.3.1"
                                    className="w-full"
                                />
                            ) : (
                                <div className="relative">
                                    <select 
                                        id="kodeKlasifikasi" 
                                        name="kodeKlasifikasi" 
                                        value={formData.kodeKlasifikasi} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
                                        style={{
                                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <option value="" className="text-gray-500">Pilih Kode Klasifikasi (Opsional)</option>
                                    {groupedKlasifikasi.map(group => {
                                        if (group.subItems && group.subItems.length > 0) {
                                            return (
                                                <optgroup 
                                                    key={group.id} 
                                                    label={`${group.kode.toUpperCase()} - ${group.deskripsi.toUpperCase()}`}
                                                    style={{ fontWeight: 'bold', color: '#1f2937' }}
                                                >
                                                    <option 
                                                        key={`main-${group.id}`} 
                                                        value={group.kode}
                                                        style={{ 
                                                            fontWeight: 'bold', 
                                                            backgroundColor: '#f3f4f6',
                                                            color: '#1f2937',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        📁 {group.kode.toUpperCase()} - {group.deskripsi.length > 40 ? group.deskripsi.substring(0, 40) + '...' : group.deskripsi}
                                                    </option>
                                                    {group.subItems.map(item => {
                                                        const indentationLevel = item.kode.split('.').length - 1;
                                                        const isSubCategory = indentationLevel === 1;
                                                        const isSubSubCategory = indentationLevel >= 2;
                                                        
                                                        let prefix = '';
                                                        let indentString = '';
                                                        let bgColor = '#ffffff';
                                                        let textColor = '#374151';
                                                        
                                                        if (isSubCategory) {
                                                            prefix = '├─ 📂 ';
                                                            indentString = '  ';
                                                            bgColor = '#f9fafb';
                                                            textColor = '#4b5563';
                                                        } else if (isSubSubCategory) {
                                                            prefix = '└── 📄 ';
                                                            indentString = '    ';
                                                            bgColor = '#ffffff';
                                                            textColor = '#6b7280';
                                                        }
                                                        
                                                        return (
                                                            <option 
                                                                key={item.id} 
                                                                value={item.kode}
                                                                style={{
                                                                    backgroundColor: bgColor,
                                                                    color: textColor,
                                                                    fontSize: '13px',
                                                                    paddingLeft: `${8 + indentationLevel * 16}px`
                                                                }}
                                                            >
                                                                {indentString}{prefix}{item.kode} - {item.deskripsi.length > 35 ? item.deskripsi.substring(0, 35) + '...' : item.deskripsi}
                                                            </option>
                                                        )
                                                    })}
                                                </optgroup>
                                            );
                                        } else {
                                            return (
                                                <option 
                                                    key={group.id} 
                                                    value={group.kode}
                                                    style={{ 
                                                        fontWeight: 'bold', 
                                                        backgroundColor: '#f3f4f6',
                                                        color: '#1f2937',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    📁 {group.kode.toUpperCase()} - {group.deskripsi.length > 40 ? group.deskripsi.substring(0, 40) + '...' : group.deskripsi}
                                                </option>
                                            );
                                        }
                                    })}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <span className="text-primary-500 text-xs font-medium bg-primary-50 px-2 py-1 rounded-full">Opsional</span>
                                    </div>
                                </div>
                            )}
                            
                            {validationErrors.kodeKlasifikasi && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.kodeKlasifikasi}</p>
                            )}
                            
                            {/* Info tentang auto-identifikasi */}
                            {!useManualKode && (
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Tip: Sistem akan mencoba mengidentifikasi kode klasifikasi dari nomor surat secara otomatis
                                </p>
                            )}
                        </div>
                        
                        {/* Navigation Buttons Step 1 */}
                        <div className="flex justify-end pt-8 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={handleNextStep}
                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Selanjutnya
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Step 2: File Upload & Review */}
                {currentStep === 2 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                <Paperclip size={28} className="text-primary-600" />
                                Upload & Review Dokumen
                            </h2>
                            <p className="text-gray-600 text-sm">Upload dokumen arsip dan review informasi sebelum menyimpan</p>
                        </div>
                        
                        {/* Google Drive Link Input */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                <span className="flex items-center gap-2">
                                    📁 Link Dokumen Google Drive
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Opsional</span>
                                </span>
                            </label>
                            <div className="space-y-3">
                                <InputField
                                    name="googleDriveLink"
                                    value={formData.googleDriveLink || ''}
                                    onChange={handleChange}
                                    placeholder="https://drive.google.com/file/d/your-file-id/view"
                                    className="w-full"
                                />
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="text-blue-600 mt-0.5">💡</div>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Cara mendapatkan link Google Drive:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                                <li>Upload dokumen scan ke Google Drive Anda</li>
                                                <li>Klik kanan pada file → "Dapatkan link"</li>
                                                <li>Pastikan akses diatur ke "Siapa saja yang memiliki link"</li>
                                                <li>Salin dan tempel link di sini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                {validationErrors.googleDriveLink && (
                                    <p className="text-red-500 text-sm animate-shake">{validationErrors.googleDriveLink}</p>
                                )}
                                
                                {/* Google Drive Info Display */}
                                {googleDriveInfo.fileId && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-green-800">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="font-medium text-sm">Link Google Drive berhasil diproses</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="bg-white rounded p-3 border border-green-100">
                                                <label className="block font-medium text-gray-700 mb-1">File ID:</label>
                                                <code className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs break-all">
                                                    {googleDriveInfo.fileId}
                                                </code>
                                            </div>
                                            <div className="bg-white rounded p-3 border border-green-100">
                                                <label className="block font-medium text-gray-700 mb-1">View Link:</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs flex-1 truncate">
                                                        {googleDriveInfo.viewLink}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(googleDriveInfo.viewLink, '_blank')}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title="Buka di Google Drive"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                                            💡 <strong>Otomatis:</strong> File ID dan view link telah diekstrak dari link yang Anda masukkan. 
                                            Data ini akan disimpan secara otomatis ke database.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        

                        
                        {/* Existing File Display for Legacy Files */}
                        {!googleDriveFile && existingFile.fileName && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-blue-900">File saat ini:</p>
                                            <a 
                                                href={`${supabaseUrl}/storage/v1/object/public/arsip-files/${existingFile.filePath}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                            >
                                                {existingFile.fileName}
                                            </a>
                                        </div>
                                        <Download className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            )}

                        {/* Step 2 Navigation Buttons */}
                        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={handlePrevStep}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 hover:shadow-md"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                                Kembali
                            </button>
                            
                            <div className="flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={onFinish} 
                                    className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200 hover:shadow-md"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            {arsipToEdit ? 'Simpan Perubahan' : 'Simpan Arsip'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

// Sisa komponen (NavItem, StatCard, Dashboard, dll.) tetap sama, hanya perlu passing props 'supabase'
// ... (Saya akan menyalin komponen lainnya dengan modifikasi yang diperlukan)

const KlasifikasiManager = ({ supabase, klasifikasiList, editingKlasifikasi, setEditingKlasifikasi, showNotification, setDeleteConfirmModal, openModal }) => {
    // ... (JSX sama, hanya logic handler yang berubah)
    const handleEdit = (klasifikasi) => {
        setEditingKlasifikasi(klasifikasi);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id, kode) => {
        setDeleteConfirmModal({ 
            show: true, 
            id, 
            message: `Anda yakin ingin menghapus kode klasifikasi "${kode}"? Tindakan ini tidak dapat diurungkan dan dapat mempengaruhi arsip yang ada.` 
        });
    };
    return (
        <div className="grid grid-cols-1 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Daftar Kode Klasifikasi</h2>
                    <button onClick={() => { setEditingKlasifikasi(null); openModal && openModal(); }} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Tambah Kode</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase">
                            <tr>
                                <th className="p-3">Kode</th>
                                <th className="p-3">Deskripsi</th>
                                <th className="p-3 text-center">Retensi Aktif</th>
                                <th className="p-3 text-center">Retensi Inaktif</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {klasifikasiList.map(k => {
                                const parts = k.kode.split('.');
                                const isMainCategory = parts.length === 1 && parts[0].length === 3;
                                const isSubCategory = parts.length === 2;
                                const isSubSubCategory = parts.length === 3;
                                const indentationLevel = parts.length - 1;
                                
                                // Tentukan ikon berdasarkan level
                                let icon = '';
                                let bgColor = '';
                                let textColor = '';
                                
                                if (isMainCategory) {
                                    icon = '📁';
                                    bgColor = 'bg-blue-50';
                                    textColor = 'text-blue-800';
                                } else if (isSubCategory) {
                                    icon = '📂';
                                    bgColor = 'bg-green-50';
                                    textColor = 'text-green-700';
                                } else if (isSubSubCategory) {
                                    icon = '📄';
                                    bgColor = 'bg-orange-50';
                                    textColor = 'text-orange-600';
                                } else {
                                    icon = '📄';
                                    bgColor = 'bg-gray-50';
                                    textColor = 'text-gray-600';
                                }
                                
                                return (
                                    <tr key={k.id} className={`border-b border-gray-200 hover:bg-gray-50 ${bgColor}`}>
                                        <td className={`p-3 font-medium ${isMainCategory ? 'font-bold' : ''} ${textColor}`} style={{ paddingLeft: `${0.75 + indentationLevel * 1.5}rem` }}>
                                            <span className="mr-2">{icon}</span>
                                            {k.kode}
                                        </td>
                                        <td className={`p-3 ${isMainCategory ? 'font-bold' : ''} ${textColor}`}>{k.deskripsi}</td>
                                        <td className="p-3 text-center">{k.retensiAktif} thn</td>
                                        <td className="p-3 text-center">{k.retensiInaktif} thn</td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => { handleEdit(k); openModal && openModal(); }} className="text-primary-500 hover:text-primary-700" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(k.id, k.kode)} className="text-red-500 hover:text-red-700" title="Hapus">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KlasifikasiForm = ({ supabase, klasifikasiToEdit, onFinish, showNotification }) => {
    const {
        addKlasifikasiOptimistic,
        confirmKlasifikasiOptimistic,
        rollbackKlasifikasiOptimistic,
        updateKlasifikasiOptimistic,
        confirmKlasifikasiUpdate,
        rollbackKlasifikasiUpdate
    } = useAppStore();
    
    const [formData, setFormData] = useState({
        kode: '',
        deskripsi: '',
        retensiAktif: '',
        retensiInaktif: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (klasifikasiToEdit) {
            setFormData({
                kode: klasifikasiToEdit.kode || '',
                deskripsi: klasifikasiToEdit.deskripsi || '',
                retensiAktif: klasifikasiToEdit.retensiAktif || 0,
                retensiInaktif: klasifikasiToEdit.retensiInaktif || 0
            });
        } else {
            setFormData({ kode: '', deskripsi: '', retensiAktif: '', retensiInaktif: '' });
        }
    }, [klasifikasiToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const val = (name === 'retensiAktif' || name === 'retensiInaktif') ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSave = {
            kode: formData.kode,
            deskripsi: formData.deskripsi,
            retensiAktif: formData.retensiAktif,
            retensiInaktif: formData.retensiInaktif
        };
        
        try {
            let tempId;
            const originalData = klasifikasiToEdit ? { ...klasifikasiToEdit } : null;
            
            if (klasifikasiToEdit) {
                // Optimistic update for existing klasifikasi
                updateKlasifikasiOptimistic(klasifikasiToEdit.id, dataToSave);
                
                const { data, error } = await supabase.from('klasifikasi').update(dataToSave).eq('id', klasifikasiToEdit.id).select().single();
                if (error) {
                    rollbackKlasifikasiUpdate(klasifikasiToEdit.id, originalData);
                    throw error;
                }
                confirmKlasifikasiUpdate(klasifikasiToEdit.id, data);
                showNotification('Kode klasifikasi berhasil diperbarui!', 'success');
                onFinish();
            } else {
                // Optimistic insert for new klasifikasi
                tempId = addKlasifikasiOptimistic(dataToSave);
                
                const { data, error } = await supabase.from('klasifikasi').insert([dataToSave]).select().single();
                if (error) {
                    rollbackKlasifikasiOptimistic(tempId);
                    throw error;
                }
                confirmKlasifikasiOptimistic(tempId, data);
                showNotification('Kode klasifikasi berhasil ditambahkan!', 'success');
                // Reset form untuk input baru tanpa menutup form
                setFormData({ kode: '', deskripsi: '', retensiAktif: '', retensiInaktif: '' });
            }
        } catch (error) {
            console.error("Error saving klasifikasi: ", error);
            showNotification(`Gagal menyimpan data klasifikasi: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 sticky top-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{klasifikasiToEdit ? 'Edit Kode Klasifikasi' : 'Tambah Kode Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField name="kode" label="Kode Klasifikasi" value={formData.kode} onChange={handleChange} required disabled={!!klasifikasiToEdit} />
                <InputField name="deskripsi" label="Deskripsi" value={formData.deskripsi} onChange={handleChange} required />
                <InputField name="retensiAktif" label="Retensi Aktif (Tahun)" type="number" value={formData.retensiAktif} onChange={handleChange} required />
                <InputField name="retensiInaktif" label="Retensi Inaktif (Tahun)" type="number" value={formData.retensiInaktif} onChange={handleChange} required />
                <div className="flex justify-end gap-4 pt-2">
                    {klasifikasiToEdit && <button type="button" onClick={onFinish} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Batal</button>}
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 flex items-center justify-center">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
        </div>
    );
};


const ArsipList = ({ title, arsipList, klasifikasiList, setEditingArsip, supabase, listType, setDeleteConfirmModal }) => {
    const { isItemLoading, deleteArsipOptimistic, confirmArsipDelete, rollbackArsipDelete } = useAppStore();
    const [expandedKlasifikasi, setExpandedKlasifikasi] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('tanggalSurat');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('semua');
    const [filterKlasifikasi, setFilterKlasifikasi] = useState('semua');
    const [viewMode, setViewMode] = useState('table');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.klasifikasi-dropdown')) {
                setExpandedKlasifikasi({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const getKlasifikasiDesc = (kode) => {
        const found = klasifikasiList.find(k => k.kode === kode);
        return found ? found.deskripsi : 'Tidak Ditemukan';
    };

    const getKlasifikasiStyle = (kode) => {
        const parts = kode.split('.');
        const isMainCategory = parts.length === 1 && parts[0].length === 3;
        const isSubCategory = parts.length === 2;
        const isSubSubCategory = parts.length === 3;
        
        if (isMainCategory) {
            return 'font-bold uppercase text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm';
        } else if (isSubCategory) {
            return 'font-medium text-green-700 bg-green-50 px-2 py-1 rounded text-sm ml-2';
        } else if (isSubSubCategory) {
            return 'text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm ml-4';
        }
        return 'text-gray-600';
    };

    const formatKlasifikasiDisplay = (kode) => {
        const parts = kode.split('.');
        const isMainCategory = parts.length === 1 && parts[0].length === 3;
        const isSubCategory = parts.length === 2;
        const isSubSubCategory = parts.length === 3;
        
        if (isMainCategory) {
            return `📁 ${kode}`;
        } else if (isSubCategory) {
            return `📂 ${kode}`;
        } else if (isSubSubCategory) {
            return `📄 ${kode}`;
        }
        return kode;
    };

    const toggleKlasifikasiDropdown = (arsipId) => {
        setExpandedKlasifikasi(prev => ({
            ...prev,
            [arsipId]: !prev[arsipId]
        }));
    };

    const getKlasifikasiHierarchy = (kode) => {
        const parts = kode.split('.');
        const hierarchy = [];
        
        // Main category (e.g., "000")
        if (parts.length >= 1) {
            const mainCode = parts[0];
            const mainKlasifikasi = klasifikasiList.find(k => k.kode === mainCode);
            if (mainKlasifikasi) {
                hierarchy.push({
                    kode: mainCode,
                    deskripsi: mainKlasifikasi.deskripsi,
                    level: 'main'
                });
            }
        }
        
        // Sub category (e.g., "000.01")
        if (parts.length >= 2) {
            const subCode = `${parts[0]}.${parts[1]}`;
            const subKlasifikasi = klasifikasiList.find(k => k.kode === subCode);
            if (subKlasifikasi) {
                hierarchy.push({
                    kode: subCode,
                    deskripsi: subKlasifikasi.deskripsi,
                    level: 'sub'
                });
            }
        }
        
        // Sub-sub category (e.g., "000.01.01")
        if (parts.length >= 3) {
            const subSubCode = kode;
            const subSubKlasifikasi = klasifikasiList.find(k => k.kode === subSubCode);
            if (subSubKlasifikasi) {
                hierarchy.push({
                    kode: subSubCode,
                    deskripsi: subSubKlasifikasi.deskripsi,
                    level: 'subsub'
                });
            }
        }
        
        return hierarchy;
    };

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        if (!arsipList) return [];
        
        let filtered = arsipList.filter(arsip => {
            // Search filter
            const searchMatch = !searchTerm || 
                arsip.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arsip.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arsip.tujuanSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getKlasifikasiDesc(arsip.kodeKlasifikasi).toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const today = new Date();
            const retensiDate = new Date(arsip.tanggalRetensi);
            const isActive = !retensiDate || today <= retensiDate;
            const statusMatch = filterStatus === 'semua' || 
                (filterStatus === 'aktif' && isActive) ||
                (filterStatus === 'inaktif' && !isActive);
            
            // Klasifikasi filter
            const klasifikasiMatch = filterKlasifikasi === 'semua' || 
                arsip.kodeKlasifikasi.startsWith(filterKlasifikasi);
            
            return searchMatch && statusMatch && klasifikasiMatch;
        });
        
        // Sort data
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'perihal':
                    aValue = a.perihal.toLowerCase();
                    bValue = b.perihal.toLowerCase();
                    break;
                case 'nomorSurat':
                    aValue = a.nomorSurat.toLowerCase();
                    bValue = b.nomorSurat.toLowerCase();
                    break;
                case 'tanggalSurat':
                    aValue = new Date(a.tanggalSurat);
                    bValue = new Date(b.tanggalSurat);
                    break;
                case 'tanggalRetensi':
                    aValue = new Date(a.tanggalRetensi);
                    bValue = new Date(b.tanggalRetensi);
                    break;
                case 'status':
                    const todayForSort = new Date();
                    const aRetensi = new Date(a.tanggalRetensi);
                    const bRetensi = new Date(b.tanggalRetensi);
                    aValue = (!aRetensi || todayForSort <= aRetensi) ? 'aktif' : 'inaktif';
                    bValue = (!bRetensi || todayForSort <= bRetensi) ? 'aktif' : 'inaktif';
                    break;
                default:
                    aValue = a[sortBy];
                    bValue = b[sortBy];
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }, [arsipList, searchTerm, sortBy, sortOrder, filterStatus, filterKlasifikasi, klasifikasiList]);
    
    // Pagination
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const paginatedData = filteredAndSortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterKlasifikasi, sortBy, sortOrder]);
    
    // Show skeleton if data is still loading
    const isDataLoading = !arsipList || arsipList.length === 0;
    
    // Get unique klasifikasi for filter dropdown
    const uniqueKlasifikasi = useMemo(() => {
        if (!arsipList) return [];
        const codes = [...new Set(arsipList.map(arsip => {
            const parts = arsip.kodeKlasifikasi.split('.');
            return parts[0]; // Get main category
        }))];
        return codes.map(code => {
            const klasifikasi = klasifikasiList.find(k => k.kode === code);
            return { kode: code, deskripsi: klasifikasi?.deskripsi || code };
        });
    }, [arsipList, klasifikasiList]);

    const handleDelete = (id, filePath, perihal) => {
        setDeleteConfirmModal({ 
            show: true, 
            id, 
            filePath,
            message: `Anda yakin ingin menghapus arsip "${perihal}"? Tindakan ini tidak dapat diurungkan dan akan menghapus file terkait.`,
            onConfirm: async () => {
                // Find the original data for potential rollback
                const originalData = arsipList.find(arsip => arsip.id === id);
                
                try {
                    // Optimistic delete
                    deleteArsipOptimistic(id);
                    
                    // Hapus file dari storage jika ada
                    if (filePath) {
                        const { error: fileError } = await supabase.storage.from('arsip-files').remove([filePath]);
                        if (fileError) console.warn("Could not delete file:", fileError.message);
                    }
                    // Hapus record dari database
                    const { error: dbError } = await supabase.from('arsip').delete().eq('id', id);
                    if (dbError) {
                        rollbackArsipDelete(originalData);
                        throw dbError;
                    }
                    
                    confirmArsipDelete(id);

                } catch (error) {
                    console.error("Error deleting document or file:", error);
                    // Use toast notification instead of alert for consistency
                    toast.error(`Gagal menghapus arsip: ${error.message || 'Terjadi kesalahan'}`);
                }
            }
        });
    };
    
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{title}</h3>
                        <p className="text-sm text-gray-500">
                            Menampilkan {filteredAndSortedData.length} dari {arsipList?.length || 0} arsip
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ExportExcelButton data={filteredAndSortedData} filename={`Daftar_Arsip_${listType}`} klasifikasiList={klasifikasiList} />
                    </div>
                </div>
                
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari perihal, nomor surat, tujuan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="inaktif">Inaktif</option>
                        </select>
                    </div>
                    
                    {/* Klasifikasi Filter */}
                    <div>
                        <select
                            value={filterKlasifikasi}
                            onChange={(e) => setFilterKlasifikasi(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="semua">Semua Klasifikasi</option>
                            {uniqueKlasifikasi.map(k => (
                                <option key={k.kode} value={k.kode}>
                                    {k.kode} - {k.deskripsi}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Sort By */}
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="tanggalSurat">Tanggal Surat</option>
                            <option value="perihal">Perihal</option>
                            <option value="nomorSurat">Nomor Surat</option>
                            <option value="tanggalRetensi">Tanggal Retensi</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                    
                    {/* Sort Order & View Mode */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                            title={`Urutkan ${sortOrder === 'asc' ? 'Menurun' : 'Menaik'}`}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                            title={`Tampilan ${viewMode === 'table' ? 'Grid' : 'Tabel'}`}
                        >
                            {viewMode === 'table' ? '⊞' : '☰'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Content Section */}
            <div className="p-6">
                {isDataLoading ? (
                    <div className="space-y-4">
                        <ArsipSkeleton />
                        <ArsipSkeleton />
                        <ArsipSkeleton />
                    </div>
                ) : filteredAndSortedData.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Archive className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada arsip ditemukan</h3>
                        <p className="text-gray-500 mb-4">Coba ubah filter atau kata kunci pencarian Anda</p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('semua');
                                setFilterKlasifikasi('semua');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Lampiran</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Perihal</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Nomor Surat</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Tujuan</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Surat</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Retensi</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Klasifikasi</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map(arsip => {
                                const today = new Date();
                                const retensiDate = new Date(arsip.tanggalRetensi);
                                let status = 'Aktif';
                                let statusColor = 'text-green-600';
                                if (retensiDate && today > retensiDate) {
                                    status = 'Inaktif';
                                    statusColor = 'text-red-600';
                                }
                                const fileUrl = arsip.filePath ? `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}` : null;

                                            return (
                                                <tr key={arsip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="py-4 px-4 text-center">
                                        {fileUrl ? (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700" title={arsip.fileName}>
                                                <Paperclip size={18} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">{arsip.perihal}</span>
                                                            {(arsip.googleDriveLink || arsip.filePath) && (
                                                                <div className="flex items-center gap-1">
                                                                    {arsip.googleDriveLink && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title="Dokumen tersedia di Google Drive">
                                                                            <Eye size={12} className="mr-1" />
                                                                            GDrive
                                                                        </span>
                                                                    )}
                                                                    {arsip.filePath && !arsip.googleDriveLink && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" title="File tersedia di server">
                                                                            <FileText size={12} className="mr-1" />
                                                                            File
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-600">{arsip.nomorSurat}</td>
                                                    <td className="py-4 px-4 text-gray-600">{arsip.tujuanSurat}</td>
                                                    <td className="py-4 px-4 text-gray-600">{new Date(arsip.tanggalSurat).toLocaleDateString('id-ID')}</td>
                                                    <td className="py-4 px-4 text-gray-600">{retensiDate ? retensiDate.toLocaleDateString('id-ID') : 'N/A'}</td>
                                                    <td className={`py-4 px-4 font-medium ${statusColor}`}>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {status === 'Aktif' ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 relative">
                                                        <div className="relative klasifikasi-dropdown">
                                                            <button 
                                                                onClick={() => toggleKlasifikasiDropdown(arsip.id)}
                                                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 w-full text-left"
                                                                title="Klik untuk melihat hierarki klasifikasi"
                                                            >
                                                                <span className={getKlasifikasiStyle(arsip.kodeKlasifikasi)}>
                                                                    {formatKlasifikasiDisplay(arsip.kodeKlasifikasi)}
                                                                </span>
                                                                <ChevronRight 
                                                                    size={14} 
                                                                    className={`transition-transform duration-200 ${
                                                                        expandedKlasifikasi[arsip.id] ? 'rotate-90' : ''
                                                                    }`}
                                                                />
                                                            </button>
                                            
                                            {expandedKlasifikasi[arsip.id] && (
                                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-80 max-w-96">
                                                    <div className="p-3 space-y-2">
                                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                            Hierarki Klasifikasi
                                                        </div>
                                                        {getKlasifikasiHierarchy(arsip.kodeKlasifikasi).map((item, index) => (
                                                            <div key={item.kode} className={`flex items-start gap-3 p-2 rounded ${
                                                                item.level === 'main' ? 'bg-blue-50 border-l-4 border-blue-400' :
                                                                item.level === 'sub' ? 'bg-green-50 border-l-4 border-green-400 ml-4' :
                                                                'bg-orange-50 border-l-4 border-orange-400 ml-8'
                                                            }`}>
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    {item.level === 'main' && <span className="text-blue-600">📁</span>}
                                                                    {item.level === 'sub' && <span className="text-green-600">📂</span>}
                                                                    {item.level === 'subsub' && <span className="text-orange-600">📄</span>}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`font-medium text-sm ${
                                                                        item.level === 'main' ? 'text-blue-800' :
                                                                        item.level === 'sub' ? 'text-green-800' :
                                                                        'text-orange-800'
                                                                    }`}>
                                                                        {item.kode}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-1 break-words">
                                                                        {item.deskripsi}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            {/* Google Drive Actions */}
                                                            {arsip.googleDriveLink && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => window.open(arsip.googleDriveLink, '_blank')} 
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200" 
                                                                        title="Lihat Dokumen di Google Drive"
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            try {
                                                                                const fileId = parseGoogleDriveLink(arsip.googleDriveLink)?.fileId;
                                                                                if (fileId) {
                                                                                    const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                                                                    window.open(downloadLink, '_blank');
                                                                                } else {
                                                                                    // Fallback untuk format link lama
                                                                                    const downloadLink = arsip.googleDriveLink.replace('/view', '/export?format=pdf');
                                                                                    window.open(downloadLink, '_blank');
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error downloading file:', error);
                                                                                toast.error('Gagal mengunduh file. Silakan coba buka file di Google Drive.');
                                                                            }
                                                                        }} 
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200" 
                                                                        title="Download Dokumen"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </>
                                            )}
                                                            {/* Traditional File Actions */}
                                                            {arsip.filePath && !arsip.googleDriveLink && (
                                                                <button 
                                                                    onClick={() => window.open(`${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`, '_blank')} 
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200" 
                                                                    title="Lihat File"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => setEditingArsip(arsip)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200" title="Edit">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(arsip.id, arsip.filePath, arsip.perihal)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200" title="Hapus">
                                                                <Trash2 size={16} />
                                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedData.map(arsip => {
                                    const isActive = new Date(arsip.tanggalRetensi) > new Date();
                                    return (
                                        <div key={arsip.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {arsip.googleDriveLink && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            GDrive
                                                        </span>
                                                    )}
                                                    {arsip.filePath && !arsip.googleDriveLink && (
                                                        <Paperclip size={14} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                    {isActive ? 'Aktif' : 'Inaktif'}
                                                </span>
                                            </div>
                                            
                                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{arsip.perihal}</h4>
                                            <p className="text-sm text-gray-600 mb-1">No: {arsip.nomorSurat}</p>
                                            <p className="text-sm text-gray-600 mb-2">Tujuan: {arsip.tujuanSurat}</p>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                <span>{new Date(arsip.tanggalSurat).toLocaleDateString('id-ID')}</span>
                                                <span className={getKlasifikasiStyle(arsip.kodeKlasifikasi)}>
                                                    {formatKlasifikasiDisplay(arsip.kodeKlasifikasi)}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-1">
                                                    {arsip.googleDriveLink && (
                                                        <>
                                                            <button 
                                                                onClick={() => window.open(arsip.googleDriveLink, '_blank')} 
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200" 
                                                                title="Lihat di Google Drive"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    try {
                                                                        const fileId = parseGoogleDriveLink(arsip.googleDriveLink)?.fileId;
                                                                        if (fileId) {
                                                                            const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                                                            window.open(downloadLink, '_blank');
                                                                        } else {
                                                                            const downloadLink = arsip.googleDriveLink.replace('/view', '/export?format=pdf');
                                                                            window.open(downloadLink, '_blank');
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Error downloading file:', error);
                                                                        toast.error('Gagal mengunduh file. Silakan coba buka file di Google Drive.');
                                                                    }
                                                                }} 
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors duration-200" 
                                                                title="Download"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {arsip.filePath && !arsip.googleDriveLink && (
                                                        <button 
                                                            onClick={() => window.open(`${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`, '_blank')} 
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200" 
                                                            title="Lihat File"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setEditingArsip(arsip)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors duration-200" title="Edit">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(arsip.id, arsip.filePath, arsip.perihal)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors duration-200" title="Hapus">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-500">
                                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} dari {filteredAndSortedData.length} arsip
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Sebelumnya
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white'
                                                            : 'border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const AdvancedSearchView = ({ arsipList, ...props }) => {
    const [filters, setFilters] = useState({
        keyword: '',
        startDate: '',
        endDate: '',
        status: 'semua',
        klasifikasi: 'semua'
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            keyword: '',
            startDate: '',
            endDate: '',
            status: 'semua',
            klasifikasi: 'semua'
        });
    };

    const filteredArsip = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (arsipList || []).filter(arsip => {
            if (filters.keyword) {
                const keyword = filters.keyword.toLowerCase();
                const searchable = `${arsip.perihal || ''} ${arsip.nomorSurat || ''} ${arsip.pengirim || ''} ${arsip.tujuanSurat || ''}`.toLowerCase();
                if (!searchable.includes(keyword)) return false;
            }
            if (filters.status !== 'semua') {
                const retensiDate = new Date(arsip.tanggalRetensi);
                const isInactive = retensiDate && retensiDate < today;
                if (filters.status === 'aktif' && isInactive) return false;
                if (filters.status === 'inaktif' && !isInactive) return false;
            }
            if (filters.klasifikasi !== 'semua' && arsip.kodeKlasifikasi !== filters.klasifikasi) {
                return false;
            }
            const tglSurat = new Date(arsip.tanggalSurat);
            if (filters.startDate && (!tglSurat || tglSurat < new Date(filters.startDate))) {
                return false;
            }
            if (filters.endDate && (!tglSurat || tglSurat > new Date(filters.endDate))) {
                 return false;
            }
            return true;
        });
    }, [arsipList, filters]);

    return (
        <div>
             <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-3"><Filter size={24} /> Pencarian Lanjutan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField name="keyword" label="Kata Kunci" value={filters.keyword} onChange={handleFilterChange} placeholder="Perihal, nomor surat..." />
                    <div className="grid grid-cols-2 gap-2">
                        <InputField name="startDate" label="Dari Tanggal" type="date" value={filters.startDate} onChange={handleFilterChange} />
                        <InputField name="endDate" label="Sampai Tanggal" type="date" value={filters.endDate} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status Arsip</label>
                        <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="semua">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="inaktif">Inaktif</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="klasifikasi" className="block text-sm font-medium text-gray-700 mb-1">Kode Klasifikasi</label>
                        <select 
                            name="klasifikasi" 
                            id="klasifikasi" 
                            value={filters.klasifikasi} 
                            onChange={handleFilterChange} 
                            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                            }}
                        >
                           <option value="semua">Semua Klasifikasi</option>
                           {(props.klasifikasiList || []).sort((a,b) => (a.kode || '').localeCompare(b.kode || '', undefined, {numeric: true})).map(k => {
                               const parts = k.kode.split('.');
                               const isMainCategory = parts.length === 1 && parts[0].length === 3;
                               const isSubCategory = parts.length === 2;
                               const isSubSubCategory = parts.length === 3;
                               const indentationLevel = parts.length - 1;
                               
                               let icon = '';
                               let bgColor = '#ffffff';
                               let textColor = '#374151';
                               
                               if (isMainCategory) {
                                   icon = '📁';
                                   bgColor = '#eff6ff';
                                   textColor = '#1e40af';
                               } else if (isSubCategory) {
                                   icon = '📂';
                                   bgColor = '#f0fdf4';
                                   textColor = '#15803d';
                               } else if (isSubSubCategory) {
                                   icon = '📄';
                                   bgColor = '#fff7ed';
                                   textColor = '#ea580c';
                               } else {
                                   icon = '📄';
                                   bgColor = '#f9fafb';
                                   textColor = '#6b7280';
                               }
                               
                               return (
                                   <option 
                                       key={k.id} 
                                       value={k.kode}
                                       style={{
                                           backgroundColor: bgColor,
                                           color: textColor,
                                           fontSize: '13px',
                                           paddingLeft: `${8 + indentationLevel * 16}px`
                                       }}
                                   >
                                       {icon} {k.kode} - {k.deskripsi}
                                   </option>
                               );
                           })}
                        </select>
                    </div>
                </div>
                 <div className="mt-4 flex justify-end">
                    <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                        <X size={16} /> Reset Filter
                    </button>
                </div>
            </div>
            <ArsipList {...props} title={`Hasil Pencarian (${filteredArsip.length} ditemukan)`} arsipList={filteredArsip} setEditingArsip={(a) => { props.setEditingArsip(a); props.navigate('tambah'); }} listType="pencarian" />
        </div>
    );
};

const ReportingView = ({ arsipList, klasifikasiList }) => {
    // Logika komponen ini tidak perlu diubah karena hanya memproses data yang sudah ada di client
    return <div className="text-center p-8 bg-white rounded-xl shadow-md border border-gray-200">Fitur Laporan dalam pengembangan untuk versi Supabase.</div>;
};

const InfoModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-large p-8 max-w-md w-full relative border border-gray-100 animate-slideUp">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"><XCircle size={24} /></button>
                <div className="flex flex-col items-center text-center">
                    <Archive size={48} className="text-primary-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">Sistem Arsip Digital</h2>
                    <p className="text-gray-600 mb-2 leading-relaxed">Aplikasi Manajemen Kearsipan Digital</p>
                    <p className="text-sm text-gray-500">Aplikasi manajemen arsip digital yang ditenagai oleh React, Vite, Supabase, dan di-hosting di Vercel.</p>
                </div>
            </div>
        </div>
    );
};

// Komponen NavItem yang sudah diperbarui
const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-primary-50 text-primary-600 shadow-soft border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
        {icon} <span>{label}</span>
    </button>
);



const Dashboard = ({ stats, activeArchives, inactiveArchives, archivesByYear, ...props }) => {
    const [activeTab, setActiveTab] = useState('aktif');
    const { navigate, setEditingArsip } = props;
    const { isItemLoading } = useAppStore();

    // Show skeleton if data is still loading
    const isDataLoading = !stats || stats.total === undefined;

    const statCards = [
        { 
            icon: Archive, 
            title: "Total Arsip", 
            value: stats?.total || 0, 
            color: "blue", 
            trend: "+12%",
            onClick: () => navigate('semua')
        },
        { 
            icon: CheckCircle, 
            title: "Arsip Aktif", 
            value: stats?.active || 0, 
            color: "green", 
            trend: "+8%",
            onClick: () => {
                navigate('semua');
                // Set filter untuk arsip aktif setelah navigasi
                setTimeout(() => {
                    const activeTab = document.querySelector('[data-tab="aktif"]');
                    if (activeTab) activeTab.click();
                }, 100);
            }
        },
        { 
            icon: AlertCircle, 
            title: "Arsip Inaktif", 
            value: stats?.inactive || 0, 
            color: "red", 
            trend: "-3%",
            onClick: () => {
                navigate('semua');
                // Set filter untuk arsip inaktif setelah navigasi
                setTimeout(() => {
                    const inactiveTab = document.querySelector('[data-tab="inaktif"]');
                    if (inactiveTab) inactiveTab.click();
                }, 100);
            }
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Selamat datang di Sistem Arsip Digital</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Badge variant="success" className="px-3 py-1">
                        <Clock size={14} className="mr-1" />
                        Live Data
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isDataLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    statCards.map((card, index) => (
                        <div key={card.title}>
                            <StatCard {...card} />
                        </div>
                    ))
                )}
            </div>

            {/* Chart Card */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart size={20} className="text-blue-600" />
                                Volume Arsip per Tahun
                            </CardTitle>
                            <CardDescription>
                                Distribusi arsip berdasarkan tahun pembuatan
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-white/50">
                            {archivesByYear.length} Tahun
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {archivesByYear.length > 0 ? (
                        <div>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={archivesByYear} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.5)' }}
                                    />
                                    <YAxis 
                                        allowDecimals={false} 
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.5)' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                            border: '1px solid rgba(148, 163, 184, 0.2)', 
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                                        }} 
                                        itemStyle={{ color: '#374151', fontWeight: '500' }} 
                                        labelStyle={{ color: '#111827', fontWeight: 'bold' }} 
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                                    <Bar 
                                        dataKey="Aktif" 
                                        stackId="a" 
                                        fill="url(#greenGradient)" 
                                        name="Aktif" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                    <Bar 
                                        dataKey="Inaktif" 
                                        stackId="a" 
                                        fill="url(#redGradient)" 
                                        name="Inaktif" 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                    <defs>
                                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" />
                                            <stop offset="100%" stopColor="#dc2626" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <Archive size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Belum ada data arsip</p>
                            <p className="text-sm">Data akan muncul setelah Anda menambahkan arsip pertama</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Archive Lists */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers size={20} className="text-indigo-600" />
                        Daftar Arsip
                    </CardTitle>
                    <CardDescription>
                        Kelola dan lihat arsip berdasarkan status
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button 
                                data-tab="aktif"
                                onClick={() => setActiveTab('aktif')} 
                                className={`${
                                    activeTab === 'aktif' 
                                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    Arsip Aktif
                                    <Badge variant={activeTab === 'aktif' ? 'default' : 'secondary'} className="ml-1">
                                        {activeArchives.length}
                                    </Badge>
                                </div>
                            </button>
                            <button 
                                data-tab="inaktif"
                                onClick={() => setActiveTab('inaktif')} 
                                className={`${
                                    activeTab === 'inaktif' 
                                        ? 'border-red-500 text-red-600 bg-red-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200`}
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Arsip Inaktif
                                    <Badge variant={activeTab === 'inaktif' ? 'destructive' : 'secondary'} className="ml-1">
                                        {inactiveArchives.length}
                                    </Badge>
                                </div>
                            </button>
                        </nav>
                    </div>
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'aktif' && (
                                <div key="aktif">
                                    <ArsipList 
                                        {...props} 
                                        title="Daftar Arsip Aktif" 
                                        arsipList={activeArchives} 
                                        setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} 
                                        listType="aktif" 
                                    />
                                </div>
                            )}
                            {activeTab === 'inaktif' && (
                                <div key="inaktif">
                                    <ArsipList 
                                        {...props} 
                                        title="Daftar Arsip Inaktif" 
                                        arsipList={inactiveArchives} 
                                        setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} 
                                        listType="inaktif" 
                                    />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ExportExcelButton = ({ data, filename, klasifikasiList }) => {
    // ... (Komponen ini tidak perlu diubah)
    return (
        <button 
            // onClick={handleExport}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
            <FileDown size={16} />
            Ekspor Excel
        </button>
    );
};

const AdminLoginForm = ({ onSubmit }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await onSubmit?.(email, password);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@simantep.local" required />
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
				<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi" required />
			</div>
			<button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60">
				{loading ? 'Masuk...' : 'Masuk'}
			</button>
			<p className="text-xs text-gray-500 text-center">Hanya akun admin yang diizinkan</p>
		</form>
	);
};
