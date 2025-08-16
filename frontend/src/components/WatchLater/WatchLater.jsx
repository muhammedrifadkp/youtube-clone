import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper
} from '@mui/material';
import { WatchLater as WatchLaterIcon, Clear } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Videos from '../Videos';

const WatchLater = () => {
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadWatchLater();
  }, [isAuthenticated, navigate]);

  const loadWatchLater = async () => {
    setLoading(true);
    try {
      // Mock watch later data - replace with actual API call
      const mockWatchLater = [
        {
          _id: '1',
          title: 'Complete Node.js Course',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user1',
            channelName: 'JavaScript Mastery',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 250000,
          createdAt: '2024-01-12T09:20:00Z',
          addedAt: '2024-01-18T11:30:00Z'
        },
        {
          _id: '2',
          title: 'MongoDB Tutorial',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user3',
            channelName: 'Traversy Media',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 180000,
          createdAt: '2024-01-08T14:45:00Z',
          addedAt: '2024-01-17T09:15:00Z'
        }
      ];

      setWatchLaterVideos(mockWatchLater);
    } catch (err) {
      setError('Failed to load watch later videos');
    } finally {
      setLoading(false);
    }
  };

  const clearWatchLater = () => {
    setWatchLaterVideos([]);
  };

  const removeFromWatchLater = (videoId) => {
    setWatchLaterVideos(prev => prev.filter(video => video._id !== videoId));
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WatchLaterIcon sx={{ color: 'white', fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: 'white' }}>
            Watch Later
          </Typography>
        </Box>
        
        {watchLaterVideos.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearWatchLater}
            sx={{
              borderColor: '#ff0000',
              color: '#ff0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
              }
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      )}

      {watchLaterVideos.length === 0 ? (
        <Paper sx={{ p: 4, backgroundColor: '#212121', textAlign: 'center' }}>
          <WatchLaterIcon sx={{ fontSize: 64, color: '#aaa', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            No videos saved
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Save videos to watch them later
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
            {watchLaterVideos.length} video{watchLaterVideos.length !== 1 ? 's' : ''} saved
          </Typography>
          <Videos videos={watchLaterVideos} />
        </>
      )}
    </Box>
  );
};

export default WatchLater;
