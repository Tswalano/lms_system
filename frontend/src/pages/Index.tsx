
import DashboardHeader from "@/components/DashboardHeader";
import Sidebar from "@/components/Sidebar";
import LeaveBalanceCards from "@/components/LeaveBalanceCards";
import CalendarSection from "@/components/CalendarSection";

const Index = () => {

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar />
            <div className="ml-64">
                <DashboardHeader />
                <main className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                    <div className="px-16 mx-auto space-y-8">
                        <LeaveBalanceCards />
                        <CalendarSection />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Index;
