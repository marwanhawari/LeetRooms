import { Difficulty } from "../types/Question";

export default function Question({
    id,
    title,
    titleSlug,
    difficulty,
}: {
    id: string;
    title: string;
    titleSlug: string;
    difficulty: Difficulty;
}) {
    let baseUrl = "https://leetcode.com/problems";

    function getColorFromDifficulty() {
        if (difficulty == Difficulty.Easy.valueOf()) {
            return [
                "dark:bg-lc-ez-bg",
                "dark:text-lc-ez-fg",
                "dark:hover:bg-lc-ez-bg-hover",
                "dark:hover:text-lc-ez-fg",
            ];
        } else if (difficulty == Difficulty.Medium) {
            return [
                "dark:bg-lc-md-bg",
                "dark:text-lc-md-fg",
                "dark:hover:bg-lc-md-bg-hover",
                "dark:hover:text-lc-md-fg",
            ];
        } else {
            return [
                "dark:bg-lc-hd-bg",
                "dark:text-lc-hd-fg",
                "dark:hover:bg-lc-hd-bg-hover",
                "dark:hover:text-lc-hd-fg",
            ];
        }
    }

    function getColorFromDifficultyLight() {
        if (difficulty == Difficulty.Easy.valueOf()) {
            return [
                "bg-lc-ez-bg-light",
                "text-lc-ez-fg-light",
                "hover:bg-lc-ez-bg-hover-light",
                "hover:text-lc-ez-fg-light",
            ];
        } else if (difficulty == Difficulty.Medium) {
            return [
                "bg-lc-md-bg-light",
                "text-lc-md-fg-light",
                "hover:bg-lc-md-bg-hover-light",
                "hover:text-lc-md-fg-light",
            ];
        } else {
            return [
                "bg-lc-hd-bg-light",
                "text-lc-hd-fg-light",
                "hover:bg-lc-hd-bg-hover-light",
                "hover:text-lc-hd-fg-light",
            ];
        }
    }

    let [
        difficultyBackgroundColor,
        difficultyTextColor,
        difficultyBackgroundColorOnHover,
        difficultyTextColorOnHover,
    ] = getColorFromDifficulty();

    let [
        difficultyBackgroundColorLight,
        difficultyTextColorLight,
        difficultyBackgroundColorOnHoverLight,
        difficultyTextColorOnHoverLight,
    ] = getColorFromDifficultyLight();

    return (
        <a
            className={`w-fit rounded-[21px] transition-all ${difficultyBackgroundColorLight} ${difficultyBackgroundColor} ${difficultyTextColorLight} ${difficultyTextColor} py-1 px-2.5 text-xs ${difficultyBackgroundColorOnHoverLight} ${difficultyBackgroundColorOnHover} ${difficultyTextColorOnHoverLight} ${difficultyTextColorOnHover} no-underline`}
            href={`${baseUrl}/${titleSlug}`}
            target="_top"
        >
            {id}. {title}
        </a>
    );
}
