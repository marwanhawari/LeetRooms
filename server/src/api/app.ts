import express, {
    urlencoded,
    json,
    Request,
    Response,
    NextFunction,
} from "express";
import ResponseMessage, { SessionResponse } from "../types/Session";
import { instrument } from "@socket.io/admin-ui";
import {
    DiscordProfile,
    GitHubProfile,
    GoogleProfile,
    TwitchProfile,
} from "../types/authProfiles";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { errorHandler, ensureAuthenticated } from "./middleware";
import roomsRoute from "../api/rooms/rooms.route";
import authRoute from "../api/auth/auth.route";
import session, { Session } from "express-session";
import passport from "passport";
import Redis from "ioredis";
import { User } from "@prisma/client";
import prisma from "../index";
import { Strategy as TwitchStrategy, Scope } from "@hewmen/passport-twitch";
import { RoomSession } from "../types/Session";
const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20");
const DiscordStrategy = require("passport-discord").Strategy;
let RedisStore = require("connect-redis")(session);
import { exitRoomFunction } from "./rooms/rooms.handler";
import { MessageInterface } from "../types/Message";
import { httplog, logger } from "../logger";
const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);
app.use(urlencoded({ extended: true }));
app.use(json());

if (!process.env.REDIS_URL) {
    throw new Error("Need a Redis connection URL");
}
if (!process.env.EXPRESS_SESSION_SECRET) {
    throw new Error("Need an express-session secret");
}
let redisClient = new Redis(process.env.REDIS_URL);

