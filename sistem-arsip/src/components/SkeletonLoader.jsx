import React from 'react';

// Skeleton untuk item arsip
export const ArsipSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse hover-lift">
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full"></div>
        </div>
        <div className="space-y-2 mb-3">
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
        </div>
        <div className="flex justify-between items-center">
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4"></div>
            <div className="flex gap-2">
                <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);

// Skeleton untuk item klasifikasi
export const KlasifikasiSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse hover-lift">
        <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 mb-2"></div>
            </div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
        </div>
        <div className="flex gap-2 justify-end">
            <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
            <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
        </div>
    </div>
);

// Skeleton untuk dashboard stats
export const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse hover-lift">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded w-1/3"></div>
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg"></div>
        </div>
    </div>
);

// Skeleton untuk form input
export const FormSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse hover-lift">
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i}>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-full"></div>
                </div>
            ))}
            <div className="flex gap-3 justify-end pt-4">
                <div className="h-10 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                <div className="h-10 w-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded"></div>
            </div>
        </div>
    </div>
);

// Skeleton untuk tabel
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse hover-lift">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {[...Array(cols)].map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded ${
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
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse hover-lift">
      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mb-6"></div>
      <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
    </div>
  );
};

export default {
  ArsipSkeleton,
  KlasifikasiSkeleton,
  StatCardSkeleton,
  FormSkeleton,
  TableSkeleton,
  ChartSkeleton
};