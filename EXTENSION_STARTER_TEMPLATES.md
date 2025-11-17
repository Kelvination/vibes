# Browser Extension Starter Templates
**Quick-start code for building your first monetized extension**

---

## Template 1: Freemium Base Structure

This is the fundamental structure for ANY extension that wants to implement freemium + affiliate monetization:

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Your Extension Name",
  "version": "1.0.0",
  "description": "Brief description of what your extension does",

  "permissions": [
    "storage",
    "scripting",
    "activeTab",
    "tabs"
  ],

  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

### popup.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="premium-status" class="premium-badge"></div>

  <div id="feature-content">
    <!-- Free features always visible -->
    <div class="feature free-feature">
      <h3>Free Features</h3>
      <button id="btn-free-feature">Use Free Feature</button>
    </div>

    <!-- Premium features gated -->
    <div id="premium-features" class="premium-gated" style="display:none;">
      <div class="feature">
        <h3>Premium Features</h3>
        <button id="btn-premium-feature">Use Premium Feature</button>
      </div>

      <div class="affiliate-section">
        <p>Recommended tools for this feature:</p>
        <a href="AFFILIATE_LINK_HERE" target="_blank" class="affiliate-link">
          Check out Tool X →
        </a>
      </div>
    </div>

    <!-- Upgrade prompt for non-premium users -->
    <div id="upgrade-prompt" class="upgrade-box" style="display:none;">
      <h3>Unlock Premium Features</h3>
      <p>Get advanced features and remove limitations</p>
      <button id="btn-upgrade">Upgrade Now - $2.99/month</button>
      <small>Cancel anytime, 7-day free trial</small>
    </div>
  </div>

  <!-- Settings -->
  <div id="settings-panel" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc;">
    <button id="btn-settings">⚙️ Settings</button>
    <button id="btn-help">? Help</button>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### popup.css
```css
body {
  width: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 16px;
  background: #fafafa;
}

.premium-badge {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  font-weight: 600;
}

.premium-badge.premium {
  background: #e8f5e9;
  color: #2e7d32;
}

.premium-badge.free {
  background: #fff3cd;
  color: #856404;
}

.feature {
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

.feature h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

button {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

button:hover {
  background: #1565c0;
}

button:active {
  transform: scale(0.98);
}

.upgrade-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.upgrade-box h3 {
  margin-top: 0;
}

.upgrade-box small {
  display: block;
  margin-top: 8px;
  opacity: 0.9;
}

.affiliate-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.affiliate-link {
  display: inline-block;
  margin-top: 8px;
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.affiliate-link:hover {
  text-decoration: underline;
}

.premium-gated {
  opacity: 0.6;
  pointer-events: none;
}

.premium-gated.unlocked {
  opacity: 1;
  pointer-events: auto;
}

#settings-panel {
  text-align: center;
}

#settings-panel button {
  margin: 0 4px;
  background: #f0f0f0;
  color: #333;
  font-size: 12px;
}

#settings-panel button:hover {
  background: #e0e0e0;
}
```

