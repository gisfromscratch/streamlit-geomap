"""
Streamlit Geomap Component

A custom Streamlit component for rendering interactive geospatial maps 
using the ArcGIS Maps SDK for JavaScript.
"""

import os
import streamlit.components.v1 as components
from typing import Union, List, Dict, Tuple, Any, Optional

# Create a _RELEASE constant. Set to False while developing the component,
# True when releasing
_RELEASE = False

# Get the absolute path to the frontend's build directory
if not _RELEASE:
    _component_func = components.declare_component(
        "streamlit_geomap",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component(
        "streamlit_geomap", path=build_dir
    )


# Validation functions
def _validate_height(height: Union[int, str]) -> str:
    """Validate height parameter."""
    if isinstance(height, int):
        if height < 100:
            raise ValueError("Height must be at least 100 pixels")
        return f"{height}px"
    elif isinstance(height, str):
        if height.endswith('px'):
            try:
                px_value = int(height[:-2])
                if px_value < 100:
                    raise ValueError("Height must be at least 100 pixels")
                return height
            except ValueError:
                raise ValueError("Invalid height format. Use format like '400px'")
        elif height.endswith('%'):
            try:
                pct_value = float(height[:-1])
                if pct_value <= 0 or pct_value > 100:
                    raise ValueError("Height percentage must be between 0 and 100")
                return height
            except ValueError:
                raise ValueError("Invalid height percentage format. Use format like '50%'")
        else:
            raise ValueError("Height string must end with 'px' or '%'")
    else:
        raise ValueError("Height must be an integer (pixels) or string ('400px' or '50%')")


def _validate_width(width: Union[int, str]) -> str:
    """Validate width parameter."""
    if isinstance(width, int):
        if width < 100:
            raise ValueError("Width must be at least 100 pixels")
        return f"{width}px"
    elif isinstance(width, str):
        if width.endswith('px'):
            try:
                px_value = int(width[:-2])
                if px_value < 100:
                    raise ValueError("Width must be at least 100 pixels")
                return width
            except ValueError:
                raise ValueError("Invalid width format. Use format like '400px'")
        elif width.endswith('%'):
            try:
                pct_value = float(width[:-1])
                if pct_value <= 0 or pct_value > 100:
                    raise ValueError("Width percentage must be between 0 and 100")
                return width
            except ValueError:
                raise ValueError("Invalid width percentage format. Use format like '50%'")
        else:
            raise ValueError("Width string must end with 'px' or '%'")
    else:
        raise ValueError("Width must be an integer (pixels) or string ('400px' or '50%')")


def _validate_basemap(basemap: str) -> str:
    """Validate basemap parameter."""
    valid_basemaps = {
        'topo-vector', 'streets-vector', 'streets', 'satellite', 'hybrid',
        'terrain', 'osm', 'dark-gray-vector', 'gray-vector', 'streets-night-vector',
        'streets-relief-vector', 'streets-navigation-vector'
    }
    if basemap not in valid_basemaps:
        raise ValueError(f"Invalid basemap '{basemap}'. Valid options: {', '.join(sorted(valid_basemaps))}")
    return basemap


def _validate_center(center: Union[List[float], Tuple[float, float]]) -> List[float]:
    """Validate center parameter."""
    if not isinstance(center, (list, tuple)) or len(center) != 2:
        raise ValueError("Center must be a list or tuple of [longitude, latitude]")
    
    lng, lat = center
    if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        raise ValueError("Center coordinates must be numeric")
    
    if not (-180 <= lng <= 180):
        raise ValueError(f"Longitude must be between -180 and 180, got {lng}")
    
    if not (-90 <= lat <= 90):
        raise ValueError(f"Latitude must be between -90 and 90, got {lat}")
    
    return [float(lng), float(lat)]


def _validate_zoom(zoom: Union[int, float]) -> float:
    """Validate zoom parameter."""
    if not isinstance(zoom, (int, float)):
        raise ValueError("Zoom must be numeric")
    
    if not (0 <= zoom <= 20):
        raise ValueError(f"Zoom must be between 0 and 20, got {zoom}")
    
    return float(zoom)


def _validate_view_mode(view_mode: str) -> str:
    """Validate view_mode parameter."""
    valid_modes = {'2d', '3d'}
    if view_mode not in valid_modes:
        raise ValueError(f"Invalid view_mode '{view_mode}'. Valid options: {', '.join(sorted(valid_modes))}")
    return view_mode


def _validate_layers(layers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate layers parameter."""
    if not isinstance(layers, list):
        raise ValueError("Layers must be a list")
    
    for i, layer in enumerate(layers):
        if not isinstance(layer, dict):
            raise ValueError(f"Layer {i} must be a dictionary")
        
        if 'type' not in layer:
            raise ValueError(f"Layer {i} must have a 'type' field")
        
        layer_type = layer['type']
        if layer_type not in ['feature', 'geojson', 'graphics']:
            raise ValueError(f"Layer {i} has invalid type '{layer_type}'. Valid types: feature, geojson, graphics")
        
        # Additional validation based on layer type
        if layer_type == 'feature' and 'url' not in layer and 'portal_item_id' not in layer:
            raise ValueError(f"Feature layer {i} must have either 'url' or 'portal_item_id'")
    
    return layers


def st_geomap(
    geojson: Optional[Dict[str, Any]] = None,
    feature_layers: Optional[List[Dict[str, Any]]] = None,
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
):
    """Create a new instance of the geomap component.
    
    Parameters
    ----------
    geojson : dict or None
        A GeoJSON feature collection to display on the map. If provided,
        the map will render the features as graphics and automatically
        center and zoom to show all features.
    feature_layers : list or None
        DEPRECATED: Use 'layers' parameter instead. A list of FeatureLayer configurations. 
        Each configuration can include:
        - url: Feature service URL
        - portal_item_id: ArcGIS Online/Portal item ID
        - api_key: API key for authentication
        - oauth_token: OAuth token for authentication
        - renderer: Custom renderer configuration
        - label_info: Labeling configuration
    layers : list or None
        A list of layer configurations. Each layer must have a 'type' field.
        Supported types:
        - 'feature': Feature service layers (url or portal_item_id required)
        - 'geojson': GeoJSON data layers
        - 'graphics': Graphics layers
    height : int or str, default 400
        Height of the map component. Can be:
        - Integer: Height in pixels (e.g., 400)
        - String: Height with units (e.g., "400px", "50%")
        Minimum height is 100 pixels.
    width : int or str, default "100%"
        Width of the map component. Can be:
        - Integer: Width in pixels (e.g., 800)
        - String: Width with units (e.g., "800px", "100%")
        Minimum width is 100 pixels.
    basemap : str, default "topo-vector"
        The basemap to use. Valid options:
        'topo-vector', 'streets-vector', 'streets', 'satellite', 'hybrid',
        'terrain', 'osm', 'dark-gray-vector', 'gray-vector', 'streets-night-vector',
        'streets-relief-vector', 'streets-navigation-vector'
    center : list or tuple, optional
        Map center as [longitude, latitude]. If not provided, will use
        default center or auto-center to show all features.
        Longitude must be between -180 and 180.
        Latitude must be between -90 and 90.
    zoom : int or float, optional
        Map zoom level (0-20). If not provided, will use default zoom
        or auto-zoom to show all features.
    view_mode : str, default "2d"
        Map view mode. Valid options: '2d', '3d'
    enable_selection : bool, default True
        Enable feature selection on click. When True, clicking features will
        toggle their selection state and send selection events back to Streamlit.
    enable_hover : bool, default True
        Enable hover events for features. When True, hovering over features will
        send hover events back to Streamlit and change the cursor.
    key : str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    dict
        The component's return value containing event data:
        - event: Type of event ('map_clicked', 'feature_hovered', 'feature_selected', 'map_loaded')
        - coordinates: [longitude, latitude] for click events
        - feature: Feature data for feature-related events
        - selectedFeatures: List of selected features for selection events
        - Other event-specific data
        
    Examples
    --------
    Basic usage with default settings:
    >>> result = st_geomap()
    
    Custom size and basemap:
    >>> result = st_geomap(
    ...     height=500,
    ...     width="80%",
    ...     basemap="satellite",
    ...     center=[-122.4, 37.8],
    ...     zoom=10
    ... )
    
    With GeoJSON data:
    >>> geojson_data = {
    ...     "type": "FeatureCollection",
    ...     "features": [...]
    ... }
    >>> result = st_geomap(geojson=geojson_data)
    
    With feature layers:
    >>> layers = [{
    ...     "type": "feature",
    ...     "url": "https://services.arcgis.com/.../FeatureServer/0",
    ...     "title": "My Layer"
    ... }]
    >>> result = st_geomap(layers=layers)
    """
    # Validate parameters
    try:
        validated_height = _validate_height(height)
        validated_width = _validate_width(width)
        validated_basemap = _validate_basemap(basemap)
        validated_view_mode = _validate_view_mode(view_mode)
        
        validated_center = None
        if center is not None:
            validated_center = _validate_center(center)
            
        validated_zoom = None
        if zoom is not None:
            validated_zoom = _validate_zoom(zoom)
            
        validated_layers = None
        if layers is not None:
            validated_layers = _validate_layers(layers)
        
        # Handle backward compatibility with feature_layers
        if feature_layers is not None and layers is None:
            # Convert feature_layers to new layers format
            validated_layers = []
            for fl in feature_layers:
                layer = dict(fl)  # Copy the feature layer config
                layer['type'] = 'feature'  # Add type field
                validated_layers.append(layer)
            validated_layers = _validate_layers(validated_layers)
            
    except ValueError as e:
        import streamlit as st
        st.error(f"Invalid parameter: {str(e)}")
        return None
    
    # Prepare component arguments
    component_args = {
        'geojson': geojson,
        'layers': validated_layers,
        'height': validated_height,
        'width': validated_width,
        'basemap': validated_basemap,
        'center': validated_center,
        'zoom': validated_zoom,
        'view_mode': validated_view_mode,
        'enable_selection': enable_selection,
        'enable_hover': enable_hover,
        'key': key
    }
    
    # Remove None values to keep payload minimal
    component_args = {k: v for k, v in component_args.items() if v is not None}
    
    component_value = _component_func(
        **component_args,
        default=None
    )
    return component_value


# Add some test code to play with the component while it's in development.
if not _RELEASE:
    import streamlit as st

    st.subheader("Streamlit Geomap Component Demo")
    
    # Feature showcase
    st.markdown("""
    **Enhanced Python API!** 🎉
    
    This component now supports comprehensive configuration:
    - **Customizable Size**: Configure height and width
    - **Multiple Basemaps**: Choose from various basemap options
    - **Center & Zoom**: Set initial map view
    - **Layer Management**: Unified layer configuration
    - **Interactive Events**: Click, hover, and selection events
    - **Validation**: Comprehensive input validation with helpful error messages
    
    Plus existing features:
    - Layer URLs and Portal Item IDs
    - API Key and OAuth authentication  
    - Custom renderers and labeling
    - Full backward compatibility with existing code
    """)
    
    # Demo configuration using new API
    demo_layers = [
        {
            "type": "feature",
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States Demo",
            "visible": True
        }
    ]
    
    # Create an instance of our component with new API
    result = st_geomap(
        layers=demo_layers,
        height=500,
        width="100%",
        basemap="topo-vector",
        center=[-98.5, 39.8],  # Center of US
        zoom=4,
        view_mode="2d",
        enable_selection=True,
        enable_hover=True,
        key="demo_geomap"
    )
    
    # Show the return value of the component
    if result:
        st.write("Component value:", result)