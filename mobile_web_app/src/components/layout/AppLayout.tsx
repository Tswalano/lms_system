import { useState, type ReactNode } from "react";
import AppNavigation from "./AppNavigation";

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_28%),linear-gradient(180deg,#08101e_0%,#0d1728_44%,#101c2f_100%)]">
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
