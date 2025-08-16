import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { CloudUpload, VideoCall } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useVideo } from '../../contexts/VideoContext';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    tags: '',
    isPublic: true
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { isAuthenticated } = useAuth();
  const { uploadVideo, categories, fetchCategories } = useVideo();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [isAuthenticated, navigate, fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isPublic' ? checked : value
    }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file size must be less than 100MB');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for thumbnail');
        return;
      }
      setThumbnailFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', videoFile);
      if (thumbnailFile) {
        uploadFormData.append('thumbnail', thumbnailFile);
      }
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('categoryId', formData.categoryId);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('isPublic', formData.isPublic);

      const result = await uploadVideo(uploadFormData);
      
      if (result.success) {
        setSuccess('Video uploaded successfully!');
        setTimeout(() => {
          navigate(`/video/${result.video.id}`);
        }, 2000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, backgroundColor: '#212121', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <VideoCall sx={{ mr: 2, color: '#ff0000' }} />
          <Typography variant="h4" component="h1">
            Upload Video
          </Typography>
        </Box>

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

        <form onSubmit={handleSubmit}>
          {/* Video File Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Video File *
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{
                width: '100%',
                height: 100,
                borderColor: '#303030',
                color: 'white',
                borderStyle: 'dashed',
                '&:hover': {
                  borderColor: '#ff0000',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)'
                }
              }}
            >
              {videoFile ? videoFile.name : 'Click to select video file'}
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={handleVideoFileChange}
              />
            </Button>
          </Box>

          {/* Thumbnail Upload */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thumbnail (Optional)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{
                width: '100%',
                height: 60,
                borderColor: '#303030',
                color: 'white',
                '&:hover': {
                  borderColor: '#ff0000',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)'
                }
              }}
            >
              {thumbnailFile ? thumbnailFile.name : 'Click to select thumbnail'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </Button>
          </Box>

          {/* Title */}
          <TextField
            fullWidth
            name="title"
            label="Title *"
            value={formData.title}
            onChange={handleInputChange}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#303030' },
                '&:hover fieldset': { borderColor: '#ff0000' },
                '&.Mui-focused fieldset': { borderColor: '#ff0000' },
              },
              '& .MuiInputLabel-root': {
                color: '#aaa',
                '&.Mui-focused': { color: '#ff0000' },
              },
            }}
          />

          {/* Description */}
          <TextField
            fullWidth
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#303030' },
                '&:hover fieldset': { borderColor: '#ff0000' },
                '&.Mui-focused fieldset': { borderColor: '#ff0000' },
              },
              '& .MuiInputLabel-root': {
                color: '#aaa',
                '&.Mui-focused': { color: '#ff0000' },
              },
            }}
          />

          {/* Category */}
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: '#aaa', '&.Mui-focused': { color: '#ff0000' } }}>
              Category
            </InputLabel>
            <Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#303030' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ff0000' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff0000' },
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tags */}
          <TextField
            fullWidth
            name="tags"
            label="Tags (comma separated)"
            value={formData.tags}
            onChange={handleInputChange}
            margin="normal"
            placeholder="javascript, tutorial, coding"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#303030' },
                '&:hover fieldset': { borderColor: '#ff0000' },
                '&.Mui-focused fieldset': { borderColor: '#ff0000' },
              },
              '& .MuiInputLabel-root': {
                color: '#aaa',
                '&.Mui-focused': { color: '#ff0000' },
              },
            }}
          />

          {/* Privacy */}
          <FormControlLabel
            control={
              <Switch
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ff0000',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ff0000',
                  },
                }}
              />
            }
            label="Make video public"
            sx={{ color: 'white', mt: 2 }}
          />

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#ff0000'
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            disabled={uploading}
            sx={{
              mt: 3,
              backgroundColor: '#ff0000',
              '&:hover': { backgroundColor: '#cc0000' },
              '&:disabled': { backgroundColor: '#666' },
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Upload;
