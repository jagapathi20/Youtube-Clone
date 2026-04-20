# YouTube Clone - Backend API

A production-ready, scalable backend API for a YouTube-like video streaming platform built with Node.js, Express.js, and MongoDB. This project demonstrates advanced backend engineering concepts including authentication, authorization, caching, validation, service layer architecture, and clean code practices.

## Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based auth with access & refresh tokens
  - Secure password hashing with bcrypt
  - Token rotation and session management
  - Protected routes using middleware

- **Video Management**
  - Video upload with thumbnail handling
  - Publish/unpublish videos
  - Metadata management
  - Pagination and filtering

- **Social Features**
  - Like/Unlike system (videos, comments, tweets)
  - Nested comment system with replies
  - Channel subscription system
  - Tweet functionality
  - Watch history tracking

- **Playlist Management**
  - Create, update, delete playlists
  - Add/remove videos from playlists

- **User Profile**
  - Channel profile with stats
  - Avatar & cover image management
  - Subscriber count and analytics

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Caching:** Redis
- **Validation:** Joi
- **Authentication:** JWT
- **File Upload:** Multer + Cloudinary
- **Security:** bcrypt
- **Others:** mongoose-aggregate-paginate-v2, cookie-parser, cors

## Project Structure
```bash

├── docker-compose.yml
├── dockerfile
├── index.js
├── jest.config.js
├── nginx.conf
├── package-lock.json
├── package.json
├── README.md
├── src
│   ├── app.js
│   ├── config
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── swagger.js
│   ├── constants.js
│   ├── controllers
│   │   ├── comment.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── healthcheck.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   ├── user.controller.js
│   │   └── video.controller.js
│   ├── cron
│   │   └── viewSync.cron.js
│   ├── middlewares
│   │   ├── auth.middleware.js
│   │   ├── cache.middleware.js
│   │   ├── error.middleware.js
│   │   ├── multer.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validator.middleware.js
│   ├── models
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   ├── subscription.model.js
│   │   ├── tweet.model.js
│   │   ├── user.model.js
│   │   └── video.model.js
│   ├── routes
│   │   ├── comment.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   ├── tweet.routes.js
│   │   ├── user.routes.js
│   │   └── video.routes.js
│   ├── services
│   │   ├── comment.service.js
│   │   ├── dashboard.service.js
│   │   ├── like.service.js
│   │   ├── playlist.service.js
│   │   ├── subscription.service.js
│   │   ├── tweet.service.js
│   │   ├── user.service.js
│   │   └── video.service.js
│   ├── utils
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── cacheInvalidator.js
│   │   ├── cleanLocalFiles.js
│   │   ├── cloudinary.js
│   │   └── Pagination.js
│   └── validators
│       └── user.validator.js
├── SystemDesignAndScalability.md
├── tests
│   ├── Integration
│   └── unit

```



##  Data Models

### User Model
- Username, email, password (hashed)
- Avatar and cover image
- Watch history
- Refresh token
- Timestamps

### Video Model
- Video file URL (Cloudinary)
- Thumbnail URL
- Title, description, duration
- Views count
- Published status
- Owner reference

### Comment Model
- Content
- Video reference
- Owner reference
- Timestamps

### Like Model
- Polymorphic design (can like videos, comments, or tweets)
- User reference (likedBy)
- Timestamps

### Playlist Model
- Name and description
- Array of video references
- Owner reference
- Timestamps

### Subscription Model
- Subscriber reference
- Channel reference
- Timestamps

### Tweet Model
- Content
- Owner reference
- Timestamps

##  API Endpoints

### Authentication & User Management
```
POST   /api/v1/users/register              # Register new user
POST   /api/v1/users/login                 # Login user
POST   /api/v1/users/logout                # Logout user (Protected)
POST   /api/v1/users/refresh-token         # Refresh access token
POST   /api/v1/users/change-password       # Change password (Protected)
GET    /api/v1/users/current-user          # Get current user (Protected)
PATCH  /api/v1/users/update-account        # Update account details (Protected)
PATCH  /api/v1/users/change-avatar         # Update avatar (Protected)
PATCH  /api/v1/users/update_coverImage     # Update cover image (Protected)
GET    /api/v1/users/c/:username           # Get channel profile (Protected)
GET    /api/v1/users/history               # Get watch history (Protected)
```

### Video Management
```
GET    /api/v1/videos                      # Get all videos (Protected)
POST   /api/v1/videos                      # Upload video (Protected)
GET    /api/v1/videos/:videoId             # Get video by ID (Protected)
PATCH  /api/v1/videos/:videoId             # Update video (Protected)
DELETE /api/v1/videos/:videoId             # Delete video (Protected)
PATCH  /api/v1/videos/toggle/publish/:videoId  # Toggle publish status (Protected)
```

### Comments
```
GET    /api/v1/comments/:videoId           # Get video comments (Protected)
POST   /api/v1/comments/:videoId           # Add comment (Protected)
PATCH  /api/v1/comments/c/:commentId       # Update comment (Protected)
DELETE /api/v1/comments/c/:commentId       # Delete comment (Protected)
```

