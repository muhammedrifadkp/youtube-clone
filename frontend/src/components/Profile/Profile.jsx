import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    channelName: '',
    channelDescription: '',
    email: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        channelName: user.channelName || '',
        channelDescription: user.channelDescription || '',
        email: user.email || ''
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      channelName: user.channelName || '',
      channelDescription: user.channelDescription || '',
      email: user.email || ''
    });
    setEditing(false);
    setError('');
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#ff0000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, backgroundColor: '#212121', color: 'white' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Channel
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, backgroundColor: '#2e7d32', color: 'white' }}>
            {success}
          </Alert>
        )}

        {/* Channel Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={user.avatarUrl}
            sx={{ width: 80, height: 80, mr: 3 }}
          >
            {user.firstName?.[0] || user.username?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {user.channelName || user.username}
            </Typography>
            <Typography variant="body2" color="#aaa">
              {user.subscriberCount || 0} subscribers • {user.totalViews || 0} views
            </Typography>
          </Box>
          <Button
            variant={editing ? "outlined" : "contained"}
            startIcon={editing ? <Cancel /> : <Edit />}
            onClick={editing ? handleCancel : () => setEditing(true)}
            sx={{
              backgroundColor: editing ? 'transparent' : '#ff0000',
              borderColor: '#ff0000',
              color: 'white',
              '&:hover': {
                backgroundColor: editing ? 'rgba(255, 0, 0, 0.1)' : '#cc0000',
              }
            }}
          >
            {editing ? 'Cancel' : 'Edit Channel'}
          </Button>
        </Box>

        <Divider sx={{ backgroundColor: '#303030', mb: 3 }} />

        {/* Profile Form */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!editing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#303030' },
                  '&:hover fieldset': { borderColor: editing ? '#ff0000' : '#303030' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                  '&.Mui-focused': { color: '#ff0000' },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!editing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#303030' },
                  '&:hover fieldset': { borderColor: editing ? '#ff0000' : '#303030' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                  '&.Mui-focused': { color: '#ff0000' },
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="channelName"
              label="Channel Name"
              value={formData.channelName}
              onChange={handleInputChange}
              disabled={!editing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#303030' },
                  '&:hover fieldset': { borderColor: editing ? '#ff0000' : '#303030' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                  '&.Mui-focused': { color: '#ff0000' },
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="channelDescription"
              label="Channel Description"
              value={formData.channelDescription}
              onChange={handleInputChange}
              disabled={!editing}
              multiline
              rows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#303030' },
                  '&:hover fieldset': { borderColor: editing ? '#ff0000' : '#303030' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                  '&.Mui-focused': { color: '#ff0000' },
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!editing}
              type="email"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#303030' },
                  '&:hover fieldset': { borderColor: editing ? '#ff0000' : '#303030' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                },
                '& .MuiInputLabel-root': {
                  color: '#aaa',
                  '&.Mui-focused': { color: '#ff0000' },
                },
              }}
            />
          </Grid>
        </Grid>

        {editing && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                backgroundColor: '#ff0000',
                '&:hover': { backgroundColor: '#cc0000' },
                '&:disabled': { backgroundColor: '#666' },
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}

        <Divider sx={{ backgroundColor: '#303030', my: 3 }} />

        {/* Channel Stats */}
        <Typography variant="h6" gutterBottom>
          Channel Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, backgroundColor: '#303030', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ff0000' }}>
                {user.subscriberCount || 0}
              </Typography>
              <Typography variant="body2" color="#aaa">
                Subscribers
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, backgroundColor: '#303030', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ff0000' }}>
                {user.totalViews || 0}
              </Typography>
              <Typography variant="body2" color="#aaa">
                Total Views
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, backgroundColor: '#303030', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ff0000' }}>
                {user.videoCount || 0}
              </Typography>
              <Typography variant="body2" color="#aaa">
                Videos
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;
