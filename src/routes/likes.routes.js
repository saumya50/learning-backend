import {Router} from 'express'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/v/:videoId").get(verifyJWT, toggleVideoLike);

export default router;