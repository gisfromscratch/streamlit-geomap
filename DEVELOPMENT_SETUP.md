# Development Setup Guide

This guide provides step-by-step instructions for setting up and running the Streamlit Geomap component in development mode.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm (comes with Node.js)

## Quick Setup

Run the automated setup script:

```bash
./dev_setup.sh
```

This script will:
1. Install Python dependencies
2. Install Node.js dependencies
3. Display setup instructions

## Manual Setup

If you prefer manual setup or the script doesn't work:

### 1. Install Python Dependencies

```bash
# Install Streamlit (if not already installed)
pip install streamlit

# Install the component in development mode
pip install -e .
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Development Environment

### Step 1: Start the React Development Server

Open a terminal and run:

```bash
cd frontend
npm start
```

The React dev server will start on **http://localhost:3001** (configured in `frontend/.env`).

**Important:** The frontend MUST run on port 3001, not the default 3000, because the component is configured to look for the dev server at port 3001.

### Step 2: Start the Streamlit App

Open a **new terminal** and run:

```bash
streamlit run example_app.py
```

The Streamlit app will start on **http://localhost:8501**.

## Development Workflow

1. **Frontend Development**: Make changes to files in `frontend/src/`
   - The React dev server will automatically reload
   - Changes will be reflected immediately in the Streamlit app

2. **Backend Development**: Make changes to files in `streamlit_geomap/`
   - Restart the Streamlit app to see changes
   - The component will reload automatically

## Troubleshooting

### Component Not Loading

If you see an error like:
```
Your app is having trouble loading the streamlit_geomap.streamlit_geomap component.
The app is attempting to load the component from http://localhost:3001/, and hasn't received its Streamlit.setComponentReady() message.
```

**Solution:**
1. Make sure the React dev server is running on port 3001
2. Check that `frontend/.env` contains `PORT=3001`
3. Restart the React dev server if needed

### Connection Retry Errors

If you see in the browser console:
```
Streamlit connection failed after maximum retries
```

This issue has been **fixed** in the latest version. The fix includes:
- Added proper `Streamlit.setComponentReady()` call
- Fixed Streamlit API usage 
- Added better error messages and troubleshooting tips

**If you still see this error:**
1. Make sure you have the latest version of the component
2. Rebuild the frontend: `cd frontend && npm run build`
3. Check browser console for detailed troubleshooting tips
4. Verify React dev server is running on port 3001 (development mode)

### st.set_page_config() Error

If you see:
```
streamlit.errors.StreamlitSetPageConfigMustBeFirstCommandError: set_page_config() can only be called once per app page, and must be called as the first Streamlit command in your script.
```

This should be fixed in the current version. The issue was that development test code in the component was running before the main app's `st.set_page_config()`. This has been resolved by moving the test code to only run when the component module is executed directly.

### Port Configuration

The component expects the React dev server on port 3001. This is configured in:
- `frontend/.env` file (sets the React dev server port)
- `streamlit_geomap/__init__.py` (component looks for dev server at port 3001)

### Node.js Dependencies

If you encounter issues with npm install, try:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Running with a Dedicated Python Environment

For isolation, you can use a virtual environment:

```bash
# Create virtual environment
python -m venv streamlit-geomap-env

# Activate it (Linux/Mac)
source streamlit-geomap-env/bin/activate

# Activate it (Windows)
streamlit-geomap-env\Scripts\activate

# Install dependencies
pip install streamlit
pip install -e .

# Run the app
streamlit run example_app.py
```

## Production Build

To build for production:

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Set the release flag:
In `streamlit_geomap/__init__.py`, change:
```python
_RELEASE = False
```
to:
```python
_RELEASE = True
```

3. The component will now use the built files instead of the dev server.

## Component Structure

```
streamlit-geomap/
├── streamlit_geomap/          # Python package
│   └── __init__.py           # Main component logic
├── frontend/                  # React/TypeScript frontend
│   ├── .env                  # Environment variables (PORT=3001)
│   ├── src/                  # Source code
│   ├── public/               # Static files
│   └── build/                # Built files (after npm run build)
├── example_app.py            # Example Streamlit application
└── dev_setup.sh             # Development setup script
```