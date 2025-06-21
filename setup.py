from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="streamlit-geomap",
    version="0.1.0",
    author="gisfromscratch",
    description="A custom Streamlit component for rendering interactive geospatial maps using the ArcGIS Maps SDK for JavaScript",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/gisfromscratch/streamlit-geomap",
    packages=find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "streamlit >= 1.0.0",
    ],
)