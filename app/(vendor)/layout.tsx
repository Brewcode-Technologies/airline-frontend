import RouteGuard from '@/components/auth/RouteGuard';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="vendor" loginPath="/vendor-login">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar portal="vendor" />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <Topbar logoutRedirect="/vendor-login" avatarColor="bg-emerald-600" portalLabel="vendor" />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
