"use client"

import React, { useEffect, useRef } from "react"
import mermaid from "mermaid"



export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && chart) {
      const renderMermaid = async () => {
        // Clear previous content
        ref.current.innerHTML = ''; 

        // Dynamic import of mermaid
        const { default: mermaidAPI } = await import('mermaid');

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        try {
          const { svg } = await mermaidAPI.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (err) {
          console.error("Mermaid render error:", err);
        }
      };
      renderMermaid();
    }
  }, [chart]);

  return <div ref={ref} className="mermaid-chart my-4 overflow-x-auto bg-white/50 dark:bg-black/20 p-4 rounded-xl" />
}