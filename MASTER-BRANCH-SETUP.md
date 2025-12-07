# Master Branch Setup Instructions

This document outlines the steps to create a "master" branch and set it as the default branch for this repository.

## Current State
- The repository currently uses "main" as the primary branch
- A new "master" branch needs to be created from "main"
- The "master" branch should become the default branch

## Automated Setup via GitHub Actions

A GitHub Actions workflow has been created to automate the master branch creation and PR setup:

### Workflow: `.github/workflows/create-master-branch.yml`

This workflow will:
1. Create the "master" branch from "main" 
2. Push the master branch to the remote repository
3. Create a Pull Request to merge "main" into "master"

The workflow runs automatically when:
- This PR is merged into the repository
- Manual trigger via GitHub Actions "Run workflow" button

### What Happens Automatically
✅ Master branch creation from main  
✅ Push master branch to remote  
✅ Create PR from main to master  

### Manual Steps Required After Workflow Runs

Once the workflow completes and creates the PR:

#### Step 1: Review and Merge the PR
1. Go to: https://github.com/tomer1983/swagger2mcp/pulls
2. Find the PR titled "Merge main into master"
3. Review (will show no changes since both branches point to the same commit)
4. Merge the PR

#### Step 2: Set Master as Default Branch
After the PR is merged:
1. Go to: https://github.com/tomer1983/swagger2mcp/settings
2. Navigate to "Branches" section
3. Under "Default branch", click the switch/edit icon
4. Select "master" from the dropdown
5. Click "Update" and confirm the change

## Manual Alternative (If Workflow Fails)

If the automated workflow doesn't work, follow these manual steps:

### Step 1: Push Master Branch Manually
```bash
git fetch origin main
git checkout main
git checkout -b master
git push -u origin master
```

### Step 2: Create Pull Request Manually
1. Go to: https://github.com/tomer1983/swagger2mcp/pulls
2. Click "New pull request"
3. Set base branch to: `master`
4. Set compare branch to: `main`
5. Create the PR with title: "Merge main into master"

### Step 3: Set Master as Default Branch
Follow the same steps as in the automated section above.

## Verification
Once complete, verify that:
- ✅ The master branch exists on GitHub
- ✅ The PR from main to master exists or is merged
- ✅ The default branch is set to "master" (will show on the repository homepage)
- ✅ New clones will checkout "master" by default

## Notes
- Both main and master branches will point to the same commit initially
- The master branch will become the canonical default branch
- Future development should target the master branch
- The GitHub Actions workflow handles the technical setup automatically
