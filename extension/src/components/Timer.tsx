import { useCallback, useEffect, useRef, useState } from "react";
import StopwatchIcon from "../icons/StopwatchIcon";

export default function Timer({
    createdAt,
    duration,
}: {
    createdAt: Date;
    duration: number | undefined | null;
}) {
    const getTimeRemaining = useCallback(() => {
        if (!duration) return 0;
        const endTime = new Date(createdAt).getTime() + duration * 60 * 1000;
        const endTimeInSeconds = Math.floor(endTime / 1000);
        const timeRemainingInSeconds =
            endTimeInSeconds - Math.floor(Date.now() / 1000);
        return Math.max(0, timeRemainingInSeconds);
    }, [duration, createdAt]);

    function formatTime(timeInSeconds: number) {
        return new Date(timeInSeconds * 1000).toISOString().slice(11, 19);
    }
    const [displayTime, setDisplayTime] = useState(getTimeRemaining);
    const intervalRef = useRef<number>();

    useEffect(() => {
        function updateTime() {
            const time = getTimeRemaining();
            setDisplayTime(time);
            if (time <= 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        intervalRef.current = window.setInterval(updateTime, 1000);
        updateTime();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                updateTime();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [getTimeRemaining]);

    return (
        <div
            className={`mt-2 flex flex-col items-center justify-center rounded-md bg-lc-fg-light px-2 py-[8px] text-xs transition-all dark:bg-lc-fg ${
                displayTime ? "" : "text-lc-hd-fg-light dark:text-lc-hd-fg"
            }`}
        >
            <div className="flex flex-row items-center gap-2">
                <StopwatchIcon />
                <div className="font-mono">{formatTime(displayTime)}</div>
            </div>
        </div>
    );
}
