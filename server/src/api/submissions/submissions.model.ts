export interface SubmissionRequestBody {
    submissionStatus: SubmissionStatus;
    questionTitleSlug: string;
}

export enum SubmissionStatus {
    Attempted = "Attempted",
    Accepted = "Accepted",
}
