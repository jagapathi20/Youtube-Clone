import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "YouTube Backend API",
            version: "1.0.0",
            description: `
REST API for a YouTube clone backend built with Node.js, Express, and MongoDB.

**Authentication:** All endpoints require a valid JWT via \`Authorization: Bearer <token>\`.

**Response envelope:** Every response follows the shape:
\`\`\`json
{ "statusCode": 200, "data": {}, "message": "...", "success": true }
\`\`\`
            `,
        },
        servers: [
            {
                url: "/api/v1",
                description: "API v1",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                ObjectId: {
                    type: "string",
                    pattern: "^[a-f\\d]{24}$",
                    example: "64b8f3e2a1c2d3e4f5a6b7c8",
                },
                Comment: {
                    type: "object",
                    properties: {
                        _id: { $ref: "#/components/schemas/ObjectId" },
                        content: { type: "string", example: "Great video!" },
                        video: { $ref: "#/components/schemas/ObjectId" },
                        owner: { $ref: "#/components/schemas/ObjectId" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                PaginatedComments: {
                    type: "object",
                    properties: {
                        docs: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Comment" },
                        },
                        totalDocs: { type: "integer", example: 42 },
                        limit: { type: "integer", example: 10 },
                        page: { type: "integer", example: 1 },
                        totalPages: { type: "integer", example: 5 },
                        hasPrevPage: { type: "boolean", example: false },
                        hasNextPage: { type: "boolean", example: true },
                        prevPage: { type: "integer", nullable: true, example: null },
                        nextPage: { type: "integer", example: 2 },
                    },
                },
                ApiResponse: {
                    type: "object",
                    properties: {
                        statusCode: { type: "integer" },
                        data: {},
                        message: { type: "string" },
                        success: { type: "boolean" },
                    },
                },
                ApiError: {
                    type: "object",
                    properties: {
                        statusCode: { type: "integer" },
                        message: { type: "string" },
                        success: { type: "boolean", example: false },
                        errors: { type: "array", items: { type: "string" } },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: "Missing or invalid JWT token.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ApiError" },
                            example: { statusCode: 401, message: "Unauthorized", success: false, errors: [] },
                        },
                    },
                },
                Forbidden: {
                    description: "You do not own this resource.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ApiError" },
                            example: { statusCode: 403, message: "You are not allowed to perform this action", success: false, errors: [] },
                        },
                    },
                },
                NotFound: {
                    description: "Resource not found.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ApiError" },
                            example: { statusCode: 404, message: "Comment not found", success: false, errors: [] },
                        },
                    },
                },
                BadRequest: {
                    description: "Validation error or missing required fields.",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ApiError" },
                            example: { statusCode: 400, message: "Content is required", success: false, errors: [] },
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // Glob pattern — add more route files here as you build them out
    apis: ["../routes/*.js"],
}

const swaggerSpec = swaggerJsdoc(options)

/**
 * @param {import("express").Application} app
 */
export function setupSwagger(app) {
    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: "YouTube API Docs",
            swaggerOptions: {
                persistAuthorization: true, // keeps JWT filled in across page refreshes
            },
        })
    )

    // Also expose the raw spec as JSON (useful for Postman import)
    app.get("/api/docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json")
        res.send(swaggerSpec)
    })
}