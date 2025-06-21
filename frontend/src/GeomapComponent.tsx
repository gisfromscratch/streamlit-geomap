import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase 
} from "streamlit-component-lib"
import MapView from "@arcgis/core/views/MapView"
import Map from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import FeatureLayer from "@arcgis/core/layers/FeatureLayer"
import Point from "@arcgis/core/geometry/Point"
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol"
import esriConfig from "@arcgis/core/config"

interface State {
  mapLoaded?: boolean
  error?: string
  selectedGraphics?: Graphic[]
}

// Interface for GeoJSON Feature
interface GeoJSONFeature {
  type: string
  geometry: {
    type: string
    coordinates: number[]
  }
  properties?: Record<string, any>
}

// Interface for GeoJSON FeatureCollection
interface GeoJSONFeatureCollection {
  type: string
  features: GeoJSONFeature[]
}

// Interface for FeatureLayer configuration
interface FeatureLayerConfig {
  url?: string
  portal_item_id?: string
  api_key?: string
  oauth_token?: string
  renderer?: any
  label_info?: any
  title?: string
  visible?: boolean
}

/**
 * Streamlit Geomap Component
 * 
 * A custom Streamlit component for rendering interactive geospatial maps
 * using the ArcGIS Maps SDK for JavaScript.
 */
class GeomapComponent extends StreamlitComponentBase<State> {
  private mapRef = React.createRef<HTMLDivElement>()
  private mapView: MapView | null = null
  private graphicsLayer: GraphicsLayer | null = null
  private featureLayers: FeatureLayer[] = []

  public state: State = {
    mapLoaded: false,
    error: undefined,
    selectedGraphics: []
  }

  public render = (): React.ReactNode => {
    const { mapLoaded, error } = this.state
    
    return (
      <div style={{ width: "100%", height: "400px" }}>
        <div 
          ref={this.mapRef}
          style={{ 
            width: "100%", 
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5"
          }}
        >
          {!mapLoaded && !error && (
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#666"
            }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px 0" }}>Loading Map...</h3>
                <p style={{ margin: 0 }}>
                  Initializing ArcGIS Maps SDK
                </p>
              </div>
            </div>
          )}
          {error && (
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#d32f2f"
            }}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px 0" }}>Map Error</h3>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  public componentDidMount = (): void => {
    // Initialize the map when component mounts
    this.initializeMap()
  }

  public componentDidUpdate = (): void => {
    // Update graphics if GeoJSON data has changed
    const currentGeoJSON = this.props.args.geojson
    const currentFeatureLayers = this.props.args.feature_layers as FeatureLayerConfig[]
    
    if (this.mapView && this.graphicsLayer) {
      // Clear existing graphics
      this.graphicsLayer.removeAll()
      
      // Add new graphics if GeoJSON is provided
      if (currentGeoJSON && currentGeoJSON.features && currentGeoJSON.features.length > 0) {
        const graphics = this.processGeoJSON(currentGeoJSON as GeoJSONFeatureCollection)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          this.mapView.goTo(graphics)
        }
      }
      
      // Handle feature layer updates
      if (currentFeatureLayers && Array.isArray(currentFeatureLayers) && this.mapView && this.mapView.map) {
        // Remove existing feature layers
        this.featureLayers.forEach(layer => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.remove(layer)
          }
          layer.destroy()
        })
        
