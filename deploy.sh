#!/bin/bash

# Function to check for errors
check_errors() {
    if [ $? -ne 0 ]; then
        echo "Error occurred. Rolling back changes..."
        git reset --hard HEAD^
        git push -f origin master
        exit 1
    fi
}

# Add all changes
git add .
check_errors

# Commit changes
git commit -m "Update: $1"
check_errors

# Push to GitHub
git push origin master
check_errors

echo "Deployment successful!" 