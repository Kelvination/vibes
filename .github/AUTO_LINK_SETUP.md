# Auto-Link New Projects Setup

This workflow automatically links new project directories to Vercel and creates the required GitHub secrets.

## ⚠️ Security Considerations

This automation requires a **Personal Access Token (PAT)** with permissions to write repository secrets. While convenient, this introduces security risks:

- The PAT has broad permissions to modify repository secrets
- If compromised, it could expose or modify sensitive data
- Goes against principle of least privilege

**Use with caution and keep your PAT secure.**

## Setup Instructions

### 1. Create a Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name: `vibes-auto-link-workflow`
4. Set expiration (recommend 90 days, then rotate)
5. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)

### 2. Add the PAT as a GitHub Secret

1. Go to https://github.com/Kelvination/vibes/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `GH_PAT`
4. Value: Paste your Personal Access Token
5. Click **"Add secret"**

### 3. You're Done!

The workflow will now automatically:
1. Detect when you push a new directory to `projects/`
2. Run `vercel link` for that project
3. Extract the project ID from `.vercel/project.json`
4. Create a GitHub secret named `VERCEL_PROJECT_ID_{project_name}`
5. Create a GitHub issue reminding you to update the deployment workflow

## How It Works

### Trigger
The workflow runs when you push to `master`/`main` with changes in `projects/**`

### Detection
It scans `projects/` for directories that don't have a `.vercel/` folder (= not yet linked)

### Linking
For each new project:
```bash
cd projects/new-project
vercel link --yes
```

### Secret Creation
Extracts the project ID and creates a secret:
```bash
# For project "my-cool-app"
# Creates secret: VERCEL_PROJECT_ID_my_cool_app
gh secret set VERCEL_PROJECT_ID_my_cool_app
```

### Notification
Creates a GitHub issue listing the new projects and reminding you to update the deployment workflow

## Workflow Details

**File**: `.github/workflows/auto-link-new-projects.yml`

**Runs on**: Push to master/main

**Required Secrets**:
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `GH_PAT` - Personal Access Token (new!)

## Testing the Workflow

1. Create a new directory in `projects/`:
   ```bash
   mkdir projects/test-auto-link
   echo "# Test" > projects/test-auto-link/README.md
   git add projects/test-auto-link
   git commit -m "Test auto-link workflow"
   git push
   ```

2. Check GitHub Actions to see it run
3. Verify the secret was created in repo settings
4. Check for a new GitHub issue with instructions

## Manual Override

If you need to link a project manually (workflow fails, testing, etc.):

```bash
cd projects/your-project
vercel link --yes

# Get the project ID
cat .vercel/project.json

# Create the secret manually
gh secret set VERCEL_PROJECT_ID_your_project --body "prj_xxxxx"
```

## Troubleshooting

### Workflow doesn't run
- Check that changes were pushed to `master` or `main`
- Verify changes include files under `projects/`
- Check GitHub Actions tab for error logs

### "Permission denied" errors
- Ensure `GH_PAT` secret is set correctly
- Verify the PAT has `repo` and `workflow` scopes
- Check that PAT hasn't expired

### Vercel link fails
- Verify `VERCEL_TOKEN` is valid
- Check `VERCEL_ORG_ID` is correct
- Ensure you're not hitting Vercel's project limits

### Secret not created
- Check that `.vercel/project.json` was created
- Verify `GH_PAT` has permission to write secrets
- Look for error messages in workflow logs

## Security Best Practices

1. **Rotate PAT regularly** - Set expiration and create new tokens
2. **Limit scope** - Only use this token for this specific workflow
3. **Monitor usage** - Check GitHub audit logs periodically
4. **Revoke if compromised** - Immediately revoke and create new PAT if leaked

## Disabling Auto-Link

To disable this automation:

1. Delete or rename the workflow file:
   ```bash
   git rm .github/workflows/auto-link-new-projects.yml
   ```

2. Or disable it in GitHub:
   - Go to Actions tab
   - Find "Auto-Link New Projects to Vercel"
   - Click "..." → "Disable workflow"

---

**Created**: October 2025
**Last Updated**: Check git log for this file
