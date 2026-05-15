/**
 * app.js - Main application entry point
 */
import Router from './Router.js';
import Player from '../components/Player.js';
import Toast from '../utils/Toast.js';
import { isOnline, throttle } from '../utils/Helpers.js';

import HomePage from '../pages/HomePage.js';
import SearchPage from '../pages/SearchPage.js';
import FavoritesPage from '../pages/FavoritesPage.js';
import ProfilePage from '../pages/ProfilePage.js';
import SettingsPage from '../pages/SettingsPage.js';

class App {
    constructor() {
        this.deferredPrompt = null;
        this.pullStart = 0;
        this.pullDelta = 0;
    }

    async init() {
        // Hide splash after delay
        this._hideSplash();
        
        // Initialize Player
        Player.init();
        
        // Setup routes
        this._setupRoutes();
        
        // Bind navigation
        this._bindNavigation();
        
        // Bind header buttons
        this._bindHeader();
        
        // PWA features
        this._setupPWA();
        
        // Online / offline
        this._setupNetworkMonitor();
        
        // Pull to refresh
        this._setupPullRefresh();
        
        // Scroll header hide
        this._setupHeaderScroll();
        
        // Show app
        document.getElementById('app').classList.remove('hidden');
    }

    _hideSplash() {
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            splash.classList.add('hidden-splash');
            setTimeout(() => splash.style.display = 'none', 400);
        }, 1200);
    }

    _setupRoutes() {
        const container = document.getElementById('page-container');
        
        Router.register('home', (el) => HomePage.render(el));
        Router.register('search', (el, params) => SearchPage.render(el, params));
        Router.register('favorites', (el) => FavoritesPage.render(el));
        Router.register('profile', (el) => ProfilePage.render(el));
        Router.register('settings', (el) => SettingsPage.render(el));
        
        Router.beforeChange = (newRoute) => {
            // Cleanup if needed
            if (HomePage.destroy && newRoute !== 'home') HomePage.destroy();
        };
        
        Router.init(container);
    }

    _bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                Router.navigate(item.dataset.route);
            });
        });
    }

    _bindHeader() {
        document.getElementById('search-btn')?.addEventListener('click', () => {
            Router.navigate('search');
        });
        document.getElementById('profile-btn')?.addEventListener('click', () => {
            Router.navigate('profile');
        });
        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            Toast.info('Yangi bildirishnomalar yo\'q');
        });
    }

    _setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(() => console.log('[App] SW registered'))
                    .catch(err => console.warn('[App] SW failed:', err));
            });
        }

        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install popup after delay
            setTimeout(() => {
                const popup = document.getElementById('install-popup');
                popup?.classList.remove('hidden');
            }, 30000);
        });

        document.getElementById('install-accept')?.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    Toast.success('Ilova o\'rnatildi!');
                }
                this.deferredPrompt = null;
            }
            document.getElementById('install-popup').classList.add('hidden');
        });

        document.getElementById('install-dismiss')?.addEventListener('click', () => {
            document.getElementById('install-popup').classList.add('hidden');
        });

        // Installed event
        window.addEventListener('appinstalled', () => {
            Toast.success('Ilova muvaffaqiyatli o\'rnatildi!');
            this.deferredPrompt = null;
        });
    }

    _setupNetworkMonitor() {
        const offlineScreen = document.getElementById('offline-screen');
        const updateStatus = () => {
            if (isOnline()) {
                offlineScreen.classList.add('hidden');
            } else {
                offlineScreen.classList.remove('hidden');
            }
        };
        
        window.addEventListener('online', () => {
            offlineScreen.classList.add('hidden');
            Toast.success('Internet aloqasi tiklandi');
        });
        
        window.addEventListener('offline', () => {
            offlineScreen.classList.remove('hidden');
        });
        
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            if (isOnline()) {
                offlineScreen.classList.add('hidden');
                Router._handleRoute();
            } else {
                Toast.error('Internet aloqasi yo\'q');
            }
        });
        
        updateStatus();
    }

                _setupPullRefresh() {
        const main = document.getElementById('main-content');
        const indicator = document.getElementById('pull-refresh');
        
        // Skrol qayerdaligini aniqlash uchun yordamchi funksiya
        const getScrollTop = () => {
            return main.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0;
        };

        main.addEventListener('touchstart', (e) => {
            const st = getScrollTop();
            if (st <= 5) { // Juda kichik chegara qo'yamiz
                this.pullStart = e.touches[0].clientY;
            } else {
                this.pullStart = 0;
            }
            this.pullDelta = 0;
        }, { passive: true });
        
        main.addEventListener('touchmove', (e) => {
            const st = getScrollTop();
            const currentY = e.touches[0].clientY;
            const diff = currentY - this.pullStart;

            // AGAR: 
            // 1. pullStart nol bo'lsa (tepada emasdik)
            // 2. Skrol tepada bo'lmasa (st > 5)
            // 3. Tepaga qarab surayotgan bo'lsak (diff < 0)
            // HAMMASINI TO'XTATAMIZ
            if (this.pullStart === 0 || st > 5 || diff < 0) {
                this.pullStart = 0;
                this.pullDelta = 0;
                indicator.classList.remove('active');
                return;
            }

            this.pullDelta = diff;

            if (this.pullDelta > 70) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        }, { passive: true });
        
        main.addEventListener('touchend', () => {
            const st = getScrollTop();
            if (st <= 5 && this.pullDelta > 90) {
                indicator.classList.add('active');
                Toast.info('Yangilanmoqda...');
                setTimeout(() => {
                    indicator.classList.remove('active');
                    Router._handleRoute();
                }, 800);
            } else {
                indicator.classList.remove('active');
            }
            this.pullStart = 0;
            this.pullDelta = 0;
        });
    }




    _setupHeaderScroll() {
        const header = document.getElementById('app-header');
        const main = document.getElementById('main-content');
        let lastScroll = 0;
        
        const onScroll = throttle(() => {
            const scrollTop = main.scrollTop;
            if (scrollTop > 60 && scrollTop > lastScroll) {
                header.classList.add('hidden-on-scroll');
            } else {
                header.classList.remove('hidden-on-scroll');
            }
            lastScroll = scrollTop;
        }, 100);
        
        main.addEventListener('scroll', onScroll);
    }
}

// Start app
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

// Export for debugging
window.__app = app;
