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


def st_geomap(geojson=None, feature_layers=None, key=None):
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
    key : str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    dict
        The component's return value
    """
    component_value = _component_func(
        geojson=geojson, 
        feature_layers=feature_layers, 
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
    **New FeatureLayer Support!** 🎉
    
    This component now supports ArcGIS FeatureLayers with:
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
    
    # Create an instance of our component with FeatureLayer support
    result = st_geomap(feature_layers=demo_feature_layers, key="demo_geomap")
    
    # Show the return value of the component
    if result:
        st.write("Component value:", result)