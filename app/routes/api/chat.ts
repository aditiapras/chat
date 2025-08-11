import type { Route } from "./+types/chat";
import { getAuth } from "@clerk/react-router/ssr.server";
import {createOpenRouter} from "@openrouter/ai-sdk-provider"
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export async function action(args: Route.ActionArgs) {
    const { request } = args
    const { userId } = await getAuth(args)
    if (!userId) {
        return {
            success: false,
            status: 401,
        };
    }

    const {messages, model}: {messages: UIMessage[], model: string} = await request.json()

    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    })

    const result = streamText({
        model: openrouter.chat(model),
        messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
}

export async function loader(args: Route.LoaderArgs) {
    const { userId } = await getAuth(args)
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
