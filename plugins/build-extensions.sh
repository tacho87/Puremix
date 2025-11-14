#!/bin/bash

# PureMix Extension Build Script
# This script builds both VS Code and Cursor extensions for marketplace publishing

set -e

echo "🚀 PureMix Extension Build Script"
echo "=================================="

# Check if VSCE is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build extension
build_extension() {
    local ext_dir=$1
    local ext_name=$2

    echo ""
    echo "📦 Building ${YELLOW}${ext_name}${NC} extension..."
    echo "📁 Directory: ${ext_dir}"

    cd "$ext_dir"

    # Check if icon.png exists
    if [ ! -f "icon.png" ]; then
        echo "⚠️  Warning: icon.png not found. Please convert icon.svg to PNG format."
        echo "   You can use online converters or: convert icon.svg -resize 512x512 icon.png"
    else
        echo "✅ Icon found: icon.png"
    fi

    # Check package.json
    if [ ! -f "package.json" ]; then
        echo "❌ Error: package.json not found in ${ext_dir}"
        exit 1
    fi

    echo "📋 Package info:"
    echo "   Name: $(grep '"name"' package.json | cut -d'"' -f4)"
    echo "   Display: $(grep '"displayName"' package.json | cut -d'"' -f4)"
    echo "   Version: $(grep '"version"' package.json | cut -d'"' -f4)"

    # Install vsce locally if not available globally
    if ! command -v vsce &> /dev/null; then
        echo "📥 Installing VSCE locally..."
        npm install @vscode/vsce
        VSCE_CMD="npx vsce"
    else
        VSCE_CMD="vsce"
    fi

    # Package the extension
    echo "🔨 Packaging extension..."
    if $VSCE_CMD package; then
        echo "✅ ${GREEN}Success!${NC} Extension packaged successfully"

        # List created files
        echo "📄 Created files:"
        ls -la *.vsix 2>/dev/null || echo "   No VSIX files found"

        # Get package size
        for file in *.vsix; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo "   $file: $size"
            fi
        done
    else
        echo "❌ ${RED}Failed!${NC} Extension packaging failed"
        exit 1
    fi

    cd -..
}

# Check dependencies
echo "🔍 Checking dependencies..."

# Build VS Code extension
build_extension "vscode-puremix" "VS Code"

# Build Cursor extension
build_extension "cursor-puremix" "Cursor"

echo ""
echo "🎉 ${GREEN}Build Complete!${NC}"
echo "=================================="
echo "Both extensions are ready for marketplace publishing!"
echo ""
echo "Next Steps:"
echo "1. Test extensions locally: code --install-extension *.vsix"
echo "2. Create publisher accounts on marketplaces"
echo "3. Follow PUBLISHING_GUIDE.md for publishing instructions"
echo ""
echo "Extension files created:"
echo "📁 plugins/vscode-puremix/"
echo "   - puremix-0.1.0.vsix (VS Code)"
echo "📁 plugins/cursor-puremix/"
echo "   - puremix-cursor-0.1.0.vsix (Cursor)"