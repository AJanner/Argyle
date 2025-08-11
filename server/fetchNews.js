const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FeedParser = require('feedparser-promised');
const cheerio = require('cheerio');
const crypto = require('crypto');

// Configuration
const CACHE_DIR = path.join(__dirname, 'cache');
const META_FILE = path.join(CACHE_DIR, 'meta.json');
const NEWS_CACHE_FILE = path.join(CACHE_DIR, 'news-cache.json');
const MAX_HEADLINES = 200;
const DEFAULT_RATE_LIMIT = 300000; // 5 minutes
const USER_AGENT = 'Argyle-News-Ticker/1.0 (+https://github.com/argyle)';

// Headline structure
class Headline {
    constructor(title, url, source, ts = Date.now()) {
        this.title = title;
        this.url = url;
        this.source = source;
        this.ts = ts;
        this.id = this.generateId();
    }

    generateId() {
        return crypto.createHash('sha1').update(this.title + '|' + this.url).digest('hex');
    }
}

// Cache metadata structure
class CacheMeta {
    constructor() {
        this.sources = new Map(); // domain -> { etag, lastModified, lastFetch, rateLimit }
        this.lastUpdate = Date.now();
    }

    static fromJSON(json) {
        const meta = new CacheMeta();
        if (json.sources) {
            for (const [domain, data] of Object.entries(json.sources)) {
                meta.sources.set(domain, data);
            }
        }
        if (json.lastUpdate) meta.lastUpdate = json.lastUpdate;
        return meta;
    }

    toJSON() {
        return {
            sources: Object.fromEntries(this.sources),
            lastUpdate: this.lastUpdate
        };
    }
}

// News source parser
class NewsSourceParser {
    constructor() {
        this.meta = new CacheMeta();
    }

    async loadMeta() {
        try {
            const data = await fs.readFile(META_FILE, 'utf8');
            this.meta = CacheMeta.fromJSON(JSON.parse(data));
        } catch (error) {
            console.log('No existing meta file, starting fresh');
        }
    }

