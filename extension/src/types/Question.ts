export interface QuestionInterface {
    id: string;
    title: string;
    titleSlug: string;
    difficulty: Difficulty;
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
