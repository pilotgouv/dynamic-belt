import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { DateRangeProvider } from "@/context/DateRangeContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#F6F8FB]">
            <Sidebar />
            <main className="flex-1 ml-[250px]">
                <DashboardHeader />
                <div className="p-8 mt-16">
                    {children}
                </div>
            </main>
        </div>
    );
}
