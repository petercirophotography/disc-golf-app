import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import throwTrackerRouter from './routes/throw-tracker.js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.use('/api/throw-tracker', throwTrackerRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', stripe: !!process.env.STRIPE_SECRET_KEY });
});

app.post('/create-checkout-session', async (req, res) => {
  const { courseId, courseName, price } = req.body;

  console.log('Received payment request:', { courseId, courseName, price });
  console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${courseName} - Full Walkthrough`,
              description: 'Complete video walkthrough access',
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/course/${courseId}?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/course/${courseId}?canceled=true`,
      metadata: {
        courseId: courseId.toString(),
      },
    });

    console.log('Checkout session created:', session.id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
