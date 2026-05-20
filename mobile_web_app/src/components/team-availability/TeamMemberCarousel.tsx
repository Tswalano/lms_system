import { useEffect, useRef, useState } from "react";
import TeamMemberCard from "./TeamMemberCard";
import type { TeamMember } from "./types";

interface TeamMemberCarouselProps {
    members: TeamMember[];
}

const TeamMemberCarousel = ({
    members,
}: TeamMemberCarouselProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoRotatePaused, setIsAutoRotatePaused] = useState(false);

    useEffect(() => {
        setActiveIndex(0);
        setIsAutoRotatePaused(false);
        if (containerRef.current) {
            containerRef.current.scrollTo({ left: 0, behavior: "auto" });
        }
    }, [members]);

    const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
        const container = containerRef.current;
        if (!container) return;

        const firstCard = container.querySelector<HTMLElement>("[data-carousel-card='true']");
        if (!firstCard) return;

        const cardWidth = firstCard.offsetWidth;
        const gap = 12;

        container.scrollTo({
            left: index * (cardWidth + gap),
            behavior,
        });
    };

    useEffect(() => {
        if (isAutoRotatePaused || members.length <= 1) return;

        const interval = window.setInterval(() => {
            setActiveIndex((current) => {
                const nextIndex = current >= members.length - 1 ? 0 : current + 1;
                scrollToIndex(nextIndex);
                return nextIndex;
            });
        }, 4500);

        return () => window.clearInterval(interval);
    }, [isAutoRotatePaused, members.length]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const firstCard = container.querySelector<HTMLElement>("[data-carousel-card='true']");
        if (!firstCard) return;

        const cardWidth = firstCard.offsetWidth;
        const gap = 12;
        const nextIndex = Math.round(container.scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.max(0, Math.min(members.length - 1, nextIndex)));
    };

    const handleUserInteraction = () => {
        setIsAutoRotatePaused(true);
    };

    return (
        <div className="md:hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onTouchStart={handleUserInteraction}
                onMouseDown={handleUserInteraction}
                onPointerDown={handleUserInteraction}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto pl-0.5 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {members.map((member) => (
                    <div
                        key={member.id}
                        data-carousel-card="true"
                        className="w-[88%] shrink-0 snap-center"
                    >
                        <TeamMemberCard member={member} />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                    {members.length === 0 ? "0 of 0" : `${activeIndex + 1} of ${members.length}`}
                </span>
                <div className="flex items-center gap-1.5">
                    {members.map((member, index) => (
                        <button
                            type="button"
                            key={member.id}
                            onClick={() => {
                                handleUserInteraction();
                                setActiveIndex(index);
                                scrollToIndex(index);
                            }}
                            aria-label={`Go to team member ${index + 1}`}
                            className={`h-2 rounded-full transition-all ${
                                index === activeIndex
                                    ? "w-5 bg-cyan-400 dark:bg-cyan-300"
                                    : "w-2 bg-slate-300 dark:bg-slate-600"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamMemberCarousel;
