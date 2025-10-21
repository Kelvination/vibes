# Automated Deployment Setup

This repository uses GitHub Actions to automatically deploy projects to Vercel when PRs are merged.

## How It Works

1. **Create a PR** that changes files in any `projects/` directory
2. **Merge the PR** when ready
3. **Automatic deployment** - GitHub Actions detects which project(s) changed and deploys them to Vercel
4. **Get notified** - A comment is posted on the PR with the deployment URL

## Initial Setup

### 1. Get Your Vercel Credentials

```bash
# Install Vercel CLI globally
npm install -g vercel@latest

# Login to Vercel
vercel login

# Link your project (do this for each project in projects/)
cd projects/thought-particles
vercel link

# This creates a .vercel directory with project.json
# Don't commit this directory - it's in .gitignore
```

After running `vercel link`, check `.vercel/project.json` to find:
- `orgId` - Your organization/team ID
- `projectId` - The specific project ID

### 2. Create a Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it something like "GitHub Actions - vibes"
4. Set expiration (or leave as no expiration)
5. Copy the token (you won't see it again!)

### 3. Add GitHub Secrets

Go to your GitHub repository settings: `Settings > Secrets and variables > Actions`

Add these **Repository Secrets**:

1. **VERCEL_TOKEN**: The token you just created
2. **VERCEL_ORG_ID**: Your organization ID from `.vercel/project.json`
3. **VERCEL_PROJECT_ID_thought-particles**: Project ID for thought-particles
4. **VERCEL_PROJECT_ID_your-next-project**: Project ID for your next project

**Important**: The project ID secret format is:
```
VERCEL_PROJECT_ID_{project-folder-name}
```
Replace hyphens with underscores if needed, e.g., `VERCEL_PROJECT_ID_my_cool_app`

### 4. Update the Workflow

When you add a new project, update `.github/workflows/deploy-to-vercel.yml`:

```yaml
- name: Detect changed projects
  id: filter
  uses: dorny/paths-filter@v3
  with:
    filters: |
      thought-particles:
        - 'projects/thought-particles/**'
      your-new-project:  # Add this
        - 'projects/your-new-project/**'  # Add this
```

## Adding a New Project

1. **Create the project** in `projects/new-project-name/`
2. **Link to Vercel** locally:
   ```bash
   cd projects/new-project-name
   vercel link
   ```
3. **Get the project ID** from `.vercel/project.json`
4. **Add GitHub Secret**: `VERCEL_PROJECT_ID_new-project-name`
5. **Update workflow** to detect changes in the new project path
6. **Commit and push** - next merge will auto-deploy!

## Manual Deployment

You can still deploy manually using:

```bash
cd projects/your-project
vercel --prod
```

## Troubleshooting

### Deployment Not Triggered

- Check that your PR actually merged (not just closed)
- Verify files changed are in a `projects/` subdirectory
- Check GitHub Actions tab for workflow runs
- Ensure the project path is added to the workflow filters

### Deployment Failed

Common issues:
- **Missing secrets**: Check all required secrets are set
- **Wrong project ID**: Verify secret name matches project folder
- **Build errors**: Check the project builds locally first
- **Vercel token expired**: Create a new token and update the secret

### Secret Naming

For project `my-cool-app`:
- ✅ Correct: `VERCEL_PROJECT_ID_my-cool-app`
- ❌ Wrong: `VERCEL_PROJECT_ID_my_cool_app` (unless folder uses underscores)
- ❌ Wrong: `VERCEL_PROJECT_ID` (needs project name suffix)

## Workflow Details

The workflow:
1. Triggers on **merged pull requests** that touch `projects/**`
2. Uses **dorny/paths-filter** to detect which specific projects changed
3. Runs a **matrix strategy** to deploy multiple projects in parallel if needed
4. Uses **Vercel CLI** to pull, build, and deploy
5. **Comments on the PR** with the deployment URL

## Security Notes

- Never commit `.vercel/` directories
- Keep your `VERCEL_TOKEN` secret and rotate it periodically
- Use repository secrets, not environment variables
- Token has full access to your Vercel account - keep it safe!

## Alternative: Vercel Git Integration

If you prefer, you can also use Vercel's native GitHub integration:
1. Connect your repo in Vercel dashboard
2. Set root directory for each project
3. Vercel auto-deploys on push

The GitHub Actions approach gives you more control and works better for monorepos with multiple projects.

---

Need help? Check the [workflow file](./workflows/deploy-to-vercel.yml) or [Vercel CLI docs](https://vercel.com/docs/cli).
