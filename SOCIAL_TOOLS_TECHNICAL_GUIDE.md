# Social Media Tools - Technical Implementation Guide
## Quick-Start Prototypes & Claude Code Setup

---

## OVERVIEW

This guide provides **working prototypes and implementation details** for the social media tools outlined in the research document. Each tool can be built in 1-3 weeks using Claude Code.

---

## TOOL 1: CaptionGenius - AI Caption Generator

### What We're Building
A web app that takes a topic and generates platform-specific captions in seconds.

**Core Flow**:
1. User enters topic (e.g., "My new product launch")
2. Selects platform (Instagram, TikTok, LinkedIn, Twitter)
3. Claude API generates 3-5 captions in that platform's style
4. User can copy, regenerate, or save favorites

### Tech Stack
- **Frontend**: React + TypeScript (30 min setup)
- **Backend**: Node.js + Express OR Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL, free tier)
- **Payments**: Stripe or Lemonsqueezy
- **AI**: Claude API (Sonnet 4 - fast and affordable)

### File Structure
```
caption-genius/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopicInput.jsx
│   │   │   ├── PlatformSelector.jsx
│   │   │   ├── CaptionOutput.jsx
│   │   │   └── Favorites.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Dashboard.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── api/
│   │   ├── generate-caption.js
│   │   ├── save-favorite.js
│   │   └── get-usage.js
│   ├── lib/
│   │   └── claude.js (API wrapper)
│   ├── db/
│   │   └── supabase.js
│   └── package.json
└── README.md
```

### Core API Function (Vercel Serverless)

