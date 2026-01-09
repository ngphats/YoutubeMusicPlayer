const axios = require('axios');

class YouTubeAPIService {
    constructor() {
        this.apiKey = process.env.YOUTUBE_PRIVATE_API_KEY; // Dùng private key cho Data API
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        // Add axios instance with timeout and retry configuration
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000, // 10 second timeout
        });
        
        // Simple in-memory cache for video details
        this.cache = new Map();
        this.CACHE_TTL = 300000; // 5 minutes
        this.MAX_CACHE_SIZE = 100;
        
        // Set up periodic cache cleanup to prevent memory growth
        this.cleanupInterval = setInterval(() => {
            this.cleanCache();
        }, 60000); // Run cleanup every minute
    }

    async searchVideos(query, maxResults = 10) {
        try {
            // Validate input
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return {
                    success: false,
                    error: 'Invalid query parameter'
                };
            }
            
            const response = await this.axiosInstance.get('/search', {
                params: {
                    part: 'snippet',
                    q: query.trim(),
                    type: 'video',
                    maxResults: Math.min(Math.max(1, parseInt(maxResults) || 10), 50), // Limit between 1-50
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
            // Validate input
            if (!videoId || typeof videoId !== 'string' || videoId.trim().length === 0) {
                return {
                    success: false,
                    error: 'Invalid video ID'
                };
            }
            
            // Check cache first and validate expiration during retrieval
            const cacheKey = `video_${videoId}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return {
                        success: true,
                        data: cached.data,
                        cached: true
                    };
                } else {
                    // Remove expired entry lazily
                    this.cache.delete(cacheKey);
                }
            }
            
            const response = await this.axiosInstance.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoId.trim(),
                    key: this.apiKey
                }
            });
            
            // Store in cache
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            
            // Enforce max cache size
            if (this.cache.size > this.MAX_CACHE_SIZE) {
                this.trimCache();
            }
            
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
            // Validate input
            if (!playlistId || typeof playlistId !== 'string' || playlistId.trim().length === 0) {
                return {
                    success: false,
                    error: 'Invalid playlist ID'
                };
            }
            
            const response = await this.axiosInstance.get('/playlistItems', {
                params: {
                    part: 'snippet',
                    playlistId: playlistId.trim(),
                    maxResults: Math.min(Math.max(1, parseInt(maxResults) || 50), 50), // Limit between 1-50
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
    
    // Clean expired cache entries
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.cache.delete(key);
            }
        }
    }
    
    // Trim cache to max size by removing oldest entries
    trimCache() {
        if (this.cache.size <= this.MAX_CACHE_SIZE) {
            return;
        }
        
        // Convert to array and sort by timestamp
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest entries until we're at max size
        const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => this.cache.delete(key));
    }
}

module.exports = YouTubeAPIService;
