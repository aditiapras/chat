import { verifyWebhook } from "@clerk/react-router/webhooks";
import type { Route } from "./+types/webhook";
import { prisma } from "~/lib/prisma";

export const action = async ({ request }: Route.ActionArgs) => {
    try {
      const evt = await verifyWebhook(request);
      const { id } = evt.data;
      const eventType = evt.type;

      if(eventType === "user.created"){
        await prisma.user.create({
          data:{
            clerkId:id!,
            firstName:evt.data.first_name,
            lastName:evt.data.last_name,
            imageUrl:evt.data.image_url,
            email:evt.data.email_addresses[0].email_address, 
          }
        })
      }

      if(eventType === "user.updated"){
        await prisma.user.update({
          where:{
            clerkId:id!,
          },
          data:{
            firstName:evt.data.first_name,
            lastName:evt.data.last_name,
            imageUrl:evt.data.image_url,
            email:evt.data.email_addresses[0].email_address, 
          }
        })
      }

      if(eventType === "user.deleted"){
        await prisma.user.delete({
          where:{
            clerkId:id!,
          }
        })
      }
      console.log("Webhook received", { id, eventType, success: true, status: 200 });
      return new Response("Webhook received", { status: 200 });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error verifying webhook", { status: 400 });
    }
  };

export async function loader() {
    return {
      success: true,
      status: 200,
    };
}
  