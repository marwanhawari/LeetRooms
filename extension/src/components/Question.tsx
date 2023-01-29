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
                "bg-lc-ez-bg",
                "text-lc-ez-fg",
                "hover:bg-lc-ez-bg-hover",
                "hover:text-lc-ez-fg",
            ];
        } else if (difficulty == Difficulty.Medium) {
            return [
                "bg-lc-md-bg",
                "text-lc-md-fg",
                "hover:bg-lc-md-bg-hover",
                "hover:text-lc-md-fg",
            ];
        } else {
            return [
                "bg-lc-hd-bg",
                "text-lc-hd-fg",
                "hover:bg-lc-hd-bg-hover",
                "hover:text-lc-hd-fg",
            ];
        }
    }

    let [
        difficultyBackgroundColor,
        difficultyTextColor,
        difficultyBackgroundColorOnHover,
        difficultyTextColorOnHover,
    ] = getColorFromDifficulty();

    return (
        <a
            className={`w-fit rounded-[21px] transition-all ${difficultyBackgroundColor} ${difficultyTextColor} py-1 px-2.5 text-xs ${difficultyBackgroundColorOnHover} ${difficultyTextColorOnHover} no-underline`}
            href={`${baseUrl}/${titleSlug}`}
            target="_top"
        >
            {id}. {title}
        </a>
    );
}
