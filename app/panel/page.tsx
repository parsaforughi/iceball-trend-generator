"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });

      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Generation error:", err);
    }

    setLoading(false);
  }

  function downloadImage() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = "iceball-cold-version.png";
    link.click();
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#f3f4f6] px-4 py-10">

      {/* ------------------ LOGO ------------------ */}
      <div className="mb-8">
        <Image
          src="/iceball_logo.png"
          alt="IceBall Logo"
          width={220}
          height={80}
          className="opacity-90"
        />
      </div>

      {/* ------------------ HEADER TEXT ------------------ */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center leading-snug">
        عکستو بده؛ <span className="text-blue-600">من سردترین حالتش رو می‌سازم ❄</span>
      </h1>

      {/* ------------------ UPLOAD BOX ------------------ */}
      <div className="mt-10 bg-white shadow-xl p-8 rounded-2xl w-full max-w-md text-center">
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-md transition">
          انتخاب عکس
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>

        {/* Preview */}
        {preview && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">عکس انتخابی:</p>
            <Image
              src={preview}
              alt="Preview"
              width={300}
              height={380}
              className="rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="mt-6 text-blue-600 font-semibold animate-pulse">در حال ساخت نسخه سرد... ❄</p>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-2">نسخه‌ی سرد شما:</p>
            <Image
              src={result}
              alt="Generated"
              width={300}
              height={380}
              className="rounded-xl shadow-xl"
            />

            {/* ------------------ DOWNLOAD BUTTON ------------------ */}
            <button
              onClick={downloadImage}
              className="mt-5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition active:scale-95"
            >
              دانلود ❄
            </button>
          </div>
        )}
      </div>
    </main>
  );
}