    async saveMeta() {
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.writeFile(META_FILE, JSON.stringify(this.meta.toJSON(), null, 2));
        } catch (error) {
            console.error('Failed to save meta:', error);
        }
    }

    async readSources(indexPath) {
        const sources = [];
        const content = await fs.readFile(indexPath, 'utf8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length < 2) continue;

            const type = parts[0].toLowerCase();
            const url = parts[1];

            switch (type) {
                case 'feed':
                    sources.push({ type: 'feed', url });
                    break;
                case 'site':
                case 'url':
                    sources.push({ type: 'site', url });
                    break;
                case 'headline':
                    if (parts.length >= 3) {
                        const title = parts.slice(1, -1).join(' ').replace(/^"|"$/g, '');
                        const headlineUrl = parts[parts.length - 1];
                        sources.push({ type: 'headline', title, url: headlineUrl });
                    }
                    break;
                case 'list':
                    const listPath = path.resolve(path.dirname(indexPath), url);
                    try {
                        const listSources = await this.readSources(listPath);
                        sources.push(...listSources);
                    } catch (error) {
                        console.warn(`Failed to read list ${url}:`, error.message);
                    }
                    break;
            }
        }

        return sources;
    }

    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    shouldFetch(domain) {
        const sourceMeta = this.meta.sources.get(domain);
        if (!sourceMeta) return true;

        const now = Date.now();
        const rateLimit = sourceMeta.rateLimit || DEFAULT_RATE_LIMIT;
        return (now - sourceMeta.lastFetch) >= rateLimit;
    }

    async fetchRSSFeed(url) {
        try {
            const items = await FeedParser.parse(url);
            return items.map(item => new Headline(
                item.title || 'Untitled',
                item.link || url,
                this.getDomain(url),
                item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
            ));
        } catch (error) {
            console.warn(`Failed to fetch RSS feed ${url}:`, error.message);
            return [];
        }
    }

    async fetchSiteContent(url) {
        try {
            const domain = this.getDomain(url);
            const sourceMeta = this.meta.sources.get(domain) || {};
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'If-None-Match': sourceMeta.etag,
                    'If-Modified-Since': sourceMeta.lastModified
                },
                timeout: 10000
            });

            // Update metadata
            this.meta.sources.set(domain, {
                etag: response.headers.etag,
                lastModified: response.headers['last-modified'],
                lastFetch: Date.now(),
                rateLimit: DEFAULT_RATE_LIMIT
            });

            const $ = cheerio.load(response.data);
            const headlines = [];

            // Try OpenGraph first
            const ogTitle = $('meta[property="og:title"]').attr('content');
            const ogUrl = $('meta[property="og:url"]').attr('content');
            if (ogTitle && ogUrl) {
                headlines.push(new Headline(ogTitle, ogUrl, domain));
            }

            // Try JSON-LD
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const data = JSON.parse($(el).html());
                    if (data['@type'] === 'NewsArticle' && data.headline) {
                        headlines.push(new Headline(data.headline, data.url || url, domain));
                    }
                } catch (e) {
                    // Invalid JSON, skip
                }
            });

            // Fallback to title tag
            if (headlines.length === 0) {
                const title = $('title').text().trim();
                if (title) {
                    headlines.push(new Headline(title, url, domain));
                }
            }

            return headlines;

        } catch (error) {
            if (error.response && error.response.status === 304) {
                console.log(`Content not modified for ${url}`);
                return [];
            }
            console.warn(`Failed to fetch site ${url}:`, error.message);
            return [];
        }
    }

    async fetchHeadlines(sources, opts = {}) {
        const allHeadlines = [];
        const seenIds = new Set();

        for (const source of sources) {
            try {
                let headlines = [];

                switch (source.type) {
                    case 'feed':
                        headlines = await this.fetchRSSFeed(source.url);
                        break;
                    case 'site':
                        headlines = await this.fetchSiteContent(source.url);
                        break;
                    case 'headline':
                        headlines = [new Headline(source.title, source.url, 'manual')];
                        break;
                }

                // Deduplicate and add new headlines
                for (const headline of headlines) {
                    if (!seenIds.has(headline.id)) {
                        seenIds.add(headline.id);
                        allHeadlines.push(headline);
                    }
                }

            } catch (error) {
                console.error(`Error processing source ${source.url}:`, error.message);
            }
        }

        // Sort by timestamp (newest first) and limit
        return allHeadlines
            .sort((a, b) => b.ts - a.ts)
            .slice(0, opts.maxHeadlines || MAX_HEADLINES);
    }

    async saveHeadlines(headlines) {
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
            await fs.writeFile(NEWS_CACHE_FILE, JSON.stringify(headlines, null, 2));
        } catch (error) {
            console.error('Failed to save headlines:', error);
        }
    }

    async loadHeadlines() {
        try {
            const data = await fs.readFile(NEWS_CACHE_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('No existing headlines cache, starting fresh');
            return [];
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const parser = new NewsSourceParser();
    
    try {
        await parser.loadMeta();
        
        if (args.includes('--once')) {
            console.log('Fetching news once...');
            const sources = await parser.readSources(path.join(process.cwd(), 'news.txt'));
            const headlines = await parser.fetchHeadlines(sources);
            await parser.saveHeadlines(headlines);
            await parser.saveMeta();
            console.log(`✅ Fetched ${headlines.length} headlines`);
        } else if (args.includes('--every')) {
            const interval = parseInt(args[args.indexOf('--every') + 1]) * 1000;
            console.log(`Fetching news every ${interval/1000} seconds...`);
            
            setInterval(async () => {
                try {
                    const sources = await parser.readSources(path.join(process.cwd(), 'news.txt'));
                    const headlines = await parser.fetchHeadlines(sources);
                    await parser.saveHeadlines(headlines);
                    await parser.saveMeta();
                    console.log(`✅ Updated ${headlines.length} headlines at ${new Date().toISOString()}`);
                } catch (error) {
                    console.error('Error in scheduled fetch:', error);
                }
            }, interval);
        } else {
            console.log('Usage: node fetchNews.js --once | --every <seconds>');
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { NewsSourceParser, Headline };

// Run if called directly
if (require.main === module) {
    main();
}
