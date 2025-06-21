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


def st_geomap(key=None):
    """Create a new instance of the geomap component.
    
    Parameters
    ----------
    key : str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    dict
        The component's return value
    """
    component_value = _component_func(key=key, default=None)
    return component_value


# Add some test code to play with the component while it's in development.
if not _RELEASE:
    import streamlit as st

    st.subheader("Streamlit Geomap Component Demo")
    
    # Create an instance of our component with a key for state management
    result = st_geomap(key="demo_geomap")
    
    # Show the return value of the component
    if result:
        st.write("Component value:", result)