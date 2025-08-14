import React from 'react';

// Skeleton untuk item arsip
export const ArsipItemSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-2/3"></div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/4"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton untuk item klasifikasi
export const KlasifikasiItemSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border dark:border-slate-700 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-20"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-20"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton untuk dashboard stats
export const StatCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-2/3 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-1/3"></div>
        </div>
        <div className="h-12 w-12 bg-gray-200 dark:bg-slate-600 rounded-lg"></div>
      </div>
    </div>
  );
};

// Skeleton untuk form input
export const FormSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded w-full"></div>
          </div>
        ))}
        <div className="flex justify-end gap-4 pt-4">
          <div className="h-10 w-20 bg-gray-200 dark:bg-slate-600 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-slate-600 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton untuk tabel
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:border dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="p-4 border-b dark:border-slate-700">
        <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-1/4"></div>
      </div>
      <div className="divide-y dark:divide-slate-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {[...Array(cols)].map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-gray-200 dark:bg-slate-600 rounded ${
                  colIndex === 0 ? 'w-1/4' : 
                  colIndex === 1 ? 'w-2/4' : 
                  'w-1/6'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton untuk chart
export const ChartSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:border dark:border-slate-700 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-1/3 mb-6"></div>
      <div className="h-64 bg-gray-200 dark:bg-slate-600 rounded"></div>
    </div>
  );
};

export default {
  ArsipItemSkeleton,
  KlasifikasiItemSkeleton,
  StatCardSkeleton,
  FormSkeleton,
  TableSkeleton,
  ChartSkeleton
};