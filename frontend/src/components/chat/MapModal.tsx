import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { 
  PiMapPinLight, 
  PiSelectionBackgroundLight, 
  PiTrashLight, 
  PiMagnifyingGlassLight, 
  PiXLight,
  PiClockCountdownLight,
  PiArrowRightLight
} from 'react-icons/pi';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateScrape: (params: {
    query: string;
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
    limit: number;
  }) => void;
  initialQuery?: string;
}

// Fix default Leaflet marker assets using CDN
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, onInitiateScrape, initialQuery = '' }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Scrape parameter state
  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(15);
  const [bbox, setBbox] = useState<{
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  } | null>(null);

  // Search location state
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  // Refs to share draw states inside leaflet event handlers without re-binding
  const isDrawingModeRef = useRef(false);
  const isDrawingActiveRef = useRef(false);
  const startLatLngRef = useRef<L.LatLng | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    isDrawingModeRef.current = isDrawingMode;
  }, [isDrawingMode]);

  // Handle map setup on modal open
  useEffect(() => {
    if (!isOpen || !mapDivRef.current) return;

    // Initialize Map centered on NYC
    const map = L.map(mapDivRef.current, {
      center: [40.7128, -74.0060],
      zoom: 13,
      zoomControl: false // position it manually on the right
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    // Listeners for rectangle drawing
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!isDrawingModeRef.current) return;

      if (!isDrawingActiveRef.current) {
        // Step 1: Click first corner
        isDrawingActiveRef.current = true;
        startLatLngRef.current = e.latlng;
        
        if (rectangleRef.current) {
          rectangleRef.current.remove();
          rectangleRef.current = null;
        }

        rectangleRef.current = L.rectangle(L.latLngBounds(e.latlng, e.latlng), {
          color: '#1A1817',
          weight: 2,
          fillColor: '#1A1817',
          fillOpacity: 0.15,
          dashArray: '5, 5'
        }).addTo(map);

      } else {
        // Step 2: Click second corner to lock box
        isDrawingActiveRef.current = false;
        
        if (startLatLngRef.current && rectangleRef.current) {
          const bounds = rectangleRef.current.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          
          setBbox({
            minLat: sw.lat,
            minLng: sw.lng,
            maxLat: ne.lat,
            maxLng: ne.lng
          });

          // Style locked rectangle green
          rectangleRef.current.setStyle({
            color: '#10B981',
            weight: 2,
            fillColor: '#10B981',
            fillOpacity: 0.1,
            dashArray: undefined
          });
        }
        
        setIsDrawingMode(false);
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!isDrawingModeRef.current || !isDrawingActiveRef.current || !startLatLngRef.current || !rectangleRef.current) return;
      rectangleRef.current.setBounds(L.latLngBounds(startLatLngRef.current, e.latlng));
    });

    // Clean up drawing resources on unmount
    return () => {
      if (rectangleRef.current) {
        rectangleRef.current.remove();
      }
      map.remove();
      mapRef.current = null;
    };
  }, [isOpen]);

  // Adjust cursor class on drawing mode change
  useEffect(() => {
    if (mapRef.current) {
      const container = mapRef.current.getContainer();
      if (isDrawingMode) {
        container.style.cursor = 'crosshair';
      } else {
        container.style.cursor = '';
      }
    }
  }, [isDrawingMode]);

  // OSM Nominatim Geocoder Search
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSearch.trim() || !mapRef.current) return;

    setIsSearchingLoc(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        
        mapRef.current.setView([latNum, lonNum], 13);
        
        // Add a temporary marker to label search result
        const searchMarker = L.marker([latNum, lonNum]).addTo(mapRef.current);
        searchMarker.bindPopup(`<b>${data[0].display_name.split(',')[0]}</b>`).openPopup();
        
        // Remove marker after 5 seconds
        setTimeout(() => {
          if (mapRef.current) {
            searchMarker.remove();
          }
        }, 5000);
      } else {
        alert('Location not found. Try entering a different city or address.');
      }
    } catch (error) {
      console.error('Nominatim search failed:', error);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const handleClearBbox = () => {
    if (rectangleRef.current) {
      rectangleRef.current.remove();
      rectangleRef.current = null;
    }
    setBbox(null);
    isDrawingActiveRef.current = false;
    startLatLngRef.current = null;
  };

  const handleSubmit = () => {
    if (!query.trim()) {
      alert('Please enter a business type to search (e.g. Bakeries).');
      return;
    }
    if (!bbox) {
      alert('Please select a search area on the map first.');
      return;
    }
    
    onInitiateScrape({
      query: query.trim(),
      minLat: bbox.minLat,
      minLng: bbox.minLng,
      maxLat: bbox.maxLat,
      maxLng: bbox.maxLng,
      limit
    });
    
    // Close modal after initiating
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 select-none bg-[#1A1817]/40 backdrop-blur-md">
          {/* Modal Backdrop Close Trigger */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-5xl h-[85vh] bg-[#FDFBF7] rounded-[2.5rem] border border-[#1A1817]/10 shadow-2xl flex flex-col md:flex-row overflow-hidden pointer-events-auto"
          >
            {/* LEFT SIDE: MAP VIEWER */}
            <div className="flex-1 h-2/3 md:h-full relative bg-[#F4F1EA]">
              <div ref={mapDivRef} className="w-full h-full z-10" />

              {/* Floating Geocoding Search Bar */}
              <div className="absolute top-4 left-4 right-4 z-20 max-w-md bg-[#FDFBF7]/95 backdrop-blur shadow-[0_10px_30px_rgba(26,24,23,0.06)] rounded-full border border-[#1A1817]/10 p-1">
                <form onSubmit={handleLocationSearch} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 pl-4">
                    <PiMagnifyingGlassLight className="text-lg text-[#1A1817]/40" />
                    <input
                      type="text"
                      placeholder="Search city, address or landmark..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-[14px] text-[#1A1817] placeholder:text-[#1A1817]/30 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingLoc}
                    className="px-4 py-2 bg-[#1A1817] text-[#FDFBF7] text-xs font-bold uppercase tracking-wider rounded-full hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  >
                    {isSearchingLoc ? 'Finding...' : 'Find'}
                  </button>
                </form>
              </div>

              {/* Bounding Box Drawing Mode Overlay Prompt */}
              {isDrawingMode && (
                <div className="absolute inset-x-4 bottom-4 z-20 pointer-events-none flex justify-center">
                  <div className="bg-[#1A1817]/90 text-[#FDFBF7] text-xs md:text-sm font-medium py-3 px-6 rounded-full shadow-lg border border-[#FDFBF7]/15 backdrop-blur flex items-center gap-2 animate-pulse">
                    <PiSelectionBackgroundLight className="text-lg" />
                    <span>Click once to set a corner, move mouse, and click again to lock box.</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: CONFIGURATION PANEL */}
            <div className="w-full md:w-[360px] border-t md:border-t-0 md:border-l border-[#1A1817]/10 flex flex-col h-1/3 md:h-full bg-[#FDFBF7]">
              
              {/* Header */}
              <div className="p-6 border-b border-[#1A1817]/5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-[20px] font-semibold text-[#1A1817]">Map Lead Harvester</h3>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#1A1817]/40">Scrape business listings</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#1A1817]/5 text-[#1A1817]/60 hover:text-[#1A1817] transition-all"
                >
                  <PiXLight className="text-xl" />
                </button>
              </div>

              {/* Panel Scroll Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Target Query Input */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[#1A1817]/60">Business Type / Query</label>
                  <input
                    type="text"
                    placeholder="e.g. Bakeries, Gyms, Dentists"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-3.5 bg-[#F4F1EA] border border-[#1A1817]/10 rounded-xl text-[14px] font-medium outline-none focus:border-[#1A1817] focus:bg-white transition-all duration-300"
                  />
                </div>

                {/* 2. Drawing Area Controls */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-[#1A1817]/60">Scraping Boundary</label>
                  
                  {!bbox ? (
                    <button
                      onClick={() => setIsDrawingMode(true)}
                      className="w-full flex items-center justify-center gap-2.5 py-4 border border-dashed border-[#1A1817]/20 hover:border-[#1A1817]/60 rounded-xl bg-[#F4F1EA]/30 hover:bg-[#F4F1EA]/70 text-[#1A1817] font-medium text-[13px] transition-all cursor-pointer"
                    >
                      <PiSelectionBackgroundLight className="text-lg" />
                      <span>Draw Search Bounding Box</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <PiMapPinLight className="text-lg" />
                        </div>
                        <div className="text-left">
                          <span className="text-[12px] font-semibold text-emerald-800">Bounding Box Set</span>
                          <div className="text-[9px] text-emerald-700/60 font-mono tracking-tight leading-none mt-0.5">
                            {bbox.minLat.toFixed(4)}, {bbox.minLng.toFixed(4)} to {bbox.maxLat.toFixed(4)}, {bbox.maxLng.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleClearBbox}
                        title="Delete boundary"
                        className="p-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-900 transition-all cursor-pointer"
                      >
                        <PiTrashLight className="text-base" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Limit Sliders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest font-black text-[#1A1817]/60">Maximum Listings</label>
                    <span className="text-[11px] font-bold text-[#1A1817]">{limit} businesses</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    step="1"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="w-full accent-[#1A1817] cursor-pointer"
                  />
                  <div className="text-[9px] text-[#1A1817]/40 leading-tight italic flex gap-1 items-start mt-1">
                    <PiClockCountdownLight className="text-xs flex-shrink-0 mt-0.5" />
                    <span>Scraping details and finding email credentials takes ~2 seconds per business listing.</span>
                  </div>
                </div>

              </div>

              {/* Action Button Footer */}
              <div className="p-6 border-t border-[#1A1817]/5">
                <button
                  onClick={handleSubmit}
                  disabled={!bbox || !query.trim()}
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-[#1A1817] disabled:bg-[#1A1817]/10 text-[#FDFBF7] disabled:text-[#1A1817]/20 text-[14px] font-bold uppercase tracking-widest rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:pointer-events-none cursor-pointer shadow-lg hover:shadow-xl"
                >
                  <span>Begin Search Mode</span>
                  <PiArrowRightLight className="text-lg" />
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
