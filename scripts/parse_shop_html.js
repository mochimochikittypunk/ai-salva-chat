const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// List of HTML files to parse
const htmlFiles = ['shop_page1.html', 'shop_page2.html', 'shop_page3.html'];
const products = [];

htmlFiles.forEach(fileName => {
    const htmlPath = path.join(__dirname, '../', fileName);
    if (!fs.existsSync(htmlPath)) return;

    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Adjust selectors based on typical BASE shop themes or generic structure
    // Looking for list items that likely contain product info
    // Common BASE classes: .item-list, .product-list, .item, .product
    // We'll try to be generic or look for common patterns

    // Updated strategy based on actual HTML content
    // Items are in <li> with class starting with 'items-grid_itemListLI_'
    // Inside, there is an anchor <a> with class 'items-grid_anchor_...'
    // Title is in <p class="items-grid_itemTitleText_...">
    // Price is in <p class="items-grid_price_...">
    // Image is in <img> with class 'items-grid_image_...' (src or data-src1280)
    // Description is in <p class="items-grid_itemDescriptionText_...">
    // SOLD OUT status is in <p class="items-grid_soldOut_...">

    $('li[class*="items-grid_itemListLI_"]').each((i, el) => {
        const item = $(el);
        const link = item.find('a[href*="/items/"]');
        const href = link.attr('href');

        if (!href) return;

        // Check for SOLD OUT status - User requested to KEEP sold out items
        // const soldOut = item.find('p[class*="items-grid_soldOut_"]').length > 0;
        // if (soldOut) return;

        // Resolve absolute URL
        const url = href.startsWith('http') ? href : `https://salvador.supersale.jp${href}`;

        const title = item.find('p[class*="items-grid_itemTitleText_"]').text().trim();
        const price = item.find('p[class*="items-grid_price_"]').text().trim();

        const imgTag = item.find('img[class*="items-grid_image_"]');
        let image = imgTag.attr('data-src1280') || imgTag.attr('src');

        // Description might be truncated or full, let's grab it
        const description = item.find('p[class*="items-grid_itemDescriptionText_"]').text().trim();

        if (title && url) {
            // Avoid duplicates
            if (!products.find(p => p.url === url)) {
                products.push({
                    title,
                    price,
                    description, // Add description to the object
                    image: image ? (image.startsWith('http') ? image : `https:${image}`) : null,
                    url
                });
            }
        }
    });
});

// If the above generic extraction failed to find titles/prices well, 
// let's try a more specific selector if we can guess the theme.
// But for now, let's see what we get.
console.log(JSON.stringify(products, null, 2));
