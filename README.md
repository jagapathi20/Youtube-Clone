# YouTube Clone - Backend API

A production-ready, scalable backend API for a YouTube-like video streaming platform built with Node.js, Express.js, and MongoDB. This project demonstrates advanced backend engineering concepts including authentication, authorization, file upload handling, aggregation pipelines, and RESTful API design.

##  Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Secure password hashing with bcrypt
  - Token rotation and session management
  - Protected routes with middleware

- **Video Management**
  - Video upload and processing
  - Thumbnail management
  - Publish/unpublish functionality
  - Video metadata management
  - Pagination and filtering

- **Social Features**
  - Like/unlike videos, comments, and tweets
  - Comment system with nested replies support
  - Subscription system (channel subscriptions)
  - Tweet functionality
  - Watch history tracking

- **Playlist Management**
  - Create, update, and delete playlists
  - Add/remove videos from playlists
  - User-specific playlist management

- **User Profile**
  - Channel profile with statistics
  - Avatar and cover image management
  - Watch history
  - Subscriber count and channel analytics

##  Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer + Cloudinary
- **Password Security:** bcrypt
- **Additional Libraries:**
  - mongoose-aggregate-paginate-v2 (pagination)
  - cookie-parser (cookie management)
  - cors (cross-origin resource sharing)

##  Project Structure

```
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── user.controller.js
│   │   ├── video.controller.js
│   │   ├── comment.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   └── dashboard.controller.js
│   │
│   ├── models/               # Mongoose schemas
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   ├── subscription.model.js
│   │   └── tweet.model.js
│   │
│   ├── routes/               # API routes
│   │   ├── user.routes.js
│   │   ├── video.routes.js
│   │   ├── comment.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   └── tweet.routes.js
│   │
│   ├── middlewares/          # Custom middlewares
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   │
│   ├── utils/                # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   │
│   ├── db/                   # Database configuration
│   │   └── index.js
│   │
│   ├── app.js                # Express app configuration
│   ├── constants.js          # App constants
│   └── index.js              # Entry point
│
└── public/temp/              # Temporary file storage
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

### 1. Advanced MongoDB Aggregation Pipelines
- Complex multi-stage pipelines for fetching related data
- Efficient data aggregation with `$lookup`, `$match`, `$addFields`
- Pagination support using `mongoose-aggregate-paginate-v2`

Example from `user.controller.js`:
```javascript
const channel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $addFields: {
            subscribersCount: { $size: "$subscribers" },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
    }
])
```

### 2. Secure File Upload Pipeline
- Multer for multipart form data handling
- Local temporary storage
- Cloudinary integration for cloud storage
- Automatic cleanup of local files
- Old file deletion when updating

### 3. Middleware Architecture
- Custom async handler for error management
- JWT verification middleware
- Route protection with authentication
- File upload middleware with Multer

### 4. Error Handling
- Centralized error handling with custom `ApiError` class
- Consistent error response format
- Proper HTTP status codes
- Async error handling wrapper

### 5. Security Best Practices
- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- HTTP-only cookies for token storage
- Refresh token rotation
- Input validation and sanitization
- Protected route patterns

### 6. Database Design
- Proper indexing for performance
- Reference-based relationships
- Polymorphic associations (likes model)
- Timestamps for audit trails
- Efficient query patterns

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

##  Code Quality

- Consistent code structure and naming conventions
- Modular architecture for maintainability
- Separation of concerns (MVC pattern)
- Reusable utility functions
- Error handling at every level
- Clean and readable code

##  Known Issues & Future Improvements

### Known Issues
1. Some controller functions have incomplete implementations (marked with TODO)
2. Dashboard analytics endpoints need implementation
3. Missing title field in video model schema
4. Typo in like routes (`/togle/t/` should be `/toggle/t/`)
5. Missing `await` keywords in some promise-based operations

### Suggested Improvements
1. Implement video transcoding for multiple qualities
2. Add real-time notifications using WebSockets
3. Implement search functionality with text indexes
4. Add video recommendation algorithm
5. Implement rate limiting for API endpoints
6. Add comprehensive unit and integration tests
7. Implement caching layer (Redis)
8. Add API documentation with Swagger/OpenAPI
9. Implement video streaming with HLS/DASH
10. Add content moderation features

##  License

This project is open source and available under the [MIT License](LICENSE).


##  Acknowledgments

- Inspired by YouTube's architecture and features
- Built as a learning project to demonstrate backend engineering skills
- Thanks to the open-source community for excellent tools and libraries

---

