
# Branch Workflow Guide

## Daily Development Workflow

### Working on New Features
```bash
# Start on development branch
git checkout new
git pull origin new

# Make your changes
# ... edit files ...

# Commit and push (triggers Vercel preview deployment)
git add .
git commit -m "Your commit message"
git push origin new
```

### Deploying to Production
```bash
# Ensure new branch is tested and working
git checkout new
git pull origin new

# Merge to main
git checkout main
git pull origin main
git merge new

# Deploy to production
git push origin main
```

### Emergency Hotfix
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/issue-name

# Fix the issue
# ... edit files ...

# Push and merge
git add .
git commit -m "Hotfix: description"
git push origin hotfix/issue-name

# Then merge via GitHub PR to main
```

## Vercel Preview URLs

- **Main (Production)**: Your custom domain or https://eriggalive.vercel.app
- **New (Staging)**: Auto-generated preview URL from Vercel
- **Pull Requests**: Each PR gets its own preview URL

## Viewing Deployments

```bash
# View deployment status
vercel ls

# View logs for latest deployment
vercel logs
```
