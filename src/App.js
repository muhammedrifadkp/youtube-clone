import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { VideoProvider } from './contexts/VideoContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Video from './components/Video';
import Channel from './components/Channel';
import Search from './components/Search';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Upload from './components/Upload/Upload';
import Profile from './components/Profile/Profile';
import Subscriptions from './components/Subscriptions/Subscriptions';
import History from './components/History/History';
import WatchLater from './components/WatchLater/WatchLater';
import LikedVideos from './components/LikedVideos/LikedVideos';

// YouTube-like theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff0000', // YouTube red
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#0f0f0f', // YouTube dark background
      paper: '#212121',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '18px',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <VideoProvider>
          <BrowserRouter>
            <Box sx={{ display: 'flex', backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
              <Navbar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <Sidebar open={sidebarOpen} />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  pt: '64px', // Account for navbar height
                  pl: sidebarOpen ? '240px' : '72px', // Account for sidebar width
                  transition: 'padding-left 0.3s ease',
                  backgroundColor: '#0f0f0f',
                  minHeight: '100vh'
                }}
              >
                <Routes>
                  <Route path='/' element={<Feed />} />
                  <Route path='/video/:id' element={<Video />} />
                  <Route path='/channel/:id' element={<Channel />} />
                  <Route path='/search/:searchTerm' element={<Search />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/upload' element={<Upload />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path='/subscriptions' element={<Subscriptions />} />
                  <Route path='/history' element={<History />} />
                  <Route path='/watch-later' element={<WatchLater />} />
                  <Route path='/liked-videos' element={<LikedVideos />} />
                </Routes>
              </Box>
            </Box>
          </BrowserRouter>
        </VideoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
