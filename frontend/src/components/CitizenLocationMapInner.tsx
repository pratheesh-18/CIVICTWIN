"use client";

import React, { useEffect, useRef } from "react";
import { useGoogleMaps } from "../lib/googleMaps";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";

interface CitizenLocationMapInnerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  resolvedAddress?: string;
}

export const CitizenLocationMapInner: React.FC<CitizenLocationMapInnerProps> = ({
  latitude,
  longitude,
  onLocationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);

  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapInstanceRef.current) return;

    try {
      const initialPos = {
        lat: Number(latitude) || 13.0827,
        lng: Number(longitude) || 80.2707,
      };

      const map = new google.maps.Map(containerRef.current, {
        center: initialPos,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_LEFT,
        },
        fullscreenControl: false,
        gestureHandling: "greedy",
      });

      // Custom SVG Pin Icon for CivicTwin
      const pinIcon: google.maps.Icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/>
              </filter>
            </defs>
            <path d="M19 0C8.5 0 0 8.5 0 19C0 32 19 48 19 48C19 48 38 32 38 19C38 8.5 29.5 0 19 0Z" fill="#047857" filter="url(#shadow)"/>
            <circle cx="19" cy="18" r="8" fill="#ffffff"/>
            <circle cx="19" cy="18" r="4.5" fill="#065f46"/>
          </svg>`
        )}`,
        scaledSize: new google.maps.Size(38, 48),
        anchor: new google.maps.Point(19, 48),
      };

      const marker = new google.maps.Marker({
        position: initialPos,
        map: map,
        draggable: true,
        title: "Incident Location (Drag to adjust)",
        animation: google.maps.Animation.DROP,
        icon: pinIcon,
      });

      // Handle marker dragend
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          isInternalUpdateRef.current = true;
          const newLat = parseFloat(pos.lat().toFixed(6));
          const newLng = parseFloat(pos.lng().toFixed(6));
          onLocationChange(newLat, newLng);
          setTimeout(() => {
            isInternalUpdateRef.current = false;
          }, 100);
        }
      });

      // Handle map click to reposition marker
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          isInternalUpdateRef.current = true;
          marker.setPosition(e.latLng);
          const newLat = parseFloat(e.latLng.lat().toFixed(6));
          const newLng = parseFloat(e.latLng.lng().toFixed(6));
          onLocationChange(newLat, newLng);
          setTimeout(() => {
            isInternalUpdateRef.current = false;
          }, 100);
        }
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    } catch (err) {
      console.error("Error creating Google Map instance:", err);
    }

    return () => {
      if (markerInstanceRef.current) {
        google.maps.event.clearInstanceListeners(markerInstanceRef.current);
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update map and marker position when latitude/longitude change from outside
  useEffect(() => {
    if (isInternalUpdateRef.current) return;
    if (!mapInstanceRef.current || !markerInstanceRef.current) return;

    const newPos = new google.maps.LatLng(latitude, longitude);
    markerInstanceRef.current.setPosition(newPos);
    mapInstanceRef.current.panTo(newPos);
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[280px] bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-600 mb-2" />
        <span className="text-sm font-bold text-amber-900">
          Google Maps Demo Key Loading Notice
        </span>
        <span className="text-xs text-amber-700 mt-1 max-w-sm">
          {loadError.message || "Failed to load Google Maps script."}
        </span>
        <div className="mt-3 text-xs font-mono bg-white/80 px-2 py-1 rounded border border-amber-300 text-slate-700">
          Lat: {latitude}, Lng: {longitude}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden border border-slate-200">
      {!isLoaded && (
        <div className="absolute inset-0 z-20 bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="w-7 h-7 text-emerald-700 animate-spin mb-2" />
          <span className="text-sm font-semibold text-slate-700">
            Loading Google Map...
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Initializing Google Maps engine
          </span>
        </div>
      )}

      {/* The Google Map DOM Node */}
      <div ref={containerRef} className="w-full h-full min-h-[280px] z-10" />

      {/* Map Drag Hint Badge */}
      <div className="absolute top-2.5 right-2.5 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 pointer-events-none flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
        <span>Drag pin or click map</span>
      </div>
    </div>
  );
};
