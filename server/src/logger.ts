import { Request, Response } from "express";
import pino from "pino";
const logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
        targets: [
            {
                level: "info",
                target: "pino/file",
                options: {
                    destination: `./logs/${new Date()
                        .toISOString()
                        .substring(0, 10)}.log`,
                    mkdir: true,
                },
            },
            { level: "info", target: "pino/file", options: { destination: 1 } },
        ],
    },
});
const httplog = require("pino-http")({
    logger: logger,
    customLogLevel: (req: Request, res: Response, error: Error) => {
        if (res.statusCode >= 400 || error) {
            return "error";
        }
        return "info";
    },
    customErrorMessage: (req: Request, res: Response, error: Error) => {
        return error.message;
    },
});

export { httplog, logger };
