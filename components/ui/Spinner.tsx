interface SpinnerProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const ringSize = { sm: 'w-5 h-5', md: 'w-10 h-10', lg: 'w-14 h-14' };
const borderSize = { sm: 'border-2', md: 'border-4', lg: 'border-4' };

export default function Spinner({ fullPage = false, size = 'md', label }: SpinnerProps) {
  const ring = (
    <div className="relative flex items-center justify-center">
      <div className={`${ringSize[size]} ${borderSize[size]} rounded-full border-gray-200`} />
      <div className={`absolute ${ringSize[size]} ${borderSize[size]} rounded-full border-blue-600 border-t-transparent animate-spin`} />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">{label || 'Loading…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {ring}
      {label && <p className="text-sm text-gray-400 animate-pulse">{label}</p>}
    </div>
  );
}
