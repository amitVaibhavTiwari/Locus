"use client";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { useRef, useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const PRESETS = ["25%", "50%", "75%", "100%"];

export function ResizableImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const { src, alt, width } = node.attrs as {
    src: string;
    alt?: string;
    width: string | null;
  };

  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ startX: 0, startWidth: 0 });

  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = {
      startX: e.clientX,
      startWidth: imgRef.current?.offsetWidth ?? 300,
    };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.current.startX;
      const newWidth = Math.max(60, Math.round(drag.current.startWidth + dx));
      updateAttributes({ width: `${newWidth}px` });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, updateAttributes]);

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: "block", userSelect: isDragging ? "none" : undefined }}
    >
      <span className="relative inline-block max-w-full">
        {selected && (
          <>
            {/* Preset size toolbar */}
            <span
              className="absolute -top-9 left-0 flex gap-0.5 bg-background border rounded-md shadow-md px-1.5 py-1 z-20"
              style={{ whiteSpace: "nowrap" }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    updateAttributes({ width: p });
                  }}
                  className="text-xs px-2 py-0.5 rounded hover:bg-accent text-foreground font-medium transition-colors"
                >
                  {p}
                </button>
              ))}
            </span>

            {/* Remove button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNode();
              }}
              className="absolute -top-2 -right-2 z-20 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}

        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          draggable={false}
          style={{
            width: width ?? "100%",
            maxWidth: "100%",
            display: "block",
          }}
          className={
            selected
              ? "outline outline-2 outline-primary outline-offset-1 rounded-sm"
              : ""
          }
        />

        {/* Drag-to-resize handle */}
        {selected && (
          <span
            onMouseDown={onHandleMouseDown}
            title="Drag to resize"
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl z-20"
            style={{ cursor: "se-resize" }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="m-auto mt-0.5">
              <path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}
