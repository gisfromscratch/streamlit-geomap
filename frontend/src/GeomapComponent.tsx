import React, { createRef } from "react";
import { Streamlit, withStreamlitConnection } from "streamlit-component-lib";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import "./GeomapComponent.css";

interface GeomapProps {
  args: {
    width: number;
    height?: string;
    basemap?: string;
    center?: [number, number];
    zoom?: number;
    layers?: Array<{
      url: string;
      title?: string;
      type?: string;
    }>;
    geojson?: any; // Added geojson argument
  };
  width: number;
  disabled: boolean;
}

class GeomapComponent extends React.Component<GeomapProps> {
  private mapRef = createRef<HTMLDivElement>();
  private mapView: MapView | null = null;

  componentDidMount() {
    this.initializeMap();
  }

  componentDidUpdate(prevProps: GeomapProps) {
    if (JSON.stringify(prevProps.args) !== JSON.stringify(this.props.args)) {
      this.initializeMap();
    }
  }

  componentWillUnmount() {
    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }
  }

  initializeMap() {
    if (!this.mapRef.current) {
      console.error("Map container not found");
      return;
    }

    if (this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }

    const graphicsLayer = new GraphicsLayer();
    const basemap = this.props.args.basemap || "topo-vector";
    const center = this.props.args.center || [-118.244, 34.052];
    const zoom = this.props.args.zoom || 12;

    console.log("Initializing map with args:", this.props.args);

    const featureLayers = this.createFeatureLayers(this.props.args.layers);

    const map = new Map({
      basemap,
      layers: [graphicsLayer, ...featureLayers],
    });

    this.addGeoJsonFeatures(graphicsLayer);

    this.mapView = new MapView({
      container: this.mapRef.current,
      map,
      center,
      zoom,
    });

    this.mapView.when(() => {
      const frameHeight = parseInt(this.props.args.height || "400", 10); // Parse height as number
      Streamlit.setFrameHeight(frameHeight); // Explicitly set frame height
      Streamlit.setComponentReady();
    }).catch((err) => {
      console.error("Failed to initialize map:", err);
    });
  }

  private createFeatureLayers(layers: GeomapProps["args"]["layers"]) {
    return (layers?.map((config) => {
      if (config.type && config.type === "feature") {
        const layerConfig: any = {
          url: config.url,
          title: config.title,
          //visible: config.visible,
          //renderer: config.renderer,
          //labelInfo: config.label_info,
        };
        return new FeatureLayer(layerConfig);
      }
      return null;
    }) || []).filter((layer): layer is FeatureLayer => layer !== null);
  }

  private addGeoJsonFeatures(graphicsLayer: GraphicsLayer) {
    if (this.props.args.geojson) {
      const geojsonGraphics = this.props.args.geojson.features.map((feature: any) => {
        let geometry;
        const { type, coordinates } = feature.geometry;

        if (type === "Point") {
          geometry = new Point({
            x: coordinates[0],
            y: coordinates[1],
          });
        } else if (type === "LineString") {
          /*
          geometry = new __import__('@arcgis/core/geometry/Polyline').default({
            paths: [coordinates],
          });
          */
          return null;
        } else if (type === "Polygon") {
          /*
          geometry = new __import__('@arcgis/core/geometry/Polygon').default({
            rings: coordinates,
          });
          */
          return null;
        } else {
          // Unsupported geometry type
          return null;
        }

        const attributes = feature.properties;
        return new Graphic({ geometry, attributes });
      }).filter(Boolean);
      graphicsLayer.addMany(geojsonGraphics);
    }
  }

  render() {
    const { width = "100%", height = "400px" } = this.props.args;

    return (
      <div style={{ width, height }}>
        <div ref={this.mapRef} className="map-container"></div>
      </div>
    );
  }
}

export default withStreamlitConnection(GeomapComponent);