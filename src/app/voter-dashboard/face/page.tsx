"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import FaceCapture from "@/app/components/FaceCapture";
import { useRouter } from "next/navigation";

export default function FacePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You must log in first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-xl font-semibold mb-4">
          Face verification for secure voting
        </h1>

        {!user.hasFaceRegistered ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              First time users should enroll their face
            </p>
            <FaceCapture mode="enroll" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Your face is registered verify again before voting
            </p>
           <FaceCapture
              mode="verify"
              onDone={async () => {
                await refreshUser();
                router.push("/voter-dashboard");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
