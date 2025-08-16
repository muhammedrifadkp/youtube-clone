import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "@mui/icons-material";
import { Box, InputBase, IconButton, Paper } from "@mui/material";

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search/${searchTerm.trim()}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    backgroundColor: '#121212',
                    border: '1px solid #303030',
                    borderRadius: '40px',
                    '&:hover': {
                        border: '1px solid #3ea6ff',
                    },
                    '&:focus-within': {
                        border: '1px solid #3ea6ff',
                    },
                }}
                elevation={0}
            >
                <InputBase
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{
                        ml: 2,
                        flex: 1,
                        color: 'white',
                        fontSize: '16px',
                        '& ::placeholder': {
                            color: '#aaa',
                            opacity: 1,
                        },
                    }}
                />
                <IconButton
                    type="submit"
                    sx={{
                        p: '10px',
                        color: '#aaa',
                        backgroundColor: '#303030',
                        borderRadius: '0 40px 40px 0',
                        borderLeft: '1px solid #303030',
                        '&:hover': {
                            backgroundColor: '#404040',
                            color: 'white',
                        },
                    }}
                >
                    <Search />
                </IconButton>
            </Paper>
        </Box>
    );
};

export default SearchBar