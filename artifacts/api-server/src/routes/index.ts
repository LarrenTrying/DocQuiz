import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizRouter from "./quiz";
import authRouter from "./auth";
import chatRouter from "./chat";
import discordRouter from "./discord";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(discordRouter);

export default router;
