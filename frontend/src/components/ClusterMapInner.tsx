"use client";

import React, { useEffect, useRef } from "react";
import { getTierBadge } from "../lib/definitions";
import { useGoogleMaps } from "../lib/googleMaps";
import { Loader2, AlertTriangle } from "lucide-react";

interface MapClusterItem {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  category?: string;
  priority_score: number;
  report_count?: number;
  citizen_name?: string;
  status?: string;
}

interface ClusterMapInnerProps {
  clusters: MapClusterItem[];
  selectedCluster: MapClusterItem | null;
  onSelectCluster: (cluster: any) => void;
  className?: string;
}

export const ClusterMapInner: React.FC<ClusterMapInnerProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  // Helper to construct marker SVG icon
  const createMarkerIcon = (
    color: string,
    isSelected: boolean,
    tierNumber: number
  ): google.maps.Icon => {
    const size = isSelected ? 36 : tierNumber === 1 ? 28 : 24;
    const half = size / 2;
    const strokeWidth = isSelected ? 3.5 : 2;
    const pulseStroke = isSelected ? "#059669" : "#ffffff";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${half}" cy="${half}" r="${half - 2}" fill="${color}" stroke="${pulseStroke}" stroke-width="${strokeWidth}" />
        <circle cx="${half}" cy="${half}" r="${Math.max(3, half - 7)}" fill="#ffffff" opacity="${isSelected ? 0.95 : 0.8}" />
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(half, half),
    };
  };

  // Helper to build InfoWindow HTML
  const getInfoWindowContent = (c: MapClusterItem): string => {
    const tierInfo = getTierBadge(c.priority_score);
    return `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont; max-width: 240px; padding: 4px; color: #0f172a;">
        <div style="font-weight: 700; font-size: 13px; line-height: 1.3; margin-bottom: 6px; color: #020617;">
          ${escapeHtml(c.title || "Civic Incident")}
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-family: monospace; font-size: 11px; margin-bottom: 4px;">
          <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: 600;">
            #${c.id}
          </span>
          <span style="font-weight: 700; color: ${tierInfo.markerColor};">
            Score: ${c.priority_score ? c.priority_score.toFixed(2) : "0.00"}
          </span>
        </div>
        ${
          c.category
            ? `<div style="font-size: 11px; color: #475569; margin-bottom: 2px;"><b>Category:</b> ${escapeHtml(
                c.category
              )}</div>`
            : ""
        }
        ${
          c.citizen_name
            ? `<div style="font-size: 11px; color: #475569; margin-bottom: 2px;"><b>Citizen:</b> ${escapeHtml(
                c.citizen_name
              )}</div>`
            : ""
        }
        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
          Location: ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}
        </div>
        <button
          id="btn-select-incident-${c.id}"
          style="width: 100%; text-align: center; padding: 6px 0; background: #059669; color: white; font-weight: 600; border-radius: 6px; border: none; font-size: 11px; cursor: pointer; transition: background 0.15s;"
          onmouseover="this.style.background='#047857'"
          onmouseout="this.style.background='#059669'"
        >
          Select Incident
        </button>
      </div>
    `;
  };

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = selectedCluster
        ? { lat: selectedCluster.latitude, lng: selectedCluster.longitude }
        : clusters.length > 0
        ? { lat: clusters[0].latitude, lng: clusters[0].longitude }
        : { lat: 13.0827, lng: 80.2707 };

      const map = new google.maps.Map(containerRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_LEFT,
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        gestureHandling: "greedy",
      });

      infoWindowRef.current = new google.maps.InfoWindow();

      mapInstanceRef.current = map;
    } catch (err) {
      console.error("Error creating Google Map instance for clusters:", err);
    }

    return () => {
      markersRef.current.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markersRef.current.clear();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Sync Markers with clusters
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const map = mapInstanceRef.current;
    const existingMarkers = markersRef.current;

    const clusterIdSet = new Set(clusters.map((c) => c.id));

    // Remove markers that no longer exist
    existingMarkers.forEach((marker, id) => {
      if (!clusterIdSet.has(id)) {
        marker.setMap(null);
        google.maps.event.clearInstanceListeners(marker);
        existingMarkers.delete(id);
      }
    });

    // Add or update markers
    clusters.forEach((c) => {
      const isSelected = selectedCluster?.id === c.id;
      const tierInfo = getTierBadge(c.priority_score);
      const icon = createMarkerIcon(tierInfo.markerColor, isSelected, tierInfo.tier_number);
      const position = { lat: c.latitude, lng: c.longitude };

      let marker = existingMarkers.get(c.id);
      if (marker) {
        marker.setPosition(position);
        marker.setIcon(icon);
        marker.setZIndex(isSelected ? 999 : tierInfo.tier_number === 1 ? 100 : 10);
      } else {
        marker = new google.maps.Marker({
          position,
          map,
          title: c.title,
          icon,
          zIndex: isSelected ? 999 : tierInfo.tier_number === 1 ? 100 : 10,
        });

        marker.addListener("click", () => {
          onSelectCluster(c);

          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(getInfoWindowContent(c));
            infoWindowRef.current.open(map, marker);

            // Attach click handler for button inside InfoWindow
            setTimeout(() => {
              const btn = document.getElementById(`btn-select-incident-${c.id}`);
              if (btn) {
                btn.onclick = () => onSelectCluster(c);
              }
            }, 100);
          }
        });

        existingMarkers.set(c.id, marker);
      }
    });
  }, [clusters, selectedCluster, isLoaded, onSelectCluster]);

  // Handle selected cluster change (smooth pan and open InfoWindow)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCluster) return;

    const map = mapInstanceRef.current;
    const targetPos = {
      lat: selectedCluster.latitude,
      lng: selectedCluster.longitude,
    };

    map.panTo(targetPos);
    map.setZoom(15);

    const marker = markersRef.current.get(selectedCluster.id);
    if (marker && infoWindowRef.current) {
      infoWindowRef.current.setContent(getInfoWindowContent(selectedCluster));
      infoWindowRef.current.open(map, marker);

      setTimeout(() => {
        const btn = document.getElementById(`btn-select-incident-${selectedCluster.id}`);
        if (btn) {
          btn.onclick = () => onSelectCluster(selectedCluster);
        }
      }, 100);
    }
  }, [selectedCluster]);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[350px] bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-9 h-9 text-amber-600 mb-2" />
        <span className="text-sm font-bold text-amber-900">
          Google Maps Demo Key Loading Notice
        </span>
        <span className="text-xs text-amber-700 mt-1 max-w-sm">
          {loadError.message || "Failed to load Google Maps script."}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-white ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 z-20 bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <span className="text-sm font-semibold text-slate-700">
            Loading Google Spatial Map...
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Initializing Google Maps engine
          </span>
        </div>
      )}

      {/* Google Map Container DOM Element */}
      <div ref={containerRef} className="w-full h-full min-h-[350px] z-10" />

      {/* Tier Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold shadow-md space-y-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Hazard Tiers
        </span>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
            <span className="text-slate-800">Tier 1 Critical (&ge; 0.75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0"></span>
            <span className="text-slate-800">Tier 2 Urgent (0.45 - 0.74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
            <span className="text-slate-800">Tier 3 Routine (&lt; 0.45)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
