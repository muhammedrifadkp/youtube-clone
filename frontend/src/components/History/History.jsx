import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper
} from '@mui/material';
import { Delete, History as HistoryIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Videos from '../Videos';

const History = () => {
  const [historyVideos, setHistoryVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadHistory();
  }, [isAuthenticated, navigate]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Mock history data - replace with actual API call
      const mockHistory = [
        {
          _id: '1',
          title: 'React Tutorial for Beginners',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user1',
            channelName: 'JavaScript Mastery',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 125000,
          createdAt: '2024-01-15T10:30:00Z',
          watchedAt: '2024-01-20T14:30:00Z'
        },
        {
          _id: '2',
          title: 'Advanced JavaScript Concepts',
          thumbnailUrl: 'https://i.ibb.co/G2L2Gwp/API-Course.png',
          userId: {
            _id: 'user2',
            channelName: 'Fireship',
            avatarUrl: 'https://yt3.ggpht.com/ytc/AKedOLTKdE5Z9xHYXJ8hFZjKlkKt8j5Z8xHYXJ8hFZjKlkKt8j5=s68-c-k-c0x00ffffff-no-rj',
            isVerified: true
          },
          viewCount: 89000,
          createdAt: '2024-01-10T08:15:00Z',
          watchedAt: '2024-01-19T16:45:00Z'
        }
      ];

      setHistoryVideos(mockHistory);
    } catch (err) {
      setError('Failed to load watch history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistoryVideos([]);
  };

  const removeFromHistory = (videoId) => {
    setHistoryVideos(prev => prev.filter(video => video._id !== videoId));
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
          <HistoryIcon sx={{ color: 'white', fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: 'white' }}>
            Watch History
          </Typography>
        </Box>
        
        {historyVideos.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Delete />}
            onClick={clearHistory}
            sx={{
              borderColor: '#ff0000',
              color: '#ff0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
              }
            }}
          >
            Clear All History
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      )}

      {historyVideos.length === 0 ? (
        <Paper sx={{ p: 4, backgroundColor: '#212121', textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: '#aaa', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            No watch history
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Videos you watch will appear here
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
            {historyVideos.length} video{historyVideos.length !== 1 ? 's' : ''} watched
          </Typography>
          <Videos videos={historyVideos} />
        </>
      )}
    </Box>
  );
};

export default History;
