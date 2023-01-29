import { Router } from "express";
import * as AuthHandler from "./auth.handler";
import passport from "passport";

const router = Router();

const FAILURE_REDIRECT_URL = process.env.FAILURE_REDIRECT_URL;
const SUCCESS_REDIRECT_URL = process.env.SUCCESS_REDIRECT_URL;

router.get("/github", passport.authenticate("github"));
router.get(
    "/github/callback",
    passport.authenticate("github", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);
router.get("/google", passport.authenticate("google"));
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);
router.get("/discord", passport.authenticate("discord", { prompt: "none" }));
router.get(
    "/discord/callback",
    passport.authenticate("discord", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);
router.get("/twitch", passport.authenticate("twitch"));
router.get(
    "/twitch/callback",
    passport.authenticate("twitch", {
        failureRedirect: FAILURE_REDIRECT_URL,
        successRedirect: SUCCESS_REDIRECT_URL,
    })
);

router.delete("/signout", AuthHandler.signOut);

export default router;
