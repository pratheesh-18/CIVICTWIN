"use client";

import { useEffect, useState } from "react";

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  "";

let googleMapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMapsScript(
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not defined"));
  }

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment (.env.local or Vercel Environment Variables)."
      )
    );
  }

  // Already loaded
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  // Currently loading
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    ) as HTMLScriptElement | null;

    const callbackName = "__googleMapsApiOnLoadCallback_" + Math.random().toString(36).substring(2, 9);

    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps failed to initialize"));
      }
    };

    if (existingScript) {
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        }
      });
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      googleMapsPromise = null;
      delete (window as any)[callbackName];
      reject(err);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function useGoogleMaps(apiKey: string = GOOGLE_MAPS_API_KEY) {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    return typeof window !== "undefined" && Boolean(window.google?.maps);
  });
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!apiKey) {
      setLoadError(
        new Error(
          "Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
        )
      );
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    let isMounted = true;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load Google Maps script:", err);
          setLoadError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  return { isLoaded, loadError };
}
