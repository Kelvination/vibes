# Instructions for Claude Code Agents

Hey Claude! You're working in the **vibes** repository - a monorepo designed for rapid prototyping and deployment.

## Your Environment

You're running as a Claude Code agent on **Anthropic's cloud infrastructure** in an isolated sandbox with:
- Full access to this GitHub repository
- Network access (configurable by user)
- Ability to create PRs automatically
- All standard dev tools (Node.js, npm, git, etc.)

## Repository Structure

```
vibes/
├── projects/
│   ├── thought-particles/        # Example: Interactive particle visualization
│   ├── cosmic-silent-forest/     # Empty project slots ready for ideas
│   ├── ethereal-amber-meadow/
│   └── [8 more project folders]
├── .github/
│   ├── workflows/                # Auto-deployment on PR merge
│   └── DEPLOYMENT.md             # Detailed deployment docs
└── CLAUDE.md                     # You are here
```

## How This Repo Works

### Multi-Project Setup
- Each folder in `projects/` is an independent project
- Projects are already linked to Vercel for deployment
- All projects share this single repository

### Auto-Deployment
When you merge a PR that changes files in `projects/your-project/`:
1. GitHub Actions detects the change
2. Automatically deploys to Vercel
3. Posts the live URL as a PR comment

**You don't need to manually deploy anything.**

## Working on a Project

### Starting a New Project

1. **Choose an empty project folder** (or create a new one):
   ```bash
   cd projects/cosmic-silent-forest
   # Or create new: mkdir projects/my-new-idea
   ```

2. **Build whatever the user asks for**:
   - Static HTML/CSS/JS sites work out of the box
   - React, Vue, Next.js, etc. all supported
   - Add a `package.json` if you need dependencies

3. **Create a PR when done**:
   - Make your changes
   - Push to a new branch
   - GitHub Actions handles deployment on merge

### Project Requirements

**For static sites** (HTML/CSS/JS):
- Put an `index.html` in the project root
- That's it! Vercel serves it automatically

**For framework projects**:
- Add `package.json` with dependencies
- Vercel auto-detects framework (Next.js, Vite, etc.)
- Build commands run automatically

### Testing Locally

If you need to test before deploying:
```bash
cd projects/your-project

# For static sites
python -m http.server 8000  # Or any static server

# For frameworks
npm install
npm run dev
```

## Important Notes

### What You DON'T Need to Do
- ❌ Run `vercel link` - Projects already linked
- ❌ Configure deployment - Already set up
- ❌ Add GitHub secrets - Already configured
- ❌ Manually deploy - Happens on PR merge

### What You SHOULD Do
- ✅ Build in `projects/` folders
- ✅ Create PRs with your changes
- ✅ Include clear commit messages
- ✅ Test locally when possible

### File Locations
- **Work in**: `projects/your-project-name/`
- **Don't touch**: `.github/workflows/` (unless asked)
- **Gitignored**: `.vercel/`, `node_modules/`, `.env`

## Deployment Workflow

```
1. User asks you to build something
2. You create/update files in a project folder
3. You push changes and create a PR
4. User merges PR
5. GitHub Actions deploys to Vercel
6. Live URL posted in PR comments
```

## Available Projects

These project folders are ready to use:
- `thought-particles` (example project - interactive visualization)
- `cosmic-silent-forest`
- `ethereal-amber-meadow`
- `radiant-velvet-peak`
- `hidden-crimson-tide`
- `luminous-gentle-horizon`
- `mystic-silver-canyon`
- `velvet-electric-dawn`
- `serene-frozen-echo`
- `bright-dancing-river`

Pick any empty one or create a new folder with a meaningful name.

## Common Patterns

### Static Site
```
projects/my-site/
├── index.html
├── style.css
└── script.js
```

### React + Vite
```
projects/my-app/
├── package.json
├── vite.config.js
├── index.html
└── src/
    └── main.jsx
```

### Next.js
```
projects/my-nextjs-app/
├── package.json
├── next.config.js
└── app/
    └── page.js
```

## Tips for Success

1. **Keep it simple**: Start with static HTML/CSS/JS when possible
2. **Read existing code**: Check `thought-particles/` for a working example
3. **Ask questions**: If deployment fails, user can check GitHub Actions logs
4. **Be creative**: This repo is for experimentation and fun projects
5. **Document**: Add a README.md to each project explaining what it does

## When Things Go Wrong

If deployment fails:
- Check GitHub Actions tab in the repo
- Verify the project has an `index.html` or proper framework setup
- Make sure `package.json` is valid if used
- Ask the user to check Vercel dashboard

## Philosophy

This repository exists for rapid ideation and deployment. Don't overthink it:
- Build fast, iterate faster
- Perfect is the enemy of shipped
- Have fun with it

## ethereal-amber-meadow: Blender Geometry Nodes Project

**CRITICAL RULE**: For every change to the geometry nodes editor (`projects/ethereal-amber-meadow/`), you MUST compare your implementation against Blender's actual source code. Do NOT assume how a node works or improvise its behavior. Reference the actual Blender source files:

- Node definitions: `source/blender/nodes/geometry/nodes/node_geo_*.cc`
- Function nodes: `source/blender/nodes/function/nodes/node_fn_*.cc`
- Node UI/layout: `source/blender/editors/space_node/node_draw.cc`
- Geometry types: `source/blender/blenkernel/intern/geometry_component_*.cc`
- Math utilities: `source/blender/blenlib/BLI_math_*.h`

Key Blender conventions to follow:
- **Node layout**: Outputs are drawn at the TOP of the node body, inputs BELOW them. Each socket gets its own row.
- **Socket visibility**: Nodes with mode dropdowns (Random Value, Math, etc.) show/hide sockets based on the selected mode. Hidden sockets keep their index but aren't drawn.
- **Socket types**: When a mode changes the output type (e.g., Random Value Float→Vector), the output socket type actually changes.
- **Field evaluation**: Fields are lazy per-element functions evaluated against domain elements.

## Response Format

At the end of every response, provide a link to create a new PR for the current branch. Use this format:

```
[Create PR](https://github.com/Kelvination/vibes/compare/<branch-name>?expand=1)
```

Replace `<branch-name>` with the actual branch you're working on.

---

**Questions?** Check `.github/DEPLOYMENT.md` for detailed deployment info.

**Ready to build?** Pick a project folder and let's make something cool! 🚀
