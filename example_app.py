"""
Example Streamlit app demonstrating the geomap component.

Run this app with:
    streamlit run example_app.py
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="Streamlit Geomap Demo",
    page_icon="🗺️",
    layout="wide"
)

st.title("🗺️ Streamlit Geomap Component Demo")

st.markdown("""
This is a demonstration of the **Streamlit Geomap** component - a custom component
for rendering interactive geospatial maps using the ArcGIS Maps SDK for JavaScript.

The component provides:
- Interactive mapping capabilities
- High-performance rendering
- Seamless integration with Streamlit
- No IPython dependencies required
""")

# Create the geomap component
st.subheader("Interactive Geomap")

with st.container():
    # Add some configuration options in the sidebar
    st.sidebar.header("Map Configuration")
    st.sidebar.info("Configuration options will be added here in future versions")
    
    # Create the geomap
    result = st_geomap(key="example_geomap")
    
    # Show the result
    if result:
        st.subheader("Component Status")
        st.json(result)
    
    # Add some information
    st.markdown("""
    ### Development Status
    
    - ✅ Component scaffold created
    - ✅ Basic React/TypeScript frontend
    - ✅ Python backend integration
    - ⏳ ArcGIS Maps SDK integration (coming next)
    - ⏳ Interactive map features (coming next)
    - ⏳ Data visualization capabilities (coming next)
    """)

# Add footer
st.markdown("---")
st.markdown("Built with ❤️ using Streamlit Custom Components")