"use client";

/**
 * Artifact Upload Component
 *
 * Handles paste and file upload for artifacts.
 */

import { useState, useCallback, useRef, type DragEvent } from "react";
import type { ArtifactType } from "@/domain";

interface ArtifactUploadProps {
  onUpload: (content: string, name: string, type?: ArtifactType) => void;
}

const ARTIFACT_TYPES: { value: ArtifactType; label: string }[] = [
  { value: "release_notes", label: "Release Notes" },
  { value: "documentation", label: "Documentation" },
  { value: "faq", label: "FAQ" },
  { value: "onboarding", label: "Onboarding" },
  { value: "marketing", label: "Marketing" },
  { value: "unknown", label: "Auto-detect" },
];

export function ArtifactUpload({ onUpload }: ArtifactUploadProps) {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [artifactType, setArtifactType] = useState<ArtifactType>("unknown");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onUpload(text, name || "Pasted content", artifactType);
    setText("");
    setName("");
    setArtifactType("unknown");
  };

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content, file.name, artifactType);
      };

      reader.readAsText(file);
    },
    [onUpload, artifactType]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Add Artifact
      </h2>

      {/* Mode tabs */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode("paste")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "paste"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          Paste Text
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Type selector */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Content Type
        </label>
        <select
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value as ArtifactType)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {ARTIFACT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {mode === "paste" ? (
        <>
          {/* Name input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., v2.5 Release Notes"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Text area */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Content
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your release notes, documentation, or other product content here..."
              rows={8}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
          >
            Add Artifact
          </button>
        </>
      ) : (
        <>
          {/* File drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <svg
              className="h-12 w-12 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Drop a file here or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Supports .txt and .md files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
