# 🌊 vibes

> A playground repository for building things that feel right, from anywhere.

Built for rapid prototyping with [Claude Code's new web interface](https://www.anthropic.com/news/claude-code-on-the-web) - because sometimes the best ideas come when you're away from your desk.

## What is this?

This is a single repository that houses multiple independent projects. Think of it as a creative sandbox where you can build, experiment, and deploy without the overhead of managing dozens of separate repos.

Perfect for:
- Late-night ideas that need to be real *now*
- Mobile coding sessions via Claude Code iOS/web
- Quick prototypes that might become something more
- Learning new tools and frameworks
- Building things just to see if they vibe

## Structure

```
vibes/
├── projects/
│   ├── thought-particles/     ← Example: Interactive thought visualization
│   ├── your-next-idea/
│   └── .templates/            ← Starter templates for common stacks
├── .github/
│   └── workflows/             ← Shared GitHub Actions
└── README.md
```

## Deployment Options

### Vercel (Recommended)

Each project folder can be deployed as a separate Vercel project:

1. Create a new project in Vercel
2. Connect to this `vibes` repository
3. Set **Root Directory** to `projects/your-project-name`
4. Deploy!

You can have up to 3 projects from this repo on Vercel's free tier, each with its own domain.

### GitHub Pages

GitHub Pages supports one site per repository. To use it:
- Deploy from the project folder you want to showcase
- Access at `yourusername.github.io/vibes`
- Or use subdirectories for different projects

### Other Options

- **Netlify**: Same as Vercel - set base directory per project
- **Cloudflare Pages**: Supports monorepo deployments
- **Railway**: Deploy individual project folders

## Quick Start

### Using Claude Code Web

1. Open [Claude Code for web](https://code.anthropic.com)
2. Point it to this repository
3. Ask Claude to create a new project in `projects/your-idea-name`
4. Let the vibes flow

### Local Development

```bash
# Clone the repo
git clone https://github.com/Kelvination/vibes.git
cd vibes

# Work on a specific project
cd projects/your-project-name
npm install  # or whatever your project needs
npm run dev
```

## Project Ideas

Not sure what to build? Here are some vibes:

- 🎨 Generative art canvas
- 🎮 Browser-based mini-game
- 📊 Data visualization playground
- 🎵 Music theory tool
- 🌤️ Weather mood board
- 🧮 Math concept explorer
- 💭 Thought organization tool
- 🎯 Focus/productivity timer
- 🌈 Color palette generator
- ✨ Anything that sparks joy

## Philosophy

This repo exists because:

1. **Momentum matters** - Don't let repo setup kill your creative flow
2. **Build in public** - One repo, many experiments, all visible
3. **Mobile-first ideation** - Your best ideas don't wait for you to get home
4. **Vibes over perfection** - Ship it, learn from it, iterate on it

## Contributing

This is a personal playground, but if you're reading this and want to fork it for your own creative coding journey - please do! The structure is intentionally simple and adaptable.

---

Built with Claude Code 🤖 | Last updated: October 2025
