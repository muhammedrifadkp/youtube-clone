-- Database Indexes for YouTube Clone
-- Optimized for search performance and common queries

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_channel_name ON users(channel_name);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_subscriber_count ON users(subscriber_count DESC);

-- Videos table indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_title ON videos USING gin(to_tsvector('english', title));
CREATE INDEX idx_videos_description ON videos USING gin(to_tsvector('english', description));
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX idx_videos_like_count ON videos(like_count DESC);
CREATE INDEX idx_videos_is_public ON videos(is_public);
CREATE INDEX idx_videos_upload_status ON videos(upload_status);
CREATE INDEX idx_videos_public_recent ON videos(created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_videos_trending ON videos(view_count DESC, created_at DESC) WHERE is_public = TRUE;

-- Video tags indexes
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag ON video_tags(tag);
CREATE INDEX idx_video_tags_tag_gin ON video_tags USING gin(tag gin_trgm_ops);

-- Comments table indexes
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_video_recent ON comments(video_id, created_at DESC);

-- Subscriptions table indexes
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at DESC);

-- Video reactions indexes
CREATE INDEX idx_video_reactions_video_id ON video_reactions(video_id);
CREATE INDEX idx_video_reactions_user_id ON video_reactions(user_id);
CREATE INDEX idx_video_reactions_type ON video_reactions(reaction_type);

-- Comment reactions indexes
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Video views indexes
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id);
CREATE INDEX idx_video_views_created_at ON video_views(created_at DESC);
CREATE INDEX idx_video_views_ip_address ON video_views(ip_address);

-- Playlists indexes
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_is_public ON playlists(is_public);
CREATE INDEX idx_playlists_created_at ON playlists(created_at DESC);

-- Playlist videos indexes
CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX idx_playlist_videos_position ON playlist_videos(playlist_id, position);

-- Search history indexes
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_query ON search_history(search_query);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

-- Categories indexes
CREATE INDEX idx_categories_name ON categories(name);

-- Enable trigram extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite indexes for common query patterns
CREATE INDEX idx_videos_user_public_recent ON videos(user_id, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_videos_category_public_recent ON videos(category_id, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_videos_trending_score ON videos((view_count + like_count * 10) DESC, created_at DESC) WHERE is_public = TRUE;

-- Full-text search index combining title and description
CREATE INDEX idx_videos_full_text ON videos USING gin(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
