#!/bin/bash

# ===========================================
# Ajax02 Repository Preparation Script
# ===========================================

echo "🚀 Preparing Ajax02 deployment..."

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Add remote repository
echo "🔗 Adding Ajax02 remote repository..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/dallyp22/Ajax02.git

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📋 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
.venv/
venv/
pip-log.txt
pip-delete-this-directory.txt

# Build outputs
dist/
build/
.vercel/
.railway/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Google Cloud credentials
*-credentials.json
service-account*.json

# Temporary files
temp/
tmp/
*.tmp

# Poetry
poetry.lock
EOF
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Initial commit: Multi-tenant AI Rent Optimizer

Features:
- Multi-tenant SaaS architecture with client isolation
- BigQuery integration with automatic dataset creation
- Super admin interface for client management
- Auth0 authentication with role-based access control
- Data upload system for rent roll and competition data
- Analytics dashboard with pricing optimization
- Railway and Vercel deployment configurations

Ready for production deployment to Railway (backend) and Vercel (frontend)."

# Push to repository
echo "🚀 Pushing to Ajax02 repository..."
git push -u origin main

echo ""
echo "✅ Repository prepared successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Deploy backend to Railway using DEPLOYMENT_RAILWAY_VERCEL.md"
echo "2. Deploy frontend to Vercel"
echo "3. Configure Auth0 for production"
echo "4. Test the complete system"
echo ""
echo "📖 See DEPLOYMENT_RAILWAY_VERCEL.md for detailed instructions."
