/**
 * SheetsAPI.js - Google Sheets GViz JSON Parser
 * Professional parser for Google Sheets data via GViz API
 */

const SHEET_ID = '14S4GwzF2ddm3pIjXZSRCfMpzhErRG_maxqxbfdv-nd0';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Column mapping (A-J)
const COLUMNS = {
    0: 'section',
    1: 'type',
    2: 'title',
    3: 'description',
    4: 'thumbnail',
    5: 'video',
    6: 'genre',
    7: 'language',
    8: 'country',
    9: 'year'
};

class SheetsAPI {
    constructor() {
        this.cache = null;
        this.cacheTime = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Parse messy GViz JSON response
     * Format: google.visualization.Query.setResponse({...});
     */
    parseGvizResponse(text) {
        try {
            // Remove GViz callback wrapper
            // Format: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid GViz response format');
            }
            
            const jsonStr = text.substring(jsonStart, jsonEnd + 1);
            const data = JSON.parse(jsonStr);
            
            if (data.status === 'error') {
                throw new Error(data.errors?.[0]?.detailed_message || 'GViz error');
            }
            
            return data.table;
        } catch (err) {
            console.error('[SheetsAPI] Parse error:', err);
            throw new Error('Google Sheets ma\'lumotlarini o\'qib bo\'lmadi');
        }
    }

    /**
     * Transform table rows into video objects
     */
    transformToVideos(table) {
        if (!table || !table.rows) return [];
        
        const videos = [];
        
        table.rows.forEach((row, idx) => {
            if (!row.c) return;
            
            const video = {
                id: `video-${idx}`,
                section: '',
                type: 'grid',
                title: '',
                description: '',
                thumbnail: '',
                video: '',
                genre: '',
                language: '',
                country: '',
                year: ''
            };
            
            row.c.forEach((cell, colIdx) => {
                const field = COLUMNS[colIdx];
                if (!field) return;
                
                let value = '';
                if (cell && cell.v !== null && cell.v !== undefined) {
                    value = String(cell.v).trim();
                }
                
                video[field] = value;
            });
            
            // Skip empty rows
            if (!video.title && !video.video) return;
            
            // Normalize type
            video.type = (video.type || 'grid').toLowerCase().trim();
            if (!['story', 'carousel', 'grid', 'list'].includes(video.type)) {
                video.type = 'grid';
            }
            
            // Default section
            if (!video.section) video.section = 'Boshqalar';
            
            videos.push(video);
        });
        
        return videos;
    }

    /**
     * Fetch all videos from Google Sheets
     */
    async fetchVideos(forceRefresh = false) {
        // Use cache if available and fresh
        if (!forceRefresh && this.cache && this.cacheTime && 
            (Date.now() - this.cacheTime < this.CACHE_DURATION)) {
            return this.cache;
        }
        
        try {
            const response = await fetch(GVIZ_URL, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            const table = this.parseGvizResponse(text);
            const videos = this.transformToVideos(table);
            
            this.cache = videos;
            this.cacheTime = Date.now();
            
            // Cache in localStorage for offline
            try {
                localStorage.setItem('videos_cache', JSON.stringify({
                    videos,
                    timestamp: Date.now()
                }));
            } catch (e) { /* quota exceeded */ }
            
            return videos;
        } catch (err) {
            console.error('[SheetsAPI] Fetch error:', err);
            
            // Try to load from localStorage cache
            try {
                const cached = localStorage.getItem('videos_cache');
                if (cached) {
                    const { videos } = JSON.parse(cached);
                    return videos;
                }
            } catch (e) { /* ignore */ }
            
            throw err;
        }
    }

    /**
     * Group videos by section
     */
    groupBySection(videos) {
        const sections = {};
        
        videos.forEach(video => {
            const key = video.section || 'Boshqalar';
            if (!sections[key]) {
                sections[key] = {
                    name: key,
                    type: video.type,
                    videos: []
                };
            }
            sections[key].videos.push(video);
        });
        
        return Object.values(sections);
    }

    /**
     * Search videos
     */
    searchVideos(videos, query) {
        if (!query || !query.trim()) return videos;
        
        const q = query.toLowerCase().trim();
        return videos.filter(v => {
            return (
                v.title.toLowerCase().includes(q) ||
                v.description.toLowerCase().includes(q) ||
                v.genre.toLowerCase().includes(q) ||
                v.country.toLowerCase().includes(q) ||
                v.language.toLowerCase().includes(q) ||
                v.section.toLowerCase().includes(q)
            );
        });
    }

    /**
     * Filter videos by category
     */
    filterByGenre(videos, genre) {
        if (!genre || genre === 'all') return videos;
        return videos.filter(v => 
            v.genre.toLowerCase() === genre.toLowerCase()
        );
    }

    /**
     * Get unique genres
     */
    getGenres(videos) {
        const genres = new Set();
        videos.forEach(v => {
            if (v.genre) genres.add(v.genre);
        });
        return Array.from(genres).sort();
    }

    /**
     * Get trending videos (latest year)
     */
    getTrending(videos, limit = 10) {
        return [...videos]
            .sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0))
            .slice(0, limit);
    }

    /**
     * Get featured for hero (first 5 with thumbnail)
     */
    getFeatured(videos, limit = 5) {
        return videos.filter(v => v.thumbnail).slice(0, limit);
    }

    /**
     * Get recommended (random selection)
     */
    getRecommended(videos, currentId = null, limit = 6) {
        const others = videos.filter(v => v.id !== currentId);
        return this._shuffle(others).slice(0, limit);
    }

    _shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

export default new SheetsAPI();
