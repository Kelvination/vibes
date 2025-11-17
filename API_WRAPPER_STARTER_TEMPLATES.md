# API Wrapper Starter Templates
## Copy-Paste Code to Get Started with Claude Code

---

## TEMPLATE 1: Simple REST Wrapper (Node.js + Express)

Use this for: **SimpleStripe**, **TwitterSimple**, **GoogleAPIsSimple**, etc.

### Directory Structure
```
projects/simple-stripe/
├── src/
│   ├── index.js          (main server)
│   ├── routes/
│   │   └── charges.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimit.js
│   └── services/
│       └── stripe.js
├── package.json
└── .env.example
```

### package.json
```json
{
  "name": "simple-stripe",
  "version": "1.0.0",
  "description": "Simplified Stripe wrapper",
  "main": "src/index.js",
  "scripts": {
    "dev": "node src/index.js",
    "start": "node src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "stripe": "^12.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

### src/index.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');
const chargesRouter = require('./routes/charges');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware);
app.use(rateLimitMiddleware);

// Routes
app.use('/charges', chargesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### src/middleware/auth.js
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In production, use a database for API keys
const validApiKeys = new Map();

module.exports = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  // In production: verify against database
  if (!validApiKeys.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.userId = validApiKeys.get(apiKey);
  next();
};
```

### src/middleware/rateLimit.js
```javascript
// Simple in-memory rate limiting
const rateLimits = new Map();

const FREE_TIER = 100;
const STARTER_TIER = 10000;

module.exports = (req, res, next) => {
  const userId = req.userId;
  const now = Date.now();

  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, {
      monthStart: now,
      count: 0,
      tier: 'free' // In production: fetch from database
    });
  }

  const limit = rateLimits.get(userId);
  const isNewMonth = now - limit.monthStart > 30 * 24 * 60 * 60 * 1000;

  if (isNewMonth) {
    limit.monthStart = now;
    limit.count = 0;
  }

  const tierLimit = limit.tier === 'free' ? FREE_TIER : STARTER_TIER;

  if (limit.count >= tierLimit) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 30 * 24 * 60 * 60
    });
  }

  limit.count++;
  req.usage = {
    used: limit.count,
    limit: tierLimit
  };

  next();
};
```

### src/services/stripe.js
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createCharge(amount, currency, email, description) {
    // Your simplified business logic here
    // Handles idempotency, error normalization, etc.

    const charge = await stripe.charges.create({
      amount,
      currency,
      source: 'tok_visa', // In production: from customer
      receipt_email: email,
      description
    });

    return {
      id: charge.id,
      status: charge.status,
      amount: charge.amount,
      currency: charge.currency
    };
  }
}

module.exports = new StripeService();
```

### src/routes/charges.js
```javascript
const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripe');

