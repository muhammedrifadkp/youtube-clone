const { query } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess 
} = require('../middleware/errorMiddleware');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all video categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Categories retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           icon:
 *                             type: string
 *                           videoCount:
 *                             type: integer
 */
const getCategories = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT c.id, c.name, c.description, c.icon, c.created_at,
            COUNT(v.id) as video_count
     FROM categories c
     LEFT JOIN videos v ON c.id = v.category_id AND v.is_public = true
     GROUP BY c.id, c.name, c.description, c.icon, c.created_at
     ORDER BY c.name ASC`
  );

  const categories = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    videoCount: parseInt(row.video_count),
    createdAt: row.created_at
  }));

  sendSuccess(res, 200, { categories }, 'Categories retrieved successfully');
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT c.id, c.name, c.description, c.icon, c.created_at,
            COUNT(v.id) as video_count
     FROM categories c
     LEFT JOIN videos v ON c.id = v.category_id AND v.is_public = true
     WHERE c.id = $1
     GROUP BY c.id, c.name, c.description, c.icon, c.created_at`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Category not found', 404);
  }

  const category = {
    id: result.rows[0].id,
    name: result.rows[0].name,
    description: result.rows[0].description,
    icon: result.rows[0].icon,
    videoCount: parseInt(result.rows[0].video_count),
    createdAt: result.rows[0].created_at
  };

  sendSuccess(res, 200, { category }, 'Category retrieved successfully');
});

/**
 * @swagger
 * /api/categories/{id}/videos:
 *   get:
 *     summary: Get videos in a specific category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, popular, trending]
 *           default: recent
 *     responses:
 *       200:
 *         description: Category videos retrieved successfully
 *       404:
 *         description: Category not found
 */
const getCategoryVideos = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const sort = req.query.sort || 'recent';
  const offset = (page - 1) * limit;

  // Check if category exists
  const categoryResult = await query('SELECT id FROM categories WHERE id = $1', [id]);
  if (categoryResult.rows.length === 0) {
    throw new AppError('Category not found', 404);
  }

  // Determine sort order
  let orderBy = 'ORDER BY v.created_at DESC';
  switch (sort) {
    case 'popular':
      orderBy = 'ORDER BY v.view_count DESC, v.created_at DESC';
      break;
    case 'trending':
      orderBy = 'ORDER BY (v.view_count + v.like_count * 10) DESC, v.created_at DESC';
      break;
    case 'recent':
    default:
      orderBy = 'ORDER BY v.created_at DESC';
      break;
  }

  // Get videos
  const videosResult = await query(
    `SELECT v.*, u.channel_name, u.avatar_url, u.is_verified,
            ARRAY_AGG(DISTINCT vt.tag) FILTER (WHERE vt.tag IS NOT NULL) as tags
     FROM videos v
     JOIN users u ON v.user_id = u.id
     LEFT JOIN video_tags vt ON v.id = vt.video_id
     WHERE v.category_id = $1 AND v.is_public = true
     GROUP BY v.id, u.channel_name, u.avatar_url, u.is_verified
     ${orderBy}
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );

  // Get total count
  const countResult = await query(
    'SELECT COUNT(*) FROM videos WHERE category_id = $1 AND is_public = true',
    [id]
  );

  const videos = videosResult.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    duration: row.duration,
    viewCount: row.view_count,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    commentCount: row.comment_count,
    isPublic: row.is_public,
    createdAt: row.created_at,
    channelName: row.channel_name,
    channelAvatar: row.avatar_url,
    isVerified: row.is_verified,
    tags: row.tags || []
  }));

  const total = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Category videos retrieved successfully',
    data: videos,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryVideos
};
