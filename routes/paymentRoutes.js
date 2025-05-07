import express from 'express';
import Stripe from 'stripe';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { Application } from '../models/application.model.js';

const router = express.Router();
const stripe = new Stripe('pk_test_51RIxplRNIwrvZLG6djrMzc4HNeRcP6ePGd0ABHwrR8HDpnoho90N2XW8gO07ECXbdM952vtgC71MBUZx4NyLWhxs00xKmzRtVQ'); // Replace with your test secret key

router.post('/pay/:applicationId', isAuthenticated, async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await Application.findById(applicationId).populate('job applicant');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const job = application.job;
    const amount = job.salary; // assuming `salary` is in job model

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Salary for ${application.applicant.fullname}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:5173/payment/success/${applicationId}`,
      cancel_url: `http://localhost:5173/payment/cancel`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment failed' });
  }
});

export default router;
