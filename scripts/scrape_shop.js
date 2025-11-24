const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://salvador.supersale.jp';
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'shop_knowledge.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function fetchHtml(url) {
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

async function scrapeShop() {
    const html = await fetchHtml(BASE_URL);
    if (!html) return;

    const $ = cheerio.load(html);
    const products = [];
    const productLinks = [];

    // Extract product links from the main page
    // Using the selectors identified from the HTML analysis
    // li.items-grid_itemListLI_5c97110f > a.items-grid_anchor_5c97110f
    $('li[class*="items-grid_itemListLI_"] a[class*="items-grid_anchor_"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            productLinks.push(href);
        }
    });

    console.log(`Found ${productLinks.length} products. Starting detailed scraping...`);

    for (const link of productLinks) {
        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const productHtml = await fetchHtml(link);
        if (!productHtml) continue;

        const $p = cheerio.load(productHtml);
        
        // Try to find product details. 
        // Note: Selectors on detail page might differ or be same. 
        // Based on common BASE themes, we look for standard meta tags first as they are reliable.
        
        const title = $p('meta[property="og:title"]').attr('content') || $p('title').text();
        const image = $p('meta[property="og:image"]').attr('content');
        const description = $p('meta[property="og:description"]').attr('content');
        const url = $p('meta[property="og:url"]').attr('content') || link;
        
        // Price might need specific selector. Trying to find it in the body.
        // On the list page it was p.items-grid_price_5c97110f. 
        // On detail page, it's often similar or in a specific price block.
        // Let's try to find any element with 'price' in class or id, or look for ¥ symbol.
        let price = '';
        // Try the selector from list page if it exists on detail page
        price = $p('p[class*="items-grid_price_"]').text().trim();
        
        if (!price) {
             // Fallback: look for elements containing Yen symbol
             // This is a bit loose but effective for a general scraper
             $p('div, span, p').each((i, el) => {
                 const text = $(el).text().trim();
                 if (!price && (text.startsWith('¥') || text.includes('円')) && text.length < 20) {
                     // Check if it looks like a price
                     if (/\d/.test(text)) {
                         price = text;
                     }
                 }
             });
        }

        // Get full description from body if possible, as meta description is truncated
        // Look for the main description block.
        // In the list page HTML, description was in p.items-grid_itemDescriptionText_5c97110f
        // In detail page, it might be in a different container.
        let fullDescription = '';
        // Common BASE selectors for description
        const descriptionSelectors = [
            'div[class*="item-detail_description"]',
            '#item-detail-description',
            '.description',
            'div[data-parts="item-detail"]' // Seen in the CSS styles in temp_page.html
        ];
        
        for (const sel of descriptionSelectors) {
            const text = $p(sel).text().trim();
            if (text.length > fullDescription.length) {
                fullDescription = text;
            }
        }
        
        if (!fullDescription) fullDescription = description;

        const productData = {
            title,
            price,
            description: fullDescription,
            image,
            url
        };

        console.log(`Scraped: ${title}`);
        products.push(productData);
    }

    // Also scrape "About" or "Blog" if available?
    // For now, let's stick to products as that's the core "knowledge".

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to ${OUTPUT_FILE}`);
}

scrapeShop();
