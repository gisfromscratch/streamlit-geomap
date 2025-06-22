#!/usr/bin/env python3

"""
Enhanced logging test for DOM removeChild error debugging
This test creates and destroys map components to trigger the error.
"""

import streamlit as st
import time
import streamlit_geomap as gm

st.set_page_config(
    page_title="DOM Error Debug Test",
    layout="wide"
)

st.title("🔍 DOM removeChild Error Debugging")

st.markdown("""
This test creates multiple map components to help identify where the DOM removeChild error occurs.
Check the browser console for detailed logging.
""")

# Test 1: Basic map creation and destruction
st.header("Test 1: Basic Map Component")

if st.button("Create Basic Map"):
    with st.container():
        gm_result = gm.st_geomap(
            center=[-118.244, 34.052],
            zoom=10,
            basemap="streets-vector",
            height="300px",
            key="basic_map_1"
        )
    st.success("Map created! Check console for initialization logs.")

# Test 2: Rapid component creation/destruction
st.header("Test 2: Rapid Component Lifecycle")

col1, col2 = st.columns(2)

with col1:
    if st.button("Create Map #1"):
        gm_result_1 = gm.st_geomap(
            center=[-74.006, 40.712],  # NYC
            zoom=12,
            basemap="topo-vector",
            height="250px",
            key="rapid_map_1"
        )

with col2:
    if st.button("Create Map #2"):
        gm_result_2 = gm.st_geomap(
            center=[-122.419, 37.775],  # SF
            zoom=11,
            basemap="satellite",
            height="250px",
            key="rapid_map_2"
        )

# Test 3: Component with data
st.header("Test 3: Map with GeoJSON Data")

sample_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.244, 34.052]
            },
            "properties": {
                "name": "Los Angeles",
                "type": "city"
            }
        },
        {
            "type": "Feature", 
            "geometry": {
                "type": "Point",
                "coordinates": [-118.264, 34.072]
            },
            "properties": {
                "name": "Hollywood",
                "type": "neighborhood"
            }
        }
    ]
}

if st.button("Create Map with Data"):
    gm_result_data = gm.st_geomap(
        center=[-118.244, 34.052],
        zoom=10,
        basemap="streets-vector",
        geojson=sample_geojson,
        height="300px",
        key="data_map_1"
    )
    st.success("Map with data created! Check console for logs.")

# Test 4: Component state changes
st.header("Test 4: Dynamic Component Changes")

map_type = st.selectbox(
    "Select basemap type:",
    ["streets-vector", "topo-vector", "satellite", "hybrid", "terrain"],
    key="basemap_selector"
)

zoom_level = st.slider(
    "Zoom level:",
    min_value=1,
    max_value=20,
    value=10,
    key="zoom_slider"
)

# This will cause the component to re-render when values change
gm_result_dynamic = gm.st_geomap(
    center=[-118.244, 34.052],
    zoom=zoom_level,
    basemap=map_type,
    height="300px",
    key="dynamic_map"
)

# Add some debugging info
st.sidebar.header("Debug Info")
st.sidebar.write("This test helps identify DOM manipulation issues.")
st.sidebar.write("Open browser console to see detailed logging.")
st.sidebar.write("Look for messages starting with:")
st.sidebar.code("""
🔄 REACT LIFECYCLE: 
🔍 DOM STATE:
🧹 CLEANUP:
⚠️ DOM OBSERVER:
🚨 DOM OBSERVER:
""")

# Force re-render with timestamp
st.sidebar.write(f"Last render: {time.time()}")