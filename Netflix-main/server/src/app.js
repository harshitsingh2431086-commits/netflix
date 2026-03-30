import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ type: '*/*' }));

const port = process.env.PORT || 5000;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
if (!admin.apps.length && projectId && clientEmail && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}
const db = admin.apps.length ? admin.firestore() : null;

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/plans/create', async (req, res) => {
  try {
    const data = req.body || {};
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: data.name,
        amount: Math.round(Number(data.price) * 100),
        currency: 'INR',
        description: data.description || `${data.name} Plan`
      },
      notes: {
        resolution: data.resolution,
        quality: data.quality
      }
    });
    res.json({ id: plan.id });
  } catch (e) {
    res.status(500).json({ error: 'plan_create_failed' });
  }
});

app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { planId, uid } = req.body || {};
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120
    });
    if (db) {
      await db.collection('subscriptions').doc(subscription.id).set({
        uid: uid || null,
        status: 'created',
        planId,
        razorpaySubscriptionId: subscription.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    res.json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    res.status(500).json({ error: 'subscription_create_failed' });
  }
});

app.post('/webhooks/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const body = JSON.stringify(req.body);
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (digest !== signature) {
    return res.status(400).json({ status: 'failure' });
  }
  const event = req.body.event;
  const payload = req.body.payload;
  try {
    if (event === 'subscription.activated' || event === 'subscription.charged') {
      const sub = payload.subscription.entity;
      if (db) {
        const docSnap = await db.collection('subscriptions').doc(sub.id).get();
        const uid = docSnap.exists ? docSnap.data().uid : null;
        if (uid) {
          await db.collection('users').doc(uid).update({
            subscriptionStatus: 'active',
            activePlan: sub.plan_id,
            currentPeriodEnd: sub.current_end
          });
        }
        await db.collection('subscriptions').doc(sub.id).set({
          status: 'active',
          currentPeriodEnd: sub.current_end,
          lastChargedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const sub = payload.subscription.entity;
      if (db) {
        const docSnap = await db.collection('subscriptions').doc(sub.id).get();
        const uid = docSnap.exists ? docSnap.data().uid : null;
        if (uid) {
          await db.collection('users').doc(uid).update({
            subscriptionStatus: 'inactive'
          });
        }
        await db.collection('subscriptions').doc(sub.id).set({
          status: 'cancelled'
        }, { merge: true });
      }
    }
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