### popup.js
```javascript
// Premium status management
const STORAGE_KEY = 'extension_premium_status';
const TRIAL_DAYS = 7;

async function checkPremiumStatus() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);

  if (!stored[STORAGE_KEY]) {
    return {
      isPremium: false,
      trialEndDate: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      purchaseDate: null
    };
  }

  const status = stored[STORAGE_KEY];

  // Check if trial expired
  if (!status.isPremium && new Date(status.trialEndDate) < new Date()) {
    return {
      isPremium: false,
      trialEndDate: null,
      purchaseDate: status.purchaseDate
    };
  }

  return status;
}

async function initializeUI() {
  const status = await checkPremiumStatus();
  const badge = document.getElementById('premium-status');
  const upgradePrompt = document.getElementById('upgrade-prompt');
  const premiumFeatures = document.getElementById('premium-features');

  if (status.isPremium) {
    badge.textContent = '✅ Premium Active';
    badge.classList.add('premium');
    premiumFeatures.classList.add('unlocked');
    premiumFeatures.style.display = 'block';
    upgradePrompt.style.display = 'none';
  } else {
    badge.textContent = '⭐ Free Version';
    badge.classList.add('free');
    premiumFeatures.style.display = 'none';

    if (status.trialEndDate) {
      const daysLeft = Math.ceil(
        (new Date(status.trialEndDate) - new Date()) / (24 * 60 * 60 * 1000)
      );
      upgradePrompt.style.display = 'block';
      document.querySelector('#upgrade-prompt p').textContent =
        `${daysLeft} days left in free trial`;
    } else {
      upgradePrompt.style.display = 'block';
    }
  }
}

// Handle free features
document.getElementById('btn-free-feature')?.addEventListener('click', () => {
  // Implement free feature
  console.log('Free feature triggered');
  alert('Free feature working!');
});

// Handle premium features
document.getElementById('btn-premium-feature')?.addEventListener('click', async () => {
  const status = await checkPremiumStatus();

  if (!status.isPremium) {
    alert('Upgrade to premium to use this feature');
    return;
  }

  // Implement premium feature
  console.log('Premium feature triggered');
  alert('Premium feature working!');
});

// Handle upgrade button
document.getElementById('btn-upgrade')?.addEventListener('click', async () => {
  // Open payment provider (ExtensionPay example)
  chrome.tabs.create({
    url: 'https://your-payment-page.com/upgrade'
  });

  // After user completes payment, you'd receive a webhook
  // This is simplified - implement proper payment flow
  // For now, we'll use a demo
  const demoUpgrade = confirm('Demo: Mark as premium? (in production, this is paid)');
  if (demoUpgrade) {
    await chrome.storage.local.set({
      [STORAGE_KEY]: {
        isPremium: true,
        purchaseDate: new Date(),
        trialEndDate: null
      }
    });
    location.reload();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeUI);

// Settings
document.getElementById('btn-settings')?.addEventListener('click', () => {
  alert('Settings coming soon');
});

document.getElementById('btn-help')?.addEventListener('click', () => {
  alert('Help: This extension helps you do amazing things!');
});
```

### background.js
```javascript
// Service worker for background tasks

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize free trial on install
    const STORAGE_KEY = 'extension_premium_status';
    const TRIAL_DAYS = 7;

    chrome.storage.local.set({
      [STORAGE_KEY]: {
        isPremium: false,
        trialEndDate: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        purchaseDate: null
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://yoursite.com/welcome'
    });
  }
});

// Handle messages from popup/content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackEvent') {
    // Analytics tracking (privacy-compliant)
    console.log('Event tracked:', request.event);
  }
});
```

### content.js
```javascript
// Content script injected into web pages

console.log('Extension content script loaded');

// Example: Listen for clicks on elements
document.addEventListener('click', (e) => {
  if (e.target.matches('.your-selector')) {
    chrome.runtime.sendMessage({
      action: 'trackEvent',
      event: 'user_clicked_something'
    });
  }
});
```

---

## Template 2: Price Comparison Extension Example

For the "Smart Price Comparison" idea:

### popup.html (specific to price comparison)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="header">
    <h2>Price Finder</h2>
    <span class="version">Free</span>
  </div>

  <div id="product-info" class="hidden">
    <div class="product-name" id="product-name"></div>
    <div class="current-price" id="current-price"></div>
  </div>

  <div id="price-comparison">
    <h3>Prices on Other Sites:</h3>
    <div id="price-list"></div>
  </div>

  <!-- Affiliate section -->
  <div class="affiliate-deals">
    <h4>💡 Best Deals Right Now</h4>
    <div id="affiliate-deals-container"></div>
  </div>

  <div class="premium-section">
    <h4>Get Price Alerts 🔔</h4>
    <p>Premium users get notified when prices drop!</p>
    <button id="btn-upgrade-alerts">Upgrade to Premium</button>
  </div>

  <style>
    body {
      width: 450px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .version {
      background: #fff3cd;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .product-name {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .current-price {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .price-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 8px;
      background: white;
    }

    .price-item.best {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .seller {
      font-weight: 500;
    }

    .price {
      font-size: 16px;
      font-weight: bold;
      color: #1976d2;
    }

    .affiliate-deals {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      margin: 16px 0;
    }

    .affiliate-link {
      display: block;
      margin: 8px 0;
      padding: 8px;
      background: white;
      border-radius: 4px;
      text-decoration: none;
      color: #1976d2;
      font-size: 13px;
    }

    .affiliate-link:hover {
      background: #e3f2fd;
    }

    .premium-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 6px;
      margin-top: 16px;
    }

    .premium-section p {
      margin: 8px 0;
      font-size: 13px;
    }

    button {
      width: 100%;
      padding: 10px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      margin-top: 8px;
    }

    button:hover {
      background: #1565c0;
    }

    .hidden {
      display: none;
    }
  </style>

  <script src="popup.js"></script>
</body>
</html>
```

### popup.js (price comparison logic)
```javascript
const AFFILIATE_AMAZON = 'https://amazon.com/?tag=YOUR_AFFILIATE_ID';
const AFFILIATE_WALMART = 'https://walmart.com?affiliate_id=YOUR_ID';

// Get product info from current page
async function getProductFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // This is simplified - in reality, you'd use better parsing
  const result = await chrome.tabs.sendMessage(tab.id, {
    action: 'getProductInfo'
  });

  return result;
}

// Fetch prices from multiple sources (simplified)
async function fetchPrices(productName) {
  const prices = [];

  try {
    // Example: Using a price comparison API
    // In production, use a real API like PriceAPI, Keepa, etc.

    const response = await fetch(`https://api.priceapi.com/search?q=${productName}`);
    const data = await response.json();

    return data.results.map(item => ({
      seller: item.store,
      price: item.price,
      url: item.url,
      rating: item.rating
    }));
  } catch (e) {
    console.error('Price fetch failed:', e);
    return [];
  }
}

// Display affiliate recommendations
function displayAffiliateDeals() {
  const container = document.getElementById('affiliate-deals-container');

  const deals = [
    { name: 'Check Amazon Prime', url: AFFILIATE_AMAZON },
    { name: 'Walmart Savings', url: AFFILIATE_WALMART },
    { name: 'See Best Deals on CamelCamelCamel', url: 'https://camelcamelcamel.com' }
  ];

  container.innerHTML = deals.map(deal =>
    `<a class="affiliate-link" href="${deal.url}" target="_blank">${deal.name} →</a>`
  ).join('');
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const product = await getProductFromPage();

    if (product) {
      document.getElementById('product-name').textContent = product.name;
      document.getElementById('current-price').textContent = product.price;
      document.getElementById('product-info').classList.remove('hidden');

      // Fetch prices from competitors
      const prices = await fetchPrices(product.name);
      const priceList = document.getElementById('price-list');

      prices.forEach((item, index) => {
        const isLowest = index === 0;
        const div = document.createElement('div');
        div.className = `price-item ${isLowest ? 'best' : ''}`;
        div.innerHTML = `
          <span class="seller">${item.seller}</span>
          <span class="price">${item.price}</span>
        `;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          chrome.tabs.create({ url: item.url });
        });
        priceList.appendChild(div);
      });
    }

    displayAffiliateDeals();
  } catch (e) {
    console.error('Error:', e);
  }
});

// Handle upgrade button
document.getElementById('btn-upgrade-alerts')?.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://yoursite.com/upgrade?ref=extension'
  });
});
```

---

## Template 3: Affiliate Integration Pattern

For adding affiliate links subtly and legally:

```javascript
// Affiliate utility module
const AffiliateManager = {
  // Mapping of products/services to affiliate links
  AFFILIATE_LINKS: {
    'amazon': {
      url: 'https://amazon.com/?tag=YOUR_TAG',
      commission: '5-10%',
      disclosure: 'Amazon affiliate link'
    },
    'clickbank': {
      url: 'https://your-clickbank-link.com',
      commission: '50-75%',
      disclosure: 'ClickBank affiliate link'
    },
    'skillshare': {
      url: 'https://skillshare.com?via=YourRef',
      commission: '15-20%',
      disclosure: 'Skillshare affiliate link'
    }
  },

  // Get affiliate link with proper disclosure
  getAffiliateLink(service) {
    const link = this.AFFILIATE_LINKS[service];
    if (!link) return null;

    return {
      url: link.url,
      disclosure: `✧ ${link.disclosure}`
    };
  },

  // Create affiliate element with proper disclosure
  createAffiliateElement(service, displayText) {
    const link = this.getAffiliateLink(service);
    if (!link) return null;

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = displayText;
    a.title = link.disclosure;
    a.className = 'affiliate-link';

    return a;
  },

  // Track affiliate click (privacy-compliant)
  trackClick(service) {
    chrome.runtime.sendMessage({
      action: 'trackAffiliateClick',
      service: service,
      timestamp: new Date()
    });
  }
};

