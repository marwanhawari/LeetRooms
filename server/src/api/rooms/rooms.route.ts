import { Router } from "express";
import * as RoomsHandler from "./rooms.handler";

const router = Router();

router.get("/", RoomsHandler.getRoomPlayers);
router.post("/", RoomsHandler.createRoom);
router.post("/random", RoomsHandler.joinRandomRoom);
router.post("/exit", RoomsHandler.exitRoom);
router.post("/:id", RoomsHandler.joinRoomById);

export default router;
