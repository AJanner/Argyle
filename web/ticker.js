// News Ticker Module
class NewsTicker {
    constructor(options = {}) {
        this.options = {
            target: options.target || '#news-ticker',
            endpoint: options.endpoint || '/api/news',
            speed: options.speed || 60, // pixels per second
            gap: options.gap || 48, // gap between headlines
            pauseOnHover: options.pauseOnHover !== false,
            direction: options.direction || 'ltr',
            fontCss: options.fontCss || null,
            maxHeadlines: options.maxHeadlines || 50
        };

        this.container = null;
        this.ticker = null;
        this.headlines = [];
        this.isPaused = false;
        this.animationId = null;
        this.currentPosition = 0;
        this.lastUpdate = 0;
        this.offlineMode = false;

        this.init();
    }

    async init() {
        try {
            this.container = document.querySelector(this.options.target);
            if (!this.container) {
                console.error(`News ticker target not found: ${this.options.target}`);
                return;
            }

            // Load custom font if specified
            if (this.options.fontCss) {
                await this.loadFont(this.options.fontCss);
            }

            this.setupTicker();
            this.loadHeadlines();
            this.startAnimation();

            // Set up periodic refresh
            setInterval(() => this.loadHeadlines(), 300000); // 5 minutes

        } catch (error) {
            console.error('Failed to initialize news ticker:', error);
        }
    }

    async loadFont(fontCss) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontCss;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    setupTicker() {
        // Create ticker structure
        this.container.innerHTML = `
            <div class="news-ticker-container">
                <div class="news-ticker-content">
                    <div class="news-ticker-track">
                        <div class="news-ticker-list"></div>
                    </div>
                </div>
                <div class="news-ticker-offline" style="display: none;">📡 Offline</div>
            </div>
        `;

        this.ticker = this.container.querySelector('.news-ticker-track');
        this.tickerList = this.container.querySelector('.news-ticker-list');
        this.offlineBadge = this.container.querySelector('.news-ticker-offline');

        // Set up hover events
        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.pause());
            this.container.addEventListener('mouseleave', () => this.resume());
        }

        // Set direction
        if (this.options.direction === 'rtl') {
            this.ticker.style.direction = 'rtl';
        }
    }

    async loadHeadlines() {
        try {
            const response = await fetch(this.options.endpoint);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const headlines = await response.json();
            this.headlines = headlines.slice(0, this.options.maxHeadlines);
            this.offlineMode = false;
            this.offlineBadge.style.display = 'none';
            
            this.renderHeadlines();
            this.lastUpdate = Date.now();

        } catch (error) {
            console.warn('Failed to fetch headlines, using cached data:', error.message);
            this.offlineMode = true;
            this.offlineBadge.style.display = 'block';
            
            // Try to load from localStorage as fallback
            this.loadFromCache();
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('news-ticker-cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour old
                    this.headlines = data.headlines;
                    this.renderHeadlines();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached headlines:', error);
        }
    }

    saveToCache() {
        try {
            localStorage.setItem('news-ticker-cache', JSON.stringify({
                headlines: this.headlines,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save headlines to cache:', error);
        }
    }

    renderHeadlines() {
        if (!this.tickerList || this.headlines.length === 0) return;

        // Create headline elements
        const headlineElements = this.headlines.map(headline => {
            const element = document.createElement('div');
            element.className = 'news-ticker-item';
            element.innerHTML = `
                <span class="news-source">${this.sanitizeText(headline.source)}</span>
                <span class="news-separator">•</span>
                <span class="news-title">${this.sanitizeText(headline.title)}</span>
                <span class="news-time">${this.formatTimeAgo(headline.ts)}</span>
            `;
            
            // Make clickable
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                window.open(headline.url, '_blank');
            });
            
            return element;
        });

        // Clear and populate
        this.tickerList.innerHTML = '';
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Duplicate for seamless loop
        headlineElements.forEach(element => {
            this.tickerList.appendChild(element.cloneNode(true));
        });

        // Save to cache
        this.saveToCache();

        // Reset position for new content
        this.currentPosition = 0;
    }

    sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    startAnimation() {
        if (this.animationId) return;
        
        const animate = () => {
            if (this.isPaused) {
                this.animationId = requestAnimationFrame(animate);
                return;
            }

            this.currentPosition -= this.options.speed / 60; // 60fps

            // Check if we need to loop
            const tickerWidth = this.tickerList.scrollWidth / 2;
            if (Math.abs(this.currentPosition) >= tickerWidth) {
                this.currentPosition = 0;
            }

            this.ticker.style.transform = `translateX(${this.currentPosition}px)`;
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    pause() {
        this.isPaused = true;
        this.container.classList.add('paused');
    }

    resume() {
        this.isPaused = false;
        this.container.classList.remove('paused');
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Public methods for external control
    setSpeed(speed) {
        this.options.speed = speed;
    }

    setDirection(direction) {
        this.options.direction = direction;
        if (this.ticker) {
            this.ticker.style.direction = direction;
        }
    }

    refresh() {
        this.loadHeadlines();
    }
}

// Global initialization function
function initNewsTicker(options = {}) {
    return new NewsTicker(options);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NewsTicker, initNewsTicker };
} else {
    window.NewsTicker = NewsTicker;
    window.initNewsTicker = initNewsTicker;
}