### Likes
```
POST   /api/v1/likes/toggle/v/:videoId     # Toggle video like (Protected)
POST   /api/v1/likes/toggle/c/:commentId   # Toggle comment like (Protected)
POST   /api/v1/likes/togle/t/:tweetId      # Toggle tweet like (Protected)
GET    /api/v1/likes/likedVideos           # Get liked videos (Protected)
```

### Playlists
```
POST   /api/v1/playlist                    # Create playlist (Protected)
GET    /api/v1/playlist/:playlistId        # Get playlist by ID (Protected)
PATCH  /api/v1/playlist/:playlistId        # Update playlist (Protected)
DELETE /api/v1/playlist/:playlistId        # Delete playlist (Protected)
PATCH  /api/v1/playlist/add/:videoId/:playlistId     # Add video to playlist (Protected)
PATCH  /api/v1/playlist/remove/:videoId/:playlistId  # Remove video from playlist (Protected)
GET    /api/v1/playlist/user/:userId       # Get user playlists (Protected)
```

### Subscriptions
```
POST   /api/v1/subscriptions/c/:channelId  # Toggle subscription (Protected)
GET    /api/v1/subscriptions/c/:channelId  # Get subscribed channels (Protected)
GET    /api/v1/subscriptions/u/:subscriberId  # Get channel subscribers (Protected)
```

### Tweets
```
POST   /api/v1/tweets                      # Create tweet (Protected)
GET    /api/v1/tweets/user/:userId         # Get user tweets (Protected)
PATCH  /api/v1/tweets/:tweetId             # Update tweet (Protected)
DELETE /api/v1/tweets/:tweetId             # Delete tweet (Protected)
```

### Health Check
```
GET    /api/v1/healthcheck                 # API health status
```

##  Authentication Flow

1. **Registration:** User registers with email, username, password, and avatar
2. **Login:** User receives access token (short-lived) and refresh token (long-lived)
3. **Access Protected Routes:** Access token sent via cookies or Authorization header
4. **Token Refresh:** When access token expires, use refresh token to get new access token
5. **Logout:** Refresh token is cleared from database and cookies

##  Key Technical Highlights

## Key Technical Highlights

- **Service Layer Architecture** — Clean separation of business logic from controllers
- **Redis Caching** — Implemented with custom cache middleware and invalidation utilities
- **Joi Validation** — Robust request validation with dedicated validator files
- **Enhanced Middleware** — Authentication, Multer, Cache, Error, and Validator middlewares
- **Advanced MongoDB Aggregations** — Complex pipelines with lookup, pagination, and optimization
- **Secure File Handling** — Multer + Cloudinary with automatic local file cleanup
- **JWT Authentication** — Access & Refresh tokens with rotation and HTTP-only cookies
- **Polymorphic Like System** — Single Like model for videos, comments, and tweets
- **Global Error Handling** — Centralized error middleware with consistent API responses

## API Endpoints

### Authentication & User Management
```http
POST   /api/v1/users/register
POST   /api/v1/users/login
POST   /api/v1/users/logout
POST   /api/v1/users/refresh-token
GET    /api/v1/users/current-user
PATCH  /api/v1/users/update-account
PATCH  /api/v1/users/change-avatar
PATCH  /api/v1/users/update-cover-image
GET    /api/v1/users/c/:username          # Channel profile
GET    /api/v1/users/history              # Watch history
```

##  Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd youtube-clone-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=*

# Database
MONGODB_URL=mongodb://localhost:27017

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:8000`

##  Testing

You can test the API endpoints using:
- Postman
- Thunder Client
- cURL
- Any REST client

### Sample Request (Login)
```bash
curl -X POST http://localhost:8000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

##  Performance Considerations

- **Database Indexing:** Strategic indexes on frequently queried fields (username, email)
- **Aggregation Optimization:** Efficient pipeline stages to minimize database operations
- **File Upload:** Async processing with temporary storage cleanup
- **Pagination:** Built-in pagination for large datasets
- **Mongoose Connection Pooling:** Optimized database connections

## Code Quality

- **Clean Architecture** with Service Layer for better separation of concerns
- **Consistent code structure** and naming conventions across the project
- **Modular and Maintainable** design following industry best practices
- **Thin Controllers** – Business logic moved to dedicated service files
- **Robust Validation** using Joi schemas in separate validator files
- **Comprehensive Error Handling** with custom `ApiError` and global error middleware
- **Reusable Utilities** for common operations (Cloudinary, caching, file cleanup)
- **Well-documented** and readable code with clear comments where necessary
- **Type Safety Awareness** and consistent async/await usage

### Future Improvements
1. Implement video transcoding for multiple qualities
2. Add real-time notifications using WebSockets
3. Implement search functionality with text indexes
4. Add video recommendation algorithm
5. Implement rate limiting for API endpoints
6. Add comprehensive unit and integration tests
7. Add API documentation with Swagger/OpenAPI
8. Implement video streaming with HLS/DASH
    

##  License

This project is open source and available under the [MIT License](LICENSE).


##  Acknowledgments

- Inspired by YouTube's architecture and features
- Built as a learning project to demonstrate backend engineering skills

---

