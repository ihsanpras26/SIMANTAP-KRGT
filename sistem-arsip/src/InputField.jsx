// File: InputField.jsx
import React from 'react';

export default function InputField({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  ...props 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label 
          className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1" 
          htmlFor={name}
        >
          {label}
          {required && <span className="text-red-500 text-base">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-3.5 
            bg-white border-2 border-gray-200 rounded-xl 
            text-gray-900 placeholder-gray-500 text-sm
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            hover:border-gray-300 hover:shadow-sm
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200
            ${error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50' : ''}
            ${className}
          `}
          {...props}
        />
        {required && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-primary-500 text-xs font-medium bg-primary-50 px-2 py-1 rounded-full">Wajib</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}