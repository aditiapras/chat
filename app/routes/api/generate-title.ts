import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/generate-title";
import { prisma } from "~/lib/prisma";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const { userId } = await getAuth(args);

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.formData();
  const threadId = formData.get("threadId") as string;
  const aiResponse = formData.get("aiResponse") as string;
  const model = formData.get("model") as string;

  if (!threadId || !aiResponse || !model) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Check if thread exists and belongs to user
    const thread = await prisma.thread.findUnique({
      where: {
        id: threadId,
        userId: userId,
      },
      select: {
        title: true,
      },
    });

    if (!thread) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only generate title if it doesn't exist
    if (!thread.title) {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const titleResponse = await generateText({
        model: openrouter.chat(model),
        prompt: `Create a simple max 7 words title based on this AI response (output only plain text): ${aiResponse.substring(0, 500)}`,
      });

      // Sanitize and validate title
      const sanitizedTitle = titleResponse.text
        .replace(/[<>]/g, "") // Remove potential HTML tags
        .substring(0, 100) // Limit length
        .trim();

      if (sanitizedTitle) {
        await prisma.thread.update({
          where: { id: threadId },
          data: { title: sanitizedTitle },
        });

        console.log("✅ Title generated via action:", sanitizedTitle);

        return new Response(
          JSON.stringify({
            success: true,
            title: sanitizedTitle,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        title: thread.title,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Failed to generate title:", error);
    return new Response(JSON.stringify({ error: "Failed to generate title" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
