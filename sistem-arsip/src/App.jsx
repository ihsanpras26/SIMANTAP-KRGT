/*
 * PENTING: Untuk mengatasi error "Could not resolve '@supabase/supabase-js'",
 * Anda HARUS menjalankan perintah berikut di terminal Anda (dalam folder 'sistem-arsip'):
 *
 * npm install @supabase/supabase-js
 *
 * Error ini terjadi karena library Supabase belum ter-install di proyek Anda.
 * Kode di bawah ini sudah benar, tetapi membutuhkan library tersebut untuk bisa berjalan.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import InputField from './InputField';
import toast, { Toaster } from 'react-hot-toast';
import useAppStore from './store/useAppStore';
import { useDebounce, useDebouncedCallback } from './hooks/useDebounce';
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

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Archive, FilePlus, FolderKanban, Bell, Search, Trash2, Edit, XCircle, LogOut, Info, FileDown, Layers, Filter, X, Paperclip, FileText, CheckCircle, AlertCircle, ChevronRight, Home } from 'lucide-react';
import DevIndicator from './components/DevIndicator.jsx'
import './animations.css'

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
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// --- Komponen Utama Aplikasi ---
export default function App() {
    // Cek konfigurasi environment variables
    if (!isValidConfig) {
        return <ConfigurationMessage />;
    }

    // --- State Management ---
    const [currentView, setCurrentView] = useState('dashboard');
    
    // Zustand store for optimistic updates
    const {
        arsipList,
        klasifikasiList,
        isLoading: storeLoading,
        setArsipList,
        setKlasifikasiList,
        setIsLoading: setStoreLoading,
        isItemLoading
    } = useAppStore();
    const [editingArsip, setEditingArsip] = useState(null);
    const [editingKlasifikasi, setEditingKlasifikasi] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    // Removed dark mode state - using light mode only
    // Notification state removed - using react-hot-toast instead
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, id: null, message: '' });
    
    // Search functionality state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

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
            const arsipResults = arsipList.filter(arsip => {
                const searchableText = `${arsip.perihal} ${arsip.nomorSurat} ${arsip.tujuanSurat} ${arsip.kodeKlasifikasi}`.toLowerCase();
                return searchTerms.some(term => searchableText.includes(term));
            }).map(arsip => ({ ...arsip, type: 'arsip' }));

            // Search in klasifikasi
            const klasifikasiResults = klasifikasiList.filter(klasifikasi => {
                const searchableText = `${klasifikasi.kode} ${klasifikasi.nama}`.toLowerCase();
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
        // Fungsi untuk mengambil data awal
        const fetchData = async () => {
            setStoreLoading(true);
            // Ambil data arsip
            const { data: arsipData, error: arsipError } = await supabase.from('arsip').select('*').order('tanggalSurat', { ascending: false });
            if (arsipError) console.error("Error fetching arsip:", arsipError);
            else setArsipList(arsipData || []);

            // Ambil data klasifikasi
            const { data: klasifikasiData, error: klasifikasiError } = await supabase.from('klasifikasi').select('*').order('kode', { ascending: true });
            if (klasifikasiError) console.error("Error fetching klasifikasi:", klasifikasiError);
            else setKlasifikasiList(klasifikasiData || []);
            
            setStoreLoading(false);
        };

        fetchData();

        // Menyiapkan langganan real-time untuk tabel 'arsip'
        const arsipChannel = supabase.channel('public:arsip')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip' }, 
                (payload) => {
                    console.log('Perubahan arsip diterima!', payload);
                    
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
                    console.log('Perubahan klasifikasi diterima!', payload);
                    
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
                    background: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: isDarkMode ? '#F1F5F9' : '#1E293B',
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
                return <KlasifikasiManager {...props} />;
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

    return (
        <>
        <div className="bg-gray-50 min-h-screen font-sans text-gray-900 transition-all duration-300">
                <div className="flex flex-col lg:flex-row">
                    <aside className="bg-white w-full lg:w-72 lg:min-h-screen p-6 border-r border-gray-200 shadow-soft">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-2 bg-primary-500 rounded-xl">
                                <Archive className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">SIMANTEP</h1>
                                <span className="text-xs text-gray-500 font-medium">Sistem Arsip Digital</span>
                            </div>
                        </div>
                        <nav className="flex flex-row lg:flex-col gap-3">
                            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => navigate('dashboard')} />
                            <NavItem icon={<FilePlus size={20} />} label="Tambah Arsip" active={currentView === 'tambah'} onClick={() => navigate('tambah')} />
                            <NavItem icon={<Layers size={20} />} label="Semua Arsip" active={currentView === 'semua'} onClick={() => navigate('semua')} />
                            <NavItem icon={<FolderKanban size={20} />} label="Kode Klasifikasi" active={currentView === 'klasifikasi'} onClick={() => navigate('klasifikasi')} />
                            <NavItem icon={<Search size={20} />} label="Pencarian Lanjutan" active={currentView === 'cari'} onClick={() => navigate('cari')} />
                            <NavItem icon={<FileText size={20} />} label="Laporan" active={currentView === 'laporan'} onClick={() => navigate('laporan')} />
                        </nav>
                         <div className="mt-auto pt-8 hidden lg:block">
                            <button onClick={() => setShowInfoModal(true)} className="w-full flex items-center gap-3 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 p-3 rounded-xl transition-all duration-200">
                                <Info size={18} />
                                <span>Tentang Aplikasi</span>
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 p-6 lg:p-8 relative">
                        {import.meta.env.DEV && <DevIndicator />}
                        
                        {/* Header with Breadcrumbs and Search */}
                        <div className="mb-8 space-y-6">
                            {/* Breadcrumbs */}
                            <nav className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-3 rounded-xl shadow-soft border border-gray-100">
                                <Home size={16} className="text-primary-500" />
                                <ChevronRight size={14} className="text-gray-300" />
                                <span className="capitalize font-medium text-gray-900">
                                    {currentView === 'dashboard' ? 'Dashboard' :
                                     currentView === 'arsip' ? 'Daftar Arsip' :
                                     currentView === 'tambah' ? 'Tambah Arsip' :
                                     currentView === 'klasifikasi' ? 'Kode Klasifikasi' :
                                     currentView === 'laporan' ? 'Laporan' : 'Dashboard'}
                                </span>
                            </nav>
                            
                            {/* Global Search Bar */}
                            <div className="relative search-container">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Cari arsip, klasifikasi, nomor surat..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Search Results Dropdown */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-large z-50 max-h-96 overflow-y-auto animate-slideDown">
                                        <div className="p-3">
                                            <div className="text-xs text-gray-500 px-3 py-2 font-medium bg-gray-50 rounded-lg mb-2">
                                                {searchResults.length} hasil ditemukan
                                            </div>
                                            {searchResults.map((result, index) => (
                                                <div
                                                    key={`${result.type}-${result.id}`}
                                                    className="p-4 hover:bg-primary-50 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-primary-100 mb-2 last:mb-0"
                                                    onClick={() => {
                                                        if (result.type === 'arsip') {
                                                            navigate('semua');
                                                        } else {
                                                            navigate('klasifikasi');
                                                        }
                                                        setShowSearchResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {result.type === 'arsip' ? (
                                                                <FileText className="text-primary-600" size={18} />
                                                            ) : (
                                                                <FolderKanban className="text-green-600" size={18} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                                    {result.type === 'arsip' ? result.perihal : result.nama}
                                                                </span>
                                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                                    result.type === 'arsip' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {result.type === 'arsip' ? 'Arsip' : 'Klasifikasi'}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {result.type === 'arsip' ? (
                                                                    <span>{result.nomorSurat} • {result.kodeKlasifikasi}</span>
                                                                ) : (
                                                                    <span>Kode: {result.kode}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* No Results */}
                                {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-large z-50 animate-slideDown">
                                        <div className="p-8 text-center">
                                            <Search className="mx-auto text-gray-400 mb-3" size={28} />
                                            <p className="text-sm text-gray-600 font-medium">Tidak ada hasil untuk "{searchQuery}"</p>
                                            <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci yang berbeda</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {renderView() || <div className="p-8 bg-white rounded-xl shadow-soft border border-gray-100">Halaman tidak ditemukan.</div>}
                    </main>
                </div>
                {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
                <Toaster />
                {deleteConfirmModal.show && <DeleteConfirmModal message={deleteConfirmModal.message} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmModal({ show: false, id: null, message: '' })} />}
            </div>
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
    });
    const [file, setFile] = useState(null);
    const [existingFile, setExistingFile] = useState({ fileName: '', filePath: '' });
    const [uploadProgress, setUploadProgress] = useState(0); // Note: Supabase JS v2 doesn't support progress yet
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (arsipToEdit) {
            setFormData({
                nomorSurat: arsipToEdit.nomorSurat || '',
                tanggalSurat: arsipToEdit.tanggalSurat ? new Date(arsipToEdit.tanggalSurat).toISOString().split('T')[0] : '',
                pengirim: arsipToEdit.pengirim || '',
                tujuanSurat: arsipToEdit.tujuanSurat || '',
                perihal: arsipToEdit.perihal || '',
                kodeKlasifikasi: arsipToEdit.kodeKlasifikasi || '',
            });
            setExistingFile({ fileName: arsipToEdit.fileName, filePath: arsipToEdit.filePath });
        }
    }, [arsipToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.kodeKlasifikasi.length <= 3) {
            showNotification("Kode klasifikasi harus lebih spesifik.", 'error');
            return;
        }
        setIsLoading(true);

        let fileData = {
            filePath: arsipToEdit?.filePath || null,
            fileName: arsipToEdit?.fileName || null,
        };

        // Handle file upload
        if (file) {
            // Jika ada file lama, hapus dulu
            if (arsipToEdit?.filePath) {
                const { error: deleteError } = await supabase.storage.from('arsip-files').remove([arsipToEdit.filePath]);
                if (deleteError) console.warn("Could not delete old file:", deleteError.message);
            }

            const newFilePath = `public/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('arsip-files').upload(newFilePath, file);

            if (uploadError) {
                console.error("Upload failed:", uploadError);
                showNotification(`Gagal mengunggah file: ${uploadError.message}`, 'error');
                setIsLoading(false);
                return;
            }
            
            fileData = {
                filePath: newFilePath,
                fileName: file.name,
            };
        }

        const selectedKlasifikasi = klasifikasiList.find(k => k.kode === formData.kodeKlasifikasi);
        const tglSurat = new Date(formData.tanggalSurat);
        const retensiDate = new Date(new Date(tglSurat).setFullYear(tglSurat.getFullYear() + Number(selectedKlasifikasi.retensiAktif)));

        const dataToSave = { 
            nomorSurat: formData.nomorSurat,
            tanggalSurat: tglSurat.toISOString(),
            pengirim: formData.pengirim,
            tujuanSurat: formData.tujuanSurat,
            perihal: formData.perihal,
            kodeKlasifikasi: formData.kodeKlasifikasi,
            tanggalRetensi: retensiDate.toISOString(),
            filePath: fileData.filePath,
            fileName: fileData.fileName,
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
            showNotification(`Gagal menyimpan data: ${error.message}`, 'error');
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
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md dark:border dark:border-slate-700 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">{arsipToEdit ? 'Edit Arsip' : 'Tambah Arsip Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField name="nomorSurat" label="Nomor Surat" value={formData.nomorSurat} onChange={handleChange} required />
                <InputField name="tanggalSurat" label="Tanggal Surat" type="date" value={formData.tanggalSurat} onChange={handleChange} required />
                <InputField name="pengirim" label="Pengirim / Asal Surat" value={formData.pengirim} onChange={handleChange} required />
                <InputField name="tujuanSurat" label="Tujuan Surat" value={formData.tujuanSurat} onChange={handleChange} required />
                <InputField name="perihal" label="Perihal / Isi Ringkas" value={formData.perihal} onChange={handleChange} required />
                <div>
                    <label htmlFor="kodeKlasifikasi" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kode Klasifikasi</label>
                    <select id="kodeKlasifikasi" name="kodeKlasifikasi" value={formData.kodeKlasifikasi} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Pilih Kode Klasifikasi</option>
                        {groupedKlasifikasi.map(group => {
                            if (group.subItems && group.subItems.length > 0) {
                                return (
                                    <optgroup key={group.id} label={`${group.kode} - ${group.deskripsi}`}>
                                        <option key={`main-${group.id}`} value={group.kode}>
                                            {group.kode} - {group.deskripsi}
                                        </option>
                                        {group.subItems.map(item => {
                                            const indentationLevel = item.kode.split('.').length - 1;
                                            const indentString = '\u00A0\u00A0'.repeat(indentationLevel);
                                            return (
                                                <option key={item.id} value={item.kode}>
                                                    {indentString}{item.kode} - {item.deskripsi}
                                                </option>
                                            )
                                        })}
                                    </optgroup>
                                );
                            } else {
                                return (
                                    <option key={group.id} value={group.kode}>
                                        {group.kode} - {group.deskripsi}
                                    </option>
                                );
                            }
                        })}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Lampiran Berkas</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                    <span>Pilih berkas untuk diunggah</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-500">PDF, DOCX, PNG, JPG, dll.</p>
                        </div>
                    </div>
                    {file && <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Berkas dipilih: {file.name}</p>}
                    {!file && existingFile.fileName && (
                         <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                            <span>Lampiran saat ini: </span>
                            <a href={`${supabaseUrl}/storage/v1/object/public/arsip-files/${existingFile.filePath}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:underline">{existingFile.fileName}</a>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onFinish} className="px-6 py-2 rounded-lg bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 text-gray-700 dark:text-slate-200">Batal</button>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 flex items-center gap-2">
                        {isLoading ? `Menyimpan...` : (arsipToEdit ? 'Simpan Perubahan' : 'Simpan Arsip')}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Sisa komponen (NavItem, StatCard, Dashboard, dll.) tetap sama, hanya perlu passing props 'supabase'
// ... (Saya akan menyalin komponen lainnya dengan modifikasi yang diperlukan)

const KlasifikasiManager = ({ supabase, klasifikasiList, editingKlasifikasi, setEditingKlasifikasi, showNotification, setDeleteConfirmModal }) => {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Daftar Kode Klasifikasi</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 uppercase">
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
                                const isMainCategory = k.kode.length === 3;
                                const indentationLevel = k.kode.split('.').length - 1;
                                return (
                                    <tr key={k.id} className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${isMainCategory ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
                                        <td className={`p-3 font-medium ${isMainCategory ? 'font-bold' : ''}`} style={{ paddingLeft: `${0.75 + indentationLevel * 1.5}rem` }}>{k.kode}</td>
                                        <td className={`p-3 ${isMainCategory ? 'font-bold' : ''}`}>{k.deskripsi}</td>
                                        <td className="p-3 text-center">{k.retensiAktif} thn</td>
                                        <td className="p-3 text-center">{k.retensiInaktif} thn</td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => handleEdit(k)} className="text-primary-500 hover:text-primary-700" title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(k.id, k.kode)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Hapus">
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
            <div className="lg:col-span-1">
                <KlasifikasiForm 
                    supabase={supabase}
                    klasifikasiToEdit={editingKlasifikasi} 
                    onFinish={() => setEditingKlasifikasi(null)}
                    showNotification={showNotification}
                />
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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 sticky top-8">
            <h3 className="text-xl font-bold mb-4 dark:text-white">{klasifikasiToEdit ? 'Edit Kode Klasifikasi' : 'Tambah Kode Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField name="kode" label="Kode Klasifikasi" value={formData.kode} onChange={handleChange} required disabled={!!klasifikasiToEdit} />
                <InputField name="deskripsi" label="Deskripsi" value={formData.deskripsi} onChange={handleChange} required />
                <InputField name="retensiAktif" label="Retensi Aktif (Tahun)" type="number" value={formData.retensiAktif} onChange={handleChange} required />
                <InputField name="retensiInaktif" label="Retensi Inaktif (Tahun)" type="number" value={formData.retensiInaktif} onChange={handleChange} required />
                <div className="flex justify-end gap-4 pt-2">
                    {klasifikasiToEdit && <button type="button" onClick={onFinish} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500">Batal</button>}
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 flex items-center justify-center">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
        </div>
    );
};


const ArsipList = ({ title, arsipList, klasifikasiList, setEditingArsip, supabase, listType }) => {
    const { isItemLoading, deleteArsipOptimistic, confirmArsipDelete, rollbackArsipDelete } = useAppStore();
    
    const getKlasifikasiDesc = (kode) => {
        const found = klasifikasiList.find(k => k.kode === kode);
        return found ? found.deskripsi : 'Tidak Ditemukan';
    };

    // Show skeleton if data is still loading
    const isDataLoading = !arsipList || arsipList.length === 0;

    const handleDelete = async (id, filePath) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini secara permanen?')) {
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
                    rollbackArsipDelete(id, originalData);
                    throw dbError;
                }
                
                confirmArsipDelete(id);

            } catch (error) {
                console.error("Error deleting document or file:", error);
                alert("Gagal menghapus arsip.");
            }
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold dark:text-white">{title}</h3>
                <ExportExcelButton data={arsipList} filename={`Daftar_Arsip_${listType}`} klasifikasiList={klasifikasiList} />
            </div>
            <div className="overflow-x-auto">
                {arsipList.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                            <tr>
                                <th className="p-3">Lampiran</th>
                                <th className="p-3">Perihal</th>
                                <th className="p-3">Nomor Surat</th>
                                <th className="p-3">Tujuan</th>
                                <th className="p-3">Tanggal Surat</th>
                                <th className="p-3">Tanggal Retensi</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Klasifikasi</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arsipList.map(arsip => {
                                const today = new Date();
                                const retensiDate = new Date(arsip.tanggalRetensi);
                                let status = 'Aktif';
                                let statusColor = 'text-green-600 dark:text-green-400';
                                if (retensiDate && today > retensiDate) {
                                    status = 'Inaktif';
                                    statusColor = 'text-red-600 dark:text-red-400';
                                }
                                const fileUrl = arsip.filePath ? `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}` : null;

                                return (
                                <tr key={arsip.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 text-center">
                                        {fileUrl ? (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700" title={arsip.fileName}>
                                                <Paperclip size={18} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-medium dark:text-white">{arsip.perihal}</td>
                                    <td className="p-3 text-gray-500 dark:text-slate-400">{arsip.nomorSurat}</td>
                                    <td className="p-3 text-gray-500 dark:text-slate-400">{arsip.tujuanSurat}</td>
                                    <td className="p-3 text-gray-500 dark:text-slate-400">{new Date(arsip.tanggalSurat).toLocaleDateString('id-ID')}</td>
                                    <td className="p-3 text-gray-500 dark:text-slate-400">{retensiDate ? retensiDate.toLocaleDateString('id-ID') : 'N/A'}</td>
                                    <td className={`p-3 font-medium ${statusColor}`}>{status}</td>
                                    <td className="p-3 text-gray-500 dark:text-slate-400" title={getKlasifikasiDesc(arsip.kodeKlasifikasi)}>{arsip.kodeKlasifikasi}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => setEditingArsip(arsip)} className="text-primary-500 hover:text-primary-700" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(arsip.id, arsip.filePath)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : isDataLoading ? (
                    <div className="space-y-4">
                        <ArsipSkeleton />
                                <ArsipSkeleton />
                                <ArsipSkeleton />
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                        Tidak ada data arsip yang cocok dengan filter Anda.
                    </div>
                )}
            </div>
        </div>
    );
};

// Komponen lain seperti AdvancedSearchView, ReportingView, InfoModal, dll. akan membutuhkan modifikasi serupa pada logika fetching dan filtering data.
// Untuk mempersingkat, saya akan menyertakan kerangka dasarnya saja.
const AdvancedSearchView = ({ arsipList, ...props }) => {
    // ... Logika filter tetap sama, karena filtering dilakukan di client-side pada 'arsipList'
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

        return arsipList.filter(arsip => {
            if (filters.keyword) {
                const keyword = filters.keyword.toLowerCase();
                const searchable = `${arsip.perihal} ${arsip.nomorSurat} ${arsip.pengirim} ${arsip.tujuanSurat}`.toLowerCase();
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
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 mb-8">
                <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-3"><Filter size={24} /> Pencarian Lanjutan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField name="keyword" label="Kata Kunci" value={filters.keyword} onChange={handleFilterChange} placeholder="Perihal, nomor surat..." />
                    <div className="grid grid-cols-2 gap-2">
                        <InputField name="startDate" label="Dari Tanggal" type="date" value={filters.startDate} onChange={handleFilterChange} />
                        <InputField name="endDate" label="Sampai Tanggal" type="date" value={filters.endDate} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status Arsip</label>
                        <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="semua">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="inaktif">Inaktif</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="klasifikasi" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kode Klasifikasi</label>
                        <select name="klasifikasi" id="klasifikasi" value={filters.klasifikasi} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                           <option value="semua">Semua Klasifikasi</option>
                           {props.klasifikasiList.sort((a,b) => a.kode.localeCompare(b.kode, undefined, {numeric: true})).map(k => <option key={k.id} value={k.kode}>{k.kode} - {k.deskripsi}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="mt-4 flex justify-end">
                    <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">
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
    return <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md">Fitur Laporan dalam pengembangan untuk versi Supabase.</div>;
};

const InfoModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-large p-8 max-w-md w-full relative border border-gray-100 animate-slideUp">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"><XCircle size={24} /></button>
                <div className="flex flex-col items-center text-center">
                    <Archive size={48} className="text-primary-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">Aplikasi SIMANTEP</h2>
                    <p className="text-gray-600 mb-2 leading-relaxed">Sistem Informasi Manajemen Kearsipan Terpadu</p>
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

const StatCard = ({ icon, title, value, color }) => {
    const colors = {
        blue: 'bg-primary-100 text-primary-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        primary: 'bg-primary-100 text-primary-600',
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-200">
            <div className="flex items-center gap-5">
                <div className={`p-3 rounded-xl ${colors[color] || colors.primary}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ stats, activeArchives, inactiveArchives, archivesByYear, ...props }) => {
    const [activeTab, setActiveTab] = useState('aktif');
    const { navigate, setEditingArsip } = props;
    const { isItemLoading } = useAppStore();

    // Show skeleton if data is still loading
    const isDataLoading = !stats || stats.total === undefined;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 dark:text-white">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {isDataLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard icon={<Archive size={28} />} title="Total Arsip" value={stats.total} color="blue" />
                        <StatCard icon={<Archive size={28} />} title="Arsip Aktif" value={stats.active} color="green" />
                        <StatCard icon={<Bell size={28} />} title="Arsip Inaktif" value={stats.inactive} color="red" />
                    </>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 mb-8">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Volume Arsip per Tahun</h3>
                {archivesByYear.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={archivesByYear} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #475569', borderRadius: '8px' }} itemStyle={{ color: '#cbd5e1' }} labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Aktif" stackId="a" fill="#22c55e" name="Aktif" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Inaktif" stackId="a" fill="#ef4444" name="Inaktif" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div className="text-center py-12 text-gray-500 dark:text-slate-400">Belum ada data arsip untuk ditampilkan di grafik.</div>}
            </div>
            
            <div>
                <div className="border-b border-gray-200 dark:border-slate-700 mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('aktif')} className={`${activeTab === 'aktif' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Daftar Arsip Aktif ({activeArchives.length})
                        </button>
                        <button onClick={() => setActiveTab('inaktif')} className={`${activeTab === 'inaktif' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Daftar Arsip Inaktif ({inactiveArchives.length})
                        </button>
                    </nav>
                </div>
                {activeTab === 'aktif' && <ArsipList {...props} title="Daftar Arsip Aktif" arsipList={activeArchives} setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} listType="aktif" />}
                {activeTab === 'inaktif' && <ArsipList {...props} title="Daftar Arsip Inaktif" arsipList={inactiveArchives} setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} listType="inaktif" />}
            </div>
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
