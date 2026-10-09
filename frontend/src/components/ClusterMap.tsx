"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

interface ClusterMapProps {
  clusters: any[];
  selectedCluster: any | null;
  onSelectCluster: (cluster: any) => void;
  className?: string;
}

const DynamicClusterMapInner = dynamic(
  () => import("./ClusterMapInner").then((mod) => mod.ClusterMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] bg-slate-100 border border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 animate-pulse">
        <MapPin className="w-8 h-8 text-emerald-600 mb-2 animate-bounce" />
        <span className="text-sm font-semibold text-slate-700">
          Loading Interactive Spatial Map...
        </span>
        <span className="text-xs text-slate-500 mt-1">Initializing Google Maps engine</span>
      </div>
    ),
  }
);

export const ClusterMap: React.FC<ClusterMapProps> = (props) => {
  return <DynamicClusterMapInner {...props} />;
};
