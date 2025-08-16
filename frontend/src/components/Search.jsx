import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { useParams } from "react-router-dom";
// import { useVideo } from "../contexts/VideoContext";
import Videos from "./Videos";
import { api } from "../utils/api";

const Search = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { searchTerm } = useParams();

    useEffect(() => {
        const performSearch = async () => {
            if (!searchTerm?.trim()) return;

            setLoading(true);
            setError(null);

            try {
                const result = await api.searchVideos(searchTerm);
                if (result.data && result.data.success) {
                    setVideos(result.data.data || []);
                } else {
                    setError('No results found');
                    setVideos([]);
                }
            } catch (err) {
                setError('Failed to search videos');
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [searchTerm, searchVideos]);

    return (
        <Box sx={{ width: '100%', backgroundColor: '#0f0f0f', minHeight: '100vh', p: 3 }}>
            <Typography
                variant="h5"
                fontWeight="500"
                mb={3}
                sx={{ color: "white" }}
            >
                Search results for "{searchTerm}"
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: '#ff0000' }} />
                </Box>
            ) : error ? (
                <Alert
                    severity="error"
                    sx={{
                        backgroundColor: '#212121',
                        color: 'white',
                        maxWidth: '400px'
                    }}
                >
                    {error}
                </Alert>
            ) : videos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
                        No results found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Try different keywords or check your spelling
                    </Typography>
                </Box>
            ) : (
                <Videos videos={videos} />
            )}
        </Box>
    );
};

export default Search