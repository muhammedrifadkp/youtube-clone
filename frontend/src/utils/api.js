import axios from "axios";

// Backend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Videos
  getVideos: (params = {}) => apiClient.get('/videos', { params }),
  getVideo: (id) => apiClient.get(`/videos/${id}`),
  searchVideos: (query, params = {}) => apiClient.get('/search/videos', { params: { q: query, ...params } }),
  uploadVideo: (formData) => apiClient.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Categories
  getCategories: () => apiClient.get('/categories'),

  // Authentication
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/me'),

  // Users
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  subscribe: (channelId) => apiClient.post(`/users/${channelId}/subscribe`),
  unsubscribe: (channelId) => apiClient.delete(`/users/${channelId}/unsubscribe`),

  // Comments
  getComments: (videoId, page = 1) => apiClient.get(`/comments/video/${videoId}?page=${page}`),
  addComment: (videoId, content, parentId = null) => apiClient.post(`/comments/video/${videoId}`, {
    content,
    parentCommentId: parentId
  }),

  // Reactions
  likeVideo: (videoId) => apiClient.post(`/videos/${videoId}/like`),
  dislikeVideo: (videoId) => apiClient.post(`/videos/${videoId}/dislike`),
};

export default apiClient;