// POST /charges
router.post('/', async (req, res, next) => {
  try {
    const { amount, currency, email, description } = req.body;

    // Validation
    if (!amount || !email) {
      return res.status(400).json({
        error: 'Missing required fields: amount, email'
      });
    }

    const charge = await stripeService.createCharge(
      amount,
      currency || 'usd',
      email,
      description
    );

    res.json({
      success: true,
      data: charge,
      usage: req.usage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## TEMPLATE 2: Multi-Provider Aggregator (Messaging)

Use this for: **UnifiedMessaging**, **AnalyticsUnified**, **CRMUnified**, etc.

### src/services/providers/index.js
```javascript
// Unified interface for multiple providers

class MessageProvider {
  constructor(name) {
    this.name = name;
  }

  async send(message) {
    throw new Error('send() must be implemented');
  }
}

class SlackProvider extends MessageProvider {
  constructor(apiKey) {
    super('slack');
    this.apiKey = apiKey;
    // this.client = new Slack.WebClient(apiKey);
  }

  async send(message) {
    // Convert unified message format to Slack format
    const slackMessage = {
      channel: message.recipient,
      text: message.text,
      blocks: message.blocks
    };

    // Send to Slack
    // return await this.client.chat.postMessage(slackMessage);

    return {
      provider: 'slack',
      status: 'sent',
      messageId: 'slack_123'
    };
  }
}

class EmailProvider extends MessageProvider {
  constructor(apiKey) {
    super('email');
    this.apiKey = apiKey;
  }

  async send(message) {
    const emailMessage = {
      to: message.recipient,
      subject: message.subject || 'Message',
      html: message.text
    };

    // Send via email service (SendGrid, Mailgun, etc.)

    return {
      provider: 'email',
      status: 'queued',
      messageId: 'email_456'
    };
  }
}

class SMSProvider extends MessageProvider {
  constructor(apiKey) {
    super('sms');
    this.apiKey = apiKey;
  }

  async send(message) {
    const smsMessage = {
      to: message.recipient,
      body: message.text.substring(0, 160) // SMS char limit
    };

    // Send via SMS service (Twilio, etc.)

    return {
      provider: 'sms',
      status: 'sent',
      messageId: 'sms_789',
      cost: 0.01
    };
  }
}

module.exports = {
  SlackProvider,
  EmailProvider,
  SMSProvider
};
```

### src/services/messagingService.js
```javascript
const { SlackProvider, EmailProvider, SMSProvider } = require('./providers');

class MessagingService {
  constructor() {
    this.providers = {};
  }

  registerProvider(name, provider) {
    this.providers[name] = provider;
  }

  async send(request) {
    // request: { channels: ['slack', 'email'], recipient, message, subject? }

    const results = [];
    const costs = [];

    for (const channel of request.channels) {
      if (!this.providers[channel]) {
        results.push({
          channel,
          status: 'failed',
          error: `No provider for ${channel}`
        });
        continue;
      }

      try {
        const result = await this.providers[channel].send({
          recipient: request.recipient,
          text: request.message,
          subject: request.subject,
          blocks: request.blocks
        });

        results.push(result);
        if (result.cost) costs.push(result.cost);
      } catch (error) {
        results.push({
          channel,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: results.every(r => r.status !== 'failed'),
      results,
      totalCost: costs.reduce((a, b) => a + b, 0)
    };
  }

  async sendBatch(requests) {
    // Send to multiple recipients
    const results = await Promise.all(
      requests.map(req => this.send(req))
    );

    const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);

    return {
      count: requests.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalCost
    };
  }
}

module.exports = new MessagingService();
```

### Usage in routes
```javascript
const express = require('express');
const router = express.Router();
const messagingService = require('../services/messagingService');
const { SlackProvider, EmailProvider, SMSProvider } = require('../services/providers');

// Initialize providers
messagingService.registerProvider('slack', new SlackProvider(process.env.SLACK_TOKEN));
messagingService.registerProvider('email', new EmailProvider(process.env.SENDGRID_KEY));
messagingService.registerProvider('sms', new SMSProvider(process.env.TWILIO_TOKEN));

// POST /messages/send
router.post('/send', async (req, res, next) => {
  try {
    const { channels, recipient, message, subject } = req.body;

    const result = await messagingService.send({
      channels,
      recipient,
      message,
      subject
    });

    res.json({
      success: result.success,
      data: result.results,
      cost: result.totalCost
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## TEMPLATE 3: Tier & Usage Tracking (Database)

Use this with any wrapper to implement billing.

### Using Supabase (PostgreSQL)

```sql
-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP
);

CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE, -- e.g., '2025-11-01' for November
  calls INTEGER DEFAULT 0,
  cost DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT,
  price DECIMAL(10, 2),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### src/db.js (Supabase client)
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class Database {
  async getUserByApiKey(apiKey) {
    const { data: apiKeyRow } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();

    if (!apiKeyRow) return null;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', apiKeyRow.user_id)
      .single();

    return user;
  }

  async trackUsage(userId, calls = 1) {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data: existing } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (existing) {
      await supabase
        .from('usage')
        .update({
          calls: existing.calls + calls,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('usage')
        .insert({
          user_id: userId,
          month,
          calls
        });
    }
  }

  async getUserTier(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('tier')
      .eq('id', userId)
      .single();

    return user?.tier || 'free';
  }

  async getMonthlyUsage(userId) {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const { data } = await supabase
      .from('usage')
      .select('calls')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    return data?.calls || 0;
  }
}

module.exports = new Database();
```

### Usage in middleware
```javascript
const db = require('../db');

const TIER_LIMITS = {
  free: 100,
  starter: 10000,
  pro: 1000000,
  enterprise: Infinity
};

module.exports = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  const user = await db.getUserByApiKey(apiKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const tier = user.tier;
  const monthlyUsage = await db.getMonthlyUsage(user.id);
  const limit = TIER_LIMITS[tier];

  if (monthlyUsage >= limit) {
    return res.status(429).json({
      error: 'Monthly limit exceeded',
      usage: monthlyUsage,
      limit
    });
  }

  // Track this request
  await db.trackUsage(user.id, 1);

  req.user = user;
  req.usage = {
    used: monthlyUsage + 1,
    limit
  };

  next();
};
```

---

## TEMPLATE 4: Stripe Payment Integration

Use this for billing/subscriptions.

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

class BillingService {
  async createCustomer(email, name) {
    const customer = await stripe.customers.create({
      email,
      name
    });

    return customer;
  }

  async createSubscription(userId, priceId) {
    const user = await db.getUser(userId);

    // Create Stripe customer if not exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await this.createCustomer(user.email, user.name);
      customerId = customer.id;
      await db.updateUser(userId, { stripe_customer_id: customerId });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }]
    });

    // Store in database
    await db.createSubscription({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      tier: this.getTierFromPrice(priceId),
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });

    return subscription;
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  async handleSubscriptionUpdated(subscription) {
    // Update database with new tier
    const tier = this.getTierFromPrice(subscription.items.data[0].price.id);
    await db.updateSubscription(subscription.id, { tier });
  }

  getTierFromPrice(priceId) {
    const priceMap = {
      [process.env.STRIPE_PRICE_STARTER]: 'starter',
      [process.env.STRIPE_PRICE_PRO]: 'pro',
      [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise'
    };
    return priceMap[priceId] || 'free';
  }
}

module.exports = new BillingService();
```

---

## QUICK DEPLOYMENT CHECKLIST

```bash
# 1. Create project folder
mkdir projects/simple-stripe
cd projects/simple-stripe

# 2. Initialize
npm init -y
npm install express cors dotenv stripe

# 3. Ask Claude Code to build it
# "Build a Stripe wrapper API using the Express template above"

# 4. Add environment variables
cat > .env << 'EOF'
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://...
SUPABASE_KEY=...
EOF

# 5. Test locally
npm run dev

# 6. Deploy (automatic via Vercel on PR merge)
git add .
git commit -m "Add simple-stripe wrapper"
git push origin your-branch
# Create PR, merge → Vercel deploys automatically
```

---

## WHAT CLAUDE CODE SHOULD BUILD FOR YOU

Tell Claude Code:

```
"Using the SimpleStripe templates, build:
1. Express server with /charges endpoint
2. API key authentication
3. Rate limiting based on tier
4. Stripe integration for processing charges
5. Simple error handling
6. Supabase database integration for users/usage
7. Full tests using Jest
8. Swagger/OpenAPI documentation

Use the provided templates as starting points."
```

**Time**: 2-3 hours
**Result**: Working API wrapper, ready to deploy

---

## NEXT: Monetization Dashboard

Once working, Claude Code can also build:
- Admin dashboard (view users, usage, revenue)
- API documentation site
- Pricing page
- User sign-up flow
- Billing portal integration

All within the same project.

---

**Key**: Don't build everything. Build MVP first (2-3 endpoints), get users, iterate.

Claude Code is your leverage. Use it to go 5x faster than manual development.
