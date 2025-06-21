# 🗺️ Streamlit Geomap

A custom Streamlit component for rendering interactive geospatial maps using the ArcGIS Maps SDK for JavaScript. Drop in dynamic, high-performance maps into your Streamlit apps—no IPython required.

## Features

- 🚀 **High-performance mapping** with ArcGIS Maps SDK for JavaScript
- 🎯 **Streamlit-native** - fully integrated with Streamlit's component system
- 🔧 **TypeScript + React** frontend for robust development
- 📦 **Easy installation** and setup
- 🌐 **No IPython dependencies** - works directly in Streamlit

## Installation

```bash
pip install streamlit-geomap
```

## Quick Start

```python
import streamlit as st
from streamlit_geomap import st_geomap

st.title("My Geospatial App")

# Create an interactive map
result = st_geomap(key="my_map")

if result:
    st.write("Map interaction result:", result)
```

## Development

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/gisfromscratch/streamlit-geomap.git
cd streamlit-geomap
```

2. Run the development setup:
```bash
./dev_setup.sh
```

3. Start the development servers:

In one terminal:
```bash
cd frontend
npm start
```

In another terminal:
```bash
streamlit run example_app.py
```

The React development server will run on `http://localhost:3001` and the Streamlit app on `http://localhost:8501`.

## Project Structure

```
streamlit-geomap/
├── streamlit_geomap/          # Python package
│   └── __init__.py           # Main component code
├── frontend/                  # React/TypeScript frontend
│   ├── src/
│   │   ├── index.tsx         # Entry point
│   │   └── GeomapComponent.tsx # Main component
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── example_app.py            # Example Streamlit app
├── setup.py                  # Python package setup
└── dev_setup.sh             # Development setup script
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
