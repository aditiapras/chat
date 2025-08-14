"use client";

import { useEffect, useRef } from "react";

interface MathRendererProps {
  children: string;
  displayMode?: boolean;
}

export function MathRenderer({
  children,
  displayMode = false,
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current || !children) return;

      try {
        // Dynamic import to avoid SSR issues
        const katex = await import("katex");

        // Clean the content - remove any existing $ wrapping
        const cleanContent = children.replace(/^\$+|\$+$/g, "").trim();

        if (!cleanContent) return;

        katex.default.render(cleanContent, containerRef.current, {
          displayMode,
          throwOnError: false,
          strict: false,
          trust: true,
          output: "html",
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error, "Content:", children);
        // Fallback to showing raw LaTeX
        if (containerRef.current) {
          containerRef.current.innerHTML = `<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${children}</code>`;
        }
      }
    };

    renderMath();
  }, [children, displayMode]);

  return (
    <span
      ref={containerRef}
      className={displayMode ? "block text-center my-4" : "inline"}
    />
  );
}
