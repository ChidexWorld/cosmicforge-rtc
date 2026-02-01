import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {/* <DashboardTabs /> */}
      {children}
    </DashboardLayout>
  );
}
