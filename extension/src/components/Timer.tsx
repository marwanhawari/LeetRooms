import { useCallback, useEffect, useRef, useState } from "react";
import StopwatchIcon from "../icons/StopwatchIcon";

export default function Timer({
    createdAt,
    duration,
}: {
    createdAt: Date;
    duration: number | undefined | null;
}) {
    let getTimeRemaining = useCallback(() => {
        if (!duration) {
            return 0;
        }
        let dateConvertedCreatedAt = new Date(createdAt);

        let endTime = dateConvertedCreatedAt.getTime() + duration * 60 * 1000;
        let endTimeInSeconds = Math.floor(endTime / 1000);

        let timeRemainingInSeconds =
            endTimeInSeconds - Math.floor(Date.now() / 1000);

        return Math.max(0, timeRemainingInSeconds);
    }, [duration, createdAt]);

    function formatTime(timeInSeconds: number) {
        return new Date(timeInSeconds * 1000).toISOString().slice(11, 19);
    }

    let [displayTime, setDisplayTime] = useState(getTimeRemaining());
    let intervalRef = useRef<number>();

    const handleVisibilityChange = useCallback(() => {
        if (document.visibilityState === "visible") {
            setDisplayTime(getTimeRemaining());
        }
    }, [getTimeRemaining]);

    useEffect(() => {
        function decrementTime() {
            setDisplayTime((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prevTime - 1;
            });
        }

        intervalRef.current = setInterval(decrementTime, 1000);

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleVisibilityChange]);

    return (
        <div
            className={`mt-2 flex flex-col items-center justify-center rounded-md bg-lc-fg-light px-2 py-[8px] text-xs transition-all dark:bg-lc-fg ${
                displayTime ? "" : "text-lc-hd-fg-light dark:text-lc-hd-fg"
            }`}
        >
            <div className="flex flex-row items-center gap-2">
                <StopwatchIcon />
                <div className={`font-mono`}>{formatTime(displayTime)}</div>
            </div>
        </div>
    );
}
