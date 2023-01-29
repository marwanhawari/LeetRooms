import { User as PrismaUser } from "@prisma/client";

interface PassportProfile {
    id: string;
    provider: string;
}

export interface GitHubProfile extends PassportProfile {
    username: string;
    _json?: {
        avatar_url?: string;
    };
}

export interface GoogleProfile extends PassportProfile {
    displayName: string;
    _json?: {
        picture?: string;
    };
}

export interface DiscordProfile extends PassportProfile {
    username: string;
    avatar?: string;
}

export interface TwitchProfile extends PassportProfile {
    display_name: string;
    profile_image_url?: string;
}

declare global {
    namespace Express {
        interface User extends PrismaUser {}
    }
}
