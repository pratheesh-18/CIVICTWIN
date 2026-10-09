"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

interface CitizenLocationMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  resolvedAddress?: string;
}

const DynamicLocationMapInner = dynamic(
  () => import("./CitizenLocationMapInner").then((mod) => mod.CitizenLocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-slate-500 animate-pulse">
        <MapPin className="w-7 h-7 text-emerald-700 mb-2 animate-bounce" />
        <span className="text-sm font-semibold text-slate-700">
          Loading Location Map...
        </span>
        <span className="text-xs text-slate-500 mt-1">Initializing Google Maps interactive GPS view</span>
      </div>
    ),
  }
);

export const CitizenLocationMap: React.FC<CitizenLocationMapProps> = (props) => {
  return <DynamicLocationMapInner {...props} />;
};
