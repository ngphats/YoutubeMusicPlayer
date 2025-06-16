const express = require('express')
const router = express.Router()
const homeController = require('../controllers/HomeController')
const YouTubeAPIService = require('../services/YouTubeAPIService')

const youtubeService = new YouTubeAPIService();

// YouTube API proxy routes
router.get('/youtube/config', (req, res) => {
    // Trả về public API key cho Player API
    res.json({
        publicApiKey: process.env.YOUTUBE_PUBLIC_API_KEY,
        success: true
    });
});

router.get('/youtube/search', async (req, res) => {
    const { q, maxResults = 10 } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const result = await youtubeService.searchVideos(q, maxResults);
    res.json(result);
});

router.get('/youtube/video/:videoId', async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
    }
    
    const result = await youtubeService.getVideoDetails(videoId);
    res.json(result);
});

router.get('/youtube/playlist/:playlistId', async (req, res) => {
    const { playlistId } = req.params;
    const { maxResults = 50 } = req.query;
    
    if (!playlistId) {
        return res.status(400).json({ error: 'Playlist ID is required' });
    }
    
    const result = await youtubeService.getPlaylistItems(playlistId, maxResults);
    res.json(result);
});

router.post("/update", homeController.update)

module.exports = router