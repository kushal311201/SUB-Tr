#!/bin/bash

# Get the last commit hash
LAST_COMMIT=$(git rev-parse HEAD)

# Rollback to the previous commit
git reset --hard HEAD^

# Force push to revert changes
git push -f origin master

echo "Rolled back to previous commit: $LAST_COMMIT" 