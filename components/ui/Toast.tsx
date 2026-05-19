'use client';

import { useEffect, useState } from 'react';
import { MdCheck, MdClose, MdError, MdInfo } from 'react-icons/md';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-purple-600',
  };

  const icons = {
    success: <MdCheck size={18} />,
    error: <MdError size={18} />,
    info: <MdInfo size={18} />,
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg transition-all duration-300 ${colors[type]} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 text-white/70 hover:text-white cursor-pointer">
        <MdClose size={16} />
      </button>
    </div>
  );
}
