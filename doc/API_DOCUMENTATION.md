# Enhanced Python API Documentation

## Overview

The `st_geomap` function has been enhanced with comprehensive prop configuration, allowing full control over map appearance and behavior. This update maintains complete backward compatibility while adding powerful new features.

## New Features

### 🎨 Configurable Size
Control the exact size of your map component:

```python
# Pixel dimensions
st_geomap(height=600, width=800)

# Percentage dimensions  
st_geomap(height="50%", width="90%")

# Mixed dimensions
st_geomap(height=500, width="100%")
```

### 🗺️ Multiple Basemaps
Choose from 12+ professionally designed basemaps:

```python
# Satellite imagery
st_geomap(basemap="satellite")

# Street maps
st_geomap(basemap="streets-vector")

# Topographic maps
st_geomap(basemap="topo-vector")

# Dark theme
st_geomap(basemap="dark-gray-vector")
```

**Available basemaps:**
- `topo-vector` - Topographic (default)
- `streets-vector` - Modern streets
- `streets` - Classic streets
- `satellite` - Satellite imagery
- `hybrid` - Satellite with labels
- `terrain` - Terrain relief
- `osm` - OpenStreetMap
- `dark-gray-vector` - Dark theme
- `gray-vector` - Light gray
- `streets-night-vector` - Night streets
- `streets-relief-vector` - Streets with relief
- `streets-navigation-vector` - Navigation optimized

### 📍 Precise Positioning
Set exact map center and zoom level:

```python
# Center on San Francisco
st_geomap(
    center=[-122.4194, 37.7749],
    zoom=12
)

# Center on New York with high zoom
st_geomap(
    center=[-74.0059, 40.7128],
    zoom=15
)
```

### 📚 Unified Layers
New unified layer system supporting multiple layer types:

```python
layers = [
    {
        "type": "feature",
        "url": "https://services.arcgis.com/.../FeatureServer/0",
        "title": "My Feature Layer"
    },
    {
        "type": "geojson",
        "data": my_geojson_data
    }
]

st_geomap(layers=layers)
```

## Function Signature

```python
def st_geomap(
    geojson: Optional[Dict[str, Any]] = None,
    feature_layers: Optional[List[Dict[str, Any]]] = None,  # DEPRECATED
    layers: Optional[List[Dict[str, Any]]] = None,
    height: Union[int, str] = 400,
    width: Union[int, str] = "100%",
    basemap: str = "topo-vector",
    center: Optional[Union[List[float], Tuple[float, float]]] = None,
    zoom: Optional[Union[int, float]] = None,
    view_mode: str = "2d",
    enable_selection: bool = True,
    enable_hover: bool = True,
    key: Optional[str] = None
) -> dict
```

## Parameters

### Core Configuration

- **`height`** (`int | str`): Map height. Can be pixels (e.g., `400`) or percentage (e.g., `"50%"`). Minimum 100px.
- **`width`** (`int | str`): Map width. Can be pixels (e.g., `800`) or percentage (e.g., `"100%"`). Minimum 100px.
- **`basemap`** (`str`): Basemap style. See available options above.
- **`center`** (`List[float] | Tuple[float, float]`): Map center as `[longitude, latitude]`. Longitude: -180 to 180, Latitude: -90 to 90.
- **`zoom`** (`int | float`): Zoom level from 0 to 20.
- **`view_mode`** (`str`): View mode. Currently supports `"2d"` (3D support planned).

### Data & Layers

- **`geojson`** (`dict`): GeoJSON FeatureCollection to display.
- **`layers`** (`List[dict]`): List of layer configurations. Each layer must have a `type` field.
- **`feature_layers`** (`List[dict]`): **DEPRECATED** - Use `layers` instead.

### Interactions

- **`enable_selection`** (`bool`): Enable feature selection on click.
- **`enable_hover`** (`bool`): Enable hover events.
- **`key`** (`str`): Unique component identifier.

## Examples

### Basic Usage

```python
import streamlit as st
from streamlit_geomap import st_geomap

# Simple map with custom size
result = st_geomap(
    height=500,
    width="90%",
    basemap="satellite"
)
```

### Advanced Configuration

