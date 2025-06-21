# 🗺️ Streamlit Geomap

A custom Streamlit component for rendering interactive geospatial maps using the ArcGIS Maps SDK for JavaScript. Drop in dynamic, high-performance maps into your Streamlit apps—no IPython required.

## Features

- 🚀 **High-performance mapping** with ArcGIS Maps SDK for JavaScript
- 🎯 **Streamlit-native** - fully integrated with Streamlit's component system
- 🔧 **TypeScript + React** frontend for robust development
- 📦 **Easy installation** and setup
- 🌐 **No IPython dependencies** - works directly in Streamlit
- 📊 **Multiple data formats** - GeoJSON and ArcGIS Feature Services
- 🎨 **12+ basemaps** - satellite, streets, topographic, and more
- 🖱️ **Interactive events** - click, hover, and selection
- 🔐 **Authentication** - API keys and OAuth for secure data
- 📱 **Responsive design** - configurable dimensions

## Installation

### From PyPI (Recommended)

```bash
pip install streamlit-geomap
```

### From Source

```bash
git clone https://github.com/gisfromscratch/streamlit-geomap.git
cd streamlit-geomap
pip install -e .
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

> 💡 **Tip**: Check out the [`examples/`](examples/) directory for more complete working examples!

## Supported Data Formats

### 1. GeoJSON

Display GeoJSON point features with automatic centering and styling:

```python
geojson_data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4194, 37.7749]  # [longitude, latitude]
            },
            "properties": {
                "name": "San Francisco",
                "population": 873965
            }
        }
    ]
}

result = st_geomap(geojson=geojson_data)
```

**Supported GeoJSON features:**
- ✅ Point geometries with automatic marker styling
- ✅ Feature properties as popup data
- ✅ Automatic map centering and zooming
- ✅ Interactive selection and hover events
- ⏳ Line and Polygon geometries (coming soon)

### 2. ArcGIS Feature Services

Connect to live ArcGIS feature services for real-time data:

```python
# Using service URL
feature_layers = [{
    "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0",
    "title": "US Counties"
}]

result = st_geomap(feature_layers=feature_layers)
```

```python
# Using Portal Item ID
feature_layers = [{
    "portal_item_id": "99fd67933e754a1181cc755146be21ca",
    "title": "World Countries"
}]

result = st_geomap(feature_layers=feature_layers)
```

**Feature Service capabilities:**
- ✅ REST service URLs and Portal Item IDs
- ✅ Secure authentication (API keys and OAuth)
- ✅ Custom renderers and symbology
- ✅ Labels and popup configuration
- ✅ Large dataset performance optimization
- ✅ Server-side filtering and queries

### 3. Combined Data Sources

Mix GeoJSON and Feature Services in a single map:

```python
result = st_geomap(
    geojson=local_points,
    feature_layers=enterprise_layers
)

## Real-World Examples

### 🏠 Real Estate Application

Create an interactive property map with market data:

```python
import streamlit as st
from streamlit_geomap import st_geomap

st.title("🏠 Real Estate Market Analysis")

# Property listings as GeoJSON
properties = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4194, 37.7749]
            },
            "properties": {
                "address": "123 Market St, San Francisco, CA",
                "price": 1200000,
                "bedrooms": 2,
                "bathrooms": 2,
                "sqft": 1100,
                "type": "Condo"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4089, 37.7834]
            },
            "properties": {
                "address": "456 Mission St, San Francisco, CA",
                "price": 950000,
                "bedrooms": 1,
                "bathrooms": 1,
                "sqft": 800,
                "type": "Apartment"
            }
        }
    ]
}

# Add neighborhood boundaries from ArcGIS
neighborhoods = [{
    "url": "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/SF_Neighborhoods/FeatureServer/0",
    "title": "San Francisco Neighborhoods",
    "renderer": {
        "type": "simple",
        "symbol": {
            "type": "simple-fill",
            "color": [0, 0, 0, 0.1],
            "outline": {"color": [128, 128, 128, 0.8], "width": 1}
        }
    }
}]

# Create interactive map
col1, col2 = st.columns([3, 1])

with col1:
    result = st_geomap(
        geojson=properties,
        feature_layers=neighborhoods,
        basemap="streets-vector",
        height=600,
        key="real_estate_map"
    )

with col2:
    st.header("Filters")
    max_price = st.slider("Max Price", 500000, 2000000, 1500000)
    min_beds = st.selectbox("Min Bedrooms", [1, 2, 3, 4])
    
    if result and result.get("event") == "feature_selected":
        st.header("Selected Property")
        props = result["feature"]["properties"]
        st.metric("Price", f"${props['price']:,}")
        st.metric("Bedrooms", props["bedrooms"])
        st.metric("Bathrooms", props["bathrooms"])
        st.metric("Square Feet", f"{props['sqft']:,}")
```

