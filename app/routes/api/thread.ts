import { getAuth } from "@clerk/react-router/ssr.server"
import type { Route } from "./+types/thread"
import { prisma } from "~/lib/prisma"

export async function action(args:Route.ActionArgs) {
    const {request} = args
    const body = await request.json()
    const {userId} = await getAuth(args)
try {
    const threads = await prisma.thread.create({
        data:{
            userId,
            model: body.model,
        }
    })

    console.log("✅ Thread created successfully", threads)
    return new Response(JSON.stringify({ 
      threadId: threads.id,
      model: threads.model
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
} catch (error) {
    console.error(`❌ Failed to create thread: ${error}`);
    return new Response(JSON.stringify({ error: "Failed to create thread" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }); 
}
}

export async function loader() {
    return {
        success: true,
        status: 200,
    }
}