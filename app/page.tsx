import { MdAdminPanelSettings, MdFlight, MdLocalShipping, MdStore, MdPerson, MdArrowForward } from 'react-icons/md';

const portals = [
  {
    name: 'Admin',
    description: 'Manage orders, drivers, vendors, and analytics',
    href: '/admin-login',
    icon: 'admin',
    gradient: 'from-violet-600 to-purple-700',
    shadow: 'shadow-purple-200',
  },
  {
    name: 'Airline',
    description: 'Create orders, track deliveries, and manage SLA',
    href: '/airline-login',
    icon: 'airline',
    gradient: 'from-blue-600 to-indigo-700',
    shadow: 'shadow-blue-200',
  },
  {
    name: 'Driver',
    description: 'View assignments, navigate, and submit proof',
    href: '/driver-login',
    icon: 'driver',
    gradient: 'from-emerald-500 to-teal-700',
    shadow: 'shadow-emerald-200',
  },
  {
    name: 'Vendor',
    description: 'Monitor orders, manage stock, and track drivers',
    href: '/vendor-login',
    icon: 'vendor',
    gradient: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-200',
  },
  {
    name: 'Customer',
    description: 'Browse catalog, order items, and track delivery',
    href: '/customer-login',
    icon: 'customer',
    gradient: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-200',
  },
];

const icons = {
  admin: <MdAdminPanelSettings size={32} className="text-white" />,
  airline: <MdFlight size={32} className="text-white" />,
  driver: <MdLocalShipping size={32} className="text-white" />,
  vendor: <MdStore size={32} className="text-white" />,
  customer: <MdPerson size={32} className="text-white" />,
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200 mb-5">
            <MdFlight size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Airline Logistics</h1>
          <p className="text-gray-500 mt-3 text-lg">Disruption-response delivery platform</p>
          <p className="text-gray-400 mt-1 text-sm">Select a portal to get started</p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {portals.map((p) => (
            <a
              key={p.name}
              href={p.href}
              className={`group relative bg-gradient-to-br ${p.gradient} rounded-2xl p-6 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${p.shadow} overflow-hidden`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {icons[p.icon as keyof typeof icons]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{p.name} Portal</h2>
                  <p className="text-white/70 text-sm mt-1 leading-relaxed">{p.description}</p>
                </div>
              </div>

              <div className="relative flex items-center gap-1 mt-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                <span>Sign in</span>
                <MdArrowForward size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-xs text-gray-400">
            Guaranteed delivery within 22 minutes • SLA-tracked • Procurement-compliant
          </p>
        </div>
      </div>
    </div>
  );
}
