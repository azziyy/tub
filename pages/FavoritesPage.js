/**
 * FavoritesPage.js - Saved favorites
 */
import Storage from '../utils/Storage.js';
import SheetsAPI from '../api/SheetsAPI.js';
import { VideoCard } from '../components/VideoCard.js';
import Player from '../components/Player.js';
import Toast from '../utils/Toast.js';

class FavoritesPage {
    async render(container) {
        const favorites = Storage.getFavorites();
        const history = Storage.getHistory();
        let allVideos = [];
        try { allVideos = await SheetsAPI.fetchVideos(); } catch(e) {}
        
        if (favorites.length === 0 && history.length === 0) {
            container.innerHTML = `
                <div style="padding: 24px 16px;">
                    <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 8px">Kolleksiyam</h1>
                    <p style="color: var(--text-tertiary); margin-bottom: 32px">Sevimli va ko'rilgan videolar</p>
                </div>
                <div class="empty-state">
                    <span class="material-icons-round">favorite_border</span>
                    <h3>Sevimlilar bo'sh</h3>
                    <p>Yoqtirgan videolaringizni saqlash uchun yurakcha tugmasini bosing</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="padding: 24px 16px 0;">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 8px">Kolleksiyam</h1>
                <p style="color: var(--text-tertiary); margin-bottom: 24px">${favorites.length} ta sevimli • ${history.length} ta ko'rilgan</p>
            </div>
            
            ${favorites.length > 0 ? `
                <section class="section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <span class="material-icons-round" style="color:var(--neon-primary)">favorite</span>
                            Sevimlilar
                        </h2>
                    </div>
                    <div class="grid-container" id="fav-list">
                        ${favorites.map(v => VideoCard.grid(v)).join('')}
                    </div>
                </section>
            ` : ''}
            
            ${history.length > 0 ? `
                <section class="section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <span class="material-icons-round">history</span>
                            Ko'rilgan
                        </h2>
                        <button class="section-action" id="clear-history">
                            Tozalash
                            <span class="material-icons-round" style="font-size:16px">delete_outline</span>
                        </button>
                    </div>
                    <div class="list-container" id="hist-list">
                        ${history.slice(0, 20).map(v => VideoCard.list(v)).join('')}
                    </div>
                </section>
            ` : ''}
            <div style="height: 24px"></div>
        `;
        
        VideoCard.activateLazyLoad(container);
        VideoCard.bindClicks(container, (id) => {
            const video = [...favorites, ...history, ...allVideos].find(v => v.id === id);
            if (video) Player.open(video, allVideos.length ? allVideos : favorites);
        });
        
        const clearBtn = container.querySelector('#clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Tarixni tozalashni xohlaysizmi?')) {
                    Storage.clearHistory();
                    Toast.success('Tarix tozalandi');
                    this.render(container);
                }
            });
        }
    }
}

export default new FavoritesPage();
