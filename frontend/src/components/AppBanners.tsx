import { useState, useEffect } from 'react';
import { X, RefreshCw, Cake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SEEN_VERSION_KEY = 'lastSeenVersion';
const DISMISSED_BIRTHDAY_KEY = 'dismissedBirthdayBanner';

const AppBanners: React.FC = () => {
    const { user } = useAuth();
    const [newVersion, setNewVersion] = useState<string | null>(null);
    const [showVersionBanner, setShowVersionBanner] = useState(false);
    const [showBirthdayBanner, setShowBirthdayBanner] = useState(false);

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/version.json', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                const latest: string = data.version;
                if (!latest) return;

                const lastSeen = localStorage.getItem(SEEN_VERSION_KEY);
                if (!lastSeen) {
                    localStorage.setItem(SEEN_VERSION_KEY, latest);
                } else if (lastSeen !== latest) {
                    setNewVersion(latest);
                    setShowVersionBanner(true);
                }
            } catch {
                // version.json absent in dev — silently skip
            }
        };
        checkVersion();
    }, []);

    useEffect(() => {
        if (!user || user.dob) return;
        const dismissedFor = localStorage.getItem(DISMISSED_BIRTHDAY_KEY);
        if (dismissedFor === user.id) return;
        setShowBirthdayBanner(true);
    }, [user]);

    const handleRefresh = () => {
        if (newVersion) localStorage.setItem(SEEN_VERSION_KEY, newVersion);
        window.location.reload();
    };

    const handleDismissVersion = () => {
        if (newVersion) localStorage.setItem(SEEN_VERSION_KEY, newVersion);
        setShowVersionBanner(false);
    };

    const handleDismissBirthday = () => {
        if (user) localStorage.setItem(DISMISSED_BIRTHDAY_KEY, user.id);
        setShowBirthdayBanner(false);
    };

    if (!showVersionBanner && !showBirthdayBanner) return null;

    return (
        <div className="relative z-20">
            {showVersionBanner && (
                <div className="flex items-center justify-between gap-3 bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-2.5 text-sm">
                    <span>
                        A new version{' '}
                        <span className="font-bold">v{newVersion}</span>{' '}
                        has been deployed.
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-xs font-semibold transition-colors"
                        >
                            <RefreshCw size={12} />
                            Refresh now
                        </button>
                        <button
                            onClick={handleDismissVersion}
                            className="opacity-70 hover:opacity-100 transition-opacity"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showBirthdayBanner && (
                <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                        <Cake size={15} className="shrink-0 text-amber-500 dark:text-amber-400" />
                        <span>
                            We'd love to celebrate your birthday!{' '}
                            <Link
                                to="/profile"
                                className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                            >
                                Add your birthday to your profile
                            </Link>{' '}
                            so we don't miss your special day.
                        </span>
                    </div>
                    <button
                        onClick={handleDismissBirthday}
                        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppBanners;