### 🌦️ Weather Monitoring Dashboard

Display real-time weather data and conditions:

```python
import streamlit as st
from streamlit_geomap import st_geomap

st.title("🌦️ Weather Monitoring Dashboard")

# Weather stations with current conditions
weather_stations = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4194, 37.7749]
            },
            "properties": {
                "station_id": "SF001",
                "location": "San Francisco, CA",
                "temperature": 68,
                "humidity": 65,
                "wind_speed": 12,
                "condition": "Partly Cloudy",
                "last_updated": "2024-01-15 14:30:00"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.2437, 34.0522]
            },
            "properties": {
                "station_id": "LA001",
                "location": "Los Angeles, CA",
                "temperature": 75,
                "humidity": 45,
                "wind_speed": 8,
                "condition": "Sunny",
                "last_updated": "2024-01-15 14:25:00"
            }
        }
    ]
}

# Weather alerts from NOAA
weather_alerts = [{
    "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/NOAA_Weather_Alerts/FeatureServer/0",
    "title": "Weather Alerts",
    "renderer": {
        "type": "simple",
        "symbol": {
            "type": "simple-fill",
            "color": [255, 165, 0, 0.4],
            "outline": {"color": [255, 140, 0, 1], "width": 2}
        }
    }
}]

# Interactive controls
col1, col2 = st.columns([3, 1])

with col1:
    result = st_geomap(
        geojson=weather_stations,
        feature_layers=weather_alerts,
        basemap="satellite",
        height=600,
        key="weather_map"
    )

with col2:
    st.header("Current Conditions")
    if result and result.get("event") == "feature_hovered":
        station = result["feature"]["properties"]
        st.metric("Temperature", f"{station['temperature']}°F")
        st.metric("Humidity", f"{station['humidity']}%")
        st.metric("Wind Speed", f"{station['wind_speed']} mph")
        st.write(f"**Condition:** {station['condition']}")
        st.caption(f"Updated: {station['last_updated']}")
    
    # Add refresh button for real-time updates
    if st.button("🔄 Refresh Data"):
        st.rerun()
```

### 🚨 Emergency Response Command Center

Coordinate emergency responses with real-time incident tracking:

