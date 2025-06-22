# Development Guide

## Getting Started

### Quick Setup
Run the setup script to install all dependencies:
```bash
./dev_setup.sh
```

### Manual Setup

1. Install Python dependencies:
```bash
pip install -e .
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Development Workflow

### Development Mode
For development, the component uses a React dev server running on port 3001.

1. Start the React development server:
```bash
cd frontend
npm start
```

2. In another terminal, run the Streamlit app:
```bash
streamlit run example_app.py
```

The component will automatically connect to the React dev server at `http://localhost:3001`.

### Production Build
To build the component for production:

1. Build the React frontend:
```bash
cd frontend
npm run build
```

2. Update the `_RELEASE` flag in `streamlit_geomap/__init__.py` to `True`

3. The component will now use the built files instead of the dev server.

## Testing

Run the setup validation tests:
```bash
python tests/test_setup.py
```

## Project Structure

```
streamlit-geomap/
├── streamlit_geomap/          # Python package
│   └── __init__.py           # Main component logic
├── frontend/                  # React/TypeScript frontend
│   ├── src/
│   │   ├── index.tsx         # React entry point
│   │   └── GeomapComponent.tsx # Main component
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── package.json          # Node.js dependencies
│   └── tsconfig.json         # TypeScript configuration
├── example_app.py            # Example Streamlit application
├── setup.py                  # Python package configuration
├── MANIFEST.in              # Package manifest
├── dev_setup.sh             # Development setup script
└── test_setup.py            # Setup validation tests
```

## Component Communication

The component uses Streamlit's bidirectional communication:

- **Python → React**: Pass data via component arguments
- **React → Python**: Use `Streamlit.setComponentValue()` to send data back

Example:
```python
# In Python
result = st_geomap(data=my_data, key="map1")

# In React (GeomapComponent.tsx)
this.props.args.Streamlit.setComponentValue({
    "event": "map_clicked",
    "coordinates": [lat, lng]
})
```

## Next Steps

1. **Integrate ArcGIS Maps SDK**: Add the ArcGIS Maps SDK for JavaScript to create interactive maps
2. **Add Map Features**: Implement zoom, pan, layer management
3. **Data Visualization**: Add support for displaying geospatial data
4. **Styling**: Customize the map appearance and themes
5. **Events**: Handle map interactions and user events

## Troubleshooting

### Component not loading
- Ensure the React dev server is running on port 3001
- Check that both Python and Node.js dependencies are installed
- Verify the `_RELEASE` flag matches your development mode

### Build errors
- Check TypeScript compilation errors in the frontend
- Ensure all imports are properly defined and used
- Run `npm run build` to identify build issues

### Import errors
- Verify the Python package is installed: `pip install -e .`
- Check that streamlit is installed and up to date