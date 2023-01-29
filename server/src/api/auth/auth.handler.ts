import { Request, Response, NextFunction } from "express";

export async function signOut(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return next(new Error("No session found"));
    }
    try {
        req.session.destroy((error) => {
            if (error) {
                throw new Error("Could not destory session");
            }
        });
        res.clearCookie("leetrooms.sid");
        delete req.user;
        return res.json(null);
    } catch (error) {
        return next(error);
    }
}
