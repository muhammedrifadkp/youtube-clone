import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Avatar, Card, CardMedia } from "@mui/material";
import { CheckCircle, MoreVert } from "@mui/icons-material";

const VideoCard = ({ video }) => {
    // Handle both backend data structure and YouTube API structure
    const videoId = video?._id || video?.id?.videoId || video?.id;
    const title = video?.title || video?.snippet?.title || "Untitled Video";
    const channelName = video?.userId?.channelName || video?.snippet?.channelTitle || "Unknown Channel";
    const channelId = video?.userId?._id || video?.snippet?.channelId;
    const thumbnail = video?.thumbnailUrl || video?.snippet?.thumbnails?.high?.url || video?.snippet?.thumbnails?.medium?.url;
    const avatar = video?.userId?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=random`;
    const viewCount = video?.viewCount || 0;
    const createdAt = video?.createdAt || video?.snippet?.publishedAt;
    const isVerified = video?.userId?.isVerified || false;

    // Format view count
    const formatViewCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M views`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K views`;
        }
        return `${count} views`;
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    };

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: '360px',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                '&:hover': {
                    '& .video-thumbnail': {
                        borderRadius: '12px',
                    }
                }
            }}
        >
            {/* Thumbnail */}
            <Link to={`/video/${videoId}`} style={{ textDecoration: 'none' }}>
                <CardMedia
                    className="video-thumbnail"
                    component="img"
                    image={thumbnail || 'https://via.placeholder.com/360x202/333/fff?text=No+Thumbnail'}
                    alt={title}
                    sx={{
                        width: '100%',
                        height: '202px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        transition: 'border-radius 0.2s ease',
                        cursor: 'pointer'
                    }}
                />
            </Link>

            {/* Video Info */}
            <Box sx={{ display: 'flex', mt: 1.5, gap: 1.5 }}>
                {/* Channel Avatar */}
                <Link to={`/channel/${channelId}`} style={{ textDecoration: 'none' }}>
                    <Avatar
                        src={avatar}
                        sx={{
                            width: 36,
                            height: 36,
                            cursor: 'pointer'
                        }}
                    >
                        {channelName?.[0]?.toUpperCase()}
                    </Avatar>
                </Link>

                {/* Video Details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/video/${videoId}`} style={{ textDecoration: 'none' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '16px',
                                lineHeight: '22px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                '&:hover': {
                                    color: '#aaa'
                                }
                            }}
                        >
                            {title}
                        </Typography>
                    </Link>

                    <Link to={`/channel/${channelId}`} style={{ textDecoration: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#aaa',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        color: 'white'
                                    }
                                }}
                            >
                                {channelName}
                            </Typography>
                            {isVerified && (
                                <CheckCircle
                                    sx={{
                                        fontSize: 14,
                                        ml: 0.5,
                                        color: '#aaa'
                                    }}
                                />
                            )}
                        </Box>
                    </Link>

                    <Typography
                        variant="body2"
                        sx={{
                            color: '#aaa',
                            fontSize: '14px',
                            mt: 0.5
                        }}
                    >
                        {formatViewCount(viewCount)} • {formatTimeAgo(createdAt)}
                    </Typography>
                </Box>

                {/* More Options */}
                <Box sx={{ alignSelf: 'flex-start' }}>
                    <MoreVert
                        sx={{
                            color: '#aaa',
                            fontSize: 20,
                            cursor: 'pointer',
                            '&:hover': {
                                color: 'white'
                            }
                        }}
                    />
                </Box>
            </Box>
        </Card>
    );
};

export default VideoCard;