export interface Question {
    id: string;
    title: string;
    titleSlug: string;
    difficulty: Difficulty;
    tags: string[];
}

export enum Difficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
}

export enum SubmissionStatus {
    Attempted = "Attempted",
    Accepted = "Accepted",
}
