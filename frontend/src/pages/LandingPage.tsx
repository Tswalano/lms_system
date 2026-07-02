import { useEffect, useState, type ElementType } from "react";
import {
    ArrowRight,
    BarChart3,
    Bell,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileText,
    Menu,
    Moon,
    Play,
    ShieldCheck,
    Sparkles,
    Sun,
    X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Feature {
    icon: ElementType;
    title: string;
    description: string;
}

interface WorkflowStep {
    label: string;
    title: string;
    description: string;
    icon: ElementType;
}

const features: Feature[] = [
    {
        icon: CalendarDays,
        title: "Self-service leave planning",
        description: "Employees can request time off, review balances, and see team availability without chasing HR.",
    },
    {
        icon: ClipboardCheck,
        title: "Clear manager approvals",
        description: "Managers get the context they need to approve, decline, and keep requests moving quickly.",
    },
    {
        icon: BarChart3,
        title: "Workforce reporting",
        description: "Admins can track leave trends, department coverage, and usage patterns from one focused view.",
    },
    {
        icon: Bell,
        title: "Useful notifications",
        description: "Important updates are surfaced at the right time so teams stay aligned without inbox noise.",
    },
];

const workflowSteps: WorkflowStep[] = [
    {
        label: "01",
        title: "Plan",
        description: "Check balances and team availability before selecting dates.",
        icon: CalendarDays,
    },
    {
        label: "02",
        title: "Approve",
        description: "Review request details with status, dates, and employee context.",
        icon: ClipboardCheck,
    },
    {
        label: "03",
        title: "Report",
        description: "Use leave summaries and analytics to support workforce planning.",
        icon: BarChart3,
    },
];

const LandingPage: React.FC = (): JSX.Element => {
    const { isAuthenticated, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const appHref = isAuthenticated ? "/" : "/login";
    // Signed in → "Open App" only; signed out → "Login" only (nothing while auth state loads)
    const showOpenApp = !loading && isAuthenticated;
    const showLogin = !loading && !isAuthenticated;

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode((current) => {
            const next = !current;
            document.documentElement.classList.toggle("dark", next);
            localStorage.setItem("theme", next ? "dark" : "light");
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
                <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
                    <a href="/" className="flex items-center gap-3" aria-label="Disraptor LMS home">
                        <img src="favicon.png" alt="" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl dark:text-white">Disraptor LMS</span>
                    </a>

                    <div className="hidden items-center gap-6 md:flex">
                        <a href="#product" className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                            Platform
                        </a>
                        <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                            Features
                        </a>
                        <a href="#workflow" className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                            Workflow
                        </a>
                        <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                            Reports
                        </a>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            onClick={toggleDarkMode}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        {showLogin && (
                            <a
                                href="/login"
                                className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-300"
                            >
                                Login
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        )}
                        {showOpenApp && (
                            <a
                                href="/"
                                className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-400 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-300"
                            >
                                Open App
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMenuOpen((current) => !current)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        aria-label="Toggle navigation"
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </nav>

                {isMenuOpen && (
                    <div className="mx-3 mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-2">
                            <a href="#product" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Platform</a>
                            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Features</a>
                            <a href="#workflow" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Workflow</a>
                            <button
                                onClick={toggleDarkMode}
                                className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
                            >
                                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                Theme
                            </button>
                            {showLogin && (
                                <a href="/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 text-sm font-bold text-slate-950">
                                    Login
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            )}
                            {showOpenApp && (
                                <a href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-400 text-sm font-bold text-slate-950">
                                    Open App
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main className="pt-[30px]">
                <section>
                    <div
                        id="product"
                        className="relative mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1540px] overflow-hidden rounded-b-[2rem] border border-slate-200 bg-slate-50 text-slate-950 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:shadow-black/30 sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3.5rem)]"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.1),transparent_58%)] dark:bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.13),transparent_58%)]" />

                        <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-5 pb-[460px] pt-20 text-center sm:px-8 sm:pb-[500px] sm:pt-24 lg:pb-[560px] lg:pt-28 xl:pb-[600px]">
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:shadow-black/10">
                                <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                                All-in-one leave management platform
                            </div>
                            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.04] tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                                Turn Leave Admin Into{" "}
                                <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-cyan-300">
                                    Clear Decisions
                                </span>
                            </h1>
                            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                                Real-time balances, approval context, team availability, and reporting to manage time off from one focused platform.
                            </p>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href={appHref}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:bg-emerald-300"
                                >
                                    {isAuthenticated ? "Open App" : "Get Started"}
                                    <ArrowRight className="h-5 w-5" />
                                </a>
                                <a
                                    href="#features"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 text-base font-semibold text-slate-800 transition hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                >
                                    View Product
                                    <Play className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        <div className="absolute bottom-[-500px] left-1/2 z-10 w-[980px] max-w-[calc(100vw-2rem)] -translate-x-1/2 sm:bottom-[-540px] sm:w-[1120px] lg:bottom-[-590px] lg:w-[1280px] xl:bottom-[-620px] xl:w-[1380px]">
                            <ProductPreview />
                        </div>
                    </div>
                </section>

                <section id="features" className="bg-slate-50 py-20 dark:bg-slate-900/60">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Product Coverage</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                                The day-to-day leave workflow in one place.
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                The landing page now reflects what the app actually does: leave balances, team calendars, approvals, notifications, and reporting.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature) => (
                                <FeatureCard key={feature.title} feature={feature} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20 dark:bg-slate-950">
                    <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                        <div className="self-center">
                            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Application Views</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                                Show the product before asking users to sign in.
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Visitors see a realistic dashboard, pending approvals, reporting charts, and calendar context immediately instead of generic marketing blocks.
                            </p>

                            <div className="mt-8 space-y-4">
                                <ValueRow icon={ShieldCheck} title="Role-aware" text="Employee, manager, and admin surfaces are represented clearly." />
                                <ValueRow icon={Clock3} title="Fast to scan" text="Key counts, request states, and availability are visible at a glance." />
                                <ValueRow icon={FileText} title="Operational" text="The page emphasizes useful HR workflows rather than decorative claims." />
                            </div>
                        </div>

                        <div className="grid gap-5">
                            <MiniScreenshot title="Team Availability" tone="cyan" />
                            <MiniScreenshot title="Approval Queue" tone="amber" />
                        </div>
                    </div>
                </section>

                <section id="workflow" className="bg-slate-950 py-20 text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Workflow</p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                    From request to insight.
                                </h2>
                            </div>
                            <p className="text-lg leading-8 text-slate-300">
                                The page guides visitors through the same path teams use inside the product: plan leave, approve requests, then review trends.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {workflowSteps.map((step) => {
                                const Icon = step.icon;

                                return (
                                    <div key={step.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-emerald-300">{step.label}</span>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                                        <p className="mt-3 leading-7 text-slate-300">{step.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-white py-16 dark:bg-slate-950">
                    <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                            Ready to manage leave with less admin?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                            {isAuthenticated
                                ? "Jump back in to submit requests, review approvals, and keep team availability visible."
                                : "Sign in to submit requests, review approvals, and keep team availability visible."}
                        </p>
                        <div className="mt-8">
                            <a
                                href={appHref}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
                            >
                                {isAuthenticated ? "Open App" : "Sign in to Disraptor LMS"}
                                <ArrowRight className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
                    <div className="flex items-center gap-3">
                        <img src="favicon.png" alt="" className="h-7 w-7 object-contain" />
                        <span className="font-semibold">Disraptor LMS</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date().getFullYear()} &copy; Disraptor Systems. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
    const Icon = feature.icon;

    return (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
        </article>
    );
};

const ValueRow = ({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) => (
    <div className="flex gap-4">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{text}</p>
        </div>
    </div>
);

const ProductPreview = () => (
    <div className="relative">
        <div className="rounded-[1.65rem] border border-slate-300 bg-white/80 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:shadow-black/40">
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white dark:border-cyan-300/20 dark:bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dashboard</span>
                </div>

                <div className="grid min-h-[520px] lg:grid-cols-[72px_1fr]">
                    <aside className="hidden border-r border-slate-200 bg-slate-50 px-3 py-4 dark:border-white/10 dark:bg-white/[0.03] lg:block">
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>
                        {[
                            { label: "Dashboard", icon: BarChart3 },
                            { label: "Apply Leave", icon: CalendarDays },
                            { label: "Approvals", icon: ClipboardCheck },
                            { label: "Notifications", icon: Bell },
                        ].map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    title={item.label}
                                    className={`mb-2 flex h-11 w-11 items-center justify-center rounded-lg ${index === 0
                                        ? "bg-emerald-400 text-slate-950"
                                        : "text-slate-500 dark:text-slate-500"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                            );
                        })}
                    </aside>

                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-xl font-semibold text-slate-950 dark:text-white">Welcome back, Glen M.</div>
                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your leave overview for this month</div>
                            </div>
                            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-bold text-slate-950">
                                Apply Leave
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                            <BalanceCard label="Annual" value="14" color="from-rose-400 to-pink-500" />
                            <BalanceCard label="Sick" value="7" color="from-cyan-400 to-blue-500" />
                            <BalanceCard label="Family" value="3" color="from-emerald-400 to-green-500" />
                            <BalanceCard label="Paternity" value="5" color="from-amber-400 to-orange-500" />
                        </div>

                        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_260px]">
                            <CalendarMock />
                            <div className="space-y-4">
                                <ApprovalCard />
                                <ReportCard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const BalanceCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className={`mb-4 h-9 w-9 rounded-lg bg-gradient-to-br ${color}`} />
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500">days available</p>
    </div>
);

const CalendarMock = () => {
    const days = Array.from({ length: 35 }, (_, index) => index + 1);

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="font-semibold text-slate-950 dark:text-white">Team Calendar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">July availability</p>
                </div>
                <CalendarDays className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <div key={`${day}-${index}`} className="py-1">{day}</div>
                ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const active = [8, 9, 10, 18, 24].includes(day);
                    const muted = day > 30;

                    return (
                        <div
                            key={day}
                            className={`flex aspect-square items-center justify-center rounded-md text-xs ${active
                                ? "bg-emerald-400 font-semibold text-slate-950"
                                : muted
                                    ? "text-slate-300 dark:text-slate-700"
                                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
                                }`}
                        >
                            {day <= 31 ? day : ""}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ApprovalCard = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-slate-950 dark:text-white">Pending Approval</p>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">2 new</span>
        </div>
        {["Thabo M.", "Lerato K."].map((name) => (
            <div key={name} className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3 last:mb-0 dark:bg-slate-950/70">
                <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Annual leave</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
            </div>
        ))}
    </div>
);

const ReportCard = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-slate-950 dark:text-white">Leave Trends</p>
            <BarChart3 className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
        </div>
        <div className="flex h-28 items-end gap-2">
            {[44, 62, 35, 76, 58, 88, 68].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                    <div
                        className="w-full rounded-t bg-cyan-400/80"
                        style={{ height: `${height}%` }}
                    />
                </div>
            ))}
        </div>
    </div>
);

const MiniScreenshot = ({ title, tone }: { title: string; tone: "cyan" | "amber" }) => {
    const isCyan = tone === "cyan";

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isCyan
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                >
                    Live view
                </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-lg bg-white p-4 dark:bg-slate-950">
                        <div className={`mb-4 h-2 rounded ${isCyan ? "bg-cyan-400" : "bg-amber-400"}`} />
                        <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="mt-3 h-2 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;
