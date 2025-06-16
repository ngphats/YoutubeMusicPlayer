const axios = require('axios');

class YouTubeAPIService {
    constructor() {
        this.apiKey = process.env.YOUTUBE_PRIVATE_API_KEY; // Dùng private key cho Data API
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
    }

    async searchVideos(query, maxResults = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/search`, {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: maxResults,
                    key: this.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('YouTube API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: 'Failed to search videos'
            };
        }
    }

    async getVideoDetails(videoId) {
        try {
            const response = await axios.get(`${this.baseURL}/videos`, {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoId,
                    key: this.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('YouTube API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: 'Failed to get video details'
            };
        }
    }

    async getPlaylistItems(playlistId, maxResults = 50) {
        try {
            const response = await axios.get(`${this.baseURL}/playlistItems`, {
                params: {
                    part: 'snippet',
                    playlistId: playlistId,
                    maxResults: maxResults,
                    key: this.apiKey
                }
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('YouTube API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: 'Failed to get playlist items'
            };
        }
    }
}

module.exports = YouTubeAPIService;
