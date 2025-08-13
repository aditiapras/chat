
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
import { useLocation } from "react-router";

export const meta: Route.MetaFunction = ({ loaderData }: Route.MetaArgs) => {
  console.log(loaderData?.title?.title)
  return [{
    title: loaderData?.title?.title,
    description: "Chat with AI",
  }]
}

export async function loader(args: Route.LoaderArgs) {
  const { params } = args
  const models = await prisma.aIModel.findMany({
    select: {
      name: true,
      modelId: true,
    },
    orderBy: {
      provider: "asc"
    }
  });
  const selectedModel = await prisma.thread.findUnique({
    where: {
      id: params.id,
    },
    select: {
      model: true,
    }
  })
  const messages = await prisma.message.findMany({
    where: {
      threadId: params.id,
    },
    select: {
      id: true,
      role: true,
      content: true,
    },
  })
  const title = await prisma.thread.findUnique({
    where: {
      id: params.id,
    },
    select: {
      title: true,
    }
  })
  return { models, selectedModel, params, messages, title };
}

export default function Threads({ loaderData }: Route.ComponentProps) {

  const location = useLocation();
  const [model, setModel] = useState(loaderData.selectedModel?.model || loaderData.models[0].modelId);
  const [prompt, setPrompt] = useState("");
  const { sendMessage, messages, status, setMessages } = useChat();
  const isInitial = useRef(true);


  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    sendMessage({ text: location.state?.prompt }, { body: { model, threadId: loaderData.params.id } });
  }, [location.state]);

  useEffect(() => {
    setMessages(loaderData.messages.map((message) => ({
      id: message.id,
      role: message.role as "user" | "system" | "assistant",
      parts: [{
        type: "text",
        text: message.content,
      }],
    })));
  }, [loaderData.messages]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ text: prompt }, { body: { model, threadId: loaderData.params.id } });
    setPrompt("");
  };


  return (
    <div className="w-full 2xl:max-w-4xl lg:max-w-3xl mx-auto flex flex-col h-full px-5 md:px-0 relative">
      <Conversation className="relative">
        <ConversationContent>
          {messages.map((message, messageIndex) => (
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
                              <Action tooltip="Copy Message" className="text-background group-hover:text-muted-foreground">
                                <CopyIcon />
                              </Action>
                              <Action tooltip="Retry Message" className="text-background group-hover:text-muted-foreground">
                                <RefreshCcwIcon />
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
          ))}
          {status === "submitted" && <Loader />}
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
              <PromptInputButton>
                <GlobeIcon size={16} />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              className="absolute right-1 bottom-1"
              disabled={!prompt || status !== "streaming"}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}