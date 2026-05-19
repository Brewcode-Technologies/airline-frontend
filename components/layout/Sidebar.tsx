'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdMenu, MdClose, MdDashboard, MdShoppingCart, MdPeople, MdBusiness, MdInventory, MdLocationOn, MdBarChart, MdManageAccounts, MdPerson, MdNavigation, MdCameraAlt, MdHistory, MdShoppingBag, MdStorefront, MdStar } from 'react-icons/md';

const PORTALS = {
  admin: {
    label:       'Admin Portal',
    activeColor: 'bg-blue-600',
    links: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: MdDashboard },
      { href: '/admin/orders',    label: 'Orders',     icon: MdShoppingCart },
      { href: '/admin/drivers',   label: 'Drivers',    icon: MdPeople },
      { href: '/admin/vendors',   label: 'Vendors',    icon: MdBusiness },
      { href: '/admin/skus',      label: 'SKUs',       icon: MdInventory },
      { href: '/admin/users',     label: 'Users',      icon: MdManageAccounts },
      { href: '/admin/tracking',  label: 'Tracking',   icon: MdLocationOn },
      { href: '/admin/analytics', label: 'Analytics',  icon: MdBarChart },
      { href: '/admin/profile',   label: 'Profile',    icon: MdPerson },
    ],
  },
  airline: {
    label:       'Airline Portal',
    activeColor: 'bg-blue-600',
    links: [
      { href: '/airline/dashboard', label: 'Dashboard', icon: MdDashboard },
      { href: '/airline/create-orders', label: 'Create Orders', icon: MdShoppingCart },
      { href: '/airline/history',   label: 'History',   icon: MdHistory },
      { href: '/airline/summary',   label: 'Summary',   icon: MdBarChart },
      { href: '/airline/tracking',  label: 'Tracking',  icon: MdLocationOn },
      { href: '/airline/punchout',  label: 'PunchOut',  icon: MdShoppingBag },
      { href: '/airline/profile',   label: 'Profile',   icon: MdPerson },
    ],
  },
  driver: {
    label:       'Driver Portal',
    activeColor: 'bg-orange-500',
    links: [
      { href: '/driver/orders',     label: 'Orders',     icon: MdShoppingCart },
      { href: '/driver/history',    label: 'History',    icon: MdHistory },
      { href: '/driver/navigation', label: 'Navigation', icon: MdNavigation },
      { href: '/driver/proof',      label: 'Proof',      icon: MdCameraAlt },
      { href: '/driver/details',    label: 'My Details', icon: MdPerson },
    ],
  },
  vendor: {
    label:       'Vendor Portal',
    activeColor: 'bg-emerald-600',
    links: [
      { href: '/vendor/dashboard', label: 'Dashboard', icon: MdDashboard },
      { href: '/vendor/orders',    label: 'Orders',     icon: MdShoppingCart },
      { href: '/vendor/stock',     label: 'Products',   icon: MdInventory },
      { href: '/vendor/tracking',  label: 'Tracking',   icon: MdLocationOn },
      { href: '/vendor/profile',   label: 'Profile',    icon: MdPerson },
    ],
  },
  customer: {
    label:       'Customer Portal',
    activeColor: 'bg-purple-600',
    links: [
      { href: '/customer/dashboard', label: 'Dashboard',  icon: MdDashboard },
      { href: '/customer/catalog',   label: 'Catalog',    icon: MdStorefront },
      { href: '/customer/cart',      label: 'Cart',       icon: MdShoppingCart },
      { href: '/customer/orders',    label: 'My Orders',  icon: MdHistory },
      { href: '/customer/tracking',  label: 'Track Order', icon: MdLocationOn },
      { href: '/customer/profile',   label: 'Profile',    icon: MdPerson },
    ],
  },
};

interface SidebarProps {
  portal: keyof typeof PORTALS;
}

export default function Sidebar({ portal }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { label, activeColor, links } = PORTALS[portal];

  const nav = (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Airline Logistics</h1>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-white cursor-pointer">
          <MdClose size={22} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label: linkLabel, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? `${activeColor} text-white` : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {linkLabel}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full z-40 w-64">
        {nav}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg cursor-pointer"
      >
        <MdMenu size={22} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{nav}</div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
