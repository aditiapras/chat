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
import { useState } from "react";
import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/id";
import { useChat } from "@ai-sdk/react";
import { Loader } from "~/components/ai-elements/loader";
import { Actions, Action } from "~/components/ai-elements/actions";
import { MarkdownRenderer } from "~/components/markdown-renderer";

export async function loader(args: Route.LoaderArgs) {
  const models = await prisma.aIModel.findMany({
    select: {
      name: true,
      code: true,
    },
  });
  return { models };
}

export default function Threads({ loaderData }: Route.ComponentProps) {
  const [model, setModel] = useState(loaderData.models[0].code);
  const [prompt, setPrompt] = useState("");
  const { sendMessage, messages, status } = useChat();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ text: prompt }, { body: { model } });
    setPrompt("");
  };

  return (
    <div className="w-full 2xl:max-w-4xl lg:max-w-3xl mx-auto flex flex-col h-full px-5 md:px-0 relative">
      <Conversation className="relative">
        <ConversationContent>
          {messages.map((message, messageIndex) => (
            <Message from={message.role} key={message.id}>
              <MessageContent className="group-[.is-user]:bg-muted group-[.is-user]:text-foreground group-[.is-assistant]:bg-transparent">
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      const isLastMessage =
                        messageIndex === messages.length - 1;
                      return (
                        <div key={`${message.id}-${i}`}>
                          <MarkdownRenderer content={part.text} />
                          {message.role === "assistant" && isLastMessage && (
                            <Actions className="mt-2">
                              <Action onClick={() => { }} label="Retry">
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action label="Like">
                                <ThumbsUpIcon className="size-3" />
                              </Action>
                              <Action label="Dislike">
                                <ThumbsDownIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </div>
                      );
                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === "streaming"}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent className="bg-muted p-4 text-xs rounded-xl">
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
          ))}
          {status === "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="pt-3 px-3 border-t border-l border-r rounded-t-xl mt-auto bg-muted sticky bottom-0 left-0 z-50">
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
                      key={model.code}
                      value={model.code}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
              <PromptInputButton>
                <GlobeIcon size={16} />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              className="absolute right-1 bottom-1"
              disabled={!prompt}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}