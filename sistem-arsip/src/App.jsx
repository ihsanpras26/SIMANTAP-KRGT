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

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Archive, FilePlus, FolderKanban, Bell, Search, Trash2, Edit, XCircle, LogOut, Info, Sun, Moon, FileDown, Layers, Filter, X, Paperclip, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import DevIndicator from './components/DevIndicator.jsx'

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg max-w-md">
            <div className="text-center">
                <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Konfigurasi Diperlukan</h2>
                <p className="text-gray-600 dark:text-slate-300 mb-4">
                    Silakan konfigurasi file .env dengan kredensial Supabase Anda.
                </p>
                <div className="text-left bg-gray-100 dark:bg-slate-700 p-3 rounded text-sm">
                    <p className="font-mono">VITE_SUPABASE_URL=your_url_here</p>
                    <p className="font-mono">VITE_SUPABASE_ANON_KEY=your_key_here</p>
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
    const [arsipList, setArsipList] = useState([]);
    const [klasifikasiList, setKlasifikasiList] = useState([]);
    const [editingArsip, setEditingArsip] = useState(null);
    const [editingKlasifikasi, setEditingKlasifikasi] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, id: null, message: '' });

    // --- Efek untuk Mengambil Data Awal & Berlangganan Perubahan ---
    useEffect(() => {
        // Fungsi untuk mengambil data awal
        const fetchData = async () => {
            setIsLoading(true);
            // Ambil data arsip
            const { data: arsipData, error: arsipError } = await supabase.from('arsip').select('*').order('tanggalSurat', { ascending: false });
            if (arsipError) console.error("Error fetching arsip:", arsipError);
            else setArsipList(arsipData);

            // Ambil data klasifikasi
            const { data: klasifikasiData, error: klasifikasiError } = await supabase.from('klasifikasi').select('*').order('kode', { ascending: true });
            if (klasifikasiError) console.error("Error fetching klasifikasi:", klasifikasiError);
            else setKlasifikasiList(klasifikasiData);
            
            setIsLoading(false);
        };

        fetchData();

        // Menyiapkan langganan real-time untuk tabel 'arsip'
        const arsipChannel = supabase.channel('public:arsip')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip' }, 
                (payload) => {
                    console.log('Perubahan arsip diterima!', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        setArsipList(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setArsipList(prev => prev.map(item => 
                            item.id === payload.new.id ? payload.new : item
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setArsipList(prev => prev.filter(item => item.id !== payload.old.id));
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
                    } else if (payload.eventType === 'UPDATE') {
                        setKlasifikasiList(prev => prev.map(item => 
                            item.id === payload.new.id ? payload.new : item
                        ).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                    } else if (payload.eventType === 'DELETE') {
                        setKlasifikasiList(prev => prev.filter(item => item.id !== payload.old.id));
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
    
    // --- Fungsi Notifikasi ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    const confirmDelete = async () => {
        try {
            const { error } = await supabase.from('klasifikasi').delete().eq('id', deleteConfirmModal.id);
            if (error) throw error;
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

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900"><div className="text-xl font-semibold dark:text-white">Memuat Sistem...</div></div>;
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
        <div className={isDarkMode ? 'dark' : ''}>
            <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans text-gray-800 dark:text-slate-300 transition-colors duration-300">
                <div className="flex flex-col md:flex-row">
                    <aside className="bg-white dark:bg-slate-800 w-full md:w-64 md:min-h-screen p-4 border-r border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Archive className="text-blue-600 dark:text-blue-400" size={32} />
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">SIMANTEP</h1>
                        </div>
                        <nav className="flex flex-row md:flex-col gap-2">
                            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => navigate('dashboard')} />
                            <NavItem icon={<FilePlus size={20} />} label="Tambah Arsip" active={currentView === 'tambah'} onClick={() => navigate('tambah')} />
                            <NavItem icon={<Layers size={20} />} label="Semua Arsip" active={currentView === 'semua'} onClick={() => navigate('semua')} />
                            <NavItem icon={<FolderKanban size={20} />} label="Kode Klasifikasi" active={currentView === 'klasifikasi'} onClick={() => navigate('klasifikasi')} />
                            <NavItem icon={<Search size={20} />} label="Pencarian Lanjutan" active={currentView === 'cari'} onClick={() => navigate('cari')} />
                            <NavItem icon={<FileText size={20} />} label="Laporan" active={currentView === 'laporan'} onClick={() => navigate('laporan')} />
                        </nav>
                         <div className="mt-auto pt-8 hidden md:block">
                            <button onClick={() => setShowInfoModal(true)} className="w-full flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg transition-colors">
                                <Info size={16} /> Info Aplikasi
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
                        {import.meta.env.DEV && <DevIndicator />}
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-all">
                                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
                            </button>
                        </div>
                        {renderView() || <div className="p-6">Halaman tidak ditemukan.</div>}
                    </main>
                </div>
                {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
                {notification.show && <Toast message={notification.message} type={notification.type} onClose={() => setNotification({ show: false, message: '', type: 'success' })} />}
                {deleteConfirmModal.show && <DeleteConfirmModal message={deleteConfirmModal.message} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmModal({ show: false, id: null, message: '' })} />}
            </div>
        </div>
    );
}

// --- Komponen Toast untuk Notifikasi ---
const Toast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? <CheckCircle size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />;
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    return (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out animate-pulse">
            <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-80 max-w-md border-l-4 border-white/30`}>
                {icon}
                <span className="flex-1 font-medium">{message}</span>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors ml-2">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

// --- Komponen Modal Konfirmasi Delete ---
const DeleteConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="text-red-500" size={24} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
                </div>
                <p className="text-gray-600 dark:text-slate-300 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

const ArsipForm = ({ supabase, klasifikasiList, arsipToEdit, onFinish, showNotification }) => {
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
            if (arsipToEdit) {
                // Update data
                const { error } = await supabase.from('arsip').update(dataToSave).eq('id', arsipToEdit.id);
                if (error) throw error;
                showNotification('Data arsip berhasil diperbarui!', 'success');
            } else {
                // Insert data baru
                const { error } = await supabase.from('arsip').insert([dataToSave]);
                if (error) throw error;
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
        return grouped;
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
                    <select id="kodeKlasifikasi" name="kodeKlasifikasi" value={formData.kodeKlasifikasi} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                        <option value="">Pilih Kode Klasifikasi</option>
                        {groupedKlasifikasi.map(group => (
                            <optgroup key={group.id} label={`${group.kode} - ${group.deskripsi}`}>
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
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Lampiran Berkas</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
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
                            <a href={`${supabaseUrl}/storage/v1/object/public/arsip-files/${existingFile.filePath}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">{existingFile.fileName}</a>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onFinish} className="px-6 py-2 rounded-lg bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 text-gray-700 dark:text-slate-200">Batal</button>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white disabled:opacity-50 flex items-center gap-2">
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
                                                <button onClick={() => handleEdit(k)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
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
            if (klasifikasiToEdit) {
                const { error } = await supabase.from('klasifikasi').update(dataToSave).eq('id', klasifikasiToEdit.id);
                if (error) throw error;
                showNotification('Kode klasifikasi berhasil diperbarui!', 'success');
            } else {
                const { error } = await supabase.from('klasifikasi').insert([dataToSave]);
                if (error) throw error;
                showNotification('Kode klasifikasi berhasil ditambahkan!', 'success');
            }
            onFinish();
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
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center justify-center">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
        </div>
    );
};


const ArsipList = ({ title, arsipList, klasifikasiList, setEditingArsip, supabase, listType }) => {
    
    const getKlasifikasiDesc = (kode) => {
        const found = klasifikasiList.find(k => k.kode === kode);
        return found ? found.deskripsi : 'Tidak Ditemukan';
    };

    const handleDelete = async (id, filePath) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini secara permanen?')) {
            try {
                // Hapus file dari storage jika ada
                if (filePath) {
                    const { error: fileError } = await supabase.storage.from('arsip-files').remove([filePath]);
                    if (fileError) console.warn("Could not delete file:", fileError.message);
                }
                // Hapus record dari database
                const { error: dbError } = await supabase.from('arsip').delete().eq('id', id);
                if (dbError) throw dbError;

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
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title={arsip.fileName}>
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
                                            <button onClick={() => setEditingArsip(arsip)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
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
                        <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="semua">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="inaktif">Inaktif</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="klasifikasi" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kode Klasifikasi</label>
                        <select name="klasifikasi" id="klasifikasi" value={filters.klasifikasi} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white"><XCircle size={24} /></button>
                <div className="flex flex-col items-center text-center">
                    <Archive size={40} className="text-blue-500 dark:text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">Aplikasi SIMANTEP</h2>
                    <p className="text-gray-600 dark:text-slate-300 mb-4">Sistem Informasi Manajemen Kearsipan Terpadu (SIMANTEP) - Aplikasi manajemen arsip digital yang ditenagai oleh React, Vite, Supabase, dan di-hosting di Vercel.</p>
                </div>
            </div>
        </div>
    );
};

// Salin komponen yang tidak berubah dari kode asli
const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'}`}
    >
        {icon} <span>{label}</span>
    </button>
);

const StatCard = ({ icon, title, value, color }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    };
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700">
            <div className="flex items-center gap-5">
                <div className={`p-3 rounded-full ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ stats, activeArchives, inactiveArchives, archivesByYear, ...props }) => {
    const [activeTab, setActiveTab] = useState('aktif');
    const { navigate, setEditingArsip } = props;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 dark:text-white">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<Archive size={28} />} title="Total Arsip" value={stats.total} color="blue" />
                <StatCard icon={<Archive size={28} />} title="Arsip Aktif" value={stats.active} color="green" />
                <StatCard icon={<Bell size={28} />} title="Arsip Inaktif" value={stats.inactive} color="red" />
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
                        <button onClick={() => setActiveTab('aktif')} className={`${activeTab === 'aktif' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                            Daftar Arsip Aktif ({activeArchives.length})
                        </button>
                        <button onClick={() => setActiveTab('inaktif')} className={`${activeTab === 'inaktif' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FileDown size={16} />
            Ekspor Excel
        </button>
    );
};
