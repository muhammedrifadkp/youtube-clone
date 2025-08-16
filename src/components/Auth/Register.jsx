import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  AccountCircle
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    channelName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    const { confirmPassword, ...registrationData } = formData;
    
    // Use username as channel name if not provided
    if (!registrationData.channelName) {
      registrationData.channelName = registrationData.username;
    }

    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3ea6ff',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      '&.Mui-focused': {
        color: '#3ea6ff',
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f0f',
        px: 2,
        py: 4
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          backgroundColor: '#212121',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join YouTube today
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: '#d32f2f', color: 'white' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            name="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            name="channelName"
            label="Channel Name (optional)"
            value={formData.channelName}
            onChange={handleChange}
            margin="normal"
            placeholder="Leave empty to use username"
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={formData.password}
            onChange={handleChange}
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={textFieldStyles}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: '#3ea6ff',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
              '&:disabled': {
                backgroundColor: 'rgba(62, 166, 255, 0.5)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink
                component={Link}
                to="/login"
                sx={{
                  color: '#3ea6ff',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;
