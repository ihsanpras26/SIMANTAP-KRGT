import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

const Header = ({ title, subtitle, searchValue, onSearchChange, onSearchSubmit, onLogout, className }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [notifications] = React.useState(0);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'sticky top-0 z-40 w-full border-b border-gray-200/60 bg-white backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm',
        className
      )}
    >
      <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-6">
        {/* Left Section - Title */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center Section - Advanced Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <form onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(searchValue); }}>
              <Input
                type="text"
                placeholder="Cari arsip... (gunakan klas:001.1 status:aktif date:2024-01-01)"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white h-11 w-full"
              />
            </form>
            
            {/* Help Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="group/help relative">
                <button 
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {/* Tooltip */}
                <div className="invisible group-hover/help:visible absolute bottom-full right-0 mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                  <div className="font-semibold mb-2">Advanced Search Commands:</div>
                  <div className="space-y-1">
                    <div><code className="bg-gray-700 px-1 rounded">klas:001.1</code> - Filter klasifikasi</div>
                    <div><code className="bg-gray-700 px-1 rounded">status:aktif</code> - Filter status (aktif/inaktif)</div>
                    <div><code className="bg-gray-700 px-1 rounded">date:2024-01-01</code> - Filter tanggal</div>
                    <div><code className="bg-gray-700 px-1 rounded">date:2024-01-01..2024-01-31</code> - Range tanggal</div>
                    <div><code className="bg-gray-700 px-1 rounded">view:grid</code> - Ubah tampilan (grid/table)</div>
                  </div>
                  <div className="mt-2 text-gray-300">
                    Kombinasi: <code className="bg-gray-700 px-1 rounded">surat masuk klas:001.1 status:aktif</code>
                  </div>
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast('Belum ada notifikasi baru', { position: 'top-right' })}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <Bell size={18} />
            </Button>
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-10 px-3 rounded-full hover:bg-gray-100 flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 py-2"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Administrator</p>
                  <p className="text-xs text-gray-500">admin@simantep.com</p>
                </div>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto text-sm hover:bg-gray-50"
                >
                  <User size={16} className="mr-3" />
                  Profil
                </Button>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => onLogout?.()}
                    className="w-full justify-start px-4 py-2 h-auto text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-3" />
                    Keluar
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export { Header };