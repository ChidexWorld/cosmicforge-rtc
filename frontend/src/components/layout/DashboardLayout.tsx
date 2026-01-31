import AppSidebar from "./AppSidebar";
import MobileSidebar from "./MobileSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <main className="flex-1 bg-white overflow-y-auto">{children}</main>

      {/* Mobile slide-in sidebar */}
      <MobileSidebar />
    </div>
  );
}
