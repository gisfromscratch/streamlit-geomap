"""
Streamlit Geomap Component

A custom Streamlit component for rendering interactive geospatial maps 
using the ArcGIS Maps SDK for JavaScript.
"""

import os
import streamlit.components.v1 as components

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


def st_geomap(geojson=None, feature_layers=None, enable_selection=True, enable_hover=True, key=None):
    """Create a new instance of the geomap component.
    
    Parameters
    ----------
    geojson : dict or None
        A GeoJSON feature collection to display on the map. If provided,
        the map will render the features as graphics and automatically
        center and zoom to show all features.
    feature_layers : list or None
        A list of FeatureLayer configurations. Each configuration can include:
        - url: Feature service URL
        - portal_item_id: ArcGIS Online/Portal item ID
        - api_key: API key for authentication
        - oauth_token: OAuth token for authentication
        - renderer: Custom renderer configuration
        - label_info: Labeling configuration
    enable_selection : bool
        Enable feature selection on click. When True, clicking features will
        toggle their selection state and send selection events back to Streamlit.
        Default is True.
    enable_hover : bool
        Enable hover events for features. When True, hovering over features will
        send hover events back to Streamlit and change the cursor. Default is True.
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
    """
    component_value = _component_func(
        geojson=geojson, 
        feature_layers=feature_layers,
        enable_selection=enable_selection,
        enable_hover=enable_hover,
        key=key, 
        default=None
    )
    return component_value


# Add some test code to play with the component while it's in development.
if not _RELEASE:
    import streamlit as st

    st.subheader("Streamlit Geomap Component Demo")
    
    # Feature showcase
    st.markdown("""
    **New Interactive Features!** 🎉
    
    This component now supports interactive events and selection:
    - **Click Events**: Click anywhere on the map to get coordinates
    - **Feature Selection**: Click on features to select/deselect them
    - **Hover Events**: Hover over features to see their data
    - **Selection Highlighting**: Selected features are highlighted with yellow outline
    
    Plus existing features:
    - Layer URLs and Portal Item IDs
    - API Key and OAuth authentication  
    - Custom renderers and labeling
    - Full backward compatibility with GeoJSON
    """)
    
    # Demo configuration
    demo_feature_layers = [
        {
            "url": "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized/FeatureServer/0",
            "title": "USA States Demo",
            "visible": True
        }
    ]
    
    # Create an instance of our component with interactive features
    result = st_geomap(
        feature_layers=demo_feature_layers, 
        enable_selection=True,
        enable_hover=True,
        key="demo_geomap"
    )
    
    # Show the return value of the component
    if result:
        st.write("Component value:", result)