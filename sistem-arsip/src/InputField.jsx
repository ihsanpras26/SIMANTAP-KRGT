// File: InputField.jsx
import React from 'react';
export default function InputField({ label, name, type = "text", value, onChange, ...props }) {
  return (
    <div>
      {label && <label className="block mb-1 font-semibold" htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border p-2 rounded"
        {...props}
      />
    </div>
  );
}