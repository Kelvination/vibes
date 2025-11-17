# Discord/Slack Bot Implementation Templates
## Ready-to-Deploy Code & Configuration

---

## Quick Start: 5 Bot Templates (Copy & Paste Ready)

All templates use Node.js + Discord.js (Slack analogues provided).

### Template 1: TokenWatch (Crypto Price Alerts Bot)

**Goal:** Monitor crypto prices, alert on significant moves

```javascript
// bot.js - Core bot logic
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`✓ TokenWatch running as ${client.user.tag}`);
  updatePrices(); // Start price monitoring
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'watch') {
    const token = args[0]; // e.g., "BTC", "ETH"
    const threshold = args[1] || 5; // % change threshold

    // Store in database (Firebase, Supabase, etc)
    await storeAlert(message.guildId, token, threshold);

    message.reply(`✓ Watching ${token} for ±${threshold}% changes`);
  }

  if (command === 'upgrade') {
    // Link to payment page
    message.reply({
      embeds: [{
        color: '#0099ff',
        title: 'Upgrade to TokenWatch Pro',
        description: 'Unlimited alerts, smart contract events, gas tracking',
        fields: [
          { name: 'Price', value: '$20/month' },
          { name: 'Feature Limit', value: 'Unlimited alerts' }
        ],
        url: 'https://your-domain.com/checkout'
      }]
    });
  }
});

async function updatePrices() {
  setInterval(async () => {
    // Fetch from CoinGecko API (free)
    const prices = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
    const data = await prices.json();

    // Check against stored alerts
    const alerts = await getActiveAlerts(); // From database

    for (const alert of alerts) {
      const change = data[alert.token].usd_24h_change;

      if (Math.abs(change) > alert.threshold) {
        // Send notification to user
        const user = await client.users.fetch(alert.userId);
        user.send(`🚨 ${alert.token.toUpperCase()} moved ${change.toFixed(2)}%`);
      }
    }
  }, 60000); // Check every 60 seconds
}

client.login(process.env.DISCORD_TOKEN);
```

**Setup Steps:**
1. Create Discord app at https://discord.com/developers
2. Get bot token → store in `.env`
3. Create Firebase project (free tier)
4. Replace placeholder database calls with your DB

**Database Schema (Firestore):**
```json
{
  "alerts": {
    "serverID_tokenName": {
      "token": "BTC",
      "threshold": 5,
      "userId": "USER_ID",
      "guildId": "GUILD_ID",
      "isPremium": false
    }
  }
}
```

**Monetization Code (Stripe):**
```javascript
// monetize.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(userId, plan = 'pro') {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'TokenWatch Pro',
          description: 'Unlimited alerts + advanced features'
        },
        unit_amount: 2000, // $20.00
        recurring: {
          interval: 'month'
        }
      },
      quantity: 1
    }],
    mode: 'subscription',
    success_url: 'https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://your-domain.com/cancel',
    metadata: { userId, plan }
  });

  return session.url;
}

module.exports = { createCheckoutSession };
```

**Deployment to Replit:**
1. Click "Import from GitHub" or paste code
2. Add `.env` with Discord token + Stripe keys
3. Click "Run" → bot starts instantly
4. Replit auto-restarts on crashes (uptime = 99%)

---

### Template 2: TourneyBot (Tournament Management)

**Goal:** Create brackets, track scores, payout calculator

