import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Define the custom components with proper typing
const MarkdownComponents: Components = {
    // Custom styling for headings
    h1: ({ node, ...props }) => (
        <h1 className="text-xl font-bold my-5" {...props} />
    ),
    h2: ({ node, ...props }) => (
        <h2 className="text-lg font-bold my-5" {...props} />
    ),
    h3: ({ node, ...props }) => <h3 className="font-bold my-5" {...props} />,
    // Custom styling for paragraphs
    p: ({ node, ...props }) => (
        <p className="my-5 text-base leading-relaxed" {...props} />
    ),
    ul: ({ node, ...props }) => (
        <ul className="list-disc pl-10 my-5 text-base leading-relaxed" {...props} />
    ),
    ol: ({ node, ...props }) => (
        <ol
            className="list-decimal pl-10 my-5 text-base leading-relaxed"
            {...props}
        />
    ),
    li: ({ node, ...props }) => (
        <li className="my-2 text-base leading-relaxed" {...props} />
    ),
    // Custom styling for code blocks
    code: ({ node, className, children, ...props }) => {
        // Check if this is inline code by looking at the parent node
        const isInline =
            node && node.position && (!node.children || node.children.length === 0);

        // Inline code
        if (isInline) {
            return (
                <code className="bg-muted rounded text-xs font-mono" {...props}>
                    {children}
                </code>
            );
        }

        // Block code (slightly smaller)
        return (
            <pre className="bg-muted rounded-md p-3 my-5 overflow-x-auto text-xs">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        );
    },
    // Custom styling for blockquotes (slightly smaller)
    blockquote: ({ node, ...props }) => (
        <blockquote
            className="border-l-4 border-border pl-3 italic text-muted-foreground my-5 text-xs"
            {...props}
        />
    ),
    // Custom styling for links
    a: ({ node, ...props }) => (
        <a
            className="text-primary hover:underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        />
    ),
    // Custom styling for tables using shadcn/ui Table components
    table: ({ node, ...props }) => (
        <div className="rounded-md my-5 border text-xs">
            <Table className="text-xs" {...props} />
        </div>
    ),
    thead: ({ node, ...props }) => (
        <TableHeader className="rounded-t-md bg-muted text-xs" {...props} />
    ),
    tbody: ({ node, ...props }) => <TableBody {...props} />,
    tr: ({ node, ...props }) => <TableRow {...props} />,
    th: ({ node, ...props }) => (
        <TableHead className="px-3 py-2 font-medium text-xs" {...props} />
    ),
    td: ({ node, ...props }) => {
        // Process children to extract only text content, removing all non-text elements
        const extractTextContent = (children: React.ReactNode): string => {
            if (typeof children === "string") {
                return children;
            }

            if (Array.isArray(children)) {
                return children.map((child) => extractTextContent(child)).join("");
            }

            if (React.isValidElement(children)) {
                // Extract text content from element children
                if ((children as any).props?.children) {
                    return extractTextContent((children as any).props.children);
                }
                return "";
            }

            return "";
        };

        // Process children to handle <br> tags and extract only text content
        const processChildren = (children: React.ReactNode): React.ReactNode => {
            if (typeof children === "string") {
                // Split on <br> tags and convert to array with line breaks
                return children.split(/<br\s*\/?/gi).map((part, index, array) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < array.length - 1 && <br />}
                    </React.Fragment>
                ));
            }

            if (Array.isArray(children)) {
                // Extract text content from all children
                const textContent = children
                    .map((child) => extractTextContent(child))
                    .join("");
                // Then process for <br> tags
                return processChildren(textContent);
            }

            if (React.isValidElement(children)) {
                // Extract text content from element
                const textContent = extractTextContent(children);
                // Then process for <br> tags
                return processChildren(textContent);
            }

            return children;
        };

        const processedChildren = processChildren(props.children);

        return (
            <TableCell className="px-3 py-2 text-xs" {...props}>
                {processedChildren}
            </TableCell>
        );
    },
    caption: ({ node, ...props }) => (
        <TableCaption className="my-5 text-xs" {...props} />
    ),
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className = "",
}) => {
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                components={MarkdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};