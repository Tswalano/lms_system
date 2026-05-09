import { useState, type ReactNode } from "react";
import AppNavigation from "./AppNavigation";

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(236,253,245,1)_40%,rgba(236,254,255,1)_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_46%,#0b1220_100%)] dark:text-slate-100">
            <AppNavigation
                isMobileMenuOpen={isMobileSheetOpen}
                onOpenMobileMenu={() => setIsMobileSheetOpen(true)}
                onCloseMobileMenu={() => setIsMobileSheetOpen(false)}
            />

            <main className="relative min-h-screen px-4 pb-32 pt-4 lg:ml-80 lg:px-8 lg:pb-8 lg:pt-8">
                <div className="mx-auto w-full max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
