import { AppShell } from "@/components/layout/AppShell";
import { BiometricGuard } from "@/components/BiometricGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <BiometricGuard>
            <AppShell>{children}</AppShell>
        </BiometricGuard>
    );
}
