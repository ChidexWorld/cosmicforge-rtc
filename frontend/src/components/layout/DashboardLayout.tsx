import AppSidebar from "./AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white">
      <AppSidebar />

      <main className="flex-1 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
