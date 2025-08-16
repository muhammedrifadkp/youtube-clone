const { query } = require('../config/database');
const { 
  AppError, 
  asyncHandler, 
  sendSuccess 
} = require('../middleware/errorMiddleware');

// Get video analytics
const getVideoAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user owns the video
  const videoResult = await query(
    'SELECT user_id FROM videos WHERE id = $1',
    [id]
  );

  if (videoResult.rows.length === 0) {
    throw new AppError('Video not found', 404);
  }

  if (videoResult.rows[0].user_id !== req.user.id) {
    throw new AppError('Not authorized to view analytics for this video', 403);
  }

  // Get basic video stats
  const statsResult = await query(
    `SELECT v.view_count, v.like_count, v.dislike_count, v.comment_count,
            v.created_at, v.title
     FROM videos v
     WHERE v.id = $1`,
    [id]
  );

  // Get view analytics by date (last 30 days)
  const viewsResult = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as views
     FROM video_views
     WHERE video_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [id]
  );

  // Get top countries
  const countriesResult = await query(
    `SELECT 'Unknown' as country, COUNT(*) as views
     FROM video_views
     WHERE video_id = $1
     GROUP BY country
     ORDER BY views DESC
     LIMIT 10`,
    [id]
  );

  const analytics = {
    video: {
      id,
      title: statsResult.rows[0].title,
      totalViews: statsResult.rows[0].view_count,
      totalLikes: statsResult.rows[0].like_count,
      totalDislikes: statsResult.rows[0].dislike_count,
      totalComments: statsResult.rows[0].comment_count,
      publishedAt: statsResult.rows[0].created_at
    },
    viewsByDate: viewsResult.rows,
    topCountries: countriesResult.rows
  };

  sendSuccess(res, 200, { analytics }, 'Video analytics retrieved successfully');
});

// Get channel analytics
const getChannelAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get channel overview
  const overviewResult = await query(
    `SELECT 
       COUNT(DISTINCT v.id) as total_videos,
       SUM(v.view_count) as total_views,
       SUM(v.like_count) as total_likes,
       SUM(v.comment_count) as total_comments,
       u.subscriber_count
     FROM users u
     LEFT JOIN videos v ON u.id = v.user_id AND v.is_public = true
     WHERE u.id = $1
     GROUP BY u.id, u.subscriber_count`,
    [userId]
  );

  // Get recent video performance
  const recentVideosResult = await query(
    `SELECT id, title, view_count, like_count, comment_count, created_at
     FROM videos
     WHERE user_id = $1 AND is_public = true
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  // Get subscriber growth (mock data for now)
  const subscriberGrowthResult = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as new_subscribers
     FROM subscriptions
     WHERE channel_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [userId]
  );

  const analytics = {
    overview: {
      totalVideos: parseInt(overviewResult.rows[0]?.total_videos || 0),
      totalViews: parseInt(overviewResult.rows[0]?.total_views || 0),
      totalLikes: parseInt(overviewResult.rows[0]?.total_likes || 0),
      totalComments: parseInt(overviewResult.rows[0]?.total_comments || 0),
      totalSubscribers: parseInt(overviewResult.rows[0]?.subscriber_count || 0)
    },
    recentVideos: recentVideosResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      views: row.view_count,
      likes: row.like_count,
      comments: row.comment_count,
      publishedAt: row.created_at
    })),
    subscriberGrowth: subscriberGrowthResult.rows
  };

  sendSuccess(res, 200, { analytics }, 'Channel analytics retrieved successfully');
});

// Get platform analytics (admin only)
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  // This would typically check for admin role
  // For now, we'll just return basic platform stats

  const statsResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM videos WHERE is_public = true) as total_videos,
      (SELECT SUM(view_count) FROM videos WHERE is_public = true) as total_views,
      (SELECT COUNT(*) FROM video_views WHERE created_at > NOW() - INTERVAL '24 hours') as views_last_24h
  `);

  const analytics = {
    platform: {
      totalUsers: parseInt(statsResult.rows[0].total_users),
      totalVideos: parseInt(statsResult.rows[0].total_videos),
      totalViews: parseInt(statsResult.rows[0].total_views),
      viewsLast24h: parseInt(statsResult.rows[0].views_last_24h)
    }
  };

  sendSuccess(res, 200, { analytics }, 'Platform analytics retrieved successfully');
});

module.exports = {
  getVideoAnalytics,
  getChannelAnalytics,
  getPlatformAnalytics
};
