"""
Test script to validate the Streamlit Geomap component setup.
"""

def test_component_import():
    """Test that the component can be imported successfully."""
    try:
        from streamlit_geomap import st_geomap
        print("✅ Component import successful")
        return True
    except ImportError as e:
        print(f"❌ Component import failed: {e}")
        return False

def test_component_structure():
    """Test that the component has the expected structure."""
    try:
        from streamlit_geomap import st_geomap
        import inspect
        
        # Check if the function is callable
        if not callable(st_geomap):
            print("❌ st_geomap is not callable")
            return False
            
        # Check function signature
        sig = inspect.signature(st_geomap)
        expected_params = ['key']
        actual_params = list(sig.parameters.keys())
        
        for param in expected_params:
            if param not in actual_params:
                print(f"❌ Expected parameter '{param}' not found in function signature")
                return False
                
        print("✅ Component structure validation successful")
        return True
    except Exception as e:
        print(f"❌ Component structure validation failed: {e}")
        return False

def test_frontend_build():
    """Test that the frontend build files exist."""
    import os
    build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "build")
    
    if not os.path.exists(build_path):
        print("❌ Frontend build directory not found")
        return False
        
    build_files = os.listdir(build_path)
    if not build_files:
        print("❌ Frontend build directory is empty")
        return False
        
    print("✅ Frontend build validation successful")
    return True

def main():
    """Run all tests."""
    print("🧪 Running Streamlit Geomap Component Tests")
    print("=" * 50)
    
    tests = [
        test_component_import,
        test_component_structure,
        test_frontend_build
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Component scaffold is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the setup.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)