```javascript
// tournament.js - Core tournament logic
const Discord = require('discord.js');
const client = new Discord.Client();

const tournaments = new Map(); // In-memory storage

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const [command, ...args] = message.content.slice(1).split(/ +/);

  if (command === 'tourney') {
    const subcommand = args[0];

    if (subcommand === 'create') {
      const name = args[1];
      const format = args[2] || 'single'; // single or double elimination

      const tournament = {
        id: message.id,
        name: name,
        format: format,
        participants: [],
        bracket: [],
        createdBy: message.author.id,
        guildId: message.guildId,
        isPaid: false
      };

      tournaments.set(tournament.id, tournament);

      const embed = new Discord.EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Tournament: ${name}`)
        .setDescription(`Format: ${format} elimination\nReact with 🎮 to join`)
        .setFooter({ text: `ID: ${tournament.id}` });

      const msg = await message.reply({ embeds: [embed] });
      await msg.react('🎮');

      // Collect reactions
      const filter = (reaction, user) => reaction.emoji.name === '🎮' && !user.bot;
      const collector = msg.createReactionCollector({ filter, time: 300000 }); // 5 min

      collector.on('collect', (reaction, user) => {
        tournament.participants.push(user.id);
      });

      collector.on('end', () => {
        generateBracket(tournament);
        message.reply(`✓ Tournament started with ${tournament.participants.length} players`);
      });
    }

    if (subcommand === 'score') {
      const tourneyId = args[1];
      const winner = args[2];
      const loser = args[3];

      const tournament = tournaments.get(tourneyId);
      // Update bracket with winner
      tournament.bracket.push({ winner, loser, timestamp: Date.now() });

      message.reply(`✓ ${winner} defeated ${loser}`);
    }

    if (subcommand === 'payout') {
      const tourneyId = args[1];
      const prizePool = parseFloat(args[2]);

      const tournament = tournaments.get(tourneyId);
      const payouts = calculatePayouts(tournament, prizePool);

      const embed = new Discord.EmbedBuilder()
        .setTitle('Prize Distribution')
        .addFields(
          { name: '1st Place', value: `$${payouts[0]}` },
          { name: '2nd Place', value: `$${payouts[1]}` },
          { name: '3rd Place', value: `$${payouts[2]}` }
        );

      message.reply({ embeds: [embed] });
    }
  }
});

function generateBracket(tournament) {
  // Simple bracket generation (for 4, 8, 16 participants)
  const bracket = [];
  const shuffled = tournament.participants.sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i += 2) {
    bracket.push({
      player1: shuffled[i],
      player2: shuffled[i + 1],
      winner: null,
      round: 1
    });
  }

  tournament.bracket = bracket;
}

function calculatePayouts(tournament, prizePool) {
  // 50% to 1st, 30% to 2nd, 20% to 3rd
  return [
    prizePool * 0.5,
    prizePool * 0.3,
    prizePool * 0.2
  ];
}

client.login(process.env.DISCORD_TOKEN);
```

**Monetization Model:**
- Free: Create 1 tournament/month
- $0.99 per tournament (user pays when creating)
- Stripe charge directly

```javascript
// payment.js - Per-transaction payment
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function chargeTournament(userId, tournamentName) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 99, // $0.99
    currency: 'usd',
    description: `TourneyBot - ${tournamentName}`,
    metadata: { userId }
  });

  // Return payment intent client secret to user
  return paymentIntent.client_secret;
}
```

---

### Template 3: Weekly Digest Bot

**Goal:** Summarize top posts from the week (easiest implementation)

```javascript
// digest.js - Weekly summary bot
const Discord = require('discord.js');
const client = new Discord.Client({ intents: ['Guilds', 'GuildMessages'] });

client.on('ready', () => {
  console.log('✓ Weekly Digest Bot ready');
  scheduleWeeklyDigest();
});

function scheduleWeeklyDigest() {
  // Run every Monday at 9 AM
  const schedule = require('node-schedule');

  schedule.scheduleJob('0 9 * * 1', async () => {
    // Get all servers the bot is in
    for (const guild of client.guilds.cache.values()) {
      await generateAndPostDigest(guild);
    }
  });
}

