import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const VideoContext = createContext();

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch videos with filters
  const fetchVideos = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/videos', { params });
      if (response.data.success) {
        setVideos(response.data.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch single video
  const fetchVideo = async (id) => {
    try {
      const response = await axios.get(`/videos/${id}`);
      if (response.data.success) {
        return response.data.data.video;
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      return null;
    }
  };

  // Search videos
  const searchVideos = async (searchTerm, filters = {}) => {
    setLoading(true);
    try {
      const params = { q: searchTerm, ...filters };
      const response = await axios.get('/search/videos', { params });
      if (response.data.success) {
        setVideos(response.data.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending videos
  const fetchTrendingVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/videos?sort=trending');
      if (response.data.success) {
        setVideos(response.data.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data.categories);
        return response.data.data.categories;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // Upload video
  const uploadVideo = async (formData) => {
    try {
      const response = await axios.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // You can use this for progress indication
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });
      
      if (response.data.success) {
        return { success: true, video: response.data.data.video };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Upload failed'
      };
    }
  };

  // Like/Unlike video
  const toggleVideoLike = async (videoId) => {
    try {
      const response = await axios.post(`/videos/${videoId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error: error.message };
    }
  };

  // Subscribe/Unsubscribe to channel
  const toggleSubscription = async (channelId) => {
    try {
      const response = await axios.post(`/users/${channelId}/subscribe`);
      return response.data;
    } catch (error) {
      // If already subscribed, try unsubscribing
      try {
        const unsubResponse = await axios.delete(`/users/${channelId}/unsubscribe`);
        return unsubResponse.data;
      } catch (unsubError) {
        console.error('Error toggling subscription:', unsubError);
        return { success: false, error: unsubError.message };
      }
    }
  };

  // Add comment
  const addComment = async (videoId, content, parentCommentId = null) => {
    try {
      const response = await axios.post(`/comments/video/${videoId}`, {
        content,
        parentCommentId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch comments
  const fetchComments = async (videoId, page = 1) => {
    try {
      const response = await axios.get(`/comments/video/${videoId}?page=${page}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    videos,
    loading,
    categories,
    fetchVideos,
    fetchVideo,
    searchVideos,
    fetchTrendingVideos,
    fetchCategories,
    uploadVideo,
    toggleVideoLike,
    toggleSubscription,
    addComment,
    fetchComments
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};