```python
# Feature-rich map
result = st_geomap(
    height=600,
    width="100%",
    basemap="hybrid",
    center=[-122.4194, 37.7749],  # San Francisco
    zoom=13,
    layers=[
        {
            "type": "feature",
            "url": "https://services.arcgis.com/.../FeatureServer/0",
            "title": "Points of Interest"
        }
    ],
    enable_selection=True,
    enable_hover=True,
    key="advanced_map"
)
```

### Multiple Basemaps Demo

```python
# Let users choose basemap
basemap_choice = st.selectbox(
    "Choose basemap:",
    ["topo-vector", "satellite", "streets-vector", "dark-gray-vector"]
)

result = st_geomap(
    basemap=basemap_choice,
    height=400,
    center=[-98.5, 39.8],  # Center of US
    zoom=4
)
```

### Location Presets

```python
locations = {
    "New York": [-74.0059, 40.7128],
    "London": [-0.1276, 51.5074],
    "Tokyo": [139.6503, 35.6762]
}

location = st.selectbox("Choose location:", list(locations.keys()))
center = locations[location]

result = st_geomap(
    center=center,
    zoom=10,
    basemap="streets-vector"
)
```

## Input Validation

The API includes comprehensive validation with helpful error messages:

```python
# These will show helpful error messages
st_geomap(height=50)          # "Height must be at least 100 pixels"
st_geomap(basemap="invalid")  # Lists valid basemap options
st_geomap(center=[200, 100])  # "Longitude must be between -180 and 180"
st_geomap(zoom=25)            # "Zoom must be between 0 and 20"
```

## Backward Compatibility

All existing code continues to work unchanged:

```python
# Old code still works
result = st_geomap(
    geojson=my_geojson,
    feature_layers=my_layers,
    key="my_map"
)

# Equivalent new code
result = st_geomap(
    geojson=my_geojson,
    layers=[
        {"type": "feature", **layer} 
        for layer in my_layers
    ],
    key="my_map"
)
```

## Event Handling

The component returns event data:

```python
result = st_geomap(...)

if result:
    if result.get("event") == "map_loaded":
        st.success("Map loaded successfully!")
    elif result.get("event") == "map_clicked":
        coords = result.get("coordinates", [])
        st.info(f"Clicked at: {coords[1]:.4f}, {coords[0]:.4f}")
    elif result.get("event") == "feature_selected":
        count = result.get("selectionCount", 0)
        st.info(f"{count} features selected")
```

## Migration Guide

### From Old API

```python
# Before
st_geomap(
    geojson=data,
    feature_layers=layers
)

# After (enhanced)
st_geomap(
    geojson=data,
    layers=[{"type": "feature", **layer} for layer in layers],
    height=500,
    basemap="satellite",
    center=[-122.4, 37.8],
    zoom=12
)
```

### Common Patterns

```python
# Responsive design
st_geomap(
    width="100%",
    height="60vh"  # 60% of viewport height
)

# Mobile-friendly
st_geomap(
    width="100%",
    height=400 if st.sidebar.checkbox("Desktop") else 300
)
```

## Best Practices

1. **Size Configuration**: Use percentage widths for responsive design
2. **Basemap Selection**: Choose basemaps appropriate for your data type
3. **Zoom Levels**: Start with zoom 10-12 for city views, 4-6 for country views
4. **Center Positioning**: Always validate coordinates are within valid ranges
5. **Layer Organization**: Use the new `layers` parameter for better organization
6. **Error Handling**: Wrap in try-catch for production applications

## Technical Notes

- Minimum dimensions: 100px × 100px
- Maximum zoom: 20 (street level)
- Coordinate system: WGS84 (longitude/latitude)
- View modes: Currently 2D only (3D support planned)
- Browser compatibility: Modern browsers supporting ArcGIS Maps SDK

## Troubleshooting

### Common Issues

1. **"Height must be at least 100 pixels"**: Increase height value
2. **"Invalid basemap"**: Check spelling against available options
3. **"Longitude must be between -180 and 180"**: Verify coordinate order (longitude first)
4. **Map not loading**: Check network connectivity and service URLs

### Performance Tips

- Use appropriate zoom levels for your data
- Consider basemap choice for performance (vector maps are faster)
- Limit the number of layers for better performance
- Use GeoJSON for small datasets, feature services for large datasets