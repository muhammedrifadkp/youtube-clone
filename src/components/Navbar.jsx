import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Button,
    Typography,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    VideoCall,
    Notifications,
    AccountCircle,
    Search,
    Mic,
    Apps
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import { logo } from '../utils/constants';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        handleMenuClose();
        navigate('/');
    };

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: '#0f0f0f',
                borderBottom: '1px solid #303030',
                zIndex: 1201 // Above sidebar
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
                {/* Left section */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleSidebarToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img src={logo} alt="YouTube" height={20} />
                        <Typography
                            variant="h6"
                            sx={{
                                ml: 1,
                                color: 'white',
                                fontWeight: 'bold',
                                display: { xs: 'none', sm: 'block' }
                            }}
                        >
                            YouTube
                        </Typography>
                    </Link>
                </Box>

                {/* Center section - Search */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    maxWidth: '600px',
                    mx: 4
                }}>
                    <SearchBar />
                    <Tooltip title="Search with your voice">
                        <IconButton sx={{ ml: 1, color: 'white' }}>
                            <Mic />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Right section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isAuthenticated ? (
                        <>
                            <Tooltip title="Create">
                                <IconButton
                                    color="inherit"
                                    component={Link}
                                    to="/upload"
                                >
                                    <VideoCall />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="YouTube apps">
                                <IconButton color="inherit">
                                    <Apps />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Notifications">
                                <IconButton color="inherit">
                                    <Badge badgeContent={3} color="error">
                                        <Notifications />
                                    </Badge>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Account">
                                <IconButton onClick={handleMenuOpen}>
                                    <Avatar
                                        src={user?.avatarUrl}
                                        sx={{ width: 32, height: 32 }}
                                    >
                                        {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: {
                                        backgroundColor: '#282828',
                                        color: 'white',
                                        minWidth: 200
                                    }
                                }}
                            >
                                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                                    Your channel
                                </MenuItem>
                                <MenuItem onClick={() => { navigate('/subscriptions'); handleMenuClose(); }}>
                                    Subscriptions
                                </MenuItem>
                                <MenuItem onClick={() => { navigate('/history'); handleMenuClose(); }}>
                                    History
                                </MenuItem>
                                <MenuItem onClick={() => { navigate('/liked-videos'); handleMenuClose(); }}>
                                    Liked videos
                                </MenuItem>
                                <MenuItem onClick={() => { navigate('/watch-later'); handleMenuClose(); }}>
                                    Watch later
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    Sign out
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Button
                            variant="outlined"
                            startIcon={<AccountCircle />}
                            component={Link}
                            to="/login"
                            sx={{
                                color: '#3ea6ff',
                                borderColor: '#3ea6ff',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#3ea6ff',
                                    backgroundColor: 'rgba(62, 166, 255, 0.1)'
                                }
                            }}
                        >
                            Sign in
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;