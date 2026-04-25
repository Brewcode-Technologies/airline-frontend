'use client';

import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdClose } from 'react-icons/md';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium animate-slide-down
      ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}
    >
      {type === 'success' ? <MdCheckCircle size={20} className="text-green-500 shrink-0" /> : <MdError size={20} className="text-red-500 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-current opacity-50 hover:opacity-100 cursor-pointer">
        <MdClose size={16} />
      </button>
    </div>
  );
}
