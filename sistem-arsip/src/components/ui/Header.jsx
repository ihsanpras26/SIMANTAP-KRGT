import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

const Header = ({ title, subtitle, searchValue, onSearchChange, className }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [notifications] = React.useState(3); // Mock notifications

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

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Cari arsip, klasifikasi, atau dokumen..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white h-11"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
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

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <Settings size={18} />
          </Button>

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
                
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto text-sm hover:bg-gray-50"
                >
                  <Settings size={16} className="mr-3" />
                  Pengaturan
                </Button>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <Button
                    variant="ghost"
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