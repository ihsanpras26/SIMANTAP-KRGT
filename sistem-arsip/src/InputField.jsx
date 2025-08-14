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
    <div className="space-y-1">
      {label && (
        <label 
          className="block text-sm font-medium text-gray-700 mb-1" 
          htmlFor={name}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-3 
          bg-white border border-gray-200 rounded-xl 
          text-gray-900 placeholder-gray-400
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          hover:border-gray-300
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}