const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// --- Step 1: Parse the discontinued products category page to get their URLs ---
const discontinuedUrls = new Set();
const discontinuedHtmlPath = path.join(__dirname, '../shop_discontinued.html');

if (fs.existsSync(discontinuedHtmlPath)) {
    const discontinuedHtml = fs.readFileSync(discontinuedHtmlPath, 'utf8');
    const $d = cheerio.load(discontinuedHtml);

    $d('li[class*="items-grid_itemListLI_"]').each((i, el) => {
        const link = $d(el).find('a[href*="/items/"]');
        const href = link.attr('href');
        if (href) {
            const url = href.startsWith('http') ? href : `https://salvador.supersale.jp${href}`;
            discontinuedUrls.add(url);
        }
    });
    console.error(`[INFO] Found ${discontinuedUrls.size} discontinued product URLs from category page.`);
} else {
    console.error('[WARN] shop_discontinued.html not found. Discontinued detection will rely on description text only.');
}

// --- Step 2: Parse the main shop pages ---
const htmlFiles = ['shop_page1.html', 'shop_page2.html', 'shop_page3.html'];
const products = [];

htmlFiles.forEach(fileName => {
    const htmlPath = path.join(__dirname, '../', fileName);
    if (!fs.existsSync(htmlPath)) return;

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    $('li[class*="items-grid_itemListLI_"]').each((i, el) => {
        const item = $(el);
        const link = item.find('a[href*="/items/"]');
        const href = link.attr('href');

        if (!href) return;

        // Resolve absolute URL
        const url = href.startsWith('http') ? href : `https://salvador.supersale.jp${href}`;

        const title = item.find('p[class*="items-grid_itemTitleText_"]').text().trim();
        const price = item.find('p[class*="items-grid_price_"]').text().trim();

        const imgTag = item.find('img[class*="items-grid_image_"]');
        let image = imgTag.attr('data-src1280') || imgTag.attr('src');

        const description = item.find('p[class*="items-grid_itemDescriptionText_"]').text().trim();

        if (title && url) {
            // Avoid duplicates
            if (!products.find(p => p.url === url)) {
                // --- Step 3: Determine discontinued status ---
                // A product is discontinued if:
                //   (a) Its URL appears in the discontinued category page, OR
                //   (b) Its description contains "こちらは終売商品です。"
                const isDiscontinuedByCategory = discontinuedUrls.has(url);
                const isDiscontinuedByDescription = description.includes('こちらは終売商品です');

                const discontinued = isDiscontinuedByCategory || isDiscontinuedByDescription;

                const productData = {
                    title,
                    price,
                    description,
                    image: image ? (image.startsWith('http') ? image : `https:${image}`) : null,
                    url
                };

                // If discontinued by category but not marked in description, 
                // prepend the marker to the description for consistency
                if (isDiscontinuedByCategory && !isDiscontinuedByDescription) {
                    productData.description = 'こちらは終売商品です。\n\n' + productData.description;
                    console.error(`[AUTO-MARKED] "${title}" → discontinued (detected from category page)`);
                }

                if (discontinued) {
                    productData.discontinued = true;
                }

                products.push(productData);
            }
        }
    });
});

// Output as JSON to stdout
console.log(JSON.stringify(products, null, 2));
