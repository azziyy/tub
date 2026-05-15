/**
 * SearchPage.js - Search functionality
 */
import SheetsAPI from '../api/SheetsAPI.js';
import { VideoCard } from '../components/VideoCard.js';
import { Skeleton } from '../components/Skeleton.js';
import { debounce, escapeHTML } from '../utils/Helpers.js';
import Player from '../components/Player.js';

class SearchPage {
    constructor() {
        this.videos = [];
        this.results = [];
        this.activeGenre = 'all';
        this.query = '';
    }

    async render(container, params = {}) {
        container.innerHTML = `
            <div style="padding: 16px 0">
                <div class="search-bar">
                    <span class="material-icons-round">search</span>
                    <input type="text" id="search-input" class="search-input" 
                           placeholder="Video, janr yoki davlat..." 
                           value="${escapeHTML(this.query || '')}">
                    <button class="search-clear hidden" id="search-clear">
                        <span class="material-icons-round" style="font-size:18px">close</span>
                    </button>
                </div>
                <div id="filter-chips" class="category-chips hide-scrollbar"></div>
                <div id="search-results"></div>
            </div>
        `;

        try {
            if (this.videos.length === 0) {
                document.getElementById('search-results').innerHTML = Skeleton.grid(8);
                this.videos = await SheetsAPI.fetchVideos();
            }
            this._buildFilters();
            this._renderResults();
            this._bind();
            
            // Focus input
            const input = document.getElementById('search-input');
            setTimeout(() => input.focus(), 100);
        } catch (err) {
            document.getElementById('search-results').innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">error</span>
                    <h3>Yuklashda xato</h3>
                    <p>${escapeHTML(err.message)}</p>
                </div>
            `;
        }
    }

    _buildFilters() {
        const genres = ['all', ...SheetsAPI.getGenres(this.videos)];
        const chips = document.getElementById('filter-chips');
        chips.innerHTML = genres.map(g => `
            <button class="chip ${g === this.activeGenre ? 'active' : ''}" data-genre="${escapeHTML(g)}">
                ${g === 'all' ? 'Barchasi' : escapeHTML(g)}
            </button>
        `).join('');
        
        chips.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeGenre = chip.dataset.genre;
                this._renderResults();
            });
        });
    }

    _bind() {
        const input = document.getElementById('search-input');
        const clear = document.getElementById('search-clear');
        
        const onSearch = debounce((v) => {
            this.query = v;
            this._renderResults();
        }, 250);
        
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            clear.classList.toggle('hidden', !value);
            onSearch(value);
        });
        
        clear.addEventListener('click', () => {
            input.value = '';
            this.query = '';
            clear.classList.add('hidden');
            this._renderResults();
            input.focus();
        });
    }

    _renderResults() {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        let results = this.videos;
        
        if (this.query) {
            results = SheetsAPI.searchVideos(results, this.query);
        }
        if (this.activeGenre !== 'all') {
            results = SheetsAPI.filterByGenre(results, this.activeGenre);
        }
        
        this.results = results;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">search_off</span>
                    <h3>Hech narsa topilmadi</h3>
                    <p>Boshqacha so'rov bilan qidirib ko'ring</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="padding: 0 16px 12px; color: var(--text-tertiary); font-size: 13px">
                ${results.length} ta natija topildi
            </div>
            <div class="grid-container">
                ${results.map(v => VideoCard.grid(v)).join('')}
            </div>
        `;
        
        VideoCard.activateLazyLoad(container);
        VideoCard.bindClicks(container, (id) => {
            const video = this.videos.find(v => v.id === id);
            if (video) Player.open(video, this.videos);
        });
    }
}

export default new SearchPage();