app.set("trust proxy", 1);
let sessionMiddleware = session({
    name: "leetrooms.sid",
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 604_800_000, // 7 days
        httpOnly: true,
        sameSite: "none",
        secure: true,
        domain: process.env.COOKIE_DOMAIN || undefined,
    },
    store: new RedisStore({ client: redisClient }),
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    // https://github.com/settings/developers
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || "placeholder",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/github/callback",
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: GitHubProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.username,
                        picture: profile._json?.avatar_url,
                        provider: profile.provider,
                        providerUserId: profile.id,
                    },
                });
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);
passport.use(
    // https://console.cloud.google.com/apis/credentials
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || "placeholder",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/google/callback",
            scope: ["profile"],
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: GoogleProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.displayName,
                        picture: profile._json?.picture,
                        provider: profile.provider,
                        providerUserId: profile.id,
                    },
                });
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);
passport.use(
    // https://discord.com/developers/applications
    new DiscordStrategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID || "placeholder",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/discord/callback",
            scope: "identify",
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: DiscordProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.username,
                        picture:
                            profile.id && profile.avatar
                                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}`
                                : null,
                        provider: profile.provider,
                        providerUserId: profile.id,
                    },
                });
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);
passport.use(
    // https://dev.twitch.tv/console/apps
    new TwitchStrategy(
        {
            clientID: process.env.TWITCH_CLIENT_ID || "placeholder",
            clientSecret: process.env.TWITCH_CLIENT_SECRET || "placeholder",
            callbackURL: "/auth/twitch/callback",
            scope: [Scope.UserReadBroadcast],
        },
        async function (
            accessToken: string,
            refreshToken: string,
            profile: TwitchProfile,
            done: any
        ) {
            try {
                let user = await prisma.user.upsert({
                    where: {
                        provider_providerUserId: {
                            provider: profile.provider,
                            providerUserId: profile.id,
                        },
                    },
                    update: {},
                    create: {
                        username: profile.display_name,
                        picture: profile.profile_image_url,
                        provider: profile.provider,
                        providerUserId: profile.id,
                    },
                });
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user: User, done) => {
    done(null, user);
});

app.get("/", (req: Request, res: Response<ResponseMessage>) => {
    return res.json({
        message: "LeetRooms API",
    });
});

export async function getUserRoomSession(
    userId: string | number
): Promise<RoomSession | undefined> {
    let roomString = await redisClient.get(`userRoomSession:${userId}`);
    return roomString ? JSON.parse(roomString) : undefined;
}

export async function setUserRoomSession(
    userId: string | number,
    room: RoomSession
) {
    await redisClient.set(`userRoomSession:${userId}`, JSON.stringify(room));
}

export async function deleteUserRoomSession(userId: string | number) {
    await redisClient.del(`userRoomSession:${userId}`);
}

app.get(
    "/sessions",
    async (
        req: Request,
        res: Response<SessionResponse | null>,
        next: NextFunction
    ) => {
        if (req.isAuthenticated()) {
            let room: RoomSession | undefined;

            try {
                room = await getUserRoomSession(req.user.id);
            } catch (error) {
                return next(error);
            }

            let sessionResponse: SessionResponse = {
                username: req.user.username,
                provider: req.user.provider,
                picture: req.user.picture,
                room: room,
            };
            return res.json(sessionResponse);
        }
        return res.json(null);
    }
);

app.use(httplog);
app.use("/auth", authRoute);
app.use("/rooms", ensureAuthenticated, roomsRoute);
app.use(errorHandler);

declare module "http" {
    interface IncomingMessage {
        session: Session & {
            passport: {
                user: User;
            };
        };
        sessionID: string;
    }
}

const server = http.createServer(app);
const io = new Server(server, {
    serveClient: false,
    transports: ["websocket", "polling"],
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

if (process.env.NODE_ENV == "production") {
    if (!process.env.SOCKETIO_USER || !process.env.SOCKETIO_PASSWORD) {
        throw new Error(
            "Need socket.io admin dashboard credentials in production"
        );
    }
    instrument(io, {
        auth: {
            type: "basic",
            username: process.env.SOCKETIO_USER,
            password: process.env.SOCKETIO_PASSWORD,
        },
        mode: "production",
    });
} else if (process.env.NODE_ENV == "development") {
    instrument(io, {
        auth: false,
        mode: "development",
    });
}

io.use((socket, next) => {
    sessionMiddleware(
        socket.request as Request,
        {} as Response,
        next as NextFunction
    );
});

// Only allow authenticated users to connect to the socket
io.use((socket, next) => {
    if (socket.request?.session?.passport?.user) {
        return next();
    } else {
        logger.error({
            message: `Unauthenticated user attempting to connect with socket`,
            socket: socket,
        });
        return;
    }
});

const CLOSED_WINDOW_CACHE_EXPIRATION = 180; // 3 minutes (in sec)
const CLOSED_WINDOW_TIMEOUT = 5_400_000; // 90 minutes (in ms)
const IDLE_WINDOW_TIMEOUT = 7_200_000; // 120 minutes (in ms)

io.on("connection", async (socket) => {
    socket.use((__, next) => {
        socket.request.session.reload((err) => {
            if (err) {
                return socket.disconnect();
            } else {
                return next();
            }
        });
    });

    if (!socket.request.session.passport.user) {
        logger.error(
            "Cannot connect without a user session and a room session"
        );
        return;
    }

    let room: RoomSession | undefined;

    try {
        room = await getUserRoomSession(
            socket.request.session.passport.user.id
        );
    } catch (error) {
        logger.error("Could not fetch a room session for the user");
        return;
    }

    if (!room) {
        logger.error("Cannot connect without a room session");
        return;
    }

    if (!socket.request.session.passport.user) {
        logger.error(
            "Cannot connect without a user session and a room session"
        );
        return;
    }

    try {
        let closedWindowTimer = await redisClient.get(
            `closedWindowTimer:${socket.request.session.passport.user.id}`
        );
        if (closedWindowTimer) {
            clearTimeout(parseInt(closedWindowTimer, 10));
            try {
                await redisClient.del(
                    `closedWindowTimer:${socket.request.session.passport.user.id}`
                );
            } catch (error) {
                logger.error(error);
            }
        }
    } catch (error) {
        logger.error(
            `Failed to fetch closedWindowTimer record for user id ${socket.request.session.passport.user.id}`
        );
    }

    socket.join([`${socket.request.session.passport.user.id}`, room.roomId]);

    async function idleWindowTimerFunction() {
        try {
            await exitRoomFunction(socket.request as Request);
        } catch (error) {
            logger.warn(
                "Tried to autodisconnect multiple idle windows at once"
            );
        }
    }
    let idleWindowTimer = setTimeout(
        idleWindowTimerFunction,
        IDLE_WINDOW_TIMEOUT
    );

    socket.on("chat-message", async (message: MessageInterface) => {
        if (!room) {
            return;
        }
        io.to(`${socket.request.session.passport.user.id}`).emit(
            "keep-alive",
            "keep-alive-message-server"
        );
        io.to(room.roomId).emit("chat-message", message);
    });

    socket.on("keep-alive", () => {
        clearInterval(idleWindowTimer);
        idleWindowTimer = setTimeout(
            idleWindowTimerFunction,
            IDLE_WINDOW_TIMEOUT
        );
    });

    socket.on("disconnect", async () => {
        // This prevents any other socket that happens to be open from calling the /exit endpoint.
        // All remaining sockets for this session get disconnected when I call the /exit endpoint for the sesssion for the first time
        clearTimeout(idleWindowTimer);

        try {
            let numberOfClientsForUser = await io
                .in(`${socket.request.session.passport.user.id}`)
                .fetchSockets()
                .then((clients) => clients.length);
            if (numberOfClientsForUser == 0) {
                redisClient.setex(
                    `closedWindowTimer:${socket.request.session.passport.user.id}`,
                    CLOSED_WINDOW_CACHE_EXPIRATION,
                    setTimeout(async () => {
                        try {
                            await exitRoomFunction(socket.request as Request);
                        } catch (error) {
                            logger.warn(error);
                        }
                        try {
                            await redisClient.del(
                                `closedWindowTimer:${socket.request.session.passport.user.id}`
                            );
                        } catch (error) {
                            logger.error(error);
                        }
                    }, CLOSED_WINDOW_TIMEOUT)[Symbol.toPrimitive]()
                );
            }
        } catch (error) {
            logger.error(
                `There was an error fetching the number of clients for user id ${socket.request.session.passport.user.id} while disconnecting`
            );
        }
    });
});

export { io };
export default server;
