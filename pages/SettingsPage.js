/**
 * SettingsPage.js - App settings
 */
import Storage from '../utils/Storage.js';
import Toast from '../utils/Toast.js';

class SettingsPage {
    render(container) {
        const settings = Storage.getSettings();
        
        container.innerHTML = `
            <div style="padding: 24px 16px 16px">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 24px">Sozlamalar</h1>
            </div>
            
            <div class="menu-list">
                <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 12px; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700">Tomosha qilish</div>
                
                <div class="menu-item">
                    <div class="menu-icon">
                        <span class="material-icons-round">play_circle</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Avto-keyingi</div>
                        <div class="menu-subtitle">Video tugagach keyingisiga o'tish</div>
                    </div>
                    <div class="toggle ${settings.autoplay ? 'active' : ''}" data-setting="autoplay"></div>
                </div>
                
                <div class="menu-item">
                    <div class="menu-icon">
                        <span class="material-icons-round">subtitles</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Subtitr</div>
                        <div class="menu-subtitle">Avtomatik subtitrlarni yoqish</div>
                    </div>
                    <div class="toggle ${settings.subtitlesEnabled ? 'active' : ''}" data-setting="subtitlesEnabled"></div>
                </div>
                
                <div class="menu-item">
                    <div class="menu-icon">
                        <span class="material-icons-round">data_saver_on</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Ma'lumot tejash</div>
                        <div class="menu-subtitle">Past sifatda yuklash</div>
                    </div>
                    <div class="toggle ${settings.dataSaver ? 'active' : ''}" data-setting="dataSaver"></div>
                </div>
                
                <div style="font-size: 13px; color: var(--text-tertiary); margin: 24px 0 12px; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700">Bildirishnomalar</div>
                
                <div class="menu-item">
                    <div class="menu-icon">
                        <span class="material-icons-round">notifications</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Bildirishnomalar</div>
                        <div class="menu-subtitle">Yangi videolar haqida xabar</div>
                    </div>
                    <div class="toggle ${settings.notifications ? 'active' : ''}" data-setting="notifications"></div>
                </div>
                
                <div style="font-size: 13px; color: var(--text-tertiary); margin: 24px 0 12px; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700">Sifat va tezlik</div>
                
                <div class="menu-item" id="quality-setting">
                    <div class="menu-icon">
                        <span class="material-icons-round">hd</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Video sifati</div>
                        <div class="menu-subtitle" id="quality-value">${this._qualityLabel(settings.quality)}</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </div>
                
                <div class="menu-item" id="speed-setting">
                    <div class="menu-icon">
                        <span class="material-icons-round">speed</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">O'qish tezligi</div>
                        <div class="menu-subtitle" id="speed-value">${settings.playbackSpeed}x</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </div>
                
                <div style="font-size: 13px; color: var(--text-tertiary); margin: 24px 0 12px; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700">Kesh va ma'lumotlar</div>
                
                <button class="menu-item" id="clear-cache">
                    <div class="menu-icon">
                        <span class="material-icons-round" style="color:var(--neon-primary)">delete_sweep</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Keshni tozalash</div>
                        <div class="menu-subtitle">Vaqtinchalik fayllarni o'chirish</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
                
                <button class="menu-item" id="reset-app">
                    <div class="menu-icon">
                        <span class="material-icons-round" style="color:var(--neon-primary)">restart_alt</span>
                    </div>
                    <div class="menu-text">
                        <div class="menu-title">Ilovani qaytadan ishga tushirish</div>
                        <div class="menu-subtitle">Hamma narsani tozalash</div>
                    </div>
                    <span class="material-icons-round menu-arrow">chevron_right</span>
                </button>
            </div>
            <div style="height: 32px"></div>
        `;
        
        this._bindToggles(container);
        this._bindActions(container);
    }

    _qualityLabel(quality) {
        const labels = { auto: 'Avtomatik', '1080p': 'Yuqori (1080p)', '720p': 'O\'rta (720p)', '480p': 'Past (480p)' };
        return labels[quality] || 'Avtomatik';
    }

    _bindToggles(container) {
        container.querySelectorAll('.toggle[data-setting]').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const key = toggle.dataset.setting;
                const newValue = !toggle.classList.contains('active');
                toggle.classList.toggle('active', newValue);
                Storage.setSetting(key, newValue);
                Toast.success('Saqlandi');
            });
        });
    }

    _bindActions(container) {
        container.querySelector('#clear-cache')?.addEventListener('click', async () => {
            if (confirm('Keshni tozalashni xohlaysizmi?')) {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                }
                localStorage.removeItem('videos_cache');
                Toast.success('Kesh tozalandi');
            }
        });

        container.querySelector('#reset-app')?.addEventListener('click', () => {
            if (confirm('Hamma sozlamalar va ma\'lumotlarni o\'chirishni xohlaysizmi?')) {
                localStorage.clear();
                Toast.success('Ilova qayta boshlanmoqda...');
                setTimeout(() => location.reload(), 1000);
            }
        });

        container.querySelector('#quality-setting')?.addEventListener('click', () => {
            const qualities = ['auto', '1080p', '720p', '480p'];
            const current = Storage.getSettings().quality;
            const next = qualities[(qualities.indexOf(current) + 1) % qualities.length];
            Storage.setSetting('quality', next);
            container.querySelector('#quality-value').textContent = this._qualityLabel(next);
            Toast.success('Sifat o\'zgartirildi');
        });

        container.querySelector('#speed-setting')?.addEventListener('click', () => {
            const speeds = [0.75, 1, 1.25, 1.5, 2];
            const current = Storage.getSettings().playbackSpeed;
            const next = speeds[(speeds.indexOf(current) + 1) % speeds.length];
            Storage.setSetting('playbackSpeed', next);
            container.querySelector('#speed-value').textContent = `${next}x`;
            Toast.success('Tezlik o\'zgartirildi');
        });
    }
}

export default new SettingsPage();
