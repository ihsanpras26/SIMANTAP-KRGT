import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

const Header = ({ title, subtitle, onLogout, className, stats }) => {
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

        {/* Center Section - Archive Stats */}
        <div className="flex-1 max-w-2xl mx-8">
          {stats && (
            <div className="flex items-center justify-center gap-4">
              {/* Total Arsip */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium text-blue-700">
                  {stats.total || 0} Total
                </span>
              </div>
              
              {/* Arsip Aktif */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-emerald-700">
                  {stats.active || 0} Aktif
                </span>
              </div>
              
              {/* Arsip Inaktif */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-amber-700">
                  {stats.inactive || 0} Inaktif
                </span>
              </div>
            </div>
          )}
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