import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import { Message, MessageContent } from "~/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "~/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "~/components/ai-elements/reasoning";
import {
  CopyIcon,
  GlobeIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/id";
import { useChat } from "@ai-sdk/react";
import { Loader } from "~/components/ai-elements/loader";
import { Response } from "~/components/ai-elements/response";
import { Action, Actions } from "~/components/ai-elements/actions";
import { useLocation, useFetcher } from "react-router";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "~/components/ai-elements/source";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export const meta: Route.MetaFunction = ({ loaderData }: Route.MetaArgs) => {
  const title = loaderData?.title?.title || "New Chat";

  return [
    {
      title: title,
      description: "Chat with AI",
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const { params } = args;
  // OPTIMIZATION: Use Promise.all to run queries in parallel instead of sequential
  const [models, title, messages] = await Promise.all([
    // Cache models query result (could be moved to parent layout)
    prisma.aIModel.findMany({
      select: {
        name: true,
        modelId: true,
      },
      orderBy: {
        provider: "asc",
      },
    }),

    // Single query to get thread data
    prisma.thread.findUnique({
      where: {
        id: params.id,
      },
      select: {
        title: true,
      },
    }),

    // Optimized messages query with content length limit
    prisma.message.findMany({
      where: {
        threadId: params.id,
      },
      select: {
        id: true,
        role: true,
        content: true,
        reasoning: true, // Include reasoning for persistent display
        model: true, // Include model for selectedModel extraction
        webSearch: true, // Include webSearch for sources
        createdAt: true, // For ordering
      },
      orderBy: {
        createdAt: "asc",
      },
      // Consider adding pagination for very long conversations
      take: 100, // Limit to last 100 messages for performance
    }),
  ]);

  // Extract selectedModel from last assistant message
  const selectedModel =
    messages.filter((msg) => msg.role === "assistant").slice(-1)[0] || null;
  return { models, selectedModel, params, messages, title };
}

export default function Threads({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const [model, setModel] = useState(
    location.state?.model ||
      loaderData.selectedModel?.model ||
      loaderData.models[0].modelId
  );
  const [prompt, setPrompt] = useState(location.state?.prompt || "");
  const [isWebSearch, setIsWebSearch] = useState(
    location.state?.webSearch || false
  );
  const { sendMessage, messages, status, setMessages, stop } = useChat({});
  const isInitial = useRef(true);
  const [currentTitle, setCurrentTitle] = useState(
    loaderData.title?.title || "New Chat"
  );
  const titleFetcher = useFetcher();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fix: Sync model state with selectedModel when navigating between pages
  useEffect(() => {
    const newModel =
      loaderData.selectedModel?.model || loaderData.models[0].modelId;
    if (newModel !== model) {
      setModel(newModel);
    }
  }, [loaderData.selectedModel?.model, loaderData.params.id]);

  // Auto-scroll to bottom when messages change or streaming
  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? "instant" : "smooth",
    });
  };

  // Instant scroll to bottom on initial load (no animation)
  useEffect(() => {
    scrollToBottom(true); // Instant scroll on page load
  }, [loaderData.params.id]); // Trigger when page/thread changes

  // Scroll to bottom when message is complete (not during streaming to prevent flicker)
  useEffect(() => {
    if (status !== "streaming" && messages.length > 0) {
      scrollToBottom(true); // Instant scroll after message is complete
    }
  }, [messages.length]); // Trigger when new message is added

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    // Only send message if prompt exists and is not empty
    if (location.state?.prompt && location.state.prompt.trim() !== "") {
      sendMessage(
        { text: location.state.prompt },
        { body: { model, threadId: loaderData.params.id, isWebSearch } }
      );
    }
  }, [location.state]);

  useEffect(() => {
    setMessages(
      loaderData.messages.map((message) => {
        const parts: any[] = [];

        // Add reasoning part FIRST if available for assistant messages
        if (message.role === "assistant" && message.reasoning) {
          parts.push({
            type: "reasoning" as const,
            text: message.reasoning,
          });
        }

        // Then add the main content
        parts.push({
          type: "text" as const,
          text: message.content,
        });

        return {
          id: message.id,
          role: message.role as "user" | "system" | "assistant",
          parts,
        };
      })
    );
  }, [loaderData.messages]);

  // Update document title when loader data changes (React Router 7 automatic revalidation)
  useEffect(() => {
    const newTitle = loaderData.title?.title || "New Chat";
    if (newTitle !== currentTitle) {
      setCurrentTitle(newTitle);
      document.title = newTitle;
    }
  }, [loaderData.title?.title, currentTitle]);

  useEffect(() => {
    if (
      messages.length > 0 &&
      (!loaderData.title?.title || loaderData.title?.title === null) &&
      titleFetcher.state === "idle"
    ) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Find the user message that triggered this AI response
        const userMessage = messages.find(
          (msg, index) => msg.role === "user" && index < messages.length - 1
        );

        if (userMessage && status !== "streaming") {
          const userContent = userMessage.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");

          const formData = new FormData();
          formData.append("threadId", loaderData.params.id);
          formData.append("userMessage", userContent);
          formData.append("model", model);

          titleFetcher.submit(formData, {
            method: "POST",
            action: "/api/generate-title",
          });
        }
      }
    }
  }, [
    messages, // Key trigger: when messages change (new AI response)
    status, // Ensure we're not streaming
    loaderData.title?.title,
    titleFetcher.state,
    loaderData.params.id,
    model,
  ]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(
      { text: prompt },
      { body: { model, threadId: loaderData.params.id, isWebSearch } }
    );
    setPrompt("");
  };

  return (
    <div className="w-full 2xl:max-w-4xl lg:max-w-3xl mx-auto flex flex-col h-full px-5 md:px-0 relative">
      <Conversation className="relative">
        <ConversationContent>
          {messages.map((message, messageIndex) => (
            <div key={message.id}>
              {message.role === "assistant" &&
                message.parts.filter((part) => part.type === "tool-webSearch")
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={message.parts
                        .filter((part) => part.type === "tool-webSearch")
                        .reduce((total, part) => {
                          const toolPart = part as any;
                          return (
                            total +
                            (Array.isArray(toolPart.output)
                              ? toolPart.output.length
                              : 0)
                          );
                        }, 0)}
                    />
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "tool-webSearch":
                          const toolPart = part as any;
                          if (Array.isArray(toolPart.output)) {
                            return toolPart.output.map(
                              (source: any, sourceIndex: number) => (
                                <SourcesContent
                                  key={`${message.id}-${i}-${sourceIndex}`}
                                >
                                  <Source
                                    key={`${message.id}-${i}-${sourceIndex}`}
                                    href={source.url}
                                    title={source.title || source.url}
                                  />
                                </SourcesContent>
                              )
                            );
                          }
                          return null;
                        default:
                          return null;
                      }
                    })}
                  </Sources>
                )}
              <Message from={message.role} key={message.id}>
                <MessageContent className="group-[.is-user]:bg-muted py-2 group-[.is-user]:rounded-tl-xl group-[.is-user]:rounded-tr-xl group-[.is-user]:rounded-bl-xl group-[.is-user]:text-foreground group-[.is-assistant]:bg-transparent">
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        const isLastMessage =
                          messageIndex === messages.length - 1;
                        return (
                          <div key={`${message.id}-${i}`} className="w-full">
                            <Response>{part.text}</Response>
                            {message.role === "assistant" && (
                              <Actions className="mt-2">
                                <Action
                                  tooltip="Copy Message"
                                  className="text-background group-hover:text-muted-foreground"
                                >
                                  <CopyIcon />
                                </Action>
                                <Action
                                  tooltip="Retry Message"
                                  className="text-background group-hover:text-muted-foreground"
                                >
                                  <RefreshCcwIcon />
                                </Action>
                              </Actions>
                            )}
                          </div>
                        );
                      case "reasoning":
                        // Check if this is currently streaming reasoning
                        const isLastReasoningMessage =
                          messageIndex === messages.length - 1;
                        const isLastReasoningPart =
                          i === message.parts.length - 1;
                        const isStreamingReasoning =
                          isLastReasoningMessage &&
                          isLastReasoningPart &&
                          status === "streaming";

                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={isStreamingReasoning}
                            defaultOpen={false} // Always default to closed
                          >
                            <ReasoningTrigger
                              isLoading={isStreamingReasoning}
                            />
                            <ReasoningContent className="text-xs bg-muted/50 p-4 rounded-xl">
                              {part.text}
                            </ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            </div>
          ))}
          {status === "streaming" && <Loader />}
          {/* Auto-scroll target element */}
          <div ref={messagesEndRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="pt-2 px-2 border-t border-l border-r rounded-t-xl mt-auto bg-muted sticky bottom-0 left-0 z-50">
        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-t-md shadow-none border-t border-l border-r relative"
        >
          <PromptInputTextarea
            onChange={(e) => {
              setPrompt(e.target.value);
            }}
            value={prompt}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {loaderData.models.map((model) => (
                    <PromptInputModelSelectItem
                      key={model.modelId}
                      value={model.modelId}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PromptInputButton
                    variant={isWebSearch ? "default" : "ghost"}
                    onClick={() => setIsWebSearch(!isWebSearch)}
                  >
                    <GlobeIcon size={16} />
                  </PromptInputButton>
                </TooltipTrigger>
                <TooltipContent align="start">
                  <p>Enable web search, may use additional credits.</p>
                </TooltipContent>
              </Tooltip>
            </PromptInputTools>
            <PromptInputSubmit
              className="absolute right-1 bottom-1"
              disabled={!prompt && status !== "streaming"}
              status={status}
              type={status === "streaming" ? "button" : "submit"}
              onClick={() => {
                if (status === "streaming") {
                  stop();
                }
              }}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
