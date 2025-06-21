#!/bin/bash

# Development setup script for Streamlit Geomap Component

echo "🗺️  Streamlit Geomap Component Development Setup"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "setup.py" ]; then
    echo "❌ Error: Please run this script from the root directory of the project"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -e .

# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "1. In one terminal, run: cd frontend && npm start"
echo "2. In another terminal, run: streamlit run example_app.py"
echo ""
echo "The React dev server will run on http://localhost:3001"
echo "The Streamlit app will run on http://localhost:8501"