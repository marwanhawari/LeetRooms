export interface RoomsPathParameter {
    id: string;
}

export interface Player {
    id: number;
    username: string;
    updatedAt: Date;
}

export interface PlayerSubmissions {
    title: string;
    titleSlug: string;
    difficulty: string;
    status: string;
}

export interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmissions[];
}
