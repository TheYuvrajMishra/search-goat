import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  PiDownloadSimpleLight, 
  PiMagnifyingGlassLight, 
  PiMapPinLight, 
  PiPhoneLight, 
  PiGlobeLight, 
  PiEnvelopeSimpleLight, 
  PiStarFill,
  PiTableLight
} from 'react-icons/pi';

interface Business {
  name: string;
  category: string;
  address: string;
  website: string;
  phone: string;
  rating: number | null;
  reviewsCount: number;
  latitude: number | null;
  longitude: number | null;
  url: string;
  emails: string[];
}

interface MapsResultTableProps {
  businesses: Business[];
}

export const MapsResultTable: React.FC<MapsResultTableProps> = ({ businesses }) => {
  const [filterText, setFilterText] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const mapContainerId = useRef(`map-container-${Math.random().toString(36).substr(2, 9)}`);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter business list
  const filtered = businesses.filter(b => {
    const term = filterText.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      (b.category && b.category.toLowerCase().includes(term)) ||
      (b.address && b.address.toLowerCase().includes(term)) ||
      (b.emails && b.emails.some(e => e.toLowerCase().includes(term)))
    );
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    // Headers
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Website', 'Rating', 'Reviews Count', 'Emails', 'Google Maps URL'];
    
    // Rows
    const rows = filtered.map(b => [
      `"${b.name.replace(/"/g, '""')}"`,
      `"${(b.category || '').replace(/"/g, '""')}"`,
      `"${(b.address || '').replace(/"/g, '""')}"`,
      `"${(b.phone || '').replace(/"/g, '""')}"`,
      `"${(b.website || '').replace(/"/g, '""')}"`,
      b.rating || '',
      b.reviewsCount || 0,
      `"${(b.emails || []).join(', ')}"`,
      `"${b.url}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Re-render Leaflet Map on viewMode change
  useEffect(() => {
    if (viewMode !== 'map') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const container = document.getElementById(mapContainerId.current);
    if (!container) return;

    // Find center based on businesses coordinates
    const validCoords = filtered.filter(b => b.latitude !== null && b.longitude !== null);
    const centerLatLng: L.LatLngExpression = validCoords.length > 0
      ? [validCoords[0].latitude!, validCoords[0].longitude!]
      : [40.7128, -74.0060];

    const map = L.map(container, {
      center: centerLatLng,
      zoom: 14,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = [];

    // Add pins for all businesses
    const bounds: L.LatLngBoundsExpression = [];
    
    validCoords.forEach(b => {
      const pos: L.LatLngExpression = [b.latitude!, b.longitude!];
      bounds.push(pos);

      const marker = L.marker(pos)
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #1A1817;">${b.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #5D6355; text-transform: uppercase;">${b.category || ''}</p>
            ${b.phone ? `<p style="margin: 2px 0; font-size: 11px;">📞 ${b.phone}</p>` : ''}
            ${b.emails.length > 0 ? `<p style="margin: 2px 0; font-size: 11px; font-weight: 500; color: #10B981;">✉️ ${b.emails.join(', ')}</p>` : ''}
            ${b.website ? `<a href="${b.website}" target="_blank" style="font-size: 11px; color: #3b82f6; text-decoration: underline;">Visit Website</a>` : ''}
          </div>
        `);
      
      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have valid coordinates
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode, filterText]);

  return (
    <div className="w-full bg-[#FDFBF7] border border-[#1A1817]/10 rounded-[2rem] shadow-xl overflow-hidden mt-6 flex flex-col">
      {/* Header and Controls */}
      <div className="p-5 border-b border-[#1A1817]/5 bg-[#F4F1EA]/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Toggle Mode */}
        <div className="flex bg-[#F4F1EA] rounded-full p-1 border border-[#1A1817]/5 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${viewMode === 'table' ? 'bg-[#FDFBF7] text-[#1A1817] shadow-sm' : 'text-[#1A1817]/50 hover:text-[#1A1817]'}`}
          >
            <PiTableLight className="text-base" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${viewMode === 'map' ? 'bg-[#FDFBF7] text-[#1A1817] shadow-sm' : 'text-[#1A1817]/50 hover:text-[#1A1817]'}`}
          >
            <PiMapPinLight className="text-base" />
            <span>Pin Map</span>
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
          <div className="flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2 bg-[#F4F1EA] rounded-full border border-[#1A1817]/5">
            <PiMagnifyingGlassLight className="text-base text-[#1A1817]/40" />
            <input
              type="text"
              placeholder="Filter leads..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-medium text-[#1A1817] w-full sm:w-40 placeholder:text-[#1A1817]/30"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            title="Download Excel/CSV"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1817] hover:scale-105 disabled:bg-[#1A1817]/20 disabled:scale-100 text-[#FDFBF7] rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
          >
            <PiDownloadSimpleLight className="text-base" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto w-full max-h-[350px] scrollbar-hide">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-[#F4F1EA]/30 border-b border-[#1A1817]/5 text-[#1A1817]/50 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 pl-6">Business Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Emails</th>
                <th className="p-4 pr-6">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1817]/5 font-medium text-[#1A1817]/80">
              {filtered.length > 0 ? (
                filtered.map((b, i) => (
                  <tr key={i} className="hover:bg-[#F4F1EA]/20 transition-all">
                    
                    {/* Name & Site */}
                    <td className="p-4 pl-6 max-w-[200px]">
                      <div className="font-semibold text-[#1A1817] truncate">{b.name}</div>
                      <div className="text-[11px] text-[#1A1817]/40 leading-tight mt-0.5 max-w-[190px] truncate" title={b.address}>
                        {b.address}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-xs">
                      {b.category && (
                        <span className="px-2.5 py-0.5 bg-[#F4F1EA] border border-[#1A1817]/5 rounded-full text-[10px] text-[#1A1817]/60 font-bold uppercase tracking-wide">
                          {b.category}
                        </span>
                      )}
                    </td>

                    {/* Website & Phone */}
                    <td className="p-4 space-y-1">
                      {b.phone && (
                        <a href={`tel:${b.phone}`} className="flex items-center gap-1.5 text-xs text-[#1A1817]/70 hover:text-[#1A1817]">
                          <PiPhoneLight className="text-sm flex-shrink-0" />
                          <span>{b.phone}</span>
                        </a>
                      )}
                      {b.website && (
                        <a href={b.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                          <PiGlobeLight className="text-sm flex-shrink-0" />
                          <span className="truncate max-w-[130px]">{b.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        </a>
                      )}
                    </td>

                    {/* Crawled Emails */}
                    <td className="p-4">
                      {b.emails && b.emails.length > 0 ? (
                        <div className="space-y-1.5">
                          {b.emails.map((email, idx) => (
                            <a
                              key={idx}
                              href={`mailto:${email}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 rounded-full text-[11px] font-semibold transition-all"
                            >
                              <PiEnvelopeSimpleLight className="text-xs flex-shrink-0 text-emerald-700" />
                              <span>{email}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#1A1817]/30 italic">No email found</span>
                      )}
                    </td>

                    {/* Rating stars */}
                    <td className="p-4 pr-6">
                      {b.rating ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center text-amber-500 text-xs">
                            <PiStarFill />
                            <span className="ml-1 font-bold text-xs text-[#1A1817]">{b.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-[#1A1817]/40">({b.reviewsCount})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#1A1817]/30">-</span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#1A1817]/40 italic">
                    No matching lead records identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Render Bbox Marker Map */
        <div className="w-full h-[350px] relative z-10">
          <div id={mapContainerId.current} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};
