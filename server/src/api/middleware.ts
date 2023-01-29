import { Request, Response, NextFunction } from "express";
import ResponseMessage from "../types/Session";

export function errorHandler(
    error: Error,
    req: Request,
    res: Response<ResponseMessage>,
    next: NextFunction
) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: error.message,
    });
}

export function ensureAuthenticated(
    req: Request,
    res: Response<ResponseMessage>,
    next: NextFunction
) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401);
    return next(new Error("Unauthenticated request"));
}
