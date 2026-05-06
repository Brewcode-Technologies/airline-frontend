import Link from 'next/link';
import { MdAdminPanelSettings, MdFlight, MdLocalShipping, MdStore } from 'react-icons/md';

const portals = [
  { name: 'Admin', href: '/admin-login', icon: 'admin', color: 'bg-purple-600 hover:bg-purple-700' },
  { name: 'Airline', href: '/airline-login', icon: 'airline', color: 'bg-blue-600 hover:bg-blue-700' },
  { name: 'Driver', href: '/driver-login', icon: 'driver', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { name: 'Vendor', href: '/vendor-login', icon: 'vendor', color: 'bg-orange-500 hover:bg-orange-600' },
];

const icons = {
  admin: <MdAdminPanelSettings size={28} className="text-white" />,
  airline: <MdFlight size={28} className="text-white" />,
  driver: <MdLocalShipping size={28} className="text-white" />,
  vendor: <MdStore size={28} className="text-white" />,
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Airline Logistics</h1>
          <p className="text-gray-500 mt-2">Select a portal to sign in</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portals.map((p) => (
            <Link key={p.name} href={p.href}
              className={`${p.color} rounded-2xl p-5 text-white transition-colors block flex items-center gap-3`}>
              {icons[p.icon as keyof typeof icons]}
              <span className="text-lg font-bold">{p.name} Portal</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
