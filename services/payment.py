# PayPal-ready payment structure

from flask import Blueprint, request, jsonify
import paypalrestsdk
import os

paypal_bp = Blueprint('paypal', __name__)

# Configure PayPal SDK
# In production, use os.environ.get for these values
paypalrestsdk.configure({
    "mode": os.environ.get('PAYPAL_MODE', 'sandbox'), # sandbox or live
    "client_id": os.environ.get('PAYPAL_CLIENT_ID', 'your-client-id'),
    "client_secret": os.environ.get('PAYPAL_CLIENT_SECRET', 'your-client-secret')
})

@paypal_bp.route('/create-subscription', methods=['POST'])
def create_subscription():
    # Example showing how you might interact with PayPal via Python
    # However, in our flow, the React frontend handles creation via @paypal/react-paypal-js
    # This endpoint is kept for completeness if server-side creation is desired.
    data = request.get_json()
    
    billing_plan_id = data.get('plan_id', os.environ.get('PAYPAL_PREMIUM_MONTHLY_PLAN_ID'))
    
    billing_agreement = paypalrestsdk.BillingAgreement({
        "name": "Premium Subscription",
        "description": "Premium Subscription Agreement",
        "start_date": data.get('start_date'), # Must be in ISO8601 format and in the future
        "plan": {
            "id": billing_plan_id
        },
        "payer": {
            "payment_method": "paypal"
        }
    })

    if billing_agreement.create():
        # returns the approval url that user needs to be redirected to
        for link in billing_agreement.links:
            if link.rel == "approval_url":
                approval_url = str(link.href)
                return jsonify({'approval_url': approval_url})
        return jsonify({'error': 'Approval URL not found'}), 500
    else:
        return jsonify({'error': billing_agreement.error}), 500

