'use client';

import { useState } from 'react';
import { MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  focusColor?: string; // e.g. 'focus:ring-blue-500'
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  focusColor = 'focus:ring-blue-500',
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <MdLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${focusColor}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        tabIndex={-1}
      >
        {show ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
      </button>
    </div>
  );
}
