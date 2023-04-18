export interface SubmissionRequestBody {
    submissionStatus: SubmissionStatus;
    questionTitleSlug: string;
    url: string;
}

export enum SubmissionStatus {
    Attempted = "Attempted",
    Accepted = "Accepted",
}
