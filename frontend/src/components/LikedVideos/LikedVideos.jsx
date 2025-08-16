import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { ThumbUp } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Videos from '../Videos';

const LikedVideos = () => {
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadLikedVideos();
  }, [isAuthenticated, navigate]);

  const loadLikedVideos = async () => {
    setLoading(true);
    try {
      // Mock liked videos data - replace with actual API call
      const mockLikedVideos = [
        {
          _id: '1',
          title: 'React Hooks Explained',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user1',
            channelName: 'JavaScript Mastery',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 320000,
          createdAt: '2024-01-14T12:00:00Z',
          likedAt: '2024-01-19T15:30:00Z'
        },
        {
          _id: '2',
          title: 'CSS Grid Layout Tutorial',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user2',
            channelName: 'Fireship',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLTKdE5Z9xHYXJ8hFZjKlkKt8j5Z8xHYXJ8hFZjKlkKt8j5=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 150000,
          createdAt: '2024-01-11T16:20:00Z',
          likedAt: '2024-01-18T10:45:00Z'
        },
        {
          _id: '3',
          title: 'TypeScript Best Practices',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user3',
            channelName: 'Traversy Media',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 95000,
          createdAt: '2024-01-09T11:30:00Z',
          likedAt: '2024-01-17T14:20:00Z'
        }
      ];

      setLikedVideos(mockLikedVideos);
    } catch (err) {
      setError('Failed to load liked videos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#ff0000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#0f0f0f', minHeight: '100vh', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ThumbUp sx={{ color: 'white', fontSize: 32 }} />
        <Typography variant="h4" sx={{ color: 'white' }}>
          Liked Videos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      )}

      {likedVideos.length === 0 ? (
        <Paper sx={{ p: 4, backgroundColor: '#212121', textAlign: 'center' }}>
          <ThumbUp sx={{ fontSize: 64, color: '#aaa', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            No liked videos
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Videos you like will appear here
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
            {likedVideos.length} video{likedVideos.length !== 1 ? 's' : ''} liked
          </Typography>
          <Videos videos={likedVideos} />
        </>
      )}
    </Box>
  );
};

export default LikedVideos;
