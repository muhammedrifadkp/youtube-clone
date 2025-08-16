import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, Stack, CircularProgress, Alert } from "@mui/material";
// import { useVideo } from "../contexts/VideoContext";
import Videos from "./Videos";
import { api } from "../utils/api";

const Feed = () => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [categories, setCategories] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);

    // YouTube-like category chips
    const defaultCategories = [
        "All", "Music", "Gaming", "News", "Sports", "Entertainment",
        "Education", "Science & Technology", "Comedy", "Film & Animation"
    ];

    useEffect(() => {
        // Set default categories for now
        setCategories(defaultCategories);

        // Load videos from backend
        const loadVideos = async () => {
            setLoading(true);
            try {
                const result = await api.getVideos();
                if (result.data && result.data.success) {
                    setVideos(result.data.data || []);
                } else {
                    // Fallback to mock data
                    setVideos([
                        {
                            _id: '1',
                            title: 'Welcome to YouTube Clone',
                            thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
                            userId: {
                                _id: 'user1',
                                channelName: 'Demo Channel',
                                avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Channel&background=random',
                                isVerified: true
                            },
                            viewCount: 1000,
                            createdAt: new Date().toISOString()
                        }
                    ]);
                }
            } catch (error) {
                console.error('Failed to load videos:', error);
                // Set mock data on error
                setVideos([
                    {
                        _id: '1',
                        title: 'Welcome to YouTube Clone',
                        thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
                        userId: {
                            _id: 'user1',
                            channelName: 'Demo Channel',
                            avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Channel&background=random',
                            isVerified: true
                        },
                        viewCount: 1000,
                        createdAt: new Date().toISOString()
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadVideos();
    }, [selectedCategory]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    return (
        <Box sx={{ width: '100%', backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
            {/* Category Filter Bar */}
            <Box sx={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#0f0f0f',
                zIndex: 100,
                borderBottom: '1px solid #303030',
                py: 2,
                px: 3
            }}>
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                    {categories.map((category) => (
                        <Chip
                            key={category}
                            label={category}
                            onClick={() => handleCategoryChange(category)}
                            variant={selectedCategory === category ? "filled" : "outlined"}
                            sx={{
                                backgroundColor: selectedCategory === category ? '#ffffff' : 'transparent',
                                color: selectedCategory === category ? '#0f0f0f' : '#ffffff',
                                borderColor: '#303030',
                                '&:hover': {
                                    backgroundColor: selectedCategory === category ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)',
                                },
                                minWidth: 'fit-content',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                height: '32px'
                            }}
                        />
                    ))}
                </Stack>
            </Box>

            {/* Main Content */}
            <Box sx={{ px: 3, py: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: '#ff0000' }} />
                    </Box>
                ) : videos && videos.length > 0 ? (
                    <Videos videos={videos} />
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Alert
                            severity="info"
                            sx={{
                                backgroundColor: '#212121',
                                color: 'white',
                                maxWidth: '400px',
                                mx: 'auto'
                            }}
                        >
                            No videos found for "{selectedCategory}". Try selecting a different category.
                        </Alert>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Feed