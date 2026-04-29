import RouteGuard from '@/components/auth/RouteGuard';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function AirlineLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="airline" loginPath="/airline-login">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar portal="airline" />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <Topbar logoutRedirect="/airline-login" avatarColor="bg-blue-600" portalLabel="airline" />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
