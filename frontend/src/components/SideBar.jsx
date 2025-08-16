import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Box,
    Avatar
} from '@mui/material';
import {
    Home,
    Explore,
    Subscriptions,
    VideoLibrary,
    History,
    OndemandVideo,
    WatchLater,
    ThumbUp,
    ExpandMore,
    Whatshot,
    MusicNote,
    SportsEsports,
    LiveTv,
    School,
    Checkroom,
    Podcast
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 72;

const SideBar = ({ open = true }) => {
    // For now, we'll use mock authentication state until contexts are properly set up
    const isAuthenticated = false;
    const user = null;
    const location = useLocation();

    const mainItems = [
        { text: 'Home', icon: <Home />, path: '/' },
        { text: 'Explore', icon: <Explore />, path: '/explore' },
        { text: 'Subscriptions', icon: <Subscriptions />, path: '/subscriptions' },
    ];

    const libraryItems = [
        { text: 'Library', icon: <VideoLibrary />, path: '/library' },
        { text: 'History', icon: <History />, path: '/history' },
        { text: 'Your videos', icon: <OndemandVideo />, path: '/your-videos' },
        { text: 'Watch later', icon: <WatchLater />, path: '/watch-later' },
        { text: 'Liked videos', icon: <ThumbUp />, path: '/liked-videos' },
    ];

    const exploreItems = [
        { text: 'Trending', icon: <Whatshot />, path: '/trending' },
        { text: 'Music', icon: <MusicNote />, path: '/music' },
        { text: 'Gaming', icon: <SportsEsports />, path: '/gaming' },
        { text: 'Live', icon: <LiveTv />, path: '/live' },
        { text: 'Learning', icon: <School />, path: '/learning' },
        { text: 'Fashion & Beauty', icon: <Checkroom />, path: '/fashion' },
        { text: 'Podcasts', icon: <Podcast />, path: '/podcasts' },
    ];

    const subscriptions = [
        { name: 'JavaScript Mastery', avatar: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj' },
        { name: 'Fireship', avatar: 'https://yt3.ggpht.com/ytc/AKedOLTKdE5Z9xHYXJ8hFZjKlkKt8j5Z8xHYXJ8hFZjKlkKt8j5=s68-c-k-c0x00ffffff-no-rj' },
        { name: 'Traversy Media', avatar: 'https://yt3.ggpht.com/ytc/AKedOLSxdoZMjZjKTL0BurKMbJjjfhim6hYnti_hDCaF=s68-c-k-c0x00ffffff-no-rj' },
    ];

    const renderListItem = (item, index) => {
        const isActive = location.pathname === item.path;

        return (
            <ListItem key={index} disablePadding>
                <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                        minHeight: 48,
                        px: 2.5,
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>
                    {open && (
                        <ListItemText
                            primary={item.text}
                            sx={{
                                color: 'white',
                                '& .MuiListItemText-primary': {
                                    fontSize: '14px',
                                    fontWeight: isActive ? 500 : 400,
                                }
                            }}
                        />
                    )}
                </ListItemButton>
            </ListItem>
        );
    };

    const renderSubscriptionItem = (subscription, index) => (
        <ListItem key={index} disablePadding>
            <ListItemButton
                sx={{
                    minHeight: 48,
                    px: 2.5,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                }}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                    }}
                >
                    <Avatar
                        src={subscription.avatar}
                        sx={{ width: 24, height: 24 }}
                    >
                        {subscription.name[0]}
                    </Avatar>
                </ListItemIcon>
                {open && (
                    <ListItemText
                        primary={subscription.name}
                        sx={{
                            color: 'white',
                            '& .MuiListItemText-primary': {
                                fontSize: '14px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }
                        }}
                    />
                )}
            </ListItemButton>
        </ListItem>
    );

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    backgroundColor: '#0f0f0f',
                    borderRight: '1px solid #303030',
                    overflowX: 'hidden',
                    transition: 'width 0.3s ease',
                    mt: '64px', // Account for navbar height
                },
            }}
        >
            <Box sx={{ overflow: 'auto', height: '100%' }}>
                {/* Main Navigation */}
                <List>
                    {mainItems.map((item, index) => renderListItem(item, index))}
                </List>

                <Divider sx={{ backgroundColor: '#303030', my: 1 }} />

                {/* Library Section */}
                {isAuthenticated && (
                    <>
                        <List>
                            {libraryItems.map((item, index) => renderListItem(item, index))}
                        </List>
                        <Divider sx={{ backgroundColor: '#303030', my: 1 }} />
                    </>
                )}

                {/* Subscriptions */}
                {isAuthenticated && open && (
                    <>
                        <Box sx={{ px: 2.5, py: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 500 }}>
                                Subscriptions
                            </Typography>
                        </Box>
                        <List>
                            {subscriptions.map((subscription, index) =>
                                renderSubscriptionItem(subscription, index)
                            )}
                        </List>
                        <Divider sx={{ backgroundColor: '#303030', my: 1 }} />
                    </>
                )}

                {/* Explore Section */}
                {open && (
                    <>
                        <Box sx={{ px: 2.5, py: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 500 }}>
                                Explore
                            </Typography>
                        </Box>
                        <List>
                            {exploreItems.map((item, index) => renderListItem(item, index))}
                        </List>
                    </>
                )}

                {/* Sign in prompt for non-authenticated users */}
                {!isAuthenticated && open && (
                    <>
                        <Divider sx={{ backgroundColor: '#303030', my: 1 }} />
                        <Box sx={{ px: 2.5, py: 2 }}>
                            <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                Sign in to like videos, comment, and subscribe.
                            </Typography>
                            <ListItemButton
                                component={Link}
                                to="/login"
                                sx={{
                                    border: '1px solid #3ea6ff',
                                    borderRadius: '18px',
                                    color: '#3ea6ff',
                                    '&:hover': {
                                        backgroundColor: 'rgba(62, 166, 255, 0.1)',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary="SIGN IN"
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            textAlign: 'center'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </Box>
                    </>
                )}
            </Box>
        </Drawer>
    );
};

export default SideBar;