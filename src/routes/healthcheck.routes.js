import { Router } from 'express';
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router();

/**
 * @swagger
 * /healthcheck:
 *   get:
 *     tags: [Healthcheck]
 *     summary: Health check
 *     description: Returns 200 if the server is up and running. No authentication required.
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Ok }
 */
router.route('/').get(healthcheck);

export default router