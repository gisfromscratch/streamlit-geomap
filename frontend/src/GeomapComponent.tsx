import React, { useEffect, useRef, useState } from "react";
import { Streamlit } from "streamlit-component-lib";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import "./GeomapComponent.css";

const GeomapComponent = ({ args }: { args: any }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!mapRef.current) {
      setError("Map container not found");
      return;
    }

    const graphicsLayer = new GraphicsLayer();
    const basemap = args.basemap || "topo-vector";
    const center = args.center || [-118.244, 34.052];
    const zoom = args.zoom || 12;

    const featureLayers = args.feature_layers?.map((config: any) => {
      const layerConfig: any = {
        url: config.url,
        title: config.title,
        visible: config.visible,
        renderer: config.renderer,
        labelInfo: config.label_info,
      };
      return new FeatureLayer(layerConfig);
    }) || [];

    const map = new Map({
      basemap,
      layers: [graphicsLayer, ...featureLayers],
    });

    const mapView = new MapView({
      container: mapRef.current,
      map,
      center,
      zoom,
    });

    mapView.when(() => {
      setMapLoaded(true);
      Streamlit.setComponentReady();
    }).catch((err) => {
      setError(`Failed to initialize map: ${err.message}`);
    });

    return () => {
      mapView.destroy();
    };
  }, [args]);

  const processGeoJSON = (geojson: any) => {
    return geojson.features.map((feature: any) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const point = new Point({ longitude, latitude });
      const symbol = new SimpleMarkerSymbol({
        color: [226, 119, 40],
        outline: { color: [255, 255, 255], width: 2 },
        size: 8,
      });
      return new Graphic({ geometry: point, symbol, attributes: feature.properties });
    });
  };

  useEffect(() => {
    if (mapLoaded && args.geojson) {
      const graphicsLayer = new GraphicsLayer();
      const graphics = processGeoJSON(args.geojson);
      graphicsLayer.addMany(graphics);
    }
  }, [mapLoaded, args.geojson]);

  return (
    <div style={{ width: args.width || "100%", height: args.height || "400px" }}>
      <div ref={mapRef} className="map-container">
        {!mapLoaded && !error && (
          <div className="map-loading">
            <h3>Loading Map...</h3>
          </div>
        )}
        {error && <div className="map-error">{error}</div>}
      </div>
    </div>
  );
};

export default GeomapComponent;