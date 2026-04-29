import RouteGuard from '@/components/auth/RouteGuard';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="driver" loginPath="/driver-login">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar portal="driver" />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <Topbar logoutRedirect="/driver-login" avatarColor="bg-orange-500" portalLabel="driver" />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
