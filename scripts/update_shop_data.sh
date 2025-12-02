#!/bin/bash

# Define User Agent to bypass bot detection
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"

echo "Fetching page 1..."
curl -L -A "$USER_AGENT" "https://salvador.supersale.jp/" > shop_page1.html

echo "Fetching page 2..."
curl -L -A "$USER_AGENT" "https://salvador.supersale.jp/?page=2" > shop_page2.html

echo "Parsing HTML and updating knowledge base..."
node scripts/parse_shop_html.js > data/shop_knowledge.json

echo "Done! Product data updated in data/shop_knowledge.json"