// Usage example
const amazonLink = AffiliateManager.createAffiliateElement(
  'amazon',
  'Compare prices on Amazon'
);

// Add to popup
if (amazonLink) {
  document.getElementById('affiliate-deals-container').appendChild(amazonLink);
  amazonLink.addEventListener('click', () => {
    AffiliateManager.trackClick('amazon');
  });
}
```

---

## Template 4: Premium Payment Integration

Using ExtensionPay (recommended):

```javascript
// ExtensionPay Integration
const PaymentManager = {
  // Initialize ExtensionPay
  async init() {
    // ExtensionPay script: https://extensionpay.com/
    // Add this to popup.html: <script src="https://extensionpay.com/d/YOUR_KEY"></script>

    if (typeof extensionPay === 'undefined') {
      console.error('ExtensionPay not loaded');
      return;
    }

    // Set your product ID
    this.productId = 'YOUR_PRODUCT_ID';
  },

  // Check if user has paid
  async isPremium() {
    const isPaid = await extensionPay.getUser();
    return isPaid && isPaid.paid;
  },

  // Open payment page
  async openCheckout() {
    await extensionPay.openPaymentPage(this.productId);
  },

  // Handle payment success (ExtensionPay calls this automatically)
  onPaymentSuccess() {
    chrome.storage.local.set({
      'extension_premium': true,
      'premium_date': new Date()
    });
    location.reload();
  }
};

// In popup.html, add:
// <script src="https://extensionpay.com/d/YOUR_KEY"></script>

// Handle upgrade button
document.getElementById('btn-upgrade')?.addEventListener('click', async () => {
  await PaymentManager.init();
  await PaymentManager.openCheckout();
});
```

---

## Checklist: Before Publishing to Stores

- [ ] **manifest.json properly configured** - All permissions minimal and justified
- [ ] **Icons provided** - 16x16, 48x48, 128x128 PNG files
- [ ] **Privacy Policy written** - Explain what data you collect (if any)
- [ ] **Affiliate links disclosed** - Clear labeling in description
- [ ] **Freemium flow tested** - Both free and premium paths work
- [ ] **No permissions creep** - Only request what you need
- [ ] **Settings page created** - Users can opt-out/modify behavior
- [ ] **Error handling** - Extension doesn't crash on edge cases
- [ ] **Tested on both browsers** - Chrome and Firefox
- [ ] **Store descriptions written** - Clear, honest, benefits-focused
- [ ] **Screenshots provided** - Show key features in action

---

## Quick Tips for Success

1. **Start Simple** - One feature done well beats three mediocre features
2. **Freemium Gate Strategy** - Gate 20-30% of features (not 80%)
3. **Affiliate Honesty** - Only recommend products you'd actually use
4. **Update Regularly** - Even small tweaks show active development
5. **Respond to Reviews** - Reply to every review (positive and negative)
6. **Privacy First** - Don't track unless absolutely necessary
7. **A/B Test** - Try different upgrade messaging, see what converts
8. **Community Building** - Build a support Discord/Slack early

---

## Next Steps

1. Choose one idea from the research document
2. Build MVP using these templates
3. Test with 100-500 beta users
4. Iterate based on feedback
5. Add monetization layer (affiliate + premium)
6. Submit to stores
7. Monitor reviews and iterate
8. Scale when hitting 5K+ users

Good luck! 🚀
