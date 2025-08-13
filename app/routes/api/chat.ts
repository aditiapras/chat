import type { Route } from "./+types/chat";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  streamText,
  generateText,
  type UIMessage,
} from "ai";
import { prisma } from "~/lib/prisma";

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const { userId } = await getAuth(args);
  if (!userId) {
    return {
      success: false,
      status: 401,
    };
  }
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const {
    messages,
    model,
    threadId,
  }: { messages: UIMessage[]; model: string; threadId: string } =
    await request.json();

  const lastMessage = messages[messages.length - 1];

  if (lastMessage && lastMessage.role === "user") {
    const userMessageContent = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    try {
      await prisma.message.create({
        data: {
          role: lastMessage.role,
          content: userMessageContent,
          model,
          threadId,
        },
      });
      console.log("✅ User message saved successfully");
    } catch (error) {
      console.error(`❌ Failed to create message: ${error}`);
    }
  }

  const result = streamText({
    model: openrouter.chat(model),
    messages: convertToModelMessages(messages),
    onAbort: () => {
      console.log("Generation Aborted");
    },
  });

  return result.toUIMessageStreamResponse({
    onFinish: async (result) => {
      // Title generation is now handled by fetcher.form in the component
      // This keeps the API clean and uses React Router 7's data mutation pattern
      try {
        const message = await prisma.message.create({
          data: {
            role: result.responseMessage.role,
            content: result.responseMessage.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(""),
            model,
            threadId: threadId,
          },
        });
        console.log("✅ Assistant message saved successfully", message);
      } catch (error) {
        console.error(`❌ Failed to create message: ${error}`);
      }
    },

    sendReasoning: true,
  });
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    return {
      success: false,
      status: 401,
    };
  }

  return {
    success: true,
    status: 200,
  };
}
