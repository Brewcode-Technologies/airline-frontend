import RouteGuard from '@/components/auth/RouteGuard';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="customer" loginPath="/customer-login">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar portal="customer" />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <Topbar logoutRedirect="/customer-login" avatarColor="bg-purple-600" portalLabel="customer" />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