async function generateAndPostDigest(guild) {
  // Find all text channels
  const channels = guild.channels.cache.filter(ch => ch.isTextBased());

  const topPosts = [];

  // Collect messages from past 7 days
  for (const [, channel] of channels) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });

      for (const [, msg] of messages) {
        // Calculate engagement score
        const score = msg.reactions.cache.reduce((sum, r) => sum + r.count, 0)
                    + (msg.reply ? 5 : 0); // Bonus for replied messages

        if (score > 0) {
          topPosts.push({
            channel: channel.name,
            author: msg.author.username,
            content: msg.content.substring(0, 100),
            score: score,
            url: msg.url
          });
        }
      }
    } catch (error) {
      // Skip channels bot can't read
    }
  }

  // Sort by engagement
  topPosts.sort((a, b) => b.score - a.score);

  // Create embed
  const embed = new Discord.EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📊 This Week\'s Top Posts')
    .setDescription(topPosts.slice(0, 10).map((post, i) =>
      `${i+1}. [${post.channel}] ${post.author}: ${post.content}\n(${post.score} engagements)`
    ).join('\n\n'));

  // Find or create #weekly-digest channel
  let digestChannel = guild.channels.cache.find(ch => ch.name === 'weekly-digest');

  if (!digestChannel) {
    digestChannel = await guild.channels.create({
      name: 'weekly-digest',
      type: Discord.ChannelType.GuildText
    });
  }

  await digestChannel.send({ embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN);
```

**Monetization:**
```
Free: 5 posts in digest
Pro: 20 posts + custom topics + email export ($2.99/month)
```

---

### Template 4: AI FAQ/DocBot (Using Claude API)

**Goal:** Answer common questions from uploaded documentation

```javascript
// docbot.js - AI-powered documentation bot
const Discord = require('discord.js');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Discord.Client();
const anthropic = new Anthropic();

// Store server documentation
const serverDocs = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const question = message.content.replace(`<@${client.user.id}>`, '').trim();

  // Get server documentation
  const docs = serverDocs.get(message.guildId) || '';

  if (!docs) {
    return message.reply('No documentation uploaded yet. Use `/doc-upload` command.');
  }

  // Use Claude to answer question based on docs
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-1',
    max_tokens: 1024,
    system: `You are a helpful support bot for a Discord community.
    Answer questions ONLY based on the following documentation.
    If the answer is not in the docs, say "I don't have information about that."

    Documentation:
    ${docs}`,
    messages: [{
      role: 'user',
      content: question
    }]
  });

  const answer = response.content[0].text;

  // Send response
  if (answer.length < 2000) {
    message.reply(answer);
  } else {
    // Split into chunks if too long
    const chunks = answer.match(/[\s\S]{1,1900}/g) || [];
    for (const chunk of chunks) {
      await message.reply(chunk);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'doc-upload') {
    const content = interaction.options.getString('content');
    serverDocs.set(interaction.guildId, content);

    interaction.reply('✓ Documentation uploaded! Now I can answer questions about it.');
  }
});

// Register slash commands
client.on('ready', () => {
  const command = {
    name: 'doc-upload',
    description: 'Upload documentation for AI to reference',
    options: [{
      name: 'content',
      type: 3,
      description: 'Documentation text',
      required: true
    }]
  };

  client.application.commands.create(command);
});

client.login(process.env.DISCORD_TOKEN);
```

**Monetization:**
```
Free: 100 Q&A per month
Pro: Unlimited Q&A + email integrations ($10/month)
Enterprise: API access + custom training ($99/month)
```

---

### Template 5: GitHub Release Tracker Bot

**Goal:** Monitor GitHub repos, post new releases

```javascript
// releases.js - GitHub release tracker
const Discord = require('discord.js');
const { Octokit } = require('@octokit/rest');

const client = new Discord.Client();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const trackedRepos = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const [command, ...args] = message.content.slice(1).split(/ +/);

  if (command === 'track') {
    const owner = args[0]; // e.g., "nodejs"
    const repo = args[1];  // e.g., "node"

    const key = `${message.guildId}-${owner}-${repo}`;
    trackedRepos.set(key, {
      owner,
      repo,
      guildId: message.guildId,
      channelId: message.channelId,
      lastCheck: Date.now()
    });

    message.reply(`✓ Tracking ${owner}/${repo} releases`);
  }

  if (command === 'untrack') {
    const key = `${message.guildId}-${args[0]}-${args[1]}`;
    trackedRepos.delete(key);
    message.reply(`✓ Stopped tracking`);
  }
});

// Check for new releases every hour
setInterval(async () => {
  for (const [, tracked] of trackedRepos) {
    try {
      const releases = await octokit.repos.listReleases({
        owner: tracked.owner,
        repo: tracked.repo,
        per_page: 5
      });

      for (const release of releases.data) {
        // Check if we've already posted this release
        if (release.published_at > tracked.lastCheck) {
          const channel = await client.channels.fetch(tracked.channelId);

          const embed = new Discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`New Release: ${release.name}`)
            .setDescription(release.body)
            .setURL(release.html_url)
            .addFields({
              name: 'Repository',
              value: `${tracked.owner}/${tracked.repo}`
            });

          channel.send({ embeds: [embed] });
        }
      }

      tracked.lastCheck = Date.now();
    } catch (error) {
      console.error(`Error checking ${tracked.owner}/${tracked.repo}:`, error);
    }
  }
}, 3600000); // 1 hour

