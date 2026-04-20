import { Router } from "express"
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import { cacheMiddleware } from "../middlewares/cache.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /videos:
 *   get:
 *     tags: [Videos]
 *     summary: Get all videos
 *     description: Paginated, searchable list of published videos. Cached globally for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Search term (title or description)
 *         example: javascript tutorial
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, views, duration], default: createdAt }
 *       - in: query
 *         name: sortType
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by uploader's user ID
 *     responses:
 *       200:
 *         description: Videos fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Videos fetched successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     docs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Video'
 *                     totalDocs: { type: integer, example: 100 }
 *                     page: { type: integer, example: 1 }
 *                     totalPages: { type: integer, example: 10 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   post:
 *     tags: [Videos]
 *     summary: Publish a video
 *     description: Uploads video file and thumbnail to Cloudinary. Duration is auto-extracted.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [videoFile, thumbnail, title, description]
 *             properties:
 *               videoFile:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *                 example: My Awesome Tutorial
 *               description:
 *                 type: string
 *                 example: Learn everything about X
 *     responses:
 *       201:
 *         description: Video published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: Video published successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Video file or thumbnail missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/")
    .get(cacheMiddleware(300, false), getAllVideos)
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 },
        ]),
        publishAVideo
    )

/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     tags: [Videos]
 *     summary: Get video by ID
 *     description: Returns video with owner info and like count. Increments view count. Cached 2 minutes.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     responses:
 *       200:
 *         description: Video fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video fetched successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   patch:
 *     tags: [Videos]
 *     summary: Update video details
 *     description: Update title, description, or thumbnail. Owner only.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: Updated Title }
 *               description: { type: string, example: Updated description }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       403:
 *         description: Forbidden — not the video owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   delete:
 *     tags: [Videos]
 *     summary: Delete a video
 *     description: Deletes video and removes files from Cloudinary. Owner only.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video deleted successfully }
 *       403:
 *         description: Forbidden — not the video owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/:videoId")
    .get(cacheMiddleware(120, false), getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

/**
 * @swagger
 * /videos/toggle/publish/{videoId}:
 *   patch:
 *     tags: [Videos]
 *     summary: Toggle publish status
 *     description: Flips isPublished between true/false. Owner only.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     responses:
 *       200:
 *         description: Publish status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video publish status toggled successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isPublished: { type: boolean, example: false }
 *       403:
 *         description: Forbidden — not the video owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router