import React from "react";
import { Grid, Box } from "@mui/material";
import VideoCard from "./VideoCard";

const Videos = ({ videos, direction }) => {
    if (!videos || videos.length === 0) {
        return null;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Grid container spacing={2}>
                {videos.map((video, index) => (
                    <Grid
                        item
                        key={video._id || video.id || index}
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        xl={3}
                    >
                        <VideoCard video={video} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Videos