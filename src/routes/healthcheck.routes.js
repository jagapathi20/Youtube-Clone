import { Router } from 'express';
import { healthcheck } from "../controllers/healthcheck.controller.js"

const router = Router();

/**
 * @openapi
 * /api/v1/healthcheck:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health status
 *     description: Returns a simple health response to confirm the backend is running.
 *     operationId: getHealthcheck
 *     security: []
 *     responses:
 *       '200':
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *                 message:
 *                   type: string
 *                   example: Healthcheck fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         description: Internal server error
 */

router.route('/').get(healthcheck);

export default router