import React from "react"
import { 
  withStreamlitConnection, 
  StreamlitComponentBase,
  Streamlit
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
  private lastHoveredFeature: any = null
  private hoverThrottleTimeout: NodeJS.Timeout | null = null
  private isUnmounted: boolean = false
  private domObserver: MutationObserver | null = null

  public state: State = {
    mapLoaded: false,
    error: undefined,
    selectedGraphics: []
  }

  public render = (): React.ReactNode => {
    console.log("🔄 REACT LIFECYCLE: render() called")
    console.log("🔍 RENDER STATE: mapLoaded =", this.state.mapLoaded)
    console.log("🔍 RENDER STATE: error =", this.state.error)
    console.log("🔍 RENDER STATE: isUnmounted =", this.isUnmounted)
    console.log("🔍 RENDER STATE: mapView exists =", !!this.mapView)
    
    const { mapLoaded, error } = this.state
    
    // Get size props from arguments, with defaults
    const height = this.props.args.height || "400px"
    const width = this.props.args.width || "100%"
    
    console.log("🔍 RENDER PROPS: width =", width, "height =", height)
    
    return (
      <div style={{ width: width, height: height }}>
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
    console.log("🔄 REACT LIFECYCLE: componentDidMount() called")
    console.log("🔍 DOM STATE: mapRef.current exists:", !!this.mapRef.current)
    console.log("🔍 DOM STATE: mapRef.current.isConnected:", this.mapRef.current?.isConnected)
    console.log("🔍 DOM STATE: mapRef.current.children.length:", this.mapRef.current?.children.length)
    
    // Set up DOM mutation observer to catch unexpected DOM changes
    this.setupDOMObserver()
    
    // Signal to Streamlit that the component is ready
    Streamlit.setComponentReady()
    console.log("🗺️ Streamlit Geomap: Component ready signal sent")
    
    // Initialize the map when component mounts, but check if Streamlit is ready first
    this.initializeMapSafely()
  }

  public componentDidUpdate = (): void => {
    console.log("🔄 REACT LIFECYCLE: componentDidUpdate() called")
    console.log("🔍 DOM STATE: mapRef.current exists:", !!this.mapRef.current)
    console.log("🔍 DOM STATE: mapRef.current.isConnected:", this.mapRef.current?.isConnected)
    console.log("🔍 DOM STATE: mapRef.current.children.length:", this.mapRef.current?.children.length)
    console.log("🔍 MAPVIEW STATE: mapView exists:", !!this.mapView)
    console.log("🔍 MAPVIEW STATE: mapView.destroyed:", this.mapView?.destroyed)
    
    // Update graphics if GeoJSON data has changed
    const currentGeoJSON = this.props.args.geojson
    const currentFeatureLayers = this.props.args.feature_layers as FeatureLayerConfig[]
    
    if (this.mapView && this.graphicsLayer) {
      console.log("🔄 GRAPHICS UPDATE: Clearing existing graphics")
      // Clear existing graphics
      this.graphicsLayer.removeAll()
      
      // Add new graphics if GeoJSON is provided
      if (currentGeoJSON && currentGeoJSON.features && currentGeoJSON.features.length > 0) {
        console.log("🔄 GRAPHICS UPDATE: Adding new graphics from GeoJSON")
        const graphics = this.processGeoJSON(currentGeoJSON as GeoJSONFeatureCollection)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          console.log("🔄 GRAPHICS UPDATE: Auto-centering to new graphics")
          // Ensure mapView is ready before calling goTo to avoid "Animation Manager is undefined" error
          this.mapView.when(() => {
            this.mapView?.goTo(graphics).catch((error) => {
              console.warn("Failed to auto-center map:", error)
            })
          })
        }
      }
      
      // Handle feature layer updates
      if (currentFeatureLayers && Array.isArray(currentFeatureLayers) && this.mapView && this.mapView.map) {
        console.log("🔄 FEATURE LAYERS UPDATE: Updating feature layers")
        console.log("🔍 BEFORE LAYER CLEANUP: mapView.map.layers.length:", this.mapView.map.layers.length)
        
        // Remove existing feature layers
        this.featureLayers.forEach((layer, index) => {
          console.log(`🔄 REMOVING LAYER ${index}: layer exists:`, !!layer)
          if (this.mapView && this.mapView.map) {
            console.log(`🔄 REMOVING LAYER ${index}: layer in map:`, this.mapView.map.layers.includes(layer))
            this.mapView.map.remove(layer)
          }
          layer.destroy()
        })
        
        console.log("🔍 AFTER LAYER CLEANUP: mapView.map.layers.length:", this.mapView.map.layers.length)
        
        // Create and add new feature layers
        this.featureLayers = this.createFeatureLayers(currentFeatureLayers)
        console.log("🔄 ADDING NEW LAYERS: count:", this.featureLayers.length)
        this.featureLayers.forEach((layer, index) => {
          console.log(`🔄 ADDING LAYER ${index}:`, layer)
          if (this.mapView && this.mapView.map) {
            this.mapView.map.add(layer)
          }
        })
        
        console.log("🔍 FINAL LAYER STATE: mapView.map.layers.length:", this.mapView.map.layers.length)
      }
    }
  }

  public componentWillUnmount = (): void => {
    console.log("🔄 REACT LIFECYCLE: componentWillUnmount() called")
    console.log("🔍 UNMOUNT STATE: mapRef.current exists:", !!this.mapRef.current)
    console.log("🔍 UNMOUNT STATE: mapRef.current.isConnected:", this.mapRef.current?.isConnected)
    console.log("🔍 UNMOUNT STATE: mapRef.current.children.length:", this.mapRef.current?.children.length)
    console.log("🔍 UNMOUNT STATE: mapView exists:", !!this.mapView)
    console.log("🔍 UNMOUNT STATE: mapView.destroyed:", this.mapView?.destroyed)
    console.log("🔍 UNMOUNT STATE: graphicsLayer exists:", !!this.graphicsLayer)
    console.log("🔍 UNMOUNT STATE: featureLayers.length:", this.featureLayers.length)
    
    // Set unmount flag to prevent further initialization
    this.isUnmounted = true
    console.log("🚩 UNMOUNT FLAG SET: isUnmounted =", this.isUnmounted)
    
    // Add a small delay to ensure any pending operations complete
    // before starting cleanup - this helps prevent race conditions
    console.log("⏰ SCHEDULING CLEANUP: setTimeout(0) to defer cleanup")
    setTimeout(() => {
      console.log("⏰ EXECUTING DEFERRED CLEANUP: Starting cleanup sequence")
      this.cleanup()
    }, 0)
    
    console.log("🔄 REACT LIFECYCLE: componentWillUnmount() completed")
  }

  private cleanup = (): void => {
    try {
      console.log("🧹 CLEANUP: Starting comprehensive map component cleanup...")
      console.log("🔍 CLEANUP STATE CHECK: isUnmounted =", this.isUnmounted)
      console.log("🔍 CLEANUP STATE CHECK: mapRef.current exists:", !!this.mapRef.current)
      console.log("🔍 CLEANUP STATE CHECK: mapRef.current.isConnected:", this.mapRef.current?.isConnected)
      console.log("🔍 CLEANUP STATE CHECK: mapRef.current.children.length:", this.mapRef.current?.children.length)
      console.log("🔍 CLEANUP STATE CHECK: mapRef.current.innerHTML length:", this.mapRef.current?.innerHTML.length)
      
      // Log all children before cleanup
      if (this.mapRef.current && this.mapRef.current.children.length > 0) {
        console.log("🔍 CLEANUP DOM CHILDREN BEFORE:")
        for (let i = 0; i < this.mapRef.current.children.length; i++) {
          const child = this.mapRef.current.children[i]
          console.log(`  Child ${i}:`, child.tagName, child.className, child.id, "connected:", child.isConnected)
        }
      }

      // Clear any pending timeouts
      if (this.hoverThrottleTimeout) {
        console.log("🧹 CLEANUP: Clearing hover throttle timeout")
        clearTimeout(this.hoverThrottleTimeout)
        this.hoverThrottleTimeout = null
      }

      // Stop DOM observer
      if (this.domObserver) {
        console.log("🧹 CLEANUP: Disconnecting DOM observer")
        this.domObserver.disconnect()
        this.domObserver = null
      }

      // Step 1: Remove event handlers first to prevent further DOM manipulation
      console.log("🧹 CLEANUP STEP 1: Removing MapView event handlers")
      if (this.mapView && !this.mapView.destroyed) {
        try {
          console.log("🔍 MAPVIEW HANDLES: Attempting to remove all event handlers")
          // Remove all event handlers to prevent them from firing during cleanup
          this.mapView.removeHandles()
          console.log("✅ MAPVIEW HANDLES: Successfully removed all event handlers")
        } catch (error) {
          // Ignore errors during event handler removal
          console.log("⚠️ MAPVIEW HANDLES: Error during removal (expected):", error)
        }
      } else {
        console.log("⏩ MAPVIEW HANDLES: Skipping - MapView null or already destroyed")
      }

      // Step 2: Clean up graphics layer before destroying MapView
      console.log("🧹 CLEANUP STEP 2: Cleaning up graphics layer")
      if (this.graphicsLayer) {
        try {
          console.log("🔍 GRAPHICS LAYER: Starting graphics layer cleanup")
          // Clear all graphics first
          if (typeof this.graphicsLayer.removeAll === 'function') {
            console.log("🔍 GRAPHICS LAYER: Removing all graphics")
            this.graphicsLayer.removeAll()
            console.log("✅ GRAPHICS LAYER: All graphics removed")
          }
          // Remove graphics layer from map if it's still attached
          if (this.mapView && this.mapView.map && !this.mapView.destroyed) {
            if (this.mapView.map.layers.includes(this.graphicsLayer)) {
              console.log("🔍 GRAPHICS LAYER: Removing from map")
              this.mapView.map.remove(this.graphicsLayer)
              console.log("✅ GRAPHICS LAYER: Removed from map")
            } else {
              console.log("ℹ️ GRAPHICS LAYER: Not attached to map, skipping removal")
            }
          }
          // Destroy the graphics layer if it has a destroy method
          if (typeof this.graphicsLayer.destroy === 'function') {
            console.log("🔍 GRAPHICS LAYER: Destroying graphics layer")
            this.graphicsLayer.destroy()
            console.log("✅ GRAPHICS LAYER: Destroyed successfully")
          }
        } catch (error) {
          console.log("⚠️ GRAPHICS LAYER: Error during cleanup:", error)
        }
        this.graphicsLayer = null
        console.log("🔍 GRAPHICS LAYER: Reference cleared")
      } else {
        console.log("⏩ GRAPHICS LAYER: Skipping - graphics layer is null")
      }

      // Step 3: Clean up feature layers before destroying MapView
      console.log("🧹 CLEANUP STEP 3: Cleaning up feature layers")
      console.log("🔍 FEATURE LAYERS: Count to clean up:", this.featureLayers.length)
      this.featureLayers.forEach((layer, index) => {
        try {
          console.log(`🔍 FEATURE LAYER ${index}: Starting cleanup`)
          // Remove layer from map first if it's still attached
          if (this.mapView && this.mapView.map && !this.mapView.destroyed && layer) {
            if (this.mapView.map.layers.includes(layer)) {
              console.log(`🔍 FEATURE LAYER ${index}: Removing from map`)
              this.mapView.map.remove(layer)
              console.log(`✅ FEATURE LAYER ${index}: Removed from map`)
            } else {
              console.log(`ℹ️ FEATURE LAYER ${index}: Not attached to map`)
            }
          }
          // Destroy layer if it exists and has a destroy method
          if (layer && typeof layer.destroy === 'function') {
            console.log(`🔍 FEATURE LAYER ${index}: Destroying layer`)
            layer.destroy()
            console.log(`✅ FEATURE LAYER ${index}: Destroyed successfully`)
          }
        } catch (error) {
          console.log(`⚠️ FEATURE LAYER ${index}: Error during cleanup:`, error)
        }
      })
      this.featureLayers = []
      console.log("🔍 FEATURE LAYERS: All references cleared")

      // Step 4: Destroy the MapView BEFORE DOM container cleanup
      console.log("🧹 CLEANUP STEP 4: Destroying MapView")
      if (this.mapView) {
        try {
          console.log("🔍 MAPVIEW DESTROY: Starting MapView destruction")
          console.log("🔍 MAPVIEW DESTROY: MapView.destroyed before =", this.mapView.destroyed)
          console.log("🔍 MAPVIEW DESTROY: MapView.container exists =", !!this.mapView.container)
          console.log("🔍 MAPVIEW DESTROY: MapView.container.isConnected =", this.mapView.container?.isConnected)
          
          // Check if the MapView is already destroyed to prevent double-destruction
          if (!this.mapView.destroyed && typeof this.mapView.destroy === 'function') {
            console.log("🔍 MAPVIEW DESTROY: Calling destroy() method")
            // CRITICAL: This must happen while the DOM container still exists
            this.mapView.destroy()
            console.log("✅ MAPVIEW DESTROY: MapView.destroy() completed")
            console.log("🔍 MAPVIEW DESTROY: MapView.destroyed after =", this.mapView.destroyed)
          } else {
            console.log("⏩ MAPVIEW DESTROY: Skipping - already destroyed or no destroy method")
          }
        } catch (error) {
          // Silently handle MapView destruction errors to prevent DOM exceptions
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.log("⚠️ MAPVIEW DESTROY: Error during destruction:", errorMsg)
          console.log("⚠️ MAPVIEW DESTROY: Error type:", error?.constructor?.name)
          console.log("⚠️ MAPVIEW DESTROY: Full error object:", error)
        }
        this.mapView = null
        console.log("🔍 MAPVIEW DESTROY: Reference cleared")
      } else {
        console.log("⏩ MAPVIEW DESTROY: Skipping - MapView is null")
      }

      // Step 5: Only clear DOM container if it still exists and is connected
      console.log("🧹 CLEANUP STEP 5: Cleaning up DOM container")
      if (this.mapRef.current) {
        try {
          console.log("🔍 DOM CLEANUP: Starting DOM container cleanup")
          console.log("🔍 DOM CLEANUP: Container.isConnected =", this.mapRef.current.isConnected)
          console.log("🔍 DOM CLEANUP: Container.children.length =", this.mapRef.current.children.length)
          console.log("🔍 DOM CLEANUP: Container.innerHTML.length =", this.mapRef.current.innerHTML.length)
          
          // Check if the container is still connected to the DOM
          if (this.mapRef.current.isConnected) {
            console.log("🔍 DOM CLEANUP: Container is connected, proceeding with child removal")
            // Use a more gentle approach to clear the container
            let childIndex = 0
            while (this.mapRef.current.firstChild) {
              try {
                const child = this.mapRef.current.firstChild
                console.log(`🔍 DOM CLEANUP: Removing child ${childIndex}:`, 
                  child.nodeName, 
                  (child as any).className || '(no class)', 
                  "connected:", child.isConnected,
                  "parentNode exists:", !!child.parentNode,
                  "parentNode is mapRef:", child.parentNode === this.mapRef.current)
                
                this.mapRef.current.removeChild(child)
                console.log(`✅ DOM CLEANUP: Successfully removed child ${childIndex}`)
                childIndex++
                
                // Safety break to prevent infinite loops
                if (childIndex > 100) {
                  console.log("🚨 DOM CLEANUP: Breaking infinite loop prevention (100+ children)")
                  break
                }
              } catch (domError) {
                // If removeChild fails, break the loop to prevent infinite attempts
                const errorMsg = domError instanceof Error ? domError.message : String(domError)
                console.log("⚠️ DOM CLEANUP: Child removal error:", errorMsg)
                console.log("⚠️ DOM CLEANUP: Error type:", domError?.constructor?.name)
                console.log("⚠️ DOM CLEANUP: Full error object:", domError)
                console.log("🚨 DOM CLEANUP: Breaking due to removeChild error")
                break
              }
            }
            console.log("🔍 DOM CLEANUP: Final container.children.length =", this.mapRef.current.children.length)
          } else {
            console.log("⏩ DOM CLEANUP: Container not connected to DOM, skipping child removal")
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.log("⚠️ DOM CLEANUP: Container cleanup error:", errorMsg)
          console.log("⚠️ DOM CLEANUP: Error type:", error?.constructor?.name)
          console.log("⚠️ DOM CLEANUP: Full error object:", error)
        }
      } else {
        console.log("⏩ DOM CLEANUP: Skipping - mapRef.current is null")
      }

      // Clear hover state
      console.log("🧹 CLEANUP STEP 6: Clearing hover state")
      this.lastHoveredFeature = null

      console.log("✅ CLEANUP: Map component cleaned up successfully")
    } catch (error) {
      // Log the error but don't throw it to prevent React from showing error boundaries
      console.log("❌ CLEANUP: Cleanup completed with errors:", error)
      console.log("❌ CLEANUP: Error type:", error?.constructor?.name)
      console.log("❌ CLEANUP: Full error object:", error)
    }
  }

  private createLayersFromConfigs = (layerConfigs: any[]): FeatureLayer[] => {
    const layers: FeatureLayer[] = []
    
    layerConfigs.forEach(config => {
      try {
        if (config.type === 'feature') {
          // Convert to FeatureLayerConfig format and use existing method
          const featureConfig: FeatureLayerConfig = {
            url: config.url,
            portal_item_id: config.portal_item_id,
            api_key: config.api_key,
            oauth_token: config.oauth_token,
            renderer: config.renderer,
            label_info: config.label_info,
            title: config.title,
            visible: config.visible
          }
          
          const featureLayers = this.createFeatureLayers([featureConfig])
          layers.push(...featureLayers)
        }
        // Note: 'geojson' and 'graphics' layer types would be handled here
        // but for now we focus on feature layers to maintain existing functionality
      } catch (error) {
        console.error("Error creating layer:", error, config)
      }
    })
    
    return layers
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
    console.log("🎯 EVENT HANDLERS: Starting event handler setup")
    if (!this.mapView) {
      console.log("⚠️ EVENT HANDLERS: MapView not available, skipping event handler setup")
      return
    }

    console.log("🎯 EVENT HANDLERS: Adding click event handler")
    // Handle map click events
    this.mapView.on("click", (event) => {
      console.log("🎯 EVENT: Map click event triggered", event)
      this.handleMapClick(event)
    })

    console.log("🎯 EVENT HANDLERS: Adding pointer-move event handler")
    // Handle pointer move for hover effects
    this.mapView.on("pointer-move", (event) => {
      // Don't log every pointer move as it's too verbose
      this.handlePointerMove(event)
    })
    
    console.log("✅ EVENT HANDLERS: All event handlers added successfully")
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
      Streamlit.setComponentValue({
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

    // Throttle hover events to avoid too much communication
    if (this.hoverThrottleTimeout) {
      clearTimeout(this.hoverThrottleTimeout)
    }

    this.hoverThrottleTimeout = setTimeout(async () => {
      try {
        // Get screen point from the event
        const screenPoint = {
          x: event.x,
          y: event.y
        }

        // Hit test to find graphics at hover location
        const response = await this.mapView!.hitTest(screenPoint)
        
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

        // Only send hover events if there's a feature being hovered and it's different from last
        if (hoveredFeature && JSON.stringify(hoveredFeature) !== JSON.stringify(this.lastHoveredFeature)) {
          this.lastHoveredFeature = hoveredFeature
          
          // Check if hover events are enabled
          const enableHover = this.props.args.enable_hover !== false
          if (enableHover) {
            Streamlit.setComponentValue({
              event: "feature_hovered",
              feature: hoveredFeature,
              timestamp: new Date().toISOString()
            })
          }
        } else if (!hoveredFeature && this.lastHoveredFeature) {
          // Clear last hovered feature when no longer hovering
          this.lastHoveredFeature = null
        }

      } catch (error) {
        // Silently handle hover errors to avoid console spam
      }
    }, 100) // Throttle to 100ms
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
    Streamlit.setComponentValue({
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

  private setupDOMObserver = (): void => {
    if (!this.mapRef.current) {
      console.log("⚠️ DOM OBSERVER: Cannot setup observer - mapRef.current is null")
      return
    }

    console.log("👁️ DOM OBSERVER: Setting up MutationObserver")
    this.domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          if (mutation.removedNodes.length > 0) {
            console.log("🚨 DOM OBSERVER: Child nodes removed from map container!")
            console.log("🔍 DOM OBSERVER: Removed nodes:", Array.from(mutation.removedNodes).map(node => ({
              nodeName: node.nodeName,
              nodeType: node.nodeType,
              className: (node as any).className || '(no class)',
              id: (node as any).id || '(no id)',
              isConnected: node.isConnected,
              parentNode: !!node.parentNode
            })))
            console.log("🔍 DOM OBSERVER: Target:", mutation.target)
            console.log("🔍 DOM OBSERVER: Stack trace:")
            console.trace("DOM removal stack trace")
          }
          if (mutation.addedNodes.length > 0) {
            console.log("➕ DOM OBSERVER: Child nodes added to map container")
            console.log("🔍 DOM OBSERVER: Added nodes:", Array.from(mutation.addedNodes).map(node => ({
              nodeName: node.nodeName,
              nodeType: node.nodeType,
              className: (node as any).className || '(no class)',
              id: (node as any).id || '(no id)'
            })))
          }
        }
        if (mutation.type === 'attributes') {
          console.log("📝 DOM OBSERVER: Attribute change on map container:", mutation.attributeName, mutation.oldValue)
        }
      })
    })

    this.domObserver.observe(this.mapRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    })
    console.log("✅ DOM OBSERVER: MutationObserver setup complete")
  }

  private initializeMapSafely = (retries: number = 0): void => {
    const maxRetries = 50 // Maximum 5 seconds of retries (50 * 100ms)
    
    // Check if component has been unmounted
    if (this.isUnmounted) {
      console.log("🗺️ Component unmounted, canceling map initialization")
      return
    }
    
    // Check if component args are ready (data from Python side)
    if (!this.props.args) {
      if (retries < maxRetries) {
        console.log(`🗺️ Streamlit args not ready, retrying in 100ms... (${retries + 1}/${maxRetries})`)
        setTimeout(() => this.initializeMapSafely(retries + 1), 100)
        return
      } else {
        // Max retries reached, show error
        console.error("🚨 Streamlit connection failed after maximum retries")
        console.error("🔧 Troubleshooting tips:")
        console.error("   - Make sure React dev server is running on port 3001 (in development)")
        console.error("   - Check that the component build is up to date (run 'npm run build')")
        console.error("   - Verify Streamlit and component are compatible versions")
        this.setState({ error: "Failed to connect to Streamlit. Please refresh the page and check the console for troubleshooting tips." })
        return
      }
    }
    
    console.log("🗺️ Streamlit connection ready, initializing map...")
    // Streamlit is ready, proceed with map initialization
    this.initializeMap()
  }

  private initializeMap = async (): Promise<void> => {
    console.log("🗺️ INIT: Starting map initialization...")
    console.log("🔍 INIT STATE: isUnmounted =", this.isUnmounted)
    
    // Check if component has been unmounted
    if (this.isUnmounted) {
      console.log("🚫 INIT: Component unmounted, canceling map initialization")
      return
    }
    
    if (!this.mapRef.current) {
      console.error("🚨 INIT: Map container not found during initialization")
      this.setState({ error: "Map container not found" })
      return
    }

    // Additional safety check: ensure the container is properly attached to the DOM
    if (!this.mapRef.current.isConnected) {
      console.error("🚨 INIT: Map container is not connected to the DOM")
      console.log("🔍 INIT DOM: Container exists:", !!this.mapRef.current)
      console.log("🔍 INIT DOM: Container.parentNode:", this.mapRef.current.parentNode)
      console.log("🔍 INIT DOM: Container.ownerDocument:", this.mapRef.current.ownerDocument)
      this.setState({ error: "Map container is not attached to DOM" })
      return
    }

    try {
      console.log("🗺️ INIT: Container validation passed, proceeding with initialization")
      console.log("🔍 INIT DOM: Container.offsetWidth =", this.mapRef.current.offsetWidth)
      console.log("🔍 INIT DOM: Container.offsetHeight =", this.mapRef.current.offsetHeight)
      console.log("🔍 INIT DOM: Container.children.length =", this.mapRef.current.children.length)

      // Create a graphics layer for GeoJSON features
      console.log("🗺️ INIT: Creating graphics layer")
      this.graphicsLayer = new GraphicsLayer()
      console.log("✅ INIT: Graphics layer created successfully")

      // Get configuration from props
      const basemap = this.props.args.basemap || "topo-vector"
      const center = this.props.args.center || [-118.244, 34.052] // Default: Los Angeles coordinates
      const zoom = this.props.args.zoom || 12
      console.log("🗺️ INIT: Configuration - basemap:", basemap, "center:", center, "zoom:", zoom)
      
      // Handle layers - support both new 'layers' and legacy 'feature_layers' 
      let allFeatureLayers: FeatureLayer[] = []
      
      // New layers prop takes precedence
      if (this.props.args.layers && Array.isArray(this.props.args.layers)) {
        console.log("🗺️ INIT: Using new 'layers' prop, count:", this.props.args.layers.length)
        const layerConfigs = this.props.args.layers
        allFeatureLayers = this.createLayersFromConfigs(layerConfigs)
      } 
      // Fallback to legacy feature_layers for backward compatibility
      else if (this.props.args.feature_layers && Array.isArray(this.props.args.feature_layers)) {
        console.log("🗺️ INIT: Using legacy 'feature_layers' prop, count:", this.props.args.feature_layers.length)
        const featureLayerConfigs = this.props.args.feature_layers as FeatureLayerConfig[]
        allFeatureLayers = this.createFeatureLayers(featureLayerConfigs)
      }
      
      this.featureLayers = allFeatureLayers
      console.log("✅ INIT: Feature layers created, count:", this.featureLayers.length)

      // Check again if component was unmounted during layer creation
      if (this.isUnmounted) {
        console.log("🚫 INIT: Component unmounted during layer creation, aborting initialization")
        return
      }

      // Create a Map instance with configurable basemap
      console.log("🗺️ INIT: Creating Map instance")
      const allLayers = [this.graphicsLayer, ...this.featureLayers]
      console.log("🗺️ INIT: Total layers to add:", allLayers.length)
      const map = new Map({
        basemap: basemap,
        layers: allLayers
      })
      console.log("✅ INIT: Map instance created successfully")

      // Get GeoJSON data from props
      const geojson = this.props.args.geojson as GeoJSONFeatureCollection
      console.log("🗺️ INIT: GeoJSON features count:", geojson?.features?.length || 0)

      // Final check before creating MapView
      if (this.isUnmounted || !this.mapRef.current || !this.mapRef.current.isConnected) {
        console.log("🚫 INIT: Component state changed, aborting MapView creation")
        console.log("🔍 INIT STATE: isUnmounted =", this.isUnmounted)
        console.log("🔍 INIT STATE: mapRef.current exists =", !!this.mapRef.current)
        console.log("🔍 INIT STATE: mapRef.current.isConnected =", this.mapRef.current?.isConnected)
        return
      }

      // Additional safety: ensure container has proper dimensions
      if (this.mapRef.current.offsetWidth === 0 || this.mapRef.current.offsetHeight === 0) {
        console.warn("🗺️ INIT: Map container has zero dimensions, initialization may fail")
        console.warn("🔍 INIT DIMENSIONS: offsetWidth =", this.mapRef.current.offsetWidth)
        console.warn("🔍 INIT DIMENSIONS: offsetHeight =", this.mapRef.current.offsetHeight)
      }

      // Create a MapView instance with configurable properties
      console.log("🗺️ INIT: Creating MapView instance")
      console.log("🔍 INIT MAPVIEW: About to create MapView with container:", this.mapRef.current)
      console.log("🔍 INIT MAPVIEW: Container tagName:", this.mapRef.current.tagName)
      console.log("🔍 INIT MAPVIEW: Container className:", this.mapRef.current.className)
      
      this.mapView = new MapView({
        container: this.mapRef.current,
        map: map,
        center: center,
        zoom: zoom
      })
      console.log("✅ INIT: MapView instance created, waiting for ready state")

      // Wait for the view to load
      console.log("🗺️ INIT: Waiting for MapView.when()")
      await this.mapView.when()
      console.log("✅ INIT: MapView.when() completed successfully")

      // Check if component was unmounted during async initialization
      if (this.isUnmounted) {
        console.log("🚫 INIT: Component unmounted during async initialization, cleaning up")
        this.cleanup()
        return
      }

      // Add interactive event handlers
      console.log("🗺️ INIT: Adding event handlers")
      this.addEventHandlers()
      console.log("✅ INIT: Event handlers added")

      // Process GeoJSON data if provided
      if (geojson && geojson.features && geojson.features.length > 0) {
        console.log("🗺️ INIT: Processing GeoJSON features")
        const graphics = this.processGeoJSON(geojson)
        console.log("🗺️ INIT: Adding graphics to layer, count:", graphics.length)
        this.graphicsLayer.addMany(graphics)
        
        // Auto-center and zoom to show all features
        if (graphics.length > 0) {
          console.log("🗺️ INIT: Auto-centering to graphics")
          await this.mapView.goTo(graphics)
          console.log("✅ INIT: Auto-centering completed")
        }
      }
      
      // Final check before setting state
      if (this.isUnmounted) {
        console.log("🚫 INIT: Component unmounted before completion, skipping state update")
        return
      }

      console.log("🗺️ INIT: Setting mapLoaded state to true")
      this.setState({ mapLoaded: true })
      
      // Set component value to indicate successful initialization
      console.log("🗺️ INIT: Sending map_loaded event to Streamlit")
      Streamlit.setComponentValue({
        event: "map_loaded",
        basemap: basemap,
        center: [this.mapView.center.longitude, this.mapView.center.latitude],
        zoom: this.mapView.zoom,
        featuresRendered: geojson?.features?.length || 0,
        featureLayersLoaded: this.featureLayers.length,
        timestamp: new Date().toISOString()
      })

      console.log("✅ INIT: ArcGIS map initialized successfully")
      console.log("🔍 FINAL STATE: mapView exists =", !!this.mapView)
      console.log("🔍 FINAL STATE: mapView.destroyed =", this.mapView?.destroyed)
      console.log("🔍 FINAL STATE: mapRef.current.children.length =", this.mapRef.current?.children.length)
    } catch (error) {
      console.error("❌ INIT: Error initializing ArcGIS map:", error)
      console.error("❌ INIT: Error type:", error?.constructor?.name)
      console.error("❌ INIT: Full error object:", error)
      
      // Only update state if component hasn't been unmounted
      if (!this.isUnmounted) {
        this.setState({ 
          error: `Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}` 
        })
        
        // Set component value to indicate error
        Streamlit.setComponentValue({
          event: "error",
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
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