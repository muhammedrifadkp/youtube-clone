-- Seed data for YouTube Clone Database

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('New', 'Latest videos', 'HomeIcon'),
('Coding', 'Programming and development content', 'CodeIcon'),
('ReactJS', 'React.js tutorials and content', 'CodeIcon'),
('NextJS', 'Next.js framework content', 'CodeIcon'),
('Music', 'Music videos and audio content', 'MusicNoteIcon'),
('Education', 'Educational and learning content', 'SchoolIcon'),
('Podcast', 'Podcast episodes and audio shows', 'GraphicEqIcon'),
('Movie', 'Movie trailers and film content', 'OndemandVideoIcon'),
('Gaming', 'Gaming videos and live streams', 'SportsEsportsIcon'),
('Live', 'Live streaming content', 'LiveTvIcon'),
('Sport', 'Sports highlights and content', 'FitnessCenterIcon'),
('Fashion', 'Fashion and style content', 'CheckroomIcon'),
('Beauty', 'Beauty tutorials and reviews', 'FaceRetouchingNaturalIcon'),
('Comedy', 'Comedy sketches and funny videos', 'TheaterComedyIcon'),
('Gym', 'Fitness and workout content', 'FitnessCenterIcon'),
('Crypto', 'Cryptocurrency and blockchain content', 'DeveloperModeIcon');

-- Insert demo users
INSERT INTO users (username, email, password_hash, first_name, last_name, channel_name, channel_description, avatar_url, is_verified) VALUES
('javascript_mastery', 'admin@jsmastery.pro', '$2b$10$example_hash_1', 'JavaScript', 'Mastery', 'JavaScript Mastery', 'Learn modern web development with JavaScript, React, and more!', 'http://dergipark.org.tr/assets/app/images/buddy_sample.png', TRUE),
('tech_reviewer', 'tech@example.com', '$2b$10$example_hash_2', 'Tech', 'Reviewer', 'Tech Reviews Pro', 'Honest reviews of the latest technology and gadgets', 'http://dergipark.org.tr/assets/app/images/buddy_sample.png', TRUE),
('coding_ninja', 'ninja@code.com', '$2b$10$example_hash_3', 'Code', 'Ninja', 'Coding Ninja', 'Advanced programming tutorials and tips', 'http://dergipark.org.tr/assets/app/images/buddy_sample.png', FALSE),
('music_producer', 'beats@music.com', '$2b$10$example_hash_4', 'Beat', 'Maker', 'Beat Factory', 'Original music production and beats', 'http://dergipark.org.tr/assets/app/images/buddy_sample.png', FALSE);

-- Get category IDs for reference
-- Note: In a real application, you would use the actual UUIDs generated

-- Insert demo videos
-- Note: These are placeholder entries. In production, you would have actual video files and thumbnails
INSERT INTO videos (user_id, category_id, title, description, video_url, thumbnail_url, duration, view_count, like_count, comment_count, is_public) 
SELECT 
    u.id as user_id,
    c.id as category_id,
    'Build and Deploy 5 JavaScript & React API Projects in 10 Hours - Full Course | RapidAPI' as title,
    'Learn to build and deploy 5 amazing JavaScript and React projects using various APIs. Perfect for beginners and intermediate developers looking to enhance their skills.' as description,
    '/uploads/videos/demo-video-1.mp4' as video_url,
    'https://i.ibb.co/G2L2Gwp/API-Course.png' as thumbnail_url,
    36000 as duration, -- 10 hours in seconds
    125000 as view_count,
    3200 as like_count,
    450 as comment_count,
    TRUE as is_public
FROM users u, categories c 
WHERE u.username = 'javascript_mastery' AND c.name = 'Coding'
LIMIT 1;

INSERT INTO videos (user_id, category_id, title, description, video_url, thumbnail_url, duration, view_count, like_count, comment_count, is_public) 
SELECT 
    u.id as user_id,
    c.id as category_id,
    'React 18 Complete Tutorial - Build Modern Web Apps' as title,
    'Complete React 18 tutorial covering hooks, context, suspense, and all the latest features. Build real-world applications step by step.' as description,
    '/uploads/videos/demo-video-2.mp4' as video_url,
    'https://i.ibb.co/G2L2Gwp/API-Course.png' as thumbnail_url,
    7200 as duration, -- 2 hours
    89000 as view_count,
    2100 as like_count,
    320 as comment_count,
    TRUE as is_public
