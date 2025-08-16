import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  Paper,
  Button,
  Divider
} from '@mui/material';
import { NotificationsActive, NotificationsOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useVideo } from '../../contexts/VideoContext';
import { useNavigate } from 'react-router-dom';
import Videos from '../Videos';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const { fetchVideos } = useVideo();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadSubscriptions();
  }, [isAuthenticated, navigate]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      // Mock subscriptions data - replace with actual API call
      const mockSubscriptions = [
        {
          id: '1',
          channelName: 'JavaScript Mastery',
          avatar: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
          subscriberCount: 1250000,
          notificationsEnabled: true
        },
        {
          id: '2',
          channelName: 'Fireship',
          avatar: 'https://yt3.ggpht.com/ytc/AKedOLTKdE5Z9xHYXJ8hFZjKlkKt8j5Z8xHYXJ8hFZjKlkKt8j5=s68-c-k-c0x00ffffff-no-rj',
          subscriberCount: 2100000,
          notificationsEnabled: false
        },
        {
          id: '3',
          channelName: 'Traversy Media',
          avatar: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj',
          subscriberCount: 1800000,
          notificationsEnabled: true
        }
      ];

      setSubscriptions(mockSubscriptions);

      // Load latest videos from subscriptions
      const result = await fetchVideos({ subscriptions: true });
      if (result && result.success) {
        setVideos(result.data || []);
      }
    } catch (err) {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (channelId) => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === channelId
          ? { ...sub, notificationsEnabled: !sub.notificationsEnabled }
          : sub
      )
    );
  };

  const formatSubscriberCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subscribers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K subscribers`;
    }
    return `${count} subscribers`;
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
      <Typography variant="h4" sx={{ color: 'white', mb: 3 }}>
        Subscriptions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
          {error}
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
            No subscriptions yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            Subscribe to channels to see their latest videos here
          </Typography>
        </Box>
      ) : (
        <>
          {/* Subscribed Channels */}
          <Paper sx={{ p: 3, mb: 4, backgroundColor: '#212121' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Your Channels
            </Typography>
            <Grid container spacing={2}>
              {subscriptions.map((subscription) => (
                <Grid item xs={12} sm={6} md={4} key={subscription.id}>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#303030',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Avatar
                      src={subscription.avatar}
                      sx={{ width: 48, height: 48 }}
                    >
                      {subscription.channelName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: 'white',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {subscription.channelName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        {formatSubscriberCount(subscription.subscriberCount)}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => toggleNotifications(subscription.id)}
                      sx={{
                        minWidth: 'auto',
                        p: 1,
                        color: subscription.notificationsEnabled ? '#ff0000' : '#aaa'
                      }}
                    >
                      {subscription.notificationsEnabled ? (
                        <NotificationsActive />
                      ) : (
                        <NotificationsOff />
                      )}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Divider sx={{ backgroundColor: '#303030', mb: 3 }} />

          {/* Latest Videos from Subscriptions */}
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Latest Videos
          </Typography>

          {videos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: '#aaa' }}>
                No recent videos from your subscriptions
              </Typography>
            </Box>
          ) : (
            <Videos videos={videos} />
          )}
        </>
      )}
    </Box>
  );
};

export default Subscriptions;