```python
import streamlit as st
from streamlit_geomap import st_geomap
import datetime

st.title("🚨 Emergency Response Command Center")

# Active incidents
incidents = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4194, 37.7749]
            },
            "properties": {
                "incident_id": "INC-2024-001",
                "type": "Structure Fire",
                "severity": "High",
                "status": "Active",
                "units_dispatched": 3,
                "reported_time": "2024-01-15 14:15:00",
                "address": "123 Market St, San Francisco, CA"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.4089, 37.7834]
            },
            "properties": {
                "incident_id": "INC-2024-002",
                "type": "Medical Emergency",
                "severity": "Medium",
                "status": "En Route",
                "units_dispatched": 1,
                "reported_time": "2024-01-15 14:20:00",
                "address": "456 Mission St, San Francisco, CA"
            }
        }
    ]
}

# Emergency services infrastructure
emergency_layers = [
    {
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Fire_Stations/FeatureServer/0",
        "title": "Fire Stations",
        "renderer": {
            "type": "simple",
            "symbol": {
                "type": "simple-marker",
                "color": [255, 0, 0],
                "size": 10,
                "outline": {"color": [255, 255, 255], "width": 2}
            }
        }
    },
    {
        "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Hospitals/FeatureServer/0",
        "title": "Hospitals",
        "renderer": {
            "type": "simple",
            "symbol": {
                "type": "simple-marker",
                "color": [0, 255, 0],
                "size": 8,
                "outline": {"color": [255, 255, 255], "width": 2}
            }
        }
    }
]

# Dashboard layout
col1, col2 = st.columns([3, 1])

with col1:
    result = st_geomap(
        geojson=incidents,
        feature_layers=emergency_layers,
        basemap="hybrid",
        height=650,
        key="emergency_map"
    )

with col2:
    st.header("Active Incidents")
    
    # Summary metrics
    st.metric("Total Incidents", len(incidents["features"]))
    st.metric("High Priority", 1)
    st.metric("Units Deployed", 4)
    
    # Incident details
    if result and result.get("event") == "feature_selected":
        incident = result["feature"]["properties"]
        st.subheader("Incident Details")
        st.write(f"**ID:** {incident['incident_id']}")
        st.write(f"**Type:** {incident['type']}")
        st.write(f"**Severity:** {incident['severity']}")
        st.write(f"**Status:** {incident['status']}")
        st.write(f"**Units:** {incident['units_dispatched']}")
        st.write(f"**Address:** {incident['address']}")
        st.write(f"**Reported:** {incident['reported_time']}")
        
        # Action buttons
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("🚒 Dispatch Unit"):
                st.success("Unit dispatched!")
        with col_b:
            if st.button("📞 Contact Incident"):
                st.info("Connecting...")
    
    # Filter controls
    st.header("Filters")
    severity_filter = st.multiselect(
        "Severity Level",
        ["High", "Medium", "Low"],
        default=["High", "Medium", "Low"]
    )
    
    status_filter = st.multiselect(
        "Status",
        ["Active", "En Route", "Resolved"],
        default=["Active", "En Route"]
    )

## API Reference

### st_geomap()

Create an interactive geospatial map component.

```python
st_geomap(
    geojson=None,
    feature_layers=None,
    layers=None,
    height=400,
    width="100%",
    basemap="topo-vector",
    center=None,
    zoom=None,
    view_mode="2d",
    enable_selection=True,
    enable_hover=True,
    key=None
)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `geojson` | `dict` | `None` | GeoJSON FeatureCollection to display as graphics |
| `feature_layers` | `list` | `None` | List of ArcGIS Feature Service configurations |
| `layers` | `list` | `None` | Unified layer configurations (replaces feature_layers) |
| `height` | `int/str` | `400` | Height in pixels or CSS units ("400px", "50%") |
| `width` | `int/str` | `"100%"` | Width in pixels or CSS units ("800px", "100%") |
| `basemap` | `str` | `"topo-vector"` | Basemap style (see available options below) |
| `center` | `list` | `None` | Map center as [longitude, latitude] |
| `zoom` | `int/float` | `None` | Zoom level (0-20) |
| `view_mode` | `str` | `"2d"` | View mode: "2d" or "3d" |
| `enable_selection` | `bool` | `True` | Enable feature selection on click |
| `enable_hover` | `bool` | `True` | Enable hover events |
| `key` | `str` | `None` | Unique component key for Streamlit |

#### Available Basemaps

| Basemap ID | Description |
|------------|-------------|
| `topo-vector` | Topographic map (default) |
| `streets-vector` | Modern street map |
| `streets` | Classic street map |
| `satellite` | Satellite imagery |
| `hybrid` | Satellite with street labels |
| `terrain` | Terrain with relief |
| `osm` | OpenStreetMap |
| `dark-gray-vector` | Dark theme |
| `gray-vector` | Light gray theme |
| `streets-night-vector` | Night-time street map |
| `streets-relief-vector` | Streets with terrain relief |
| `streets-navigation-vector` | Navigation-focused streets |

#### Return Value

Returns a dictionary with event data:

```python
{
    "event": "map_clicked",           # Event type
    "coordinates": [-122.4, 37.8],   # Click coordinates
    "feature": {...},                # Feature data (if clicked)
    "selectedFeatures": [...],       # Currently selected features
    "timestamp": "2024-01-15T14:30:00"
}
```

