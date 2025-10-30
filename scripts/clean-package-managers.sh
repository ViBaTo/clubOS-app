#!/bin/bash

# Package Manager Cleanup Script
# Ensures PNPM-only environment by removing conflicting package managers

set -e

echo "🧹 Starting package manager cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Working in: $PROJECT_ROOT"

# Function to safely remove files/directories
safe_remove() {
    if [ -e "$1" ]; then
        echo "  ❌ Removing: $1"
        rm -rf "$1"
    fi
}

# Remove conflicting lockfiles
echo "${YELLOW}🔒 Cleaning conflicting lockfiles...${NC}"
safe_remove "package-lock.json"
safe_remove "yarn.lock"
safe_remove ".yarn"
safe_remove ".yarnrc"
safe_remove ".yarnrc.yml"

# Remove duplicate files
echo "${YELLOW}📂 Cleaning duplicate files...${NC}"
safe_remove "package-lock 2.json"
safe_remove "package 2.json"
safe_remove "node_modules 2"
safe_remove "postcss.config 2.mjs"
safe_remove "tsconfig 2.json"
safe_remove "middleware 2.ts"
safe_remove ".gitignore 2"

# Remove node_modules to ensure clean state
echo "${YELLOW}📦 Removing node_modules...${NC}"
safe_remove "node_modules"

# Clean package manager caches
echo "${YELLOW}🗑️  Cleaning package manager caches...${NC}"
echo "  🔧 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || echo "  ℹ️  NPM cache clean skipped"

echo "  🔧 Cleaning yarn cache..."
yarn cache clean 2>/dev/null || echo "  ℹ️  Yarn cache clean skipped"

echo "  🔧 Cleaning pnpm store..."
pnpm store prune 2>/dev/null || echo "  ℹ️  PNPM store prune skipped"

# Reinstall with pnpm
echo "${GREEN}⚡ Installing dependencies with PNPM...${NC}"
pnpm install

# Verify installation
echo "${GREEN}✅ Verifying installation...${NC}"
if [ -f "pnpm-lock.yaml" ] && [ -d "node_modules" ]; then
    echo "${GREEN}✅ Package manager cleanup completed successfully!${NC}"
    echo "📋 Summary:"
    echo "  • Using PNPM as the exclusive package manager"
    echo "  • Removed all conflicting lockfiles and caches"
    echo "  • Clean installation completed"
else
    echo "${RED}❌ Installation verification failed${NC}"
    exit 1
fi

# Check for remaining conflicts
echo "${YELLOW}🔍 Checking for remaining conflicts...${NC}"
conflicts_found=false

if [ -f "package-lock.json" ]; then
    echo "${RED}  ⚠️  package-lock.json still exists${NC}"
    conflicts_found=true
fi

if [ -f "yarn.lock" ]; then
    echo "${RED}  ⚠️  yarn.lock still exists${NC}"
    conflicts_found=true
fi

if [ "$conflicts_found" = false ]; then
    echo "${GREEN}  ✅ No conflicts detected${NC}"
fi

echo ""
echo "${GREEN}🎉 Cleanup complete! Your project is now configured for PNPM-only usage.${NC}"