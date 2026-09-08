import {Router} from 'express'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getVideoComments,addComment,updateComment,deleteComment} from '../controllers/comment.controller.js'

const router = Router()

router.route("/v/:videoId").get(verifyJWT, getVideoComments).post(verifyJWT, addComment);
router.route("/c/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment);
router.route("/d/:commentId").delete(verifyJWT, deleteComment);

export default router;