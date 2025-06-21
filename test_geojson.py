#!/usr/bin/env python3
"""
Test script for GeoJSON functionality in streamlit-geomap component.
"""

import streamlit as st
from streamlit_geomap import st_geomap

# Set page config
st.set_page_config(
    page_title="GeoJSON Test",
    page_icon="🗺️",
    layout="wide"
)

st.title("🗺️ GeoJSON Feature Test")

# Sample GeoJSON data with points
sample_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-118.244, 34.052]  # Los Angeles
            },
            "properties": {
                "name": "Los Angeles",
                "population": 3990456
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-122.419, 37.775]  # San Francisco
            },
            "properties": {
                "name": "San Francisco",
                "population": 883305
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-73.935, 40.730]  # New York
            },
            "properties": {
                "name": "New York",
                "population": 8336817
            }
        }
    ]
}

st.subheader("Test Cases")

# Test 1: Map without GeoJSON
st.write("**Test 1: Basic map without GeoJSON data**")
result1 = st_geomap(key="test_basic")
if result1:
    st.json(result1)

st.write("---")

# Test 2: Map with GeoJSON
st.write("**Test 2: Map with GeoJSON point data**")
result2 = st_geomap(geojson=sample_geojson, key="test_geojson")
if result2:
    st.json(result2)

st.write("---")

# Test 3: Show the GeoJSON data
st.write("**Sample GeoJSON Data:**")
st.json(sample_geojson)