```javascript
// /api/generate-caption.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const PLATFORM_PROMPTS = {
  instagram:
    "Write an engaging Instagram caption with storytelling, emojis, and a call-to-action. Max 2,200 characters.",
  tiktok:
    "Write a snappy TikTok caption with hooks, trending language, and urgency. Max 150 characters.",
  linkedin:
    "Write a professional LinkedIn caption focused on value and authenticity. Max 3,000 characters.",
  twitter:
    "Write a witty, concise tweet with conversation starter or controversy. Max 280 characters.",
  facebook:
    "Write a friendly, community-focused Facebook caption with engagement hooks. Max 2,000 characters.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, platform, userID } = req.body;

  // Check user's API usage (free tier: 3/month)
  // const usage = await checkUsage(userID);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\n\n${PLATFORM_PROMPTS[platform]}\n\nGenerate 3 different captions.`,
        },
      ],
    });

    const captions = response.content[0].text
      .split("\n\n")
      .filter((c) => c.trim());

    // Log usage
    // await logUsage(userID, 1);

    return res.status(200).json({
      success: true,
      captions,
      platform,
      topic,
    });
  } catch (error) {
    console.error("Claude API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

### React Component (Frontend)

```jsx
// src/components/CaptionGenerator.jsx
import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";

const PLATFORMS = ["instagram", "tiktok", "linkedin", "twitter", "facebook"];

export default function CaptionGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          userID: localStorage.getItem("userID"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate captions");
      }

      setCaptions(data.captions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">CaptionGenius</h1>
        <p className="text-slate-400 mb-8">
          AI captions tailored to each platform
        </p>

        {/* Input Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <label className="block text-white font-semibold mb-3">
            What's your content about?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Launching my new course about productivity'"
            className="w-full bg-slate-700 text-white rounded p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />

          <label className="block text-white font-semibold mb-3">
            Where are you posting?
          </label>
          <div className="flex gap-2 mb-6 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  platform === p
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={20} />
            {loading ? "Generating..." : "Generate Captions"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-6">{error}</div>
        )}

        {/* Results */}
        {captions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Generated Captions
            </h2>
            {captions.map((caption, idx) => (
              <div
                key={idx}
                className="bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition"
              >
                <p className="text-white mb-3">{caption}</p>
                <button
                  onClick={() => copyToClipboard(caption)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Free Tier Message */}
        <div className="mt-8 p-4 bg-slate-700 rounded text-slate-300 text-sm text-center">
          <p>Free tier: 3 generations/month | Upgrade to Pro for unlimited</p>
        </div>
      </div>
    </div>
  );
}
```

### Deployment Checklist
- [ ] Create Vercel account, connect GitHub repo
- [ ] Add Claude API key to environment variables
- [ ] Set up Supabase project (free tier)
- [ ] Configure Stripe for payments
- [ ] Test locally: `npm run dev`
- [ ] Deploy: `git push` (Vercel auto-deploys)
- [ ] Product Hunt launch page

---

## TOOL 2: HashtagLab - Smart Hashtag Generator

### Core Concept
- Input: Content topic + platform
- Output: Relevant hashtags + volume estimates + tracking
- Use Claude to understand nuance + context

### API Function

```javascript
// /api/generate-hashtags.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const HASHTAG_PROMPT = `Generate hashtags for this content. Return as JSON array.
Topic: {topic}
Platform: {platform}
Niche: {niche}

Format your response ONLY as valid JSON:
{
  "primary": ["high", "volume", "hashtags"],
  "niche": ["specific", "to", "niche"],
  "trending": ["currently", "viral"],
  "tips": "Brief advice on using these hashtags"
}

Guidelines:
- Instagram: 15-30 hashtags, mix of high and niche
- TikTok: 3-10 hashtags, focus on trending
- LinkedIn: 3-5 professional hashtags
- Twitter: 2-3 hashtags, conversation starters`;

export default async function handler(req, res) {
  const { topic, platform, niche } = req.body;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: HASHTAG_PROMPT.replace("{topic}", topic)
            .replace("{platform}", platform)
            .replace("{niche}", niche),
        },
      ],
    });

    // Parse Claude's JSON response
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const hashtags = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      hashtags,
      platform,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

### React Component (Simplified)

```jsx
// src/components/HashtagGenerator.jsx
import { useState } from "react";
import { Tag, TrendingUp } from "lucide-react";

export default function HashtagGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [hashtags, setHashtags] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, niche }),
      });
      const data = await res.json();
      setHashtags(data.hashtags);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    const allTags = [
      ...hashtags.primary,
      ...hashtags.niche,
      ...hashtags.trending,
    ]
      .map((tag) => `#${tag}`)
      .join(" ");
    navigator.clipboard.writeText(allTags);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">HashtagLab</h1>

      <div className="space-y-4 mb-6">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Your content topic"
          className="w-full border p-3 rounded"
        />

        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Your niche (e.g., 'fitness', 'tech', 'fashion')"
          className="w-full border p-3 rounded"
        />

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full border p-3 rounded"
        >
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">Twitter</option>
        </select>

        <button
          onClick={generate}
          disabled={loading || !topic}
          className="w-full bg-blue-600 text-white py-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Hashtags"}
        </button>
      </div>

      {hashtags && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <Tag size={18} /> Primary Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.primary.map((tag) => (
                <span key={tag} className="bg-blue-200 px-3 py-1 rounded text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-bold mb-2">Niche Tags</h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.niche.map((tag) => (
                <span
                  key={tag}
                  className="bg-purple-200 px-3 py-1 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <TrendingUp size={18} /> Trending Now
            </h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.trending.map((tag) => (
                <span
                  key={tag}
                  className="bg-green-200 px-3 py-1 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={copyAll}
            className="w-full bg-gray-600 text-white py-2 rounded"
          >
            Copy All Hashtags
          </button>

          <p className="text-sm text-gray-600">{hashtags.tips}</p>
        </div>
      )}
    </div>
  );
}
```

---

## TOOL 3: ContentRepurpose - Multi-Format Content Adapter

### Core Concept
- Input: Long-form content (blog post, video transcript)
- Output: LinkedIn article, Twitter thread, TikTok script, Instagram carousel

### Key Prompt for Claude

```javascript
const REPURPOSE_PROMPT = `You are a content repurposing expert. Take this content and adapt it into multiple formats.

ORIGINAL CONTENT:
{content}

Create:
1. **LinkedIn Article** (500 words, professional, 3-4 sections)
2. **Twitter Thread** (10 tweets, conversation-starter, educational)
3. **TikTok Script** (60 seconds, hook + value + CTA, trendy language)
4. **Instagram Carousel** (5-7 slides, visual-friendly captions)
5. **Newsletter Summary** (200 words, digestible, scannable)

Format as JSON:
{
  "linkedin": { "title": "", "content": "" },
  "twitter_thread": ["tweet 1", "tweet 2", ...],
  "tiktok_script": "",
  "instagram_carousel": ["slide 1 caption", "slide 2 caption", ...],
  "newsletter": ""
}`;
```

### API Implementation

```javascript
// /api/repurpose-content.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export default async function handler(req, res) {
  const { content } = req.body;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `${REPURPOSE_PROMPT}\n\nContent to repurpose:\n${content}`,
        },
      ],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const repurposed = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      repurposed,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

---

## DEPLOYMENT STRATEGY

### Recommended Deployment Path

#### Week 1-2: Build & Test Locally
```bash
# Create React app
npx create-vite@latest caption-genius --template react

# Install dependencies
cd caption-genius
npm install anthropic stripe @supabase/supabase-js

# Create Vercel functions
mkdir -p api

# Add environment variables to .env.local
VITE_ANTHROPIC_API_KEY=your_key
VITE_STRIPE_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_KEY=your_key

# Test locally
npm run dev
```

#### Week 3: Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys, configure env vars in Vercel dashboard
# Set: Anthropic API key, Stripe keys, Supabase credentials

# Test production
curl https://your-app.vercel.app
```

#### Week 4: Payments Setup
```javascript
// /api/create-checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { plan } = req.body;

  const prices = {
    pro: "price_xxx",
    creator: "price_yyy",
  };

  const session = await stripe.checkout.sessions.create({
    pricing_table_id: "prctbl_xxx",
    customer_email: req.body.email,
    mode: "subscription",
    success_url: `https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://your-domain.com`,
  });

  res.json({ url: session.url });
}
```

---

## COST BREAKDOWN (Year 1)

```
Claude API Calls:
- 10,000 free signups
- 5% convert to paid (500 users)
- 50 captions/month per paid user = 25,000 calls
- Cost: $0.01 per 1k tokens = ~$50/month = $600/year