FROM users u, categories c 
WHERE u.username = 'javascript_mastery' AND c.name = 'ReactJS'
LIMIT 1;

INSERT INTO videos (user_id, category_id, title, description, video_url, thumbnail_url, duration, view_count, like_count, comment_count, is_public) 
SELECT 
    u.id as user_id,
    c.id as category_id,
    'iPhone 15 Pro Max Review - Is It Worth The Upgrade?' as title,
    'Comprehensive review of the iPhone 15 Pro Max covering camera, performance, battery life, and whether you should upgrade from previous models.' as description,
    '/uploads/videos/demo-video-3.mp4' as video_url,
    'https://i.ibb.co/G2L2Gwp/API-Course.png' as thumbnail_url,
    1200 as duration, -- 20 minutes
    250000 as view_count,
    8500 as like_count,
    1200 as comment_count,
    TRUE as is_public
FROM users u, categories c 
WHERE u.username = 'tech_reviewer' AND c.name = 'New'
LIMIT 1;

-- Insert video tags
INSERT INTO video_tags (video_id, tag)
SELECT v.id, unnest(ARRAY['javascript', 'react', 'api', 'tutorial', 'programming', 'web development'])
FROM videos v 
WHERE v.title LIKE '%JavaScript & React API Projects%';

INSERT INTO video_tags (video_id, tag)
SELECT v.id, unnest(ARRAY['react', 'react18', 'hooks', 'tutorial', 'frontend'])
FROM videos v 
WHERE v.title LIKE '%React 18 Complete Tutorial%';

INSERT INTO video_tags (video_id, tag)
SELECT v.id, unnest(ARRAY['iphone', 'review', 'apple', 'smartphone', 'tech'])
FROM videos v 
WHERE v.title LIKE '%iPhone 15 Pro Max Review%';

-- Insert demo comments
INSERT INTO comments (video_id, user_id, content, like_count)
SELECT 
    v.id as video_id,
    u.id as user_id,
    'Amazing tutorial! This really helped me understand React better. Thank you for the detailed explanation.' as content,
    45 as like_count
FROM videos v, users u 
WHERE v.title LIKE '%React 18 Complete Tutorial%' AND u.username = 'coding_ninja'
LIMIT 1;

INSERT INTO comments (video_id, user_id, content, like_count)
SELECT 
    v.id as video_id,
    u.id as user_id,
    'Great review! Very thorough analysis of the camera improvements.' as content,
    23 as like_count
FROM videos v, users u 
WHERE v.title LIKE '%iPhone 15 Pro Max Review%' AND u.username = 'javascript_mastery'
LIMIT 1;

-- Insert demo subscriptions
INSERT INTO subscriptions (subscriber_id, channel_id)
SELECT 
    s.id as subscriber_id,
    c.id as channel_id
FROM users s, users c 
WHERE s.username = 'coding_ninja' AND c.username = 'javascript_mastery';

INSERT INTO subscriptions (subscriber_id, channel_id)
SELECT 
    s.id as subscriber_id,
    c.id as channel_id
FROM users s, users c 
WHERE s.username = 'music_producer' AND c.username = 'javascript_mastery';

INSERT INTO subscriptions (subscriber_id, channel_id)
SELECT 
    s.id as subscriber_id,
    c.id as channel_id
FROM users s, users c 
WHERE s.username = 'coding_ninja' AND c.username = 'tech_reviewer';

-- Update subscriber counts
UPDATE users SET subscriber_count = (
    SELECT COUNT(*) FROM subscriptions WHERE channel_id = users.id
);

-- Insert demo video reactions
INSERT INTO video_reactions (video_id, user_id, reaction_type)
SELECT 
    v.id as video_id,
    u.id as user_id,
    'like' as reaction_type
FROM videos v, users u 
WHERE v.title LIKE '%React 18 Complete Tutorial%' AND u.username = 'coding_ninja'
LIMIT 1;

-- Insert demo playlists
INSERT INTO playlists (user_id, title, description, is_public, video_count)
SELECT 
    u.id as user_id,
    'React Learning Path' as title,
    'Complete playlist for learning React from beginner to advanced' as description,
    TRUE as is_public,
    1 as video_count
FROM users u 
WHERE u.username = 'coding_ninja'
LIMIT 1;
