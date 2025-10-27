/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const sgMail = require("@sendgrid/mail");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// HTTPS endpoint to send redemption email via SendGrid
exports.sendRedemptionEmail = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const apiKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
    const fromEmail = process.env.FROM_EMAIL || functions.config().sendgrid?.from;
    if (!apiKey || !fromEmail) {
      logger.error('Missing SENDGRID_API_KEY or FROM_EMAIL');
      return res.status(500).json({ error: 'Email not configured' });
    }
    sgMail.setApiKey(apiKey);

    const { email, reward, userId } = req.body || {};
    if (!email || !reward?.title || !reward?.credits) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const msg = {
      to: email,
      from: fromEmail,
      subject: `Your EcoLife Reward: ${reward.title}`,
      text: `Hi!\n\nThanks for redeeming: ${reward.title}.\nCredits used: ${reward.credits}.\nUser: ${userId}.\n\nWe will process your reward shortly.\n\n— EcoLife Team`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2>Reward Redeemed 🎉</h2>
          <p>Thanks for redeeming <strong>${reward.title}</strong>.</p>
          <p><strong>Credits used:</strong> ${reward.credits}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p>We will process your reward shortly.</p>
          <hr/>
          <p style="color:#64748b">EcoLife</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error('sendRedemptionEmail error', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});
