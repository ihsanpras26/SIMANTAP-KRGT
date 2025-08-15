import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Archive,
  FilePlus,
  FolderKanban,
  Search,
  FileDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'arsip', label: 'Daftar Arsip', icon: Archive },
  { id: 'tambah-arsip', label: 'Tambah Arsip', icon: FilePlus },
  { id: 'klasifikasi', label: 'Klasifikasi', icon: FolderKanban },
  { id: 'pencarian', label: 'Pencarian Lanjutan', icon: Search },
  { id: 'laporan', label: 'Laporan', icon: FileDown },
];

const Sidebar = ({
  currentView,
  setCurrentView,
  isCollapsed,
  setIsCollapsed,
  collapsed,
  onToggle,
  navigationItems,
  onNavigate,
  onShowInfo,
}) => {
  const collapsedState = typeof isCollapsed === 'boolean' ? isCollapsed : !!collapsed;
  const toggleCollapse = () => {
    if (typeof setIsCollapsed === 'function') {
      setIsCollapsed(!collapsedState);
    } else if (typeof onToggle === 'function') {
      onToggle();
    }
  };

  const items = Array.isArray(navigationItems) && navigationItems.length > 0 ? navigationItems : sidebarItems;

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsedState ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full overflow-y-auto bg-white border-r border-gray-200/60 shadow-lg z-40"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-gray-200/60">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsedState && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Archive className="text-white" size={18} />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold text-lg">SIMANTEP</h1>
                  <p className="text-gray-500 text-xs">Sistem Arsip Digital</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-8 w-8"
            aria-label={collapsedState ? 'Buka Sidebar' : 'Tutup Sidebar'}
          >
            {collapsedState ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative p-4 space-y-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const viewId = item.view ?? item.id;
          const isActive = currentView === viewId || currentView === item.id;

          const handleClick = () => {
            if (typeof onNavigate === 'function') {
              onNavigate(viewId);
            } else if (typeof setCurrentView === 'function') {
              setCurrentView(viewId);
            }
          };

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="ghost"
                onClick={handleClick}
                className={cn(
                  'relative w-full justify-start gap-3 h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200',
                  isActive && 'bg-primary-50 text-primary-700 border border-primary-200 shadow-soft',
                  collapsedState && 'justify-center px-0'
                )}
              >
                {Icon && <Icon size={20} className={cn(isActive ? 'text-primary-600' : 'text-gray-500')} />}
                <AnimatePresence>
                  {!collapsedState && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 w-1 h-8 bg-primary-500 rounded-l-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Button>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/60 bg-white">
        <AnimatePresence>
          {!collapsedState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center text-gray-500 text-xs"
            >
              <p>© {new Date().getFullYear()} SIMANTEP</p>
              <p>Versi 1.0.0</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export { Sidebar };