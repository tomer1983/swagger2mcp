#!/bin/bash
# Script to create master branch and PR from main

set -e

echo "===========================================" 
echo "Master Branch Creation Script"
echo "==========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

echo "Step 1: Fetching latest changes from remote..."
git fetch origin

echo ""
echo "Step 2: Checking if master branch already exists..."
if git ls-remote --heads origin master | grep -q master; then
    echo "Master branch already exists on remote!"
    echo "Skipping branch creation..."
else
    echo "Master branch does not exist. Creating it..."
    
    # Checkout main branch
    echo ""
    echo "Step 3: Checking out main branch..."
    git checkout main
    git pull origin main
    
    # Create master branch from main
    echo ""
    echo "Step 4: Creating master branch from main..."
    git checkout -b master
    
    # Push master branch to remote
    echo ""
    echo "Step 5: Pushing master branch to remote..."
    git push -u origin master
    
    echo ""
    echo "✅ Master branch created successfully!"
fi

echo ""
echo "Step 6: Checking if PR already exists..."
# Note: This requires gh CLI to be installed
if command -v gh &> /dev/null; then
    # Check for existing PR
    EXISTING_PR=$(gh pr list --base master --head main --json number --jq '.[0].number' 2>/dev/null || echo "")
    
    if [ -n "$EXISTING_PR" ]; then
        echo "PR already exists: #$EXISTING_PR"
        echo "View it at: $(gh pr view $EXISTING_PR --json url --jq '.url')"
    else
        echo "Creating PR from main to master..."
        gh pr create \
            --base master \
            --head main \
            --title "Merge main into master" \
            --body "This PR merges the main branch into the newly created master branch.

After this PR is merged:
1. Go to repository Settings
2. Navigate to Branches
3. Set 'master' as the default branch

This will make master the primary branch for the repository."
        
        echo ""
        echo "✅ PR created successfully!"
    fi
else
    echo "⚠️  GitHub CLI (gh) not found."
    echo "Please install it or create the PR manually:"
    echo "1. Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/compare/master...main"
    echo "2. Create a PR from main to master"
fi

echo ""
echo "==========================================="
echo "Next Steps:"
echo "==========================================="
echo "1. Review and merge the PR from main to master"
echo "2. Go to repository Settings > Branches"
echo "3. Set 'master' as the default branch"
echo ""
echo "For more information, see MASTER-BRANCH-SETUP.md"
echo "==========================================="
