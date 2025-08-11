"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { codeToHtml } from "shiki";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  // Handle edge cases
  const safeCode = code || "";
  const safeLanguage = language || "text";

  const [lightHtml, setLightHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true);

        // Generate HTML for light theme
        const lightResult = await codeToHtml(safeCode, {
          lang: safeLanguage,
          theme: "github-light",
          transformers: [
            {
              pre(node) {
                node.properties.style = `
                  margin: 0;
                  padding: 1rem;
                  font-size: 0.875rem;
                  background: hsl(var(--background));
                  color: hsl(var(--foreground));
                  overflow-x: auto;
                `;
              },
              line(node, line) {
                if (showLineNumbers) {
                  node.children.unshift({
                    type: "element",
                    tagName: "span",
                    properties: {
                      style: `
                        display: inline-block;
                        width: 2.5rem;
                        text-align: right;
                        padding-right: 1rem;
                        color: hsl(var(--muted-foreground));
                        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                        font-size: 0.875rem;
                        user-select: none;
                      `,
                    },
                    children: [{ type: "text", value: String(line) }],
                  });
                }
              },
            },
          ],
        });

        // Generate HTML for dark theme
        const darkResult = await codeToHtml(safeCode, {
          lang: safeLanguage,
          theme: "github-dark",
          transformers: [
            {
              pre(node) {
                node.properties.style = `
                  margin: 0;
                  padding: 1rem;
                  font-size: 0.875rem;
                  background: hsl(var(--background));
                  color: hsl(var(--foreground));
                  overflow-x: auto;
                `;
              },
              line(node, line) {
                if (showLineNumbers) {
                  node.children.unshift({
                    type: "element",
                    tagName: "span",
                    properties: {
                      style: `
                        display: inline-block;
                        width: 2.5rem;
                        text-align: right;
                        padding-right: 1rem;
                        color: hsl(var(--muted-foreground));
                        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
                        font-size: 0.875rem;
                        user-select: none;
                      `,
                    },
                    children: [{ type: "text", value: String(line) }],
                  });
                }
              },
            },
          ],
        });

        setLightHtml(lightResult);
        setDarkHtml(darkResult);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text
        const fallbackHtml = `<pre style="margin: 0; padding: 1rem; font-size: 0.875rem; background: hsl(var(--background)); color: hsl(var(--foreground)); overflow-x: auto;"><code>${safeCode}</code></pre>`;
        setLightHtml(fallbackHtml);
        setDarkHtml(fallbackHtml);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [safeCode, safeLanguage, showLineNumbers]);

  if (isLoading) {
    return (
      <CodeBlockContext.Provider value={{ code: safeCode }}>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-md border bg-background text-foreground",
            className
          )}
          {...props}
        >
          <div className="relative">
            <pre
              className="overflow-x-auto"
              style={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            >
              <code className="font-mono text-sm">{safeCode}</code>
            </pre>
            {children && (
              <div className="absolute right-2 top-2 flex items-center gap-2">
                {children}
              </div>
            )}
          </div>
        </div>
      </CodeBlockContext.Provider>
    );
  }

  return (
    <CodeBlockContext.Provider value={{ code: safeCode }}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md border bg-background text-foreground",
          className
        )}
        {...props}
      >
        <div className="relative">
          {/* Light theme */}
          <div
            className="dark:hidden"
            dangerouslySetInnerHTML={{ __html: lightHtml }}
          />

          {/* Dark theme */}
          <div
            className="hidden dark:block"
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />

          {children && (
            <div className="absolute right-2 top-2 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="outline"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
