"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Save, MessageSquareMore, Sparkles } from 'lucide-react';

interface TextSelectionTooltipProps {
  selectedText: string;
  selectionRect: DOMRect | null;
  onExplain: (text: string) => void;
  onSummarize?: (text: string) => void; // Optional for future use
  onSaveQuote?: (text: string) => void; // Optional for future use
  onClose: () => void; // To close the tooltip
}

export function TextSelectionTooltip({
  selectedText,
  selectionRect,
  onExplain,
  onSummarize,
  onSaveQuote,
  onClose,
}: TextSelectionTooltipProps) {
  if (!selectedText || !selectionRect) return null;

  // Calculate tooltip position
  const tooltipWidth = 200; // Approximate width of the tooltip
  const tooltipHeight = 48; // Approximate height of the tooltip
  const margin = 10; // Margin from selection

  let top = selectionRect.top - tooltipHeight - margin;
  let left = selectionRect.left + (selectionRect.width / 2) - (tooltipWidth / 2);

  // Keep tooltip within viewport (simple bounds check)
  if (top < 0) {
    top = selectionRect.bottom + margin;
  }
  if (left < 0) {
    left = 0;
  }
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth;
  }

  const handleExplainClick = () => {
    onExplain(selectedText);
    onClose();
  };

  return (
    <AnimatePresence>
      {selectedText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed z-[999] bg-zinc-900 text-white rounded-lg shadow-xl p-2 flex items-center space-x-2 whitespace-nowrap"
          style={{ top: top + window.scrollY, left: left }}
          // Prevent selection events from propagating to close the tooltip immediately
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleExplainClick}
            className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-zinc-700 text-xs font-medium"
          >
            <Lightbulb size={14} /> Explain
          </button>
          {onSummarize && (
            <button
              onClick={() => { onSummarize(selectedText); onClose(); }}
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-zinc-700 text-xs font-medium"
            >
              <Sparkles size={14} /> Summarize
            </button>
          )}
          {onSaveQuote && (
            <button
              onClick={() => { onSaveQuote(selectedText); onClose(); }}
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-zinc-700 text-xs font-medium"
            >
              <Save size={14} /> Quote
            </button>
          )}
          {/* Close button - optionally add a tiny X, or rely on outside click */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
