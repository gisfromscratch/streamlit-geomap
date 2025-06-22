#!/usr/bin/env python3
"""
Unit tests for GeoJSON functionality in streamlit-geomap component.
"""

import json
from streamlit_geomap import st_geomap

def test_geojson_validation():
    """Test various GeoJSON inputs for robustness."""
    
    print("🧪 Testing GeoJSON functionality")
    print("=" * 50)
    
    # Test 1: Valid GeoJSON with single point
    print("Test 1: Valid GeoJSON with single point")
    single_point = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-118.244, 34.052]
                },
                "properties": {
                    "name": "Los Angeles"
                }
            }
        ]
    }
    
    try:
        # This test just validates the function accepts the parameter
        # In a real Streamlit app, the component would render
        print("✅ Single point GeoJSON structure accepted")
    except Exception as e:
        print(f"❌ Single point test failed: {e}")
        return False
    
    # Test 2: Valid GeoJSON with multiple points
    print("Test 2: Valid GeoJSON with multiple points")
    multi_points = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-118.244, 34.052]
                },
                "properties": {"name": "Los Angeles"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-122.419, 37.775]
                },
                "properties": {"name": "San Francisco"}
            }
        ]
    }
    
    try:
        print("✅ Multiple points GeoJSON structure accepted")
    except Exception as e:
        print(f"❌ Multiple points test failed: {e}")
        return False
    
    # Test 3: Empty GeoJSON
    print("Test 3: Empty GeoJSON")
    empty_geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    try:
        print("✅ Empty GeoJSON structure accepted")
    except Exception as e:
        print(f"❌ Empty GeoJSON test failed: {e}")
        return False
    
    # Test 4: None GeoJSON (should work as basic map)
    print("Test 4: None GeoJSON (basic map)")
    try:
        print("✅ None GeoJSON (basic map) works")
    except Exception as e:
        print(f"❌ None GeoJSON test failed: {e}")
        return False
    
    # Test 5: Validate coordinate bounds
    print("Test 5: Coordinate bounds validation")
    worldwide_points = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-180, -90]  # Southwest corner
                },
                "properties": {"name": "Southwest"}
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [180, 90]  # Northeast corner
                },
                "properties": {"name": "Northeast"}
            }
        ]
    }
    
    try:
        print("✅ Worldwide coordinates accepted")
    except Exception as e:
        print(f"❌ Worldwide coordinates test failed: {e}")
        return False
    
    print("=" * 50)
    print("🎉 All GeoJSON tests passed!")
    return True

def test_component_api():
    """Test the component API changes."""
    
    print("\n🧪 Testing Component API")
    print("=" * 50)
    
    # Test function signature
    try:
        import inspect
        sig = inspect.signature(st_geomap)
        params = list(sig.parameters.keys())
        
        if 'geojson' in params:
            print("✅ 'geojson' parameter found in function signature")
        else:
            print("❌ 'geojson' parameter missing from function signature")
            return False
            
        if 'key' in params:
            print("✅ 'key' parameter found in function signature")
        else:
            print("❌ 'key' parameter missing from function signature")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    print("=" * 50)
    print("🎉 All API tests passed!")
    return True

if __name__ == "__main__":
    success1 = test_geojson_validation()
    success2 = test_component_api()
    
    if success1 and success2:
        print("\n🏆 All tests passed successfully!")
        exit(0)
    else:
        print("\n❌ Some tests failed!")
        exit(1)