        // Create and add new feature layers
        this.featureLayers = this.createFeatureLayers(currentFeatureLayers)
        this.featureLayers.forEach(layer => {
          if (this.mapView && this.mapView.map) {
            this.mapView.map.add(layer)
          }
        })
      }
    }
  }

  public componentWillUnmount = (): void => {
    // Clean up the map view when component unmounts
    if (this.mapView) {
      this.mapView.destroy()
      this.mapView = null
    }
    if (this.graphicsLayer) {
      this.graphicsLayer = null
    }
    // Clean up feature layers
    this.featureLayers.forEach(layer => {
      layer.destroy()
    })
    this.featureLayers = []
  }

  private createFeatureLayers = (configs: FeatureLayerConfig[]): FeatureLayer[] => {
    const layers: FeatureLayer[] = []
    
    configs.forEach(config => {
      try {
        // Handle authentication
        if (config.api_key) {
          esriConfig.apiKey = config.api_key
        }
        
        // Create FeatureLayer configuration
        const layerConfig: any = {}
        
        if (config.url) {
          layerConfig.url = config.url
        } else if (config.portal_item_id) {
          layerConfig.portalItem = {
            id: config.portal_item_id
          }
        } else {
          console.warn("FeatureLayer config must include either 'url' or 'portal_item_id'")
          return
        }
        
        // Add optional properties
        if (config.title) {
          layerConfig.title = config.title
        }
        
        if (config.visible !== undefined) {
          layerConfig.visible = config.visible
        }
        
        if (config.renderer) {
          layerConfig.renderer = config.renderer
        }
        
        if (config.label_info) {
          layerConfig.labelingInfo = config.label_info
        }
        
        // Handle OAuth token if provided
        if (config.oauth_token) {
          // Note: OAuth token handling would typically be done at the esriConfig level
          // or through IdentityManager, but for simplicity we'll set it as a custom request header
          layerConfig.customParameters = {
            token: config.oauth_token
          }
        }
        
        const featureLayer = new FeatureLayer(layerConfig)
        layers.push(featureLayer)
        
      } catch (error) {
        console.error("Error creating FeatureLayer:", error, config)
      }
    })
    
    return layers
  }

  private addEventHandlers = (): void => {
    if (!this.mapView) return

    // Handle map click events
    this.mapView.on("click", (event) => {
      this.handleMapClick(event)
    })

    // Handle pointer move for hover effects
    this.mapView.on("pointer-move", (event) => {
      this.handlePointerMove(event)
    })
  }

  private handleMapClick = async (event: any): Promise<void> => {
    if (!this.mapView) return

    try {
      // Get screen point from the event
      const screenPoint = {
        x: event.x,
        y: event.y
      }

      // Convert screen point to map point
      const mapPoint = this.mapView.toMap(screenPoint)

      // Hit test to find graphics at click location
      const response = await this.mapView.hitTest(screenPoint)
      
      let clickedGraphic = null
      let featureData = null

      // Check if we clicked on a graphic
      if (response.results.length > 0) {
        const hitResult = response.results[0]
        if (hitResult.type === "graphic" &&  hitResult.graphic && hitResult.graphic.geometry) {
          clickedGraphic = hitResult.graphic
          featureData = {
            attributes: hitResult.graphic.attributes || {},
            geometry: {
              type: hitResult.graphic.geometry.type,
              coordinates: hitResult.graphic.geometry.type === "point" 
                ? [(hitResult.graphic.geometry as any).longitude, (hitResult.graphic.geometry as any).latitude]
                : null
            }
          }

          // Handle selection
          this.handleFeatureSelection(hitResult.graphic)
        }
      }

      // Send click event data back to Streamlit
      this.props.args.Streamlit.setComponentValue({
        event: "map_clicked",
        coordinates: [mapPoint.longitude, mapPoint.latitude],
        screenPoint: screenPoint,
        feature: featureData,
        hasFeature: clickedGraphic !== null,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error("Error handling map click:", error)
    }
  }

  private handlePointerMove = async (event: any): Promise<void> => {
    if (!this.mapView) return

    try {
      // Get screen point from the event
      const screenPoint = {
        x: event.x,
        y: event.y
      }

      // Hit test to find graphics at hover location
      const response = await this.mapView.hitTest(screenPoint)
      
      let hoveredFeature = null

      // Check if we're hovering over a graphic
      if (response.results.length > 0) {
        const hitResult = response.results[0]
        if (hitResult.type === "graphic" && hitResult.graphic && hitResult.graphic.geometry) {
          hoveredFeature = {
            attributes: hitResult.graphic.attributes || {},
            geometry: {
              type: hitResult.graphic.geometry.type,
              coordinates: hitResult.graphic.geometry.type === "point" 
                ? [(hitResult.graphic.geometry as any).longitude, (hitResult.graphic.geometry as any).latitude]
                : null
            }
          }

          // Change cursor to pointer when hovering over features
          if (this.mapView && this.mapView.container) {
            this.mapView.container.style.cursor = "pointer"
          }
        }
      } else {
        // Reset cursor when not hovering over features
        if (this.mapView && this.mapView.container) {
          this.mapView.container.style.cursor = "grab"
        }
      }

      // Only send hover events if there's a feature being hovered
      if (hoveredFeature) {
        this.props.args.Streamlit.setComponentValue({
          event: "feature_hovered",
          feature: hoveredFeature,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      // Silently handle hover errors to avoid console spam
    }
  }

  private handleFeatureSelection = (graphic: Graphic): void => {
    if (!this.mapView) return

    // Get current interactive settings
    const enableSelection = this.props.args.enable_selection !== false

    if (!enableSelection) return

    // Toggle selection state
    let newSelectedGraphics = [...(this.state.selectedGraphics || [])]
    
    const isAlreadySelected = newSelectedGraphics.some(g => g === graphic)
    
    if (isAlreadySelected) {
      // Deselect
      newSelectedGraphics = newSelectedGraphics.filter(g => g !== graphic)
      this.removeSelectionHighlight(graphic)
    } else {
      // Select
      newSelectedGraphics.push(graphic)
      this.addSelectionHighlight(graphic)
    }

    // Update state
    this.setState({ selectedGraphics: newSelectedGraphics })

    // Send selection event data back to Streamlit
    this.props.args.Streamlit.setComponentValue({
      event: "feature_selected",
      selectedFeatures: newSelectedGraphics.map(g => ({
        attributes: g.attributes || {},
        geometry: g.geometry ? {
          type: g.geometry.type,
          coordinates: g.geometry.type === "point" 
            ? [(g.geometry as any).longitude, (g.geometry as any).latitude]
            : null
        } : null
      })),
      selectionCount: newSelectedGraphics.length,
      timestamp: new Date().toISOString()
    })
  }

  private addSelectionHighlight = (graphic: Graphic): void => {
    if (!graphic.symbol) return

    // Create a highlight symbol based on the original
    const originalSymbol = graphic.symbol as SimpleMarkerSymbol
    const highlightSymbol = originalSymbol.clone()
    
    // Make it larger and add a bright outline
    highlightSymbol.size = (originalSymbol.size || 8) + 4
    highlightSymbol.outline = {
      color: [255, 255, 0, 1], // Yellow outline
      width: 3
    } as any

    // Store original symbol for restoration
    (graphic as any).__originalSymbol = originalSymbol
    graphic.symbol = highlightSymbol
  }

  private removeSelectionHighlight = (graphic: Graphic): void => {
    // Restore original symbol
    const originalSymbol = (graphic as any).__originalSymbol
    if (originalSymbol) {
      graphic.symbol = originalSymbol
      delete (graphic as any).__originalSymbol
    }
  }

  private initializeMap = async (): Promise<void> => {
    if (!this.mapRef.current) {
      this.setState({ error: "Map container not found" })
      return
    }

    try {
      // Create a graphics layer for GeoJSON features
      this.graphicsLayer = new GraphicsLayer()

      // Create FeatureLayers if provided
      const featureLayerConfigs = this.props.args.feature_layers as FeatureLayerConfig[]
      if (featureLayerConfigs && Array.isArray(featureLayerConfigs)) {
        this.featureLayers = this.createFeatureLayers(featureLayerConfigs)
      }

      // Create a Map instance with a basemap
      const allLayers = [this.graphicsLayer, ...this.featureLayers]
      const map = new Map({
        basemap: "topo-vector", // Topographic basemap
        layers: allLayers
      })

      // Get GeoJSON data from props
      const geojson = this.props.args.geojson as GeoJSONFeatureCollection

      // Default center and zoom
      let center: number[] = [-118.244, 34.052] // Los Angeles coordinates
      let zoom = 12

      // Create a MapView instance
      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: center,
        zoom: zoom
      })

      // Wait for the view to load
      await this.mapView.when()

      // Add interactive event handlers
      this.addEventHandlers()

      // Process GeoJSON data if provided
      if (geojson && geojson.features && geojson.features.length > 0) {
        const graphics = this.processGeoJSON(geojson)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          await this.mapView.goTo(graphics)
        }
      }
      
      this.setState({ mapLoaded: true })
      
      // Set component value to indicate successful initialization
      this.props.args.Streamlit.setComponentValue({
        status: "map_loaded",
        basemap: "topo-vector",
        center: [this.mapView.center.longitude, this.mapView.center.latitude],
        zoom: this.mapView.zoom,
        featuresRendered: geojson?.features?.length || 0,
        featureLayersLoaded: this.featureLayers.length,
        timestamp: new Date().toISOString()
      })

      console.log("ArcGIS map initialized successfully")
    } catch (error) {
      console.error("Error initializing ArcGIS map:", error)
      this.setState({ 
        error: `Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      
      // Set component value to indicate error
      this.props.args.Streamlit.setComponentValue({
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }

  private processGeoJSON = (geojson: GeoJSONFeatureCollection): Graphic[] => {
    const graphics: Graphic[] = []

    geojson.features.forEach((feature) => {
      if (feature.geometry.type === "Point") {
        const [longitude, latitude] = feature.geometry.coordinates
        
        // Create a point geometry
        const point = new Point({
          longitude,
          latitude
        })

        // Create a simple marker symbol
        const symbol = new SimpleMarkerSymbol({
          color: [226, 119, 40], // Orange color
          outline: {
            color: [255, 255, 255],
            width: 2
          },
          size: 8
        })

        // Create the graphic
        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          attributes: feature.properties || {}
        })

        graphics.push(graphic)
      }
    })

    return graphics
  }
}

export default withStreamlitConnection(GeomapComponent)