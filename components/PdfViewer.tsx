'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle, RefreshCw, FileWarning } from 'lucide-react';

// Use a more stable CDN and the standard .js extension for the worker
// Version 5.4.296 is quite new, so we ensure the URL is exact
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
// Wait, I checked your version was 5.4.296. Let's use unpkg but with the .js fallback if needed.
// Actually, let's use the local worker we copied to public earlier as a primary fallback
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  file: File | Blob | null;
  onLoadSuccess: (data: { numPages: number }) => void;
  pageNumber: number;
  scale: number;
}

export default function PdfViewer({ file, onLoadSuccess, pageNumber, scale }: PdfViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render if file changes
  useEffect(() => {
    setError(null);
    setRenderKey(prev => prev + 1);
  }, [file]);

  if (!file) return null;

  return (
    <div className="flex flex-col items-center w-full h-full min-h-[500px]">
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border-2 border-dashed border-destructive/30 rounded-xl m-4">
          <FileWarning size={48} className="text-destructive mb-4" />
          <h3 className="text-lg font-bold mb-2">PDF Display Error</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6 font-mono bg-muted p-2 rounded">
            {error}
          </p>
          <button 
            onClick={() => {
              setError(null);
              setRenderKey(k => k + 1);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : (
        <Document
          key={`${renderKey}-${file instanceof File ? file.name : 'blob'}`}
          file={file}
          onLoadSuccess={(data) => {
            console.log("PDF loaded successfully:", data.numPages, "pages");
            setError(null);
            onLoadSuccess(data);
          }}
          onLoadError={(err) => {
            console.error("PDF.js Error:", err);
            setError(err.message || "Unknown PDF.js error");
          }}
          loading={
            <div className="flex flex-col items-center gap-3 p-20">
              <RefreshCw size={40} className="animate-spin text-primary" />
              <p className="text-sm font-bold animate-pulse">Initializing PDF Engine...</p>
            </div>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl border border-border"
            onRenderError={(err) => {
              console.error("Page Render Error:", err);
              setError("Failed to render page: " + err.message);
            }}
          />
        </Document>
      )}
    </div>
  );
}