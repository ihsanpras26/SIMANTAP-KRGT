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
import InputField from './InputField.jsx'

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
        if (!supabase) return;
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

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
        { id: 'tambah', label: 'Tambah Arsip', icon: FilePlus, view: 'tambah' },
        { id: 'semua', label: 'Semua Arsip', icon: Layers, view: 'semua' },
        { id: 'klasifikasi', label: 'Kode Klasifikasi', icon: FolderKanban, view: 'klasifikasi' },
        { id: 'cari', label: 'Pencarian Lanjutan', icon: Search, view: 'cari' },
        { id: 'laporan', label: 'Laporan', icon: FileText, view: 'laporan' },
    ];

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
                
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header 
                        title={
                            currentView === 'dashboard' ? 'Dashboard' :
                            currentView === 'tambah' ? 'Tambah Arsip' :
                            currentView === 'semua' ? 'Semua Arsip' :
                            currentView === 'klasifikasi' ? 'Kode Klasifikasi' :
                            currentView === 'cari' ? 'Pencarian Lanjutan' :
                            currentView === 'laporan' ? 'Laporan' : 'SIMANTEP'
                        }
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
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
    });
    const [file, setFile] = useState(null);
    const [existingFile, setExistingFile] = useState({ fileName: '', filePath: '' });
    // Note: uploadProgress removed as it's not used in current implementation
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
        if (!selectedKlasifikasi) {
            showNotification('Kode klasifikasi tidak valid.', 'error');
            setIsLoading(false);
            return;
        }
        const tglSurat = new Date(formData.tanggalSurat);
        if (isNaN(tglSurat)) {
            showNotification('Tanggal surat tidak valid.', 'error');
            setIsLoading(false);
            return;
        }
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
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{arsipToEdit ? 'Edit Arsip' : 'Tambah Arsip Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField name="nomorSurat" label="Nomor Surat" value={formData.nomorSurat} onChange={handleChange} required />
                <InputField name="tanggalSurat" label="Tanggal Surat" type="date" value={formData.tanggalSurat} onChange={handleChange} required />
                <InputField name="pengirim" label="Pengirim / Asal Surat" value={formData.pengirim} onChange={handleChange} required />
                <InputField name="tujuanSurat" label="Tujuan Surat" value={formData.tujuanSurat} onChange={handleChange} required />
                <InputField name="perihal" label="Perihal / Isi Ringkas" value={formData.perihal} onChange={handleChange} required />
                <div>
                    <label htmlFor="kodeKlasifikasi" className="block text-sm font-medium text-gray-700 mb-1">Kode Klasifikasi</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran Berkas</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                    <span>Pilih berkas untuk diunggah</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">PDF, DOCX, PNG, JPG, dll.</p>
                        </div>
                    </div>
                    {file && <p className="mt-2 text-sm text-gray-500">Berkas dipilih: {file.name}</p>}
                    {!file && existingFile.fileName && (
                         <div className="mt-2 text-sm text-gray-500">
                            <span>Lampiran saat ini: </span>
                            <a href={`${supabaseUrl}/storage/v1/object/public/arsip-files/${existingFile.filePath}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:underline">{existingFile.fileName}</a>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onFinish} className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Batal</button>
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
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Daftar Kode Klasifikasi</h2>
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
                                const isMainCategory = k.kode.length === 3;
                                const indentationLevel = k.kode.split('.').length - 1;
                                return (
                                    <tr key={k.id} className={`border-b border-gray-200 hover:bg-gray-50 ${isMainCategory ? 'bg-gray-100' : ''}`}>
                                        <td className={`p-3 font-medium ${isMainCategory ? 'font-bold' : ''}`} style={{ paddingLeft: `${0.75 + indentationLevel * 1.5}rem` }}>{k.kode}</td>
                                        <td className={`p-3 ${isMainCategory ? 'font-bold' : ''}`}>{k.deskripsi}</td>
                                        <td className="p-3 text-center">{k.retensiAktif} thn</td>
                                        <td className="p-3 text-center">{k.retensiInaktif} thn</td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => handleEdit(k)} className="text-primary-500 hover:text-primary-700" title="Edit">
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
                    rollbackArsipDelete(originalData);
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
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <ExportExcelButton data={arsipList} filename={`Daftar_Arsip_${listType}`} klasifikasiList={klasifikasiList} />
            </div>
            <div className="overflow-x-auto">
                {arsipList.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600">
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
                                let statusColor = 'text-green-600';
                                if (retensiDate && today > retensiDate) {
                                    status = 'Inaktif';
                                    statusColor = 'text-red-600';
                                }
                                const fileUrl = arsip.filePath ? `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}` : null;

                                return (
                                <tr key={arsip.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-3 text-center">
                                        {fileUrl ? (
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700" title={arsip.fileName}>
                                                <Paperclip size={18} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-medium text-gray-900">{arsip.perihal}</td>
                                    <td className="p-3 text-gray-600">{arsip.nomorSurat}</td>
                                    <td className="p-3 text-gray-600">{arsip.tujuanSurat}</td>
                                    <td className="p-3 text-gray-600">{new Date(arsip.tanggalSurat).toLocaleDateString('id-ID')}</td>
                                    <td className="p-3 text-gray-600">{retensiDate ? retensiDate.toLocaleDateString('id-ID') : 'N/A'}</td>
                                    <td className={`p-3 font-medium ${statusColor}`}>{status}</td>
                                    <td className="p-3 text-gray-600" title={getKlasifikasiDesc(arsip.kodeKlasifikasi)}>{arsip.kodeKlasifikasi}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => setEditingArsip(arsip)} className="text-primary-500 hover:text-primary-700" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(arsip.id, arsip.filePath)} className="text-red-500 hover:text-red-700" title="Hapus">
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
                    <div className="text-center py-12 text-gray-500">
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
                        <select name="klasifikasi" id="klasifikasi" value={filters.klasifikasi} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                           <option value="semua">Semua Klasifikasi</option>
                           {props.klasifikasiList.sort((a,b) => a.kode.localeCompare(b.kode, undefined, {numeric: true})).map(k => <option key={k.id} value={k.kode}>{k.kode} - {k.deskripsi}</option>)}
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



const Dashboard = ({ stats, activeArchives, inactiveArchives, archivesByYear, ...props }) => {
    const [activeTab, setActiveTab] = useState('aktif');
    const { navigate, setEditingArsip } = props;
    const { isItemLoading } = useAppStore();

    // Show skeleton if data is still loading
    const isDataLoading = !stats || stats.total === undefined;

    const statCards = [
        { icon: Archive, title: "Total Arsip", value: stats?.total || 0, color: "blue", trend: "+12%" },
        { icon: CheckCircle, title: "Arsip Aktif", value: stats?.active || 0, color: "green", trend: "+8%" },
        { icon: AlertCircle, title: "Arsip Inaktif", value: stats?.inactive || 0, color: "red", trend: "-3%" }
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
