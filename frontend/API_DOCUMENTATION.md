# YouTube Clone API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

For paginated responses:
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

## Error Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [...] // Optional validation details
  }
}
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "channelName": "John's Channel"
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### POST `/api/auth/logout`
Logout current user (requires authentication).

#### GET `/api/auth/me`
Get current user profile (requires authentication).

#### PUT `/api/auth/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

### Users (`/api/users`)

#### GET `/api/users/:id`
Get user profile by ID.

#### PUT `/api/users/profile`
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "channelName": "Updated Channel Name",
  "channelDescription": "Channel description",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### POST `/api/users/:id/subscribe`
Subscribe to a channel (requires authentication).

#### DELETE `/api/users/:id/unsubscribe`
Unsubscribe from a channel (requires authentication).

#### GET `/api/users/subscriptions`
Get current user's subscriptions (requires authentication).

#### GET `/api/users/search?q=searchTerm`
Search users and channels.

#### GET `/api/users/trending`
Get trending channels.

### Videos (`/api/videos`)

#### POST `/api/videos/upload`
Upload a new video (requires authentication).

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `video` (file): Video file (required)
- `thumbnail` (file): Thumbnail image (optional)
- `title` (string): Video title (required)
- `description` (string): Video description
- `categoryId` (UUID): Category ID
- `tags` (string): Comma-separated tags
- `isPublic` (boolean): Whether video is public (default: true)

#### GET `/api/videos`
Get videos with pagination and filters.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 50)
- `category` (UUID): Filter by category
- `sort` (string): Sort order (`recent`, `trending`, `popular`)

#### GET `/api/videos/:id`
Get video by ID.

#### PUT `/api/videos/:id`
Update video details (requires authentication, owner only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "categoryId": "category-uuid",
  "isPublic": true,
  "isMonetized": false
}
```

#### DELETE `/api/videos/:id`
Delete video (requires authentication, owner only).

#### GET `/api/videos/user/:userId`
Get videos by user ID.

### Search (`/api/search`)

#### GET `/api/search/videos?q=searchTerm`
Search videos with advanced filters.

**Query Parameters:**
- `q` (string): Search query (required, min 2 chars)
- `page` (number): Page number
- `limit` (number): Items per page
- `category` (UUID): Filter by category
- `duration` (string): Filter by duration (`short`, `medium`, `long`)
- `uploadDate` (string): Filter by upload date (`hour`, `today`, `week`, `month`, `year`)
- `sortBy` (string): Sort order (`relevance`, `upload_date`, `view_count`, `rating`)

#### GET `/api/search/channels?q=searchTerm`
Search channels and users.

#### GET `/api/search/suggestions?q=partialTerm`
Get search suggestions for autocomplete.

#### GET `/api/search/trending`
Get trending search terms.

### Categories (`/api/categories`)

#### GET `/api/categories`
Get all video categories.

#### GET `/api/categories/:id`
Get category by ID.

#### GET `/api/categories/:id/videos`
Get videos in a specific category.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `sort` (string): Sort order (`recent`, `popular`, `trending`)

### Comments (`/api/comments`)

#### GET `/api/comments/video/:videoId`
Get comments for a video.

#### POST `/api/comments/video/:videoId`
Add a comment to a video (requires authentication).

**Request Body:**
```json
{
  "content": "Great video!",
  "parentCommentId": "parent-comment-uuid" // Optional for replies
}
```

#### PUT `/api/comments/:id`
Update a comment (requires authentication, owner only).

#### DELETE `/api/comments/:id`
Delete a comment (requires authentication, owner only).

#### GET `/api/comments/:id/replies`
Get replies to a comment.

### Playlists (`/api/playlists`)

#### GET `/api/playlists/user/:userId`
Get user's playlists.

#### POST `/api/playlists`
Create a new playlist (requires authentication).

**Request Body:**
```json
{
  "title": "My Playlist",
  "description": "Playlist description",
  "isPublic": true
}
```

#### GET `/api/playlists/:id`
Get playlist by ID.

#### PUT `/api/playlists/:id`
Update playlist (requires authentication, owner only).

#### DELETE `/api/playlists/:id`
Delete playlist (requires authentication, owner only).

#### POST `/api/playlists/:id/videos`
Add video to playlist (requires authentication, owner only).

**Request Body:**
```json
{
  "videoId": "video-uuid"
}
```

#### DELETE `/api/playlists/:id/videos/:videoId`
Remove video from playlist (requires authentication, owner only).

### Analytics (`/api/analytics`)

#### GET `/api/analytics/video/:id`
Get video analytics (requires authentication, owner only).

#### GET `/api/analytics/channel`
Get channel analytics (requires authentication).

#### GET `/api/analytics/platform`
Get platform analytics (admin only).

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `413` - Payload Too Large (file too big)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **General**: 100 requests per 15 minutes per IP
- **Authentication**: Additional limits for login attempts
- **File Upload**: Special limits for video uploads

## File Upload Limits

- **Videos**: 500MB maximum
- **Thumbnails**: 5MB maximum
- **Avatars**: 2MB maximum

## Supported File Formats

### Videos
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- WMV (.wmv)
- WebM (.webm)

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Interactive Documentation

For interactive API testing, visit:
```
http://localhost:5000/api-docs
```

This provides a Swagger UI interface where you can test all endpoints directly.
