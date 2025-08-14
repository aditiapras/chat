import type { Route } from "./+types/chat";
import { getAuth } from "@clerk/react-router/ssr.server";
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { prisma } from "~/lib/prisma";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const { userId } = await getAuth(args);
  if (!userId) {
    return {
      success: false,
      status: 401,
    };
  }

  const {
    messages,
    model,
    threadId,
    isWebSearch,
  }: {
    messages: UIMessage[];
    model: string;
    threadId: string;
    isWebSearch: boolean;
  } = await request.json();

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

  const webSearch = tool({
    description: "Search the web for information and provide sources",
    inputSchema: z.object({
      query: z.string().describe("The query to search for"),
      maxResults: z
        .number()
        .default(3)
        .describe("The maximum number of results to return"),
    }),
    execute: async ({ query, maxResults }) => {
      console.log(`🔍 Starting web search for: "${query}"`);
      const startTime = Date.now();

      const crawlResponse = await app.search(query, {
        limit: maxResults,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
          timeout: 15000,
          maxAge: 3600,
        },
      });

      if (!crawlResponse.success) {
        throw new Error(crawlResponse.error);
      }

      const searchTime = Date.now() - startTime;
      console.log(
        `✅ Web search completed in ${searchTime}ms, found ${crawlResponse.data.length} results`
      );

      return crawlResponse.data.map((result: any) => ({
        title: result.title || result.url,
        url: result.url,
        content: result.markdown?.slice(0, 1000), // take just the first 1000 characters
      }));
    },
  });

  const result = streamText({
    model: gateway(model),
    messages: convertToModelMessages(messages),
    onAbort: ({ steps }) => {
      console.log("Generation Aborted", steps);
    },
    prepareStep: ({ steps }) => {
      if (isWebSearch && steps.length === 0) {
        console.log("✅ Web search enabled - requiring tool use on first step");
        return {
          toolChoice: "required",
        };
      }
      return {
        toolChoice: "none",
      };
    },
    tools: {
      webSearch,
    },
    stopWhen: stepCountIs(2),
    onFinish: async ({ text, toolResults, reasoning }) => {
      try {
        // Convert reasoning array to text string
        const reasoningText =
          reasoning?.map((part) => part.text).join("\n") || null;

        console.log("🔄 Attempting to save assistant message:", {
          role: "assistant",
          content: text?.substring(0, 100) + "...",
          reasoning:
            reasoningText?.substring(0, 100) + (reasoningText ? "..." : "none"),
          model,
          threadId,
          contentLength: text?.length,
          reasoningLength: reasoningText?.length || 0,
        });

        // Check database connection
        console.log("🔍 Checking database connection...");
        await prisma.$connect();
        console.log("✅ Database connection confirmed");

        const message = await prisma.message.create({
          data: {
            role: "assistant",
            content: text,
            reasoning: reasoningText, // Save reasoning text if available
            model,
            threadId: threadId,
            webSearch:
              toolResults?.length > 0
                ? toolResults
                    .map((r: any) => r.result?.map((item: any) => item.url))
                    .flat()
                    .filter(Boolean)
                : [],
          },
        });

        console.log(
          "✅ Assistant message saved successfully with ID:",
          message.id
        );
        console.log("📊 Message details:", {
          id: message.id,
          role: message.role,
          model: message.model,
          threadId: message.threadId,
          contentLength: message.content?.length,
          webSearchCount: message.webSearch?.length || 0,
        });

        // VERIFICATION: Query back the saved message to confirm it exists
        try {
          const verifyMessage = await prisma.message.findUnique({
            where: { id: message.id },
            select: { id: true, role: true, content: true, createdAt: true },
          });

          if (verifyMessage) {
            console.log(
              "✅ VERIFICATION: Message confirmed in database:",
              verifyMessage.id
            );
          } else {
            console.error(
              "❌ VERIFICATION FAILED: Message not found in database after save!"
            );
          }
        } catch (verifyError) {
          console.error("❌ VERIFICATION ERROR:", verifyError);
        }
      } catch (error) {
        console.error(`❌ Failed to create message:`, error);
        console.error(`❌ Error details:`, {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack?.substring(0, 500),
        });
      }
      console.log("✅ Sources:", toolResults);
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true, // Native AI SDK source handling
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
