import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { saveSubscription } from "../../utils/manageSubscriptions";

export class WebhooksController {
  async handle(request: Request, response: Response) {
    let event: Stripe.Event = request.body;

    const signature = request.headers["stripe-signature"];
    let endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (error) {
      console.log("Webhook signature failed", error.message);
      return response.sendStatus(400).send(`Webhook error: ${error.message}`);
    }

    switch (event.type) {
      case "customer.subscription.deleted":
        const payment = event.data.object as Stripe.Subscription;

        await saveSubscription(
          payment.id,
          payment.customer.toString(),
          false,
          true
        );
        break;
      case "customer.subscription.updated":
        const paymentIntent = event.data.object as Stripe.Subscription;

        await saveSubscription(
          paymentIntent.id,
          paymentIntent.customer.toString(),
          false
        );
        break;
      case "checkout.session.completed":
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await saveSubscription(
          checkoutSession.subscription.toString(),
          checkoutSession.customer.toString(),
          true
        );
        break;
      default:
        console.log(`Evento desconhecido ${event.type}`);
        break;
    }

    response.send();
  }
}
