import { Router } from "express"
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /playlists:
 *   post:
 *     tags: [Playlists]
 *     summary: Create a playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: My Favourites }
 *               description: { type: string, example: Videos I love watching }
 *     responses:
 *       201:
 *         description: Playlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: Playlist created successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       400:
 *         description: Playlist name is required
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
router.route("/").post(createPlaylist)

/**
 * @swagger
 * /playlists/{playlistId}:
 *   get:
 *     tags: [Playlists]
 *     summary: Get playlist by ID
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema: { type: string }
 *         example: 64pl001xyz
 *     responses:
 *       200:
 *         description: Playlist fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Playlist fetched successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       404:
 *         description: Playlist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   patch:
 *     tags: [Playlists]
 *     summary: Update playlist
 *     description: Owner only.
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema: { type: string }
 *         example: 64pl001xyz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Updated Playlist Name }
 *               description: { type: string, example: Updated description }
 *     responses:
 *       200:
 *         description: Playlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Playlist updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Forbidden — not the playlist owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   delete:
 *     tags: [Playlists]
 *     summary: Delete playlist
 *     description: Owner only.
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema: { type: string }
 *         example: 64pl001xyz
 *     responses:
 *       200:
 *         description: Playlist deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Playlist deleted successfully }
 *       403:
 *         description: Forbidden — not the playlist owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist)

/**
 * @swagger
 * /playlists/add/{videoId}/{playlistId}:
 *   patch:
 *     tags: [Playlists]
 *     summary: Add video to playlist
 *     description: Appends a video to the playlist. Owner only. Duplicates are ignored.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema: { type: string }
 *         example: 64pl001xyz
 *     responses:
 *       200:
 *         description: Video added to playlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video added to playlist successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Forbidden — not the playlist owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Playlist or video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)

/**
 * @swagger
 * /playlists/remove/{videoId}/{playlistId}:
 *   patch:
 *     tags: [Playlists]
 *     summary: Remove video from playlist
 *     description: Owner only.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema: { type: string }
 *         example: 64pl001xyz
 *     responses:
 *       200:
 *         description: Video removed from playlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video removed from playlist successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Playlist'
 *       403:
 *         description: Forbidden — not the playlist owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Playlist or video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

/**
 * @swagger
 * /playlists/user/{userId}:
 *   get:
 *     tags: [Playlists]
 *     summary: Get user's playlists
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         example: 64abc123def456
 *     responses:
 *       200:
 *         description: Playlists fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Playlists fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Playlist'
 *       404:
 *         description: User not found
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
router.route("/user/:userId").get(getUserPlaylists)

export default router