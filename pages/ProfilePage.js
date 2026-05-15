/**
 * ProfilePage.js - User profile
 */
import Storage from '../utils/Storage.js';
import Router from '../js/Router.js';

class ProfilePage {
    render(container) {
        const favorites = Storage.getFavorites();
        const history = Storage.getHistory();
        const continueWatching = Storage.getContinueWatching();
        
        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">V</div>
                <h1 class="profile-name">Mehmon</h1>
                <p class="profile-email">azikk1999@gmail.com</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-value">${favorites.length}</div>
                    <div class="stat-label">Sevimlilar</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${history.length}</div>
                    <div class="stat-label">Ko'rilgan</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${continueWatching.length}</div>
                    <div class="stat-label">Davom etadi</div>
                </div>
            </div>
            
            <div class="menu-list">
                <button class="menu-item" data-route="favorites">
                    <div class="menu-icon">
                        <span class="material-icons-round">favorite</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Sevimlilar</div>
                        <div class="menu-subtitle">${favorites.length} ta video</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" data-route="settings">
                    <div class="menu-icon">
                        <span class="material-icons-round">settings</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Sozlamalar</div>
                        <div class="menu-subtitle">Sifat, tezlik, tema</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" id="download-cache">
                    <div class="menu-icon">
                        <span class="material-icons-round">download</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Yuklangan videolar</div>
                        <div class="menu-subtitle">Offline tomosha qilish</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" id="share-app">
                    <div class="menu-icon">
                        <span class="material-icons-round">share</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Ilovani ulashish</div>
                        <div class="menu-subtitle">Do'stlaringizga yuboring</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" id="about-app">
                    <div class="menu-icon">
                        <span class="material-icons-round">info</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Ilova haqida</div>
                        <div class="menu-subtitle">Versiya 1.0.0</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" id="rate-app">
                    <div class="menu-icon">
                        <span class="material-icons-round" style="color:var(--neon-gold)">star</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Ilovani baholang</div>
                        <div class="menu-subtitle">Fikr-mulohaza qoldiring</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
            </div>
            
            <div style="height: 32px"></div>
            <div style="text-align:center;padding:0 16px;color:var(--text-muted);font-size:12px">
                VideoFlix v1.0.0<br>
                © 2026 All rights reserved
            </div>
            <div style="height: 24px"></div>
        `;
        
        container.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', () => Router.navigate(btn.dataset.route));
        });
    }
}

export default new ProfilePage();
