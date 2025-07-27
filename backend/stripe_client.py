import stripe
import os
from typing import Dict, Any

class StripeClient:
    def __init__(self):
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
    
    async def create_customer(self, email: str, name: str = None) -> Dict[str, Any]:
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name
            )
            return customer
        except Exception as e:
            raise Exception(f"Stripe customer creation failed: {str(e)}")
    
    async def create_subscription(self, customer_email: str, price_id: str) -> Dict[str, Any]:
        try:
            # Create or get customer
            customers = stripe.Customer.list(email=customer_email)
            if customers.data:
                customer = customers.data[0]
            else:
                customer = await self.create_customer(customer_email)
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer.id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            
            return subscription
        except Exception as e:
            raise Exception(f"Stripe subscription creation failed: {str(e)}")
    
    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        try:
            subscription = stripe.Subscription.delete(subscription_id)
            return subscription
        except Exception as e:
            raise Exception(f"Stripe subscription cancellation failed: {str(e)}")