client.login(process.env.DISCORD_TOKEN);
```

---

## Slack Bot Equivalent: Template for Slack

For Slack, use Slack Bolt instead of Discord.js:

```javascript
// slack-bot.js - Slack equivalent template
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.command('/watch', async ({ command, ack, say }) => {
  await ack();

  const token = command.text.split(' ')[0];
  const threshold = command.text.split(' ')[1] || 5;

  // Store in database
  await storeAlert(command.team_id, token, threshold);

  await say(`✓ Watching ${token} for ±${threshold}% changes`);
});

app.message('hello', async ({ message, say }) => {
  await say(`Hey <@${message.user}>!`);
});

(async () => {
  await app.start(process.env.SLACK_PORT || 3000);
  console.log('⚡️ Bolt app started');
})();
```

---

## Deployment Guide

### Option 1: Replit (Recommended for Quick Start)

```bash
1. Go to https://replit.com
2. Click "Create" → "Node.js"
3. Paste bot code into main.js
4. Create .env file with secrets:
   DISCORD_TOKEN=your_token
   STRIPE_SECRET_KEY=sk_live_...

5. Click "Run" → bot starts!
```

**Advantages:**
- Free forever for simple bots
- Auto-restart on crash
- Built-in environment variables
- Easy to share

**Disadvantages:**
- Goes to sleep after 1 hour inactive
- Limited to 2GB RAM
- Not for production scale

---

### Option 2: Railway.app (Recommended for Production)

```bash
1. Go to https://railway.app
2. Connect GitHub repo
3. Railway auto-detects Node.js
4. Add environment variables in dashboard
5. Deploy!
```

**Cost:** $5-10/month for persistent bot
**Advantages:** Reliable, good uptime, monitoring
**Disadvantages:** Paid service

---

### Option 3: Docker + Self-Hosted

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "bot.js"]
```

```bash
docker build -t mybot .
docker run -e DISCORD_TOKEN=$TOKEN mybot
```

---

## Payment Integration (Stripe)

### Setup Stripe Webhook to Track Subscriptions

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const event = JSON.parse(req.body);

  if (event.type === 'customer.subscription.updated') {
    const customerId = event.data.object.customer;
    const status = event.data.object.status;

    // Update user premium status in database
    updateUserStatus(customerId, status === 'active');
  }

  res.json({received: true});
});

app.listen(3000);
```

---

## Environment Variables Template (.env)

```
# Discord
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID=YOUR_CLIENT_ID

# Slack (if building for Slack)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Database (Supabase/Firebase)
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=...

# APIs
GITHUB_TOKEN=ghp_...
ANTHROPIC_API_KEY=sk-ant-...

# Hosting
PORT=3000
NODE_ENV=production
```

---

## Testing Checklist

```
□ Bot joins server successfully
□ /commands appear in Discord UI
□ All commands execute without errors
□ Embeds render properly
□ Database saves/retrieves data
□ Stripe checkout works
□ Webhook updates subscription status
□ Bot handles API rate limits gracefully
□ Bot reconnects after network issues
□ Error messages are helpful (not cryptic)
□ Loading state for long operations
□ Pagination for large result sets
```

---

## Marketing Assets Template

### Tweet Thread Starter
```
1/ Built [BotName] because [problem].
   Free to try, works with Discord out of the box.

2/ The problem: [describe pain point]
   The solution: [describe bot features]

3/ Try it: [Discord invite link]

4/ Pro features available: $X/month
   [list 3-5 unique features]

5/ If you like this, pls RT!
   Looking for feedback & feature requests.
```

### Email to Communities
```
Subject: [BotName] - Solves [specific problem]

Hi [Community Name] community!

I built [BotName] specifically for communities like yours.

It [core feature description]

Try it free: [link]

Feedback welcome!

[Your name]
```

---

## Resources

- **Discord.js Docs:** https://discord.js.org/#/docs
- **Slack Bolt:** https://slack.dev/bolt-js/
- **Stripe API:** https://stripe.com/docs/api
- **Railway Hosting:** https://railway.app/
- **Anthropic Claude API:** https://console.anthropic.com/

---

**Next Steps:**
1. Choose one template above
2. Modify for your specific use case
3. Deploy to Replit
4. Get first 10 servers
5. Add Stripe integration
6. Launch premium tier
