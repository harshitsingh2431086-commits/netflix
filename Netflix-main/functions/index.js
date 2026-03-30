const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Initialize Razorpay
// Set these via: firebase functions:config:set razorpay.key_id="YOUR_KEY" razorpay.key_secret="YOUR_SECRET"
const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

/**
 * 1. Create Subscription
 * Called by frontend when user selects a plan.
 */
exports.createRazorpaySubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

  const { planId } = data; // This is the Razorpay Plan ID (e.g. plan_HKl3...), not Firestore ID

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years monthly
    });

    // Save initial status
    await db.collection('subscriptions').doc(subscription.id).set({
        uid: context.auth.uid,
        status: 'created',
        planId: planId,
        razorpaySubscriptionId: subscription.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { subscriptionId: subscription.id, keyId: functions.config().razorpay.key_id };
  } catch (error) {
    console.error('Razorpay Error:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create subscription');
  }
});

/**
 * 2. Create Plan
 * Called by admin to create a new plan in Razorpay
 */
exports.createRazorpayPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  
  // Verify admin role (optional but recommended)
  // const user = await admin.auth().getUser(context.auth.uid);
  // if (user.customClaims?.role !== 'admin') throw ...

  try {
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: data.name,
        amount: data.price * 100,
        currency: 'INR',
        description: data.description || `${data.name} Plan`
      },
      notes: {
        resolution: data.resolution,
        quality: data.quality
      }
    });

    return { id: plan.id };
  } catch (error) {
    console.error('Razorpay Plan Create Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 3. Razorpay Webhook Handler
 * Single endpoint for all events: subscription.activated, charged, cancelled
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];

  // 1. Verify Signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== signature) {
    console.error("Invalid Webhook Signature");
    return res.status(400).json({ status: 'failure' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`Received Webhook: ${event}`);

  try {
      if (event === 'subscription.activated' || event === 'subscription.charged') {
          const subData = payload.subscription.entity;
          const uid = await getUidBySubscriptionId(subData.id);
          
          if (uid) {
              // Update User Status
              await db.collection('users').doc(uid).update({
                  subscriptionStatus: 'active',
                  activePlan: subData.plan_id,
                  currentPeriodEnd: subData.current_end,
              });

              // Update Subscription Doc
              await db.collection('subscriptions').doc(subData.id).update({
                  status: 'active',
                  currentPeriodEnd: subData.current_end,
                  lastChargedAt: admin.firestore.FieldValue.serverTimestamp()
              });
          }
      } 
      else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
          const subData = payload.subscription.entity;
          const uid = await getUidBySubscriptionId(subData.id);

          if (uid) {
               await db.collection('users').doc(uid).update({
                  subscriptionStatus: 'inactive'
              });
              
               await db.collection('subscriptions').doc(subData.id).update({
                  status: 'cancelled'
              });
          }
      }

      res.json({ status: 'ok' });
  } catch (err) {
      console.error(err);
      res.status(500).send("Internal Error");
  }
});

async function getUidBySubscriptionId(subId) {
    const doc = await db.collection('subscriptions').doc(subId).get();
    if (doc.exists) return doc.data().uid;
    return null;
}