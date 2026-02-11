import { Router } from "express"
import{
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {cacheMiddleware} from "../middlewares/cache.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/stats").get(cacheMiddleware(600, true), getChannelStats)
router.route("/videos").get(getChannelVideos)

export default router