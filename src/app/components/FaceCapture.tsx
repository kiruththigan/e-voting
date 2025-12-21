"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

type Mode = "enroll" | "verify";

interface Props {
  mode: Mode;
  onDone?: () => void;
}

const FaceCapture: React.FC<Props> = ({ mode, onDone }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const url = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(url),
          faceapi.nets.faceLandmark68Net.loadFromUri(url),
          faceapi.nets.faceRecognitionNet.loadFromUri(url),
        ]);
        setReady(true);
      } catch (err) {
        console.error("Model load failed", err);
        setMessage("Could not load face models");
      }
    }

    loadModels();
  }, []);

  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error", err);
        setMessage("Camera not available or permission denied");
      }
    }

    startVideo();
  }, []);

  const capture = async () => {
    if (!videoRef.current || !ready || busy) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage("No face isdetected try again");
        setBusy(false);
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);
      const endpoint =
        mode === "enroll" ? "/api/face/enroll" : "/api/face/verify";

        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Not logged in. Please log in again.");
          setBusy(false);
          return;
        }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
         },
        body: JSON.stringify({ descriptor: descriptorArray }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Request failed");
      } else {
        setMessage(data.message || "Face processed");
        if (onDone) {
          onDone();
        }
      }
    } catch (err) {
      console.error("Capture error", err);
      setMessage("Error while processing face");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-64 h-48 bg-black rounded-md"
      />
      <button
        type="button"
        onClick={capture}
        disabled={!ready || busy}
        className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
      >
        {busy
          ? "Processing"
          : mode === "enroll"
          ? "Capture and enroll"
          : "Capture and verify"}
      </button>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default FaceCapture;
