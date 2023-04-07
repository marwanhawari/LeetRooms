export interface RoomsPathParameter {
    id: string;
}

export interface Player {
    id: number;
    username: string;
    updatedAt: Date;
}

export interface PlayerSubmission {
    title: string;
    titleSlug: string;
    difficulty: string;
    status: string;
    updatedAt: Date;
}

export interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmission[];
}
