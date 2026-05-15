import { useState } from 'react';

const BannerPreview: React.FC = () => {
    const [showVersion, setShowVersion] = useState(true);
    const [showBirthdayWish, setShowBirthdayWish] = useState(true);
    const [showColleague, setShowColleague] = useState(true);

    function formatColleagueNames(names: string[]): string {
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} and ${names[1]}`;
        return `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 > 1 ? 's' : ''}`;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto pt-12 px-4 space-y-8">
                <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                    App Banner Preview{' '}
                    <span className="text-sm font-normal text-gray-400">(dev only)</span>
                </h1>

                {/* Version banner */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">New version banner</p>
                    {showVersion ? (
                        <div className="flex items-center justify-between gap-3 bg-emerald-600 text-white px-6 py-2.5 text-sm rounded">
                            <span>A new version <span className="font-bold">v1.5.0</span> has been deployed.</span>
                            <div className="flex items-center gap-3 shrink-0">
                                <button className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-xs font-semibold">
                                    ↻ Refresh now
                                </button>
                                <button onClick={() => setShowVersion(false)} className="opacity-70 hover:opacity-100">✕</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowVersion(true)} className="text-xs text-emerald-600 underline">Show again</button>
                    )}
                </div>

                {/* Birthday wish */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Birthday wish banner (shown on the user's own birthday)</p>
                    {showBirthdayWish ? (
                        <div className="flex items-center justify-between gap-3 bg-pink-50 border border-pink-200 text-pink-900 px-6 py-2.5 text-sm rounded">
                            <div className="flex items-center gap-2">
                                <span>🎉</span>
                                <span>Happy Birthday, Glen! <span className="font-medium">Wishing you a wonderful day from everyone at Disraptor.</span></span>
                            </div>
                            <button onClick={() => setShowBirthdayWish(false)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowBirthdayWish(true)} className="text-xs text-pink-600 underline">Show again</button>
                    )}
                </div>

                {/* Colleague birthday */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Colleague birthday banner (shown to everyone else)</p>
                    {showColleague ? (
                        <div className="flex items-center justify-between gap-3 bg-purple-50 border border-purple-200 text-purple-900 px-6 py-2.5 text-sm rounded">
                            <div className="flex items-center gap-2">
                                <span>🎂</span>
                                <span>
                                    Today is <span className="font-semibold">{formatColleagueNames(['Sarah', 'John'])}'s</span> birthday — don't forget to wish them all a happy day!
                                </span>
                            </div>
                            <button onClick={() => setShowColleague(false)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowColleague(true)} className="text-xs text-purple-600 underline">Show again</button>
                    )}
                </div>

                {/* Birthday prompt */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Birthday prompt banner (shown when no DOB is set)</p>
                    <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-900 px-6 py-2.5 text-sm rounded">
                        <div className="flex items-center gap-2">
                            <span>🎂</span>
                            <span>
                                We'd love to celebrate your birthday!{' '}
                                <span className="font-semibold underline underline-offset-2 cursor-pointer">Add your birthday to your profile</span>{' '}
                                so we don't miss your special day.
                            </span>
                        </div>
                        <span className="shrink-0 opacity-60 cursor-pointer">✕</span>
                    </div>
                </div>

                {/* All stacked */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">All banners stacked (as rendered in the app)</p>
                    <div className="overflow-hidden rounded shadow-sm">
                        <div className="flex items-center justify-between gap-3 bg-emerald-600 text-white px-6 py-2.5 text-sm">
                            <span>A new version <span className="font-bold">v1.5.0</span> has been deployed.</span>
                            <div className="flex items-center gap-3 shrink-0">
                                <button className="flex items-center gap-1.5 bg-white/20 rounded px-3 py-1 text-xs font-semibold">↻ Refresh now</button>
                                <span className="opacity-70">✕</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-pink-50 border-t border-pink-200 text-pink-900 px-6 py-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <span>🎉</span>
                                <span>Happy Birthday, Glen! <span className="font-medium">Wishing you a wonderful day from everyone at Disraptor.</span></span>
                            </div>
                            <span className="shrink-0 opacity-60">✕</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-purple-50 border-t border-purple-200 text-purple-900 px-6 py-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <span>🎂</span>
                                <span>Today is <span className="font-semibold">Sarah's</span> birthday — don't forget to wish them a happy day!</span>
                            </div>
                            <span className="shrink-0 opacity-60">✕</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-amber-50 border-t border-amber-200 text-amber-900 px-6 py-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <span>🎂</span>
                                <span>We'd love to celebrate your birthday! <span className="font-semibold underline underline-offset-2">Add your birthday to your profile</span> so we don't miss your special day.</span>
                            </div>
                            <span className="shrink-0 opacity-60">✕</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannerPreview;
