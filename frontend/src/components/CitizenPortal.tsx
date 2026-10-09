"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { submitComplaint, transcribeVoice, analyzeSemantics } from "../lib/api";
import { ComplaintSubmitResponse } from "../types";
import { CitizenLocationMap } from "./CitizenLocationMap";
import {
  Camera,
  Upload,
  Trash2,
  RotateCcw,
  Mic,
  Square,
  FileAudio,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Crosshair,
  Building2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";

interface CitizenPortalProps {
  initialCategory?: string;
}

const DEPARTMENTS = [
  {
    slug: "roads",
    name: "Roads & Infrastructure Maintenance Wing",
    category: "Pothole",
    tamilName: "சாலைகள் மற்றும் உள்கட்டமைப்பு துறை",
  },
  {
    slug: "water",
    name: "Water Supply & Drainage Operations",
    category: "Water Leakage",
    tamilName: "குடிநீர் மற்றும் கழிவுநீர் வடிகால் துறை",
  },
  {
    slug: "electricity",
    name: "Electrical & Street Lighting Wing",
    category: "Streetlight",
    tamilName: "மின்சாரம் மற்றும் தெருவிளக்கு துறை",
  },
  {
    slug: "sanitation",
    name: "Solid Waste & Sanitation Department",
    category: "Garbage",
    tamilName: "திடக்கழிவு மற்றும் சுகாதாரத் துறை",
  },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ initialCategory }) => {
  const { user } = useAuth();

  // Selected Department / Category
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>("roads");
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  // Form State
  const [text, setText] = useState("");
  const [latitude, setLatitude] = useState<number>(13.0827);
  const [longitude, setLongitude] = useState<number>(80.2707);
  const [resolvedAddress, setResolvedAddress] = useState<string>("Anna Nagar, Chennai, Tamil Nadu");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);

  // Audio Recording & Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<"ta" | "en">("ta");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // AI Semantic Understanding
  const [semanticData, setSemanticData] = useState<{
    category: string;
    severity: string;
    hazard_weight: number;
    detected_location: string;
    semantic_summary: string;
  } | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Submission & Post-submit state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ComplaintSubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTechView, setShowTechView] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveTranscriptRef = useRef<string>("");
  const speechRecognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Camera & File input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize department from query parameter if present
  useEffect(() => {
    if (initialCategory) {
      const cat = initialCategory.toLowerCase();
      if (cat.includes("road") || cat.includes("pothole")) {
        setSelectedDeptSlug("roads");
      } else if (cat.includes("water") || cat.includes("drain")) {
        setSelectedDeptSlug("water");
      } else if (cat.includes("light") || cat.includes("electr")) {
        setSelectedDeptSlug("electricity");
      } else if (cat.includes("garb") || cat.includes("sanit")) {
        setSelectedDeptSlug("sanitation");
      }
    }
  }, [initialCategory]);

  const currentDept =
    DEPARTMENTS.find((d) => d.slug === selectedDeptSlug) || DEPARTMENTS[0];

  // Recording timer effect
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Reverse geocoding helper when coordinates change
  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);

    // Approximate address resolver
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const parts = data.display_name.split(",");
          setResolvedAddress(parts.slice(0, 3).join(", ").trim());
        }
      })
      .catch(() => {
        setResolvedAddress(`Location at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
      });
  };

  // Auto-detect live GPS location on page load
  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          const accuracy = Math.round(pos.coords.accuracy);
          setGpsAccuracy(accuracy);
          setGpsActive(true);
          setGpsLoading(false);
          handleLocationChange(lat, lng);
        },
        (err) => {
          console.warn("Live GPS auto-detect note:", err.message);
          setGpsLoading(false);
          // Keep current or default coordinates
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  };

  // Photo handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setImageError("Please select a valid image file (JPG, PNG)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setImageError("Image file size should be less than 10MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice recording handlers
  const startVoiceRecording = async () => {
    setVoiceError(null);
    liveTranscriptRef.current = "";

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Microphone not available in this browser. You can type or upload an audio file.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio visualizer setup
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 120) * 100)));
            }
            animFrameRef.current = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      } catch (e) {
        console.warn("Audio meter init error:", e);
      }

      // Live Web Speech Recognition
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = selectedVoiceLang === "ta" ? "ta-IN" : "en-IN";

          recognition.onresult = (event: any) => {
            let interim = "";
            let finalStr = "";
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const fullSpoken = (finalStr + interim).trim();
            if (fullSpoken) {
              liveTranscriptRef.current = fullSpoken;
              setText(fullSpoken);
            }
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        }
      } catch (e) {
        console.warn("Native speech recognition not supported:", e);
      }

      // MediaRecorder configuration
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";
        else mimeType = "";
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const recordedMime = recorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(chunks, { type: recordedMime });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        let ext = "webm";
        if (recordedMime.includes("mp4")) ext = "mp4";
        else if (recordedMime.includes("ogg")) ext = "ogg";
        else if (recordedMime.includes("wav")) ext = "wav";

        const fallback = liveTranscriptRef.current.trim();
        await processAudio(audioBlob, `recorded_voice.${ext}`, fallback);
      };

      recorder.start(250);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Mic error:", err);
      setVoiceError("Microphone access was denied. Please allow microphone permissions or type your complaint.");
    }
  };

  const stopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);

    if (mediaRecorder && isRecording) {
      if (mediaRecorder.state === "recording") {
        try {
          mediaRecorder.requestData();
        } catch (e) {}
        mediaRecorder.stop();
      }
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleDeleteAudio = () => {
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setIsPlayingAudio(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
  };

  const handleTogglePlayAudio = () => {
    if (!recordedAudioUrl) return;
    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(recordedAudioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRecordedAudioBlob(file);
      setRecordedAudioUrl(URL.createObjectURL(file));
      await processAudio(file, file.name);
    }
  };

  const processAudio = async (
    audioFile: File | Blob,
    filename: string,
    fallbackSpokenText?: string
  ) => {
    setVoiceProcessing(true);
    setVoiceError(null);
    try {
      let recognizedText = "";
      try {
        const res = await transcribeVoice(audioFile, filename, selectedVoiceLang);
        if (res.transcription && res.transcription.trim()) {
          recognizedText = res.transcription.trim();
        }
        if (res.semantic_meaning) {
          setSemanticData(res.semantic_meaning);
        }
      } catch (whisperErr: any) {
        console.warn("Groq Whisper backend notice:", whisperErr);
      }

      const finalText = recognizedText || fallbackSpokenText || text;
      if (finalText && finalText.trim()) {
        setText(finalText);
        if (!semanticData) {
          const semRes = await analyzeSemantics(finalText);
          if (semRes.semantic_meaning) {
            setSemanticData(semRes.semantic_meaning);
          }
        }
      } else {
        setVoiceError("Could not clearly hear speech. Please speak closely into the microphone or type below.");
      }
    } catch (err: any) {
      console.error("Voice processing error:", err);
      setVoiceError("Voice transcription failed. You can still type your complaint directly.");
    } finally {
      setVoiceProcessing(false);
    }
  };

  // Submit Complaint
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageFile) {
      setErrorMsg("Please take or upload a photo of the problem.");
      return;
    }
    if (!text.trim()) {
      setErrorMsg("Please provide a description or record your voice.");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("citizen_name", user?.name || "Anonymous Citizen");
      formData.append("text", text);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("image", imageFile);

      const res = await submitComplaint(formData);
      setResult(res);
      setSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit complaint. Please check your network connection.");
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setSemanticData(null);
    setResult(null);
    setErrorMsg(null);
  };

  // Validation state for bottom sticky bar
  const isFormValid = Boolean(imageFile && text.trim().length > 0);
  const missingItemsText = !imageFile && !text.trim()
    ? "Photo and description required"
    : !imageFile
    ? "Photo evidence required"
    : !text.trim()
    ? "Description or voice note required"
    : "";

  const urgencyLabel = semanticData?.severity || "Normal";

  return (
    <div className="w-full space-y-6 pb-28">
      {/* Page Header */}
      {!result && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                Report a Problem
              </h1>
              <p className="text-base text-slate-600 mt-1">
                Take a photo, record your voice in Tamil or English, and mark the exact location.
              </p>
            </div>

            {/* Department Selection Chip */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5">
                <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="text-left">
                  <span className="text-xs text-slate-500 font-semibold block">Reporting to:</span>
                  <span className="text-sm font-bold text-slate-900 block truncate max-w-[260px] sm:max-w-[320px]">
                    {currentDept.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeptPicker(!showDeptPicker)}
                  className="ml-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Change</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Department Dropdown Menu */}
              {showDeptPicker && (
                <div className="absolute right-0 top-full mt-2 w-full min-w-[320px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Jurisdictional Wing
                  </div>
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept.slug}
                      type="button"
                      onClick={() => {
                        setSelectedDeptSlug(dept.slug);
                        setShowDeptPicker(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-between ${
                        selectedDeptSlug === dept.slug
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div>{dept.name}</div>
                        <div className="text-xs text-slate-500 font-normal">{dept.tamilName}</div>
                      </div>
                      {selectedDeptSlug === dept.slug && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Studio Form */}
      {!result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* ============================================================== */}
          {/* PANEL 1: PHOTO EVIDENCE                                       */}
          {/* ============================================================== */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-700" />
                  <span>1. Photo Evidence</span>
                </h2>
                {imageFile && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Take a clear photo of the damaged road, leak, streetlight, or garbage.
              </p>

              {/* Photo Upload Zone */}
              {!imagePreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 text-center flex flex-col items-center justify-center min-h-[260px] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Add defect photo</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      JPG, PNG files up to 10MB
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[280px]">
                    {/* Take Photo Button (Camera on Mobile) */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>

                    {/* Choose from Device */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>Choose File</span>
                    </button>
                  </div>

                  {/* Hidden inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Photo Preview State */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 max-h-[280px]">
                    <img
                      src={imagePreview}
                      alt="Defect Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="truncate max-w-[180px] font-semibold text-slate-800">
                      {imageFile?.name || "defect_photo.jpg"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-emerald-700" />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="py-2 px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-red-600 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {imageError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{imageError}</span>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* PANEL 2: DESCRIBE THE PROBLEM (VOICE & TEXT)                  */}
          {/* ============================================================== */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-emerald-700" />
                  <span>2. Describe the Problem</span>
                </h2>
                {text.trim() && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                Tell us what happened. You can speak in Tamil or English, or type below.
              </p>

              {/* Voice Recording Widget */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Voice Note</span>
                  {/* Language Selector */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedVoiceLang("ta")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        selectedVoiceLang === "ta"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🇮🇳 தமிழ்
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVoiceLang("en")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        selectedVoiceLang === "en"
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🌐 English
                    </button>
                  </div>
                </div>

                {/* Big Record Button */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={voiceProcessing}
                      className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Mic className="w-5 h-5" />
                      <span>Record Voice</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 animate-pulse cursor-pointer"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      <span>Stop Recording ({recordingSeconds}s)</span>
                    </button>
                  )}

                  {/* Replay or delete if audio recorded */}
                  {recordedAudioUrl && !isRecording && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleTogglePlayAudio}
                        className="p-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                        title={isPlayingAudio ? "Pause Audio" : "Play Voice Recording"}
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Play className="w-4 h-4 text-emerald-700 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAudio}
                        className="p-3 bg-white hover:bg-red-50 border border-slate-300 text-red-600 rounded-lg shadow-xs transition-colors cursor-pointer"
                        title="Delete Recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Recording Level Indicator */}
                {isRecording && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                      <span>{audioLevel > 5 ? "Hearing your voice" : "Listening..."}</span>
                    </span>
                    <span className="font-mono text-slate-500">{audioLevel}% level</span>
                  </div>
                )}

                {/* Secondary Audio Upload Link */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1">
                    <FileAudio className="w-3.5 h-3.5" />
                    <span>Upload existing audio file</span>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
                      onChange={handleAudioUpload}
                      disabled={voiceProcessing || isRecording}
                      className="hidden"
                    />
                  </label>
                  {voiceProcessing && (
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Transcribing...</span>
                    </span>
                  )}
                </div>
              </div>

              {voiceError && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{voiceError}</span>
                </div>
              )}

              {/* What you said / Text Box */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 block">
                  What you said / Description:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Type or speak the complaint (e.g. Big pothole near school, sewage overflow, broken streetlight)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* What We Understood Card */}
              {(semanticData || text.trim().length > 10) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-sm">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>What we understood</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingCategory(!isEditingCategory)}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {isEditingCategory ? "Done" : "This is not right"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {semanticData?.category || currentDept.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      Urgency: {urgencyLabel}
                    </span>
                  </div>

                  {semanticData?.detected_location && semanticData.detected_location !== "Not specified" && (
                    <div className="text-xs text-slate-600 font-medium">
                      <span className="font-bold text-slate-700">Mentioned: </span>
                      <span>{semanticData.detected_location}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {semanticData?.semantic_summary || text}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* PANEL 3: EXACT LOCATION & INTERACTIVE MAP                     */}
          {/* ============================================================== */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                  <span>3. Location</span>
                </h2>
                <div>
                  {gpsLoading ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Detecting Live GPS...</span>
                    </span>
                  ) : gpsActive ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-emerald-700" />
                      <span>Live GPS {gpsAccuracy ? `(±${gpsAccuracy}m)` : "Active"}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                      Pin Active
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Drag the pin on the map to pinpoint the exact defect location.
              </p>

              {/* Google Maps Card */}
              <div className="space-y-3">
                <div className="h-[240px] w-full">
                  <CitizenLocationMap
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                    resolvedAddress={resolvedAddress}
                  />
                </div>

                {/* GPS Trigger Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Detecting Live Position...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-4 h-4 text-emerald-700" />
                      <span>Use My Live Location</span>
                    </>
                  )}
                </button>

                {/* Resolved Area Name & Read-Only Coordinates */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Resolved Street / Area:
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">
                    {resolvedAddress}
                  </div>
                  <div className="text-xs text-slate-500 pt-0.5 font-mono">
                    Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* POST-SUBMISSION SUCCESS VIEW                                   */
        /* ============================================================== */
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Ticket Reference: #{result.complaint_id}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                We received your complaint
              </h2>
              <p className="text-base text-slate-600 mt-1">
                Your report has been verified and registered with municipal services.
              </p>
            </div>
          </div>

          {/* Citizen Progress Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Resolution Progress
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                  ✓
                </div>
                <div className="text-xs font-bold text-slate-900">1. Received</div>
                <div className="text-[11px] text-emerald-700 font-semibold">Done</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                  ✓
                </div>
                <div className="text-xs font-bold text-slate-900">2. Understood</div>
                <div className="text-[11px] text-emerald-700 font-semibold">{result.category}</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                  ✓
                </div>
                <div className="text-xs font-bold text-slate-900">3. Duplicate Scan</div>
                <div className="text-[11px] text-emerald-700 font-semibold">Cluster #{result.cluster_id}</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-xs animate-pulse">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                  4
                </div>
                <div className="text-xs font-bold text-slate-900">4. Dispatched</div>
                <div className="text-[11px] text-amber-700 font-semibold">In Progress</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-1 text-xs font-bold">
                  5
                </div>
                <div className="text-xs font-bold text-slate-700">5. Crew Assigned</div>
                <div className="text-[11px] text-slate-400">Next Step</div>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500 font-semibold block">Assigned Department</span>
              <span className="font-bold text-slate-900 text-sm mt-1 block">
                {result.assigned_dept}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500 font-semibold block">Target Resolution SLA</span>
              <span className="font-bold text-emerald-800 text-sm mt-1 block">
                Within {result.sla_hours} hours
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs text-slate-500 font-semibold block">Calculated Urgency</span>
              <span className="font-bold text-slate-900 text-sm mt-1 block">
                {result.severity} Priority
              </span>
            </div>
          </div>

          {/* Collapsible Technical View for Reviewers */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechView(!showTechView)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left font-bold text-sm text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Show how this was processed (Technical telemetry)</span>
              {showTechView ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechView && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3 font-mono text-xs">
                <div className="text-slate-600">
                  <strong>Cluster ID:</strong> #{result.cluster_id} ({result.is_new_cluster ? "New Cluster" : "Merged with Existing"})
                </div>
                <div className="text-slate-600">
                  <strong>Dynamic Priority Score:</strong> {result.priority_score.toFixed(2)}
                </div>
                <div className="text-slate-600">
                  <strong>Total Localized Reports:</strong> {result.report_count}
                </div>
                {result.agent_trace && result.agent_trace.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <strong className="text-slate-800 block mb-1">Autonomous Execution Trace:</strong>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      {result.agent_trace.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:flex-1 py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>View My Complaints</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:flex-1 py-3 px-5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl text-center transition-colors cursor-pointer"
            >
              <span>Report Another Problem</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      {!result && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Draft Summary on Left */}
            <div className="flex items-center gap-2 text-sm text-slate-700 truncate max-w-full">
              <span className="font-bold text-slate-900">{currentDept.name}</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                {urgencyLabel} Urgency
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                {imageFile ? "1 photo attached" : "No photo"}
              </span>
              {recordedAudioBlob && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Voice note</span>
                  </span>
                </>
              )}
            </div>

            {/* Actions on Right */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              {!isFormValid && (
                <span className="text-xs text-slate-500 font-medium hidden md:inline">
                  {missingItemsText}
                </span>
              )}

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!isFormValid || submitting}
                className={`w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl font-bold text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isFormValid && !submitting
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-slate-300 cursor-not-allowed opacity-75"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Complaint...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Complaint</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-20 right-6 max-w-md z-50 p-4 rounded-xl bg-red-600 text-white shadow-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-white hover:text-slate-200 text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
