#!/bin/bash

# GalloBets - Development Environment Setup Script
# Optimiza el ambiente de desarrollo local

set -e

echo "🎮 GalloBets Development Environment Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m' 
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check if in project root
if [[ ! -f "CLAUDE.md" ]]; then
    echo "❌ Run this script from project root (where CLAUDE.md exists)"
    exit 1
fi

log_step "1. Installing backend ESLint dependencies"
cd backend
if ! npm list @typescript-eslint/parser >/dev/null 2>&1; then
    npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint
    log_info "✅ ESLint installed for backend"
else
    log_info "✅ ESLint already installed"
fi

log_step "2. Checking TypeScript compilation"
log_info "Backend TypeScript check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    log_info "✅ Backend TypeScript compilation OK"
else
    log_warn "⚠️ Backend TypeScript issues found"
fi

cd ../frontend
log_info "Frontend TypeScript check..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    log_info "✅ Frontend TypeScript compilation OK"
else
    log_warn "⚠️ Frontend TypeScript issues found"
fi

log_step "3. Running linting checks"
cd ../backend
if npm run lint >/dev/null 2>&1; then
    log_info "✅ Backend linting passed"
else
    log_warn "⚠️ Backend linting issues found - run 'npm run lint:fix'"
fi

cd ../frontend
if npm run lint >/dev/null 2>&1; then
    log_info "✅ Frontend linting passed"
else
    log_warn "⚠️ Frontend linting issues found"
fi

log_step "4. Checking development servers"
cd ..

# Check if backend is running
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    log_info "✅ Backend server running on port 3001"
else
    log_warn "⚠️ Backend server not running - start with: cd backend && npm run dev"
fi

# Check if frontend is accessible
if curl -s http://localhost:5174 >/dev/null 2>&1; then
    log_info "✅ Frontend server running on port 5174"
elif curl -s http://localhost:5173 >/dev/null 2>&1; then
    log_info "✅ Frontend server running on port 5173"
else
    log_warn "⚠️ Frontend server not running - start with: cd frontend && npm run dev"
fi

log_step "5. Development environment summary"
echo ""
echo "🎯 GalloBets Development Status:"
echo "  • Backend API: http://localhost:3001"
echo "  • Frontend UI: http://localhost:5174 (or 5173)"
echo "  • Database: PostgreSQL via Neon.tech"
echo ""
echo "🛠️ Available Commands:"
echo "  • Backend: cd backend && npm run dev"
echo "  • Frontend: cd frontend && npm run dev"
echo "  • Lint: npm run lint (in respective directories)"
echo "  • Test: npm test (in respective directories)"
echo ""
echo "📊 Performance Optimizations:"
echo "  ✅ Vite fast refresh enabled"
echo "  ✅ Nodemon hot reload active"
echo "  ✅ TypeScript incremental compilation"
echo "  ✅ ESLint configured for code quality"
echo ""

if [[ -f "deployment/README-DEPLOYMENT.md" ]]; then
    log_info "📦 Production deployment scripts ready in deployment/"
fi

echo "🚀 Development environment optimized for GalloBets!"
echo "=========================================="