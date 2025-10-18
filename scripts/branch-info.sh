
#!/bin/bash

CURRENT_BRANCH=$(git branch --show-current)
echo "Current Branch: $CURRENT_BRANCH"
echo ""

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "Production URL: https://eriggalive.vercel.app (or your custom domain)"
  echo "Vercel Project: https://vercel.com/techcitybystevenson-4623s-projects/v0-eriggalive"
elif [ "$CURRENT_BRANCH" = "new" ]; then
  echo "Preview URL: https://v0-eriggalive-new.vercel.app"
  echo "This is your staging/development branch"
else
  echo "Unknown branch. Main branches are: main, new"
fi

echo ""
echo "Available commands:"
echo "  git checkout main  - Switch to production branch"
echo "  git checkout new   - Switch to development branch"
echo "  git push origin $CURRENT_BRANCH  - Deploy current branch to Vercel"
