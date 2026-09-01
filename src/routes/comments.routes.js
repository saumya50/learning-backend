import {Router} from 'express'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getVideoComments,addComment,updateComment,} from '../controllers/comment.controller.js'

const router = Router()

router.use(verifyJWT);

router.route("/v/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").patch(updateComment);

export default router