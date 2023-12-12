import Stripe from "stripe";
import prismaClient from "../../prisma";

interface CreatePortalRequest {
  user_id: string;
}

export class CreatePortalService {
  async execute({ user_id }: CreatePortalRequest) {
    const stripe = new Stripe(process.env.STRIPE_API_KEY, {
      apiVersion: "2023-10-16",
      appInfo: {
        name: "smilegestorpro",
        version: "1",
      },
    });

    const findUser = await prismaClient.user.findFirst({
      where: {
        id: user_id,
      },
    });

    let sessionId = findUser.stripe_customer_id;

    if (!sessionId) {
      console.log("NÃO TEM ID");
      return { message: "User not found" };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sessionId,
      return_url: process.env.STRIPE_SUCESS_URL,
    });

    return {
      sessionId: portalSession.url,
    };
  }
}
