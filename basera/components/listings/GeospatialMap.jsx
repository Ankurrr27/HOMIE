'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

// Component to handle mouse clicks on the map for polygon drawing
// Component to handle mouse clicks and cursor movement on the map for polygon drawing
function MapEventsHandler({ isDrawing, onMapClick, onMouseMove }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick(e.latlng);
      }
    },
    mousemove(e) {
      if (isDrawing) {
        onMouseMove(e.latlng);
      }
    }
  });
  return null;
}
// Custom component to dynamically center the map when listings/coords update
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
}

export default function GeospatialMap({ listings, cityData, onPolygonChange }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]); // Array of { lat, lng }
  const [mousePos, setMousePos] = useState(null); // Tracks active cursor latlng
  const [finalPolygon, setFinalPolygon] = useState(null); // Array of [lat, lng]
  
  // Bengaluru coordinates default
  const defaultCoords = [12.9716, 77.5946];
  const [center, setCenter] = useState(defaultCoords);

  useEffect(() => {
    // Center map based on first listing if available, or default to cityData coordinates
    const timer = setTimeout(() => {
      if (listings.length > 0 && listings[0].coordinates?.lat) {
        setCenter([listings[0].coordinates.lat, listings[0].coordinates.lng]);
      } else if (cityData?.coordinates?.lat && cityData?.coordinates?.lng) {
        setCenter([cityData.coordinates.lat, cityData.coordinates.lng]);
      } else {
        setCenter([12.9716, 77.5946]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [listings, cityData]);

  // Fix default marker icons in Leaflet bundle
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const handleMapClick = (latlng) => {
    setDrawnPoints(prev => [...prev, latlng]);
  };

  const handleMouseMove = (latlng) => {
    setMousePos(latlng);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawnPoints([]);
    setMousePos(null);
    setFinalPolygon(null);
    onPolygonChange(null); // reset backend filter
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawnPoints([]);
    setMousePos(null);
    setFinalPolygon(null);
    onPolygonChange(null);
  };

  const completeDrawing = () => {
    if (drawnPoints.length < 3) return;
    
    // Convert to GeoJSON closed polygon formatting [lng, lat]
    // MongoDB $polygon expects arrays of [lng, lat] vertices.
    const closedPoints = [...drawnPoints, drawnPoints[0]];
    const formattedPoints = closedPoints.map(p => `${p.lng},${p.lat}`).join(';');
    
    setFinalPolygon(drawnPoints.map(p => [p.lat, p.lng]));
    setIsDrawing(false);
    setMousePos(null);
    onPolygonChange(formattedPoints);
  };

  const clearPolygon = () => {
    setDrawnPoints([]);
    setMousePos(null);
    setFinalPolygon(null);
    setIsDrawing(false);
    onPolygonChange(null);
  };

  // Custom marker icon for listings
  const markerIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'custom-listing-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-5 h-5 bg-indigo-500/20 rounded-full animate-pulse"></div>
        <div class="relative w-3.5 h-3.5 bg-indigo-650 border border-white rounded-full shadow-md"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }) : null;

  return (
    <div className={`w-full h-full relative rounded-3xl overflow-hidden border border-outline shadow-lg bg-gray-50 flex flex-col ${isDrawing ? 'drawing-active-cursor' : ''}`}>
      {/* Map Drawing Controls Overlay */}
      <div className="absolute top-4 right-4 z-40 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-outline shadow-md flex items-center gap-3">
        {!isDrawing && !finalPolygon && (
          <button 
            onClick={startDrawing}
            className="bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">draw</span>
            Draw Search Area
          </button>
        )}

        {isDrawing && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase animate-pulse pr-1">
              Placing Boundary... ({drawnPoints.length} points)
            </span>
            <button 
              disabled={drawnPoints.length < 3}
              onClick={completeDrawing}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              Close & Search
            </button>
            <button 
              onClick={cancelDrawing}
              className="border border-outline hover:bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {finalPolygon && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-indigo-650 font-bold uppercase tracking-wide">
              Boundary Active
            </span>
            <button 
              onClick={clearPolygon}
              className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
            >
              Clear Boundary
            </button>
          </div>
        )}
      </div>

      {/* Floating Guided Stepper Card */}
      {isDrawing && (
        <div className="absolute bottom-4 left-4 right-4 z-40 bg-slate-950/95 backdrop-blur-md text-white p-4.5 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col gap-1.5 max-w-xs mx-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-1 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] animate-pulse">explore</span>
            Map Boundary Guide
          </div>
          <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
            {drawnPoints.length === 0 ? (
              "1. Click anywhere on the map to set your first boundary corner."
            ) : drawnPoints.length < 3 ? (
              `2. Add ${3 - drawnPoints.length} more point${3 - drawnPoints.length > 1 ? 's' : ''} to shape a closed search area.`
            ) : (
              "3. Ready! Click the green 'Close' button or the pulsing green node to filter."
            )}
          </p>
          {drawnPoints.length > 0 && (
            <div className="flex justify-end gap-3 mt-1 text-[9px] font-bold uppercase">
              <button onClick={cancelDrawing} className="text-slate-450 hover:text-white transition">Cancel</button>
              {drawnPoints.length >= 3 && (
                <button onClick={completeDrawing} className="text-emerald-400 hover:text-emerald-300 transition">Search Area</button>
              )}
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full flex-grow z-0"
      >
        <ChangeMapView coords={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapEventsHandler 
          isDrawing={isDrawing} 
          onMapClick={handleMapClick} 
          onMouseMove={handleMouseMove}
        />

        {/* Dynamic rubber-band line preview */}
        {isDrawing && drawnPoints.length > 0 && mousePos && (
          <Polyline 
            positions={[drawnPoints[drawnPoints.length - 1], mousePos]} 
            color="#ec4899" 
            weight={2}
            dashArray="5, 5"
            opacity={0.65}
          />
        )}

        {/* Polyline connecting laid nodes */}
        {isDrawing && drawnPoints.length > 0 && (
          <Polyline 
            positions={drawnPoints.map(p => [p.lat, p.lng])} 
            color="#ec4899" 
            weight={3}
          />
        )}

        {/* Drawn points nodes with special style and click event for first node */}
        {isDrawing && drawnPoints.map((pt, idx) => {
          const isFirstNode = idx === 0;
          const showCloseHint = isFirstNode && drawnPoints.length >= 3;
          
          const nodeIcon = typeof window !== 'undefined' ? L.divIcon({
            className: `drawing-node-marker`,
            html: `
              <div class="relative flex items-center justify-center">
                ${showCloseHint ? '<div class="absolute w-5 h-5 bg-emerald-500/30 rounded-full animate-ping"></div>' : ''}
                <div class="w-3 h-3 rounded-full border border-white shadow-md ${
                  showCloseHint ? 'bg-emerald-500 scale-125' : 'bg-rose-500'
                }"></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          }) : null;

          return (
            <Marker 
              key={idx} 
              position={[pt.lat, pt.lng]} 
              icon={nodeIcon || undefined}
              eventHandlers={{
                click: () => {
                  if (showCloseHint) {
                    completeDrawing();
                  }
                }
              }}
            />
          );
        })}

        {/* Finalized search boundary */}
        {finalPolygon && (
          <Polygon 
            positions={finalPolygon} 
            color="#4f46e5" 
            fillColor="#818cf8" 
            fillOpacity={0.18}
            weight={3}
          />
        )}

        {/* Property markers */}
        {listings.map(item => {
          if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lng) return null;
          return (
            <Marker
              key={item._id}
              position={[item.coordinates.lat, item.coordinates.lng]}
              icon={markerIcon || undefined}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-3 min-w-[170px] flex flex-col gap-2 font-plus-jakarta">
                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-650 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
                      {item.subcategory || 'Stay'}
                    </span>
                    {item.isVerified && (
                      <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-primary leading-tight">{item.name}</h4>
                  <p className="text-[9px] text-gray-400 font-semibold truncate">📍 {item.locality}</p>
                  
                  <div className="text-[10px] font-bold text-primary border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span>Rent:</span>
                    <span>{item.price?.displayText || 'On Request'}</span>
                  </div>
                  
                  <Link
                    href={`/${cityData.slug}/${item.category?.slug || 'stays'}/${item._id}`}
                    className="w-full bg-primary text-white py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center block mt-1 hover:opacity-90 active:scale-98 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Inject cursor styles when drawing */}
      <style jsx global>{`
        .drawing-active-cursor .leaflet-container {
          cursor: crosshair !important;
        }
      `}</style>
    </div>
  );
}
