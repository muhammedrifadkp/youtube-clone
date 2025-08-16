import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import {
    Box,
    Typography,
    Avatar,
    Button,
    IconButton,
    Divider,
    Paper,
    Stack,
    CircularProgress,
    Alert,
    TextField,
    Chip
} from "@mui/material";
import {
    ThumbUp,
    ThumbDown,
    Share,
    Download,
    MoreHoriz,
    CheckCircle,
    Notifications,
    NotificationsOff
} from "@mui/icons-material";
// import { useAuth } from "../contexts/AuthContext";
// import { useVideo } from "../contexts/VideoContext";
import Videos from "./Videos";
import { api } from "../utils/api";

const Video = () => {
    const { id } = useParams();
    const [videoDetail, setVideoDetail] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const isAuthenticated = false; // Mock for now

    useEffect(() => {
        loadVideoData();
    }, [id]);

    const loadVideoData = async () => {
        setLoading(true);
        setError('');

        try {
            // Load video details
            const result = await api.getVideo(id);
            if (result.data && result.data.success) {
                setVideoDetail(result.data.data);
            } else {
                // Mock video data for demo
                setVideoDetail({
                    _id: id,
                    title: 'Demo Video - YouTube Clone',
                    description: 'This is a demo video for the YouTube clone application. The backend integration is in progress.',
                    thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    userId: {
                        _id: 'demo-user',
                        channelName: 'Demo Channel',
                        avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Channel&background=random',
                        isVerified: true,
                        subscriberCount: 1000
                    },
                    viewCount: 5000,
                    likeCount: 150,
                    createdAt: new Date().toISOString(),
                    tags: ['demo', 'youtube', 'clone']
                });
            }

            // Load related videos
            const relatedResult = await api.getVideos();
            if (relatedResult.data && relatedResult.data.success) {
                setRelatedVideos(relatedResult.data.data || []);
            } else {
                // Mock related videos
                setRelatedVideos([
                    {
                        _id: 'related-1',
                        title: 'Related Video 1',
                        thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
                        userId: { channelName: 'Related Channel 1' },
                        viewCount: 2000,
                        createdAt: new Date().toISOString()
                    }
                ]);
            }

            // Mock comments
            setComments([
                {
                    _id: 'comment-1',
                    content: 'Great video! Looking forward to more content.',
                    userId: {
                        channelName: 'Demo User',
                        avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
                    },
                    createdAt: new Date().toISOString()
                }
            ]);

        } catch (err) {
            setError('Failed to load video');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return;

        // Mock like functionality
        setIsLiked(!isLiked);
        if (isDisliked) setIsDisliked(false);
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated || !videoDetail?.userId?._id) return;

        // Mock subscribe functionality
        setIsSubscribed(!isSubscribed);
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated || !newComment.trim()) return;

        // Mock add comment functionality
        const newCommentObj = {
            _id: `comment-${Date.now()}`,
            content: newComment.trim(),
            userId: {
                channelName: 'Current User',
                avatarUrl: 'https://ui-avatars.com/api/?name=Current+User&background=random'
            },
            createdAt: new Date().toISOString()
        };

        setComments(prev => [newCommentObj, ...prev]);
        setNewComment('');
    };

    const formatViewCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M views`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K views`;
        }
        return `${count} views`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
                <CircularProgress sx={{ color: '#ff0000' }} />
            </Box>
        );
    }

    if (error || !videoDetail) {
        return (
            <Box sx={{ p: 3, backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
                <Alert severity="error" sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
                    {error || 'Video not found'}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
                {/* Main Video Section */}
                <Box sx={{ flex: 1, maxWidth: 'calc(100% - 400px)' }}>
                    {/* Video Player */}
                    <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, mb: 2 }}>
                        <ReactPlayer
                            url={videoDetail.videoUrl || `https://www.youtube.com/watch?v=${id}`}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', top: 0, left: 0 }}
                            controls
                            playing
                        />
                    </Box>

                    {/* Video Title */}
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                        {videoDetail.title}
                    </Typography>

                    {/* Video Stats and Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                            {formatViewCount(videoDetail.viewCount)} • {formatDate(videoDetail.createdAt)}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                startIcon={<ThumbUp />}
                                onClick={handleLike}
                                sx={{
                                    color: isLiked ? '#ff0000' : '#aaa',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                                }}
                            >
                                {videoDetail.likeCount || 0}
                            </Button>
                            <Button
                                startIcon={<ThumbDown />}
                                sx={{
                                    color: isDisliked ? '#ff0000' : '#aaa',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                                }}
                            >
                                Dislike
                            </Button>
                            <Button
                                startIcon={<Share />}
                                sx={{
                                    color: '#aaa',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                                }}
                            >
                                Share
                            </Button>
                            <IconButton sx={{ color: '#aaa' }}>
                                <MoreHoriz />
                            </IconButton>
                        </Box>
                    </Box>

                    <Divider sx={{ backgroundColor: '#303030', mb: 2 }} />

                    {/* Channel Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                                src={videoDetail.userId?.avatarUrl}
                                sx={{ width: 40, height: 40 }}
                            >
                                {videoDetail.userId?.channelName?.[0] || 'U'}
                            </Avatar>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 500 }}>
                                        {videoDetail.userId?.channelName || 'Unknown Channel'}
                                    </Typography>
                                    {videoDetail.userId?.isVerified && (
                                        <CheckCircle sx={{ fontSize: 16, color: '#aaa' }} />
                                    )}
                                </Box>
                                <Typography variant="body2" sx={{ color: '#aaa' }}>
                                    {videoDetail.userId?.subscriberCount || 0} subscribers
                                </Typography>
                            </Box>
                        </Box>

                        {isAuthenticated && (
                            <Button
                                variant={isSubscribed ? "outlined" : "contained"}
                                startIcon={isSubscribed ? <NotificationsOff /> : <Notifications />}
                                onClick={handleSubscribe}
                                sx={{
                                    backgroundColor: isSubscribed ? 'transparent' : '#ff0000',
                                    borderColor: '#ff0000',
                                    color: isSubscribed ? '#ff0000' : 'white',
                                    '&:hover': {
                                        backgroundColor: isSubscribed ? 'rgba(255, 0, 0, 0.1)' : '#cc0000',
                                    }
                                }}
                            >
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </Button>
                        )}
                    </Box>

                    {/* Video Description */}
                    {videoDetail.description && (
                        <Paper sx={{ p: 2, backgroundColor: '#212121', mb: 3 }}>
                            <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>
                                {videoDetail.description}
                            </Typography>
                        </Paper>
                    )}

                    {/* Tags */}
                    {videoDetail.tags && videoDetail.tags.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {videoDetail.tags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={`#${tag}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'transparent',
                                            color: '#3ea6ff',
                                            border: '1px solid #3ea6ff',
                                            '&:hover': { backgroundColor: 'rgba(62, 166, 255, 0.1)' }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Comments Section */}
                    <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                            {comments.length} Comments
                        </Typography>

                        {/* Add Comment */}
                        {isAuthenticated && (
                            <Box component="form" onSubmit={handleAddComment} sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: '#303030' },
                                            '&:hover fieldset': { borderColor: '#ff0000' },
                                            '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                                        }
                                    }}
                                />
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={!newComment.trim()}
                                        sx={{
                                            backgroundColor: '#ff0000',
                                            '&:hover': { backgroundColor: '#cc0000' }
                                        }}
                                    >
                                        Comment
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* Comments List */}
                        {comments.map((comment) => (
                            <Box key={comment._id} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Avatar
                                        src={comment.userId?.avatarUrl}
                                        sx={{ width: 32, height: 32 }}
                                    >
                                        {comment.userId?.channelName?.[0] || 'U'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                                            {comment.userId?.channelName || 'Unknown User'} • {formatDate(comment.createdAt)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'white' }}>
                                            {comment.content}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Related Videos Sidebar */}
                <Box sx={{ width: '400px', flexShrink: 0 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        Related Videos
                    </Typography>
                    <Stack spacing={2}>
                        {relatedVideos.slice(0, 10).map((video) => (
                            <Box key={video._id} sx={{ display: 'flex', gap: 1 }}>
                                <Link to={`/video/${video._id}`} style={{ textDecoration: 'none' }}>
                                    <Box
                                        component="img"
                                        src={video.thumbnailUrl || 'https://via.placeholder.com/168x94/333/fff?text=No+Thumbnail'}
                                        alt={video.title}
                                        sx={{
                                            width: 168,
                                            height: 94,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            cursor: 'pointer'
                                        }}
                                    />
                                </Link>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Link to={`/video/${video._id}`} style={{ textDecoration: 'none' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'white',
                                                fontWeight: 500,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                '&:hover': { color: '#aaa' }
                                            }}
                                        >
                                            {video.title}
                                        </Typography>
                                    </Link>
                                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 0.5 }}>
                                        {video.userId?.channelName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#aaa' }}>
                                        {formatViewCount(video.viewCount)} • {formatDate(video.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default Video