**Event Types:**
- `map_clicked` - User clicked on the map
- `feature_hovered` - User hovered over a feature
- `feature_selected` - Feature selection changed
- `map_loaded` - Map finished loading

### Configuration Examples

#### Custom Styling

```python
# Custom map dimensions
result = st_geomap(
    height=600,
    width="90%",
    basemap="satellite"
)

# Centered on specific location
result = st_geomap(
    center=[-122.4194, 37.7749],  # San Francisco
    zoom=12,
    basemap="hybrid"
)
```

#### Authentication

```python
# API Key authentication
feature_layers = [{
    "url": "https://services.arcgis.com/secure/FeatureServer/0",
    "api_key": "your_api_key_here",
    "title": "Secured Layer"
}]

result = st_geomap(feature_layers=feature_layers)
```

#### Advanced Feature Services

```python
# Custom renderer and labels
feature_layers = [{
    "url": "https://services.arcgis.com/.../FeatureServer/0",
    "title": "Custom Styled Layer",
    "renderer": {
        "type": "simple",
        "symbol": {
            "type": "simple-fill",
            "color": [255, 0, 0, 0.5],
            "outline": {
                "color": [255, 255, 255, 1],
                "width": 2
            }
        }
    },
    "labelingInfo": [{
        "labelExpression": "[NAME]",
        "symbol": {
            "type": "text",
            "color": [0, 0, 0, 1],
            "font": {"size": 12, "family": "Arial"}
        }
    }]
}]

result = st_geomap(feature_layers=feature_layers)
```

## Event Handling

The component provides rich event data for building interactive applications:

```python
result = st_geomap(key="interactive_map")

if result:
    event_type = result.get("event")
    
    if event_type == "map_clicked":
        coords = result["coordinates"]
        st.write(f"Clicked at: {coords[1]:.4f}, {coords[0]:.4f}")
        
        if result.get("feature"):
            st.write("Clicked feature:", result["feature"]["properties"])
    
    elif event_type == "feature_selected":
        selected = result["selectedFeatures"]
        st.write(f"Selected {len(selected)} features")
        
        for feature in selected:
            st.json(feature["properties"])
    
    elif event_type == "feature_hovered":
        feature = result["feature"]
        st.write("Hovered feature:", feature["properties"])
```

## Best Practices

### Performance

- **Large datasets**: Use Feature Services instead of GeoJSON for better performance
- **Basemap selection**: Vector basemaps load faster than raster imagery
- **Zoom levels**: Start with appropriate zoom levels (10-12 for cities, 4-6 for regions)
- **Layer limits**: Limit the number of simultaneous layers for better performance

### Data Management

- **Coordinate format**: Always use [longitude, latitude] order
- **Valid ranges**: Longitude (-180 to 180), Latitude (-90 to 90)
- **GeoJSON validation**: Ensure GeoJSON follows specification
- **Feature Services**: Use ArcGIS REST API endpoints

### UI/UX

- **Responsive design**: Use percentage widths for responsive layouts
- **Minimum size**: Maintain at least 400x300 pixels for usability
- **Loading states**: Handle loading states with appropriate feedback
- **Error handling**: Wrap map calls in try-catch blocks

## Troubleshooting

### Common Issues

**Map not loading**
- Check network connectivity
- Verify basemap spelling
- Ensure minimum dimensions (100x100 px)

**GeoJSON not displaying**
- Validate GeoJSON format
- Check coordinate order (longitude first)
- Ensure features array is not empty

**Feature Services failing**
- Verify service URL accessibility
- Check authentication requirements
- Confirm service supports CORS

**Authentication errors**
- Validate API key format
- Check service permissions
- Ensure proper HTTPS usage

### Debug Mode

Enable debug information:

```python
import streamlit as st

# Enable debug info
if st.checkbox("Debug Mode"):
    result = st_geomap(key="debug_map")
    if result:
        st.json(result)  # Show full event data
```
```
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
├── examples/                  # Usage examples
│   ├── README.md             # Examples documentation
│   └── basic_usage.py        # Simple usage example
├── example_app.py            # Comprehensive demo app
├── setup.py                  # Python package setup
└── dev_setup.sh             # Development setup script
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
