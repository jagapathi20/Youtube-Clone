import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'YouTube Clone API',
            version: '1.0.0',
            description: 'REST API for a YouTube-like platform supporting video upload, comments, likes, playlists, subscriptions, and channel analytics.',
        },
        servers: [
            {
                url: 'http://143.110.178.39/api/v1',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id:              { type: 'string',  example: '64abc123def456' },
                        username:         { type: 'string',  example: 'johndoe' },
                        email:            { type: 'string',  example: 'john@example.com' },
                        fullName:         { type: 'string',  example: 'John Doe' },
                        avatar:           { type: 'string',  example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg' },
                        coverImage:       { type: 'string',  example: 'https://res.cloudinary.com/demo/image/upload/cover.jpg' },
                        watchHistory:     { type: 'array', items: { type: 'string' }, description: 'Array of Video ObjectIds' },
                        subscribersCount: { type: 'integer', example: 1500 },
                        createdAt:        { type: 'string',  format: 'date-time' },
                        updatedAt:        { type: 'string',  format: 'date-time' },
                    },
                },
                Video: {
                    type: 'object',
                    properties: {
                        _id:         { type: 'string',  example: '64vid789abc' },
                        videoFile:   { type: 'string',  example: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' },
                        thumbnail:   { type: 'string',  example: 'https://res.cloudinary.com/demo/image/upload/thumb.jpg' },
                        title:       { type: 'string',  example: 'My First Video' },
                        description: { type: 'string',  example: 'A cool video description' },
                        duration:    { type: 'number',  example: 120.5 },
                        views:       { type: 'integer', example: 1024 },
                        isPublished: { type: 'boolean', example: true },
                        owner:       { $ref: '#/components/schemas/User' },
                        createdAt:   { type: 'string',  format: 'date-time' },
                        updatedAt:   { type: 'string',  format: 'date-time' },
                    },
                },
                Comment: {
                    type: 'object',
                    properties: {
                        _id:       { type: 'string', example: '64cmt456xyz' },
                        content:   { type: 'string', example: 'Great video!' },
                        video:     { type: 'string', example: '64vid789abc', description: 'Video ObjectId' },
                        owner:     { $ref: '#/components/schemas/User' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Like: {
                    type: 'object',
                    description: 'A like on a video, comment, or tweet. Only one of video/comment/tweet will be set per document.',
                    properties: {
                        _id:       { type: 'string', example: '64lke000abc' },
                        video:     { type: 'string', example: '64vid789abc',  description: 'Video ObjectId (if liked entity is a video)' },
                        comment:   { type: 'string', example: '64cmt456xyz',  description: 'Comment ObjectId (if liked entity is a comment)' },
                        tweet:     { type: 'string', example: '64twt123abc',  description: 'Tweet ObjectId (if liked entity is a tweet)' },
                        likedBy:   { type: 'string', example: '64abc123def456', description: 'User ObjectId' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Playlist: {
                    type: 'object',
                    properties: {
                        _id:         { type: 'string', example: '64pl001xyz' },
                        name:        { type: 'string', example: 'My Favourites' },
                        description: { type: 'string', example: 'Videos I love' },
                        video:       { type: 'array', items: { $ref: '#/components/schemas/Video' }, description: 'Array of Video documents' },
                        owner:       { $ref: '#/components/schemas/User' },
                        createdAt:   { type: 'string', format: 'date-time' },
                        updatedAt:   { type: 'string', format: 'date-time' },
                    },
                },
                Subscription: {
                    type: 'object',
                    properties: {
                        _id:        { type: 'string', example: '64sub999xyz' },
                        subscriber: { type: 'string', example: '64abc123def456', description: 'User ObjectId of the subscriber' },
                        channel:    { type: 'string', example: '64xyz789abc123', description: 'User ObjectId of the channel being subscribed to' },
                        createdAt:  { type: 'string', format: 'date-time' },
                        updatedAt:  { type: 'string', format: 'date-time' },
                    },
                },
                Tweet: {
                    type: 'object',
                    properties: {
                        _id:       { type: 'string', example: '64twt123abc' },
                        content:   { type: 'string', example: 'Just uploaded a new video!' },
                        owner:     { $ref: '#/components/schemas/User' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                ApiError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string',  example: 'Error message' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Users',         description: 'Auth and user profile management' },
            { name: 'Videos',        description: 'Video upload, retrieval, and management' },
            { name: 'Comments',      description: 'Video comments' },
            { name: 'Likes',         description: 'Like/unlike videos, comments, and tweets' },
            { name: 'Playlists',     description: 'Playlist management' },
            { name: 'Subscriptions', description: 'Channel subscriptions' },
            { name: 'Tweets',        description: 'Short-form posts' },
            { name: 'Dashboard',     description: 'Channel analytics' },
            { name: 'Healthcheck', description: 'Server health status' },
        ],
    },
    apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJSDoc(options)

const setupSwagger = (app) => {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        swaggerOptions: { persistAuthorization: true },
    }))
}

export {setupSwagger}