Hosting (Vercel):
- Free tier covers up to 100 serverless functions
- Upgrade at $20/month if needed = $240/year

Database (Supabase):
- Free tier: 500MB storage, 2GB bandwidth
- Sufficient for <10K users = $0/year initially

Payments (Stripe):
- 2.9% + $0.30 per transaction
- 500 paying users × $84/year = $42,000 revenue
- Stripe fee: ~$1,300
- Cost: $1,300/year

Domain:
- $12/year

Total Year 1: ~$2,150 + your time

Break-even: ~25 paid users at $7/month
Profit at 500 paid users: ~$35,000/year
```

---

## TIMELINE TO LAUNCH

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Research + validation | Landing page with 100 signups |
| 2 | Build CaptionGenius MVP | Working tool + 50 beta testers |
| 3 | Payments + Polish | Stripe integration + UI improvements |
| 4 | Soft launch | Reddit/Discord announcement |
| 5 | Product Hunt | 1,000 signups goal |
| 6-8 | Iteration + marketing | First paying customers |
| 9-12 | Add second tool | HashtagLab launch |

---

## SUCCESS CHECKLIST

- [ ] MVP deployed and working
- [ ] Free tier has >100 users
- [ ] At least 5 beta testers giving feedback
- [ ] Payments working (test transactions)
- [ ] First paying customer acquired
- [ ] NPS score >30 from users
- [ ] Product Hunt launch with 500+ upvotes
- [ ] First $1,000 revenue month
- [ ] Second tool ready to launch

---

Created: November 2025
