"use client";

import React, { useState, useEffect } from "react";
import { Cluster, VerificationResponse } from "../types";
import { verifyWorkOrder } from "../lib/api";
import { addNotification } from "../lib/notifications";
import { getDefectFallbackImage, normalizeDefectImageUrl } from "../lib/defectImages";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Zap,
  LocateFixed,
  AlertCircle,
  Bell,
  Clock,
  Check,
} from "lucide-react";

interface VerifierModalProps {
  selectedCluster: Cluster | null;
  onVerificationComplete: () => void;
  className?: string;
}

export const VerifierModal: React.FC<VerifierModalProps> = ({
  selectedCluster,
  onVerificationComplete,
  className = "",
}) => {
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);

  // Management GPS location: NOT defaulted to user/citizen location!
  const [officerLat, setOfficerLat] = useState<number | null>(null);
  const [officerLon, setOfficerLon] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [promptTurnOnLocation, setPromptTurnOnLocation] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Before image source state with fallback guarantee
  const [beforeImgSrc, setBeforeImgSrc] = useState<string>("");

  // When selected problem changes, reset management upload & verification state
  useEffect(() => {
    setOfficerLat(null);
    setOfficerLon(null);
    setLocationError(null);
    setPromptTurnOnLocation(false);
    setVerificationResult(null);
    setFormError(null);
    setAfterImageFile(null);
    setAfterImagePreview(null);

    if (selectedCluster) {
      setBeforeImgSrc(
        normalizeDefectImageUrl(selectedCluster.before_image, selectedCluster.category)
      );
    } else {
      setBeforeImgSrc("");
    }
  }, [selectedCluster?.id, selectedCluster?.before_image, selectedCluster?.category]);

  if (!selectedCluster) {
    return (
      <div className={`bg-white border border-[#E2DDD3] rounded-[12px] p-6 text-center flex flex-col items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] h-full w-full box-border min-h-[300px] ${className}`}>
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 mb-3">
          <FileCheck2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Problem Selected</h3>
        <p className="text-base text-slate-500 max-w-sm mt-1 leading-relaxed">
          Select any problem from the queue or map to inspect resolution and submit proof.
        </p>
      </div>
    );
  }

  // 1. Handle Image Selection & immediately prompt to capture location
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterImageFile(file);
      setAfterImagePreview(URL.createObjectURL(file));
      setFormError(null);

      // Ask management to turn on location if not acquired yet
      if (officerLat === null || officerLon === null) {
        setPromptTurnOnLocation(true);
      }
    }
  };

  // 2. Turn on / Capture device GPS location
  const handleTurnOnLocation = () => {
    setLocationError(null);
    setFormError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser environment.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOfficerLat(pos.coords.latitude);
        setOfficerLon(pos.coords.longitude);
        setLocationLoading(false);
        setPromptTurnOnLocation(false);
      },
      (err) => {
        setLocationLoading(false);
        setLocationError(`Location access denied or unavailable: ${err.message}. Please allow browser location.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 3. Simulators for easy Hackathon demonstration & auditing test
  const handleSimulateOnSiteLocation = () => {
    if (!selectedCluster) return;
    // Offset by ~0.0001 degrees (~11 meters)
    setOfficerLat(parseFloat((selectedCluster.latitude + 0.00009).toFixed(6)));
    setOfficerLon(parseFloat((selectedCluster.longitude + 0.00009).toFixed(6)));
    setLocationError(null);
    setPromptTurnOnLocation(false);
  };

  const handleSimulateOffSiteFraudLocation = () => {
    if (!selectedCluster) return;
    // Offset by ~0.0022 degrees (~245 meters > 50m radius threshold)
    setOfficerLat(parseFloat((selectedCluster.latitude + 0.0022).toFixed(6)));
    setOfficerLon(parseFloat((selectedCluster.longitude + 0.0022).toFixed(6)));
    setLocationError(null);
    setPromptTurnOnLocation(false);
  };

  // Quick preset fills
  const handlePresetGenuineRepair = () => {
    handleSimulateOnSiteLocation();
    const dummyBlob = new Blob(["repaired photo data"], { type: "image/jpeg" });
    const dummyFile = new File([dummyBlob], "repaired_road_bitumen_fixed.jpg", { type: "image/jpeg" });
    setAfterImageFile(dummyFile);
    setAfterImagePreview("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop");
    setFormError(null);
  };

  const handlePresetUnfixedFraud = () => {
    handleSimulateOnSiteLocation();
    const dummyBlob = new Blob(["fake photo data"], { type: "image/jpeg" });
    const dummyFile = new File([dummyBlob], "fake_unrepaired_road.jpg", { type: "image/jpeg" });
    setAfterImageFile(dummyFile);
    setAfterImagePreview("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop");
    setFormError(null);
  };

  // Mathematical Haversine Distance helper (in meters)
  const calculateHaversineMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Radius of the Earth in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return parseFloat((R * c).toFixed(1));
  };

  const calculatedDistance =
    officerLat !== null && officerLon !== null && selectedCluster
      ? calculateHaversineMeters(
          selectedCluster.latitude,
          selectedCluster.longitude,
          officerLat,
          officerLon
        )
      : null;

  const isWithin50m = calculatedDistance !== null ? calculatedDistance <= 50.0 : false;

  // 4. Submit Verification
  const handleExecuteVerification = async () => {
    if (!afterImageFile) {
      setFormError("Please upload the management repair proof photo first.");
      return;
    }

    if (officerLat === null || officerLon === null) {
      setFormError("Management GPS location is required. Please click 'Turn On Device Location' or test using 'Simulate At Site'.");
      return;
    }

    setFormError(null);
    setVerifying(true);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("cluster_id", String(selectedCluster.id));
      formData.append("after_image", afterImageFile);
      formData.append("officer_lat", String(officerLat));
      formData.append("officer_lon", String(officerLon));

      const res = await verifyWorkOrder(formData);
      setVerificationResult(res);
      setVerifying(false);

      if (res.status === "VERIFIED") {
        setShowSuccessPopup(true);
        addNotification({
          targetRole: "department",
          title: "Resolution Verified!",
          message: `Work Order #${selectedCluster.id} successfully verified via 50m Geo-Fence & Multimodal AI.`,
          type: "success",
          clusterId: selectedCluster.id,
        });
      } else {
        addNotification({
          targetRole: "department",
          title: "Resolution Fraud Rejected!",
          message: `Work Order #${selectedCluster.id} rejected: ${res.reason}`,
          type: "warning",
          clusterId: selectedCluster.id,
        });
      }

      setTimeout(() => {
        onVerificationComplete();
      }, 700);
    } catch (err: any) {
      console.error("Verification execution error", err);
      setFormError(err.response?.data?.detail || "Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  return (
    <div
      className={`bg-white border border-[#E2DDD3] rounded-[12px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] relative space-y-5 w-full h-full box-border flex flex-col justify-between ${className}`}
    >
      <div className="space-y-5">
        {/* Header Info */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-sm font-mono font-bold">
                Cluster #{selectedCluster.id}
              </span>
              <span className="text-sm font-bold text-slate-700">
                {selectedCluster.category}
              </span>
              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded border ${
                  selectedCluster.priority_score >= 0.75
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : selectedCluster.priority_score >= 0.45
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-blue-50 text-blue-800 border-blue-300"
                }`}
              >
                Priority: {selectedCluster.priority_score.toFixed(2)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-snug">
              {selectedCluster.title}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-semibold text-slate-500 block">Time left to fix</span>
            <span className="text-sm font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-300 inline-flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>{selectedCluster.sla_hours}h SLA</span>
            </span>
          </div>
        </div>

        {/* Before vs After Image Audit Section (4:3 Aspect Ratio) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-bold text-slate-800 block mb-2">
              Before photo (reported problem)
            </span>
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
              <img
                src={
                  beforeImgSrc ||
                  normalizeDefectImageUrl(
                    selectedCluster.before_image,
                    selectedCluster.category
                  )
                }
                alt="Before Photo"
                className="w-full h-full object-cover transition-opacity duration-200"
                onError={(e) => {
                  const fallback = getDefectFallbackImage(selectedCluster.category);
                  if (beforeImgSrc !== fallback) {
                    setBeforeImgSrc(fallback);
                  } else {
                    e.currentTarget.src = "/uploads/pothole_before.jpg";
                  }
                }}
              />
              <span className="absolute bottom-2.5 left-2.5 bg-slate-900/90 text-white text-sm px-3 py-1 rounded-md font-semibold">
                Defect logged
              </span>
            </div>
          </div>

          <div>
            <span className="text-sm font-bold text-slate-800 block mb-2">
              After photo (repair proof)
            </span>
            <div className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="after-photo-upload"
              />
              <label
                htmlFor="after-photo-upload"
                className="w-full h-full cursor-pointer flex flex-col items-center justify-center p-3 text-center"
              >
                {afterImagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={afterImagePreview}
                      alt="Proof of Work"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <span className="absolute bottom-2.5 left-2.5 bg-emerald-800 text-white text-sm px-3 py-1 rounded-md font-semibold">
                      Proof attached
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-emerald-700 mb-2" />
                    <span className="text-base text-slate-900 font-bold">
                      Upload repair proof
                    </span>
                    <span className="text-sm text-slate-500 mt-1">
                      Click to select camera photo or device file
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Turn On Location Notification Prompt */}
        {promptTurnOnLocation && officerLat === null && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-sm font-bold">
                Photo uploaded. Please turn on device location to record management GPS pin.
              </div>
            </div>
            <button
              type="button"
              onClick={handleTurnOnLocation}
              disabled={locationLoading}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Navigation className="w-4 h-4" />
              <span>{locationLoading ? "Acquiring..." : "Turn On Location"}</span>
            </button>
          </div>
        )}

        {/* Location Comparison Section (Citizen vs Management - 50m Radius) */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <span>Location Audit (50m Radius Geo-Fence)</span>
            </span>

            {calculatedDistance !== null ? (
              <span
                className={`font-mono text-sm font-bold px-3 py-1 rounded-lg border ${
                  isWithin50m
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-rose-100 text-rose-900 border-rose-300"
                }`}
              >
                {calculatedDistance}m separation ({isWithin50m ? "≤ 50m Accept" : "> 50m Reject"})
              </span>
            ) : (
              <span className="font-mono text-sm font-semibold px-3 py-1 rounded-lg bg-slate-200 text-slate-700 border border-slate-300">
                GPS Pending
              </span>
            )}
          </div>

          {/* 2-Column Comparison Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Citizen Location Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-600 font-bold block">Citizen Reported Location:</span>
              <span className="font-mono font-bold text-slate-900 block text-sm">
                Lat: {selectedCluster.latitude.toFixed(6)}, Lon: {selectedCluster.longitude.toFixed(6)}
              </span>
              <span className="text-sm text-slate-500">Original complaint GPS pin</span>
            </div>

            {/* Management Uploaded Location Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-600 font-bold block">Management Uploaded Location:</span>
              {officerLat !== null && officerLon !== null ? (
                <>
                  <span className="font-mono font-bold text-emerald-900 block text-sm">
                    Lat: {officerLat.toFixed(6)}, Lon: {officerLon.toFixed(6)}
                  </span>
                  <span className="text-sm text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Location active
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono font-bold text-rose-600 block text-sm">
                    Not Captured Yet
                  </span>
                  <span className="text-sm text-slate-500">
                    Click 'Turn On Location' below
                  </span>
                </>
              )}
            </div>
          </div>

          {/* GPS Control Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTurnOnLocation}
              disabled={locationLoading}
              className="py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Navigation className={`w-4 h-4 ${locationLoading ? "animate-spin" : ""}`} />
              <span>{locationLoading ? "Acquiring GPS..." : "Turn On Device Location"}</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateOnSiteLocation}
              className="py-2.5 px-3.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5"
              title="Simulate within 50m of defect site"
            >
              <LocateFixed className="w-4 h-4 text-emerald-700" />
              <span>Simulate At Site (≤ 50m)</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateOffSiteFraudLocation}
              className="py-2.5 px-3.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5"
              title="Simulate 245m away from defect site"
            >
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Simulate Off Site (&gt; 50m)</span>
            </button>
          </div>

          {locationError && (
            <p className="text-sm text-rose-700 font-semibold bg-rose-50 p-3 rounded-lg border border-rose-200">
              {locationError}
            </p>
          )}

          <p className="text-sm text-slate-600">
            <strong className="text-slate-900 font-bold">Geo-Fence Rule:</strong> Management upload must be within <strong className="text-emerald-800 font-bold">50.0 meters</strong> radius of citizen complaint location. Beyond 50m is rejected as off-site fraud.
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handlePresetGenuineRepair}
            className="py-3 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            title="Fills repaired photo + on-site location"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Test Preset: Genuine Repair (≤50m)</span>
          </button>

          <button
            type="button"
            onClick={handlePresetUnfixedFraud}
            className="py-3 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            title="Fills un-repaired image to test rejection"
          >
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
            <span>Test Preset: Unfixed / Fake Proof</span>
          </button>
        </div>

        {/* Form Validation Error Banner */}
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="pt-4 space-y-4">
        {/* Verification CTA Button */}
        <button
          type="button"
          onClick={handleExecuteVerification}
          disabled={verifying}
          className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-base shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5 text-white fill-current" />
          <span>
            {verifying
              ? "Analyzing Before vs After with AI..."
              : "Verify & Resolve Problem"}
          </span>
        </button>

        {/* Audit Output Results Card */}
        {verificationResult && (
          <div
            className={`p-5 rounded-xl border transition-all duration-200 ${
              verificationResult.status === "REJECTED"
                ? "border-rose-300 bg-rose-50 text-rose-950"
                : "border-emerald-300 bg-emerald-50 text-emerald-950"
            }`}
          >
            {verificationResult.status === "REJECTED" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  <span>Resolution Rejected! Fraud Detected.</span>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-rose-200 text-sm space-y-1 font-mono font-medium">
                  <div>
                    <span className="text-rose-800 font-bold">Failed Check:</span>{" "}
                    {verificationResult.layer_failed}
                  </div>
                  <div>
                    <span className="text-rose-800 font-bold">Reason:</span>{" "}
                    {verificationResult.reason}
                  </div>
                </div>

                <p className="text-sm text-rose-950 font-medium leading-relaxed">
                  Contractor Trust Score docked by -10 (New Score:{" "}
                  <strong className="text-rose-950 font-mono font-bold text-base">
                    {verificationResult.contractor_trust_score}
                  </strong>
                  ). Ticket Reopened.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                  <span>Resolution Verified! Problem Solved.</span>
                </div>

                <p className="text-sm text-emerald-950 leading-relaxed font-mono font-medium bg-white p-3.5 rounded-lg border border-emerald-200">
                  {verificationResult.reason}
                </p>

                <div className="text-sm font-bold text-emerald-950">
                  Ticket status updated to Closed (Verified). Contractor Trust Score:{" "}
                  <strong className="text-emerald-950 font-mono text-base font-bold">
                    {verificationResult.contractor_trust_score}
                  </strong>{" "}
                  (+2 trust reward certified).
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPUP NOTIFICATION MODAL */}
      {showSuccessPopup && verificationResult && verificationResult.status === "VERIFIED" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-emerald-300 max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold uppercase tracking-wider">
                Resolution Verified
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                Work Order #{selectedCluster.id} Closed
              </h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {selectedCluster.title}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">50m Geo-Fence Audit:</span>
                <span className="font-mono font-bold text-emerald-800">On-Site Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">AI Visual Audit:</span>
                <span className="font-mono font-bold text-emerald-800">Problem Solved</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Contractor Trust Score:</span>
                <span className="font-mono font-bold text-emerald-800 text-base">
                  {verificationResult.contractor_trust_score} (+2 Reward)
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm font-medium text-emerald-950 flex items-center gap-2 text-left">
              <Bell className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Notification dispatched to Citizen and Command Center.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
