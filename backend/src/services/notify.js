// Simple webhook/console notification service
// Uses global fetch (Node 18+) to POST to an optional webhook URL

export async function sendNotification({ type, message, payload = {}, url = process.env.NOTIFY_WEBHOOK_URL }) {
  try {
    const event = { type, message, payload, timestamp: new Date().toISOString() };
    // Always log to console for visibility
    // eslint-disable-next-line no-console
    console.log(`[NOTIFY] ${type}: ${message}`);

    if (!url) {
      return { delivered: false, reason: 'No webhook URL configured', event };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    const ok = res.ok;
    return { delivered: ok, status: res.status, event };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[NOTIFY] Error delivering webhook:', err.message);
    return { delivered: false, error: err.message };
  }
}

export async function notifySupervisorHelpNeeded(helpRequest) {
  const question = helpRequest?.question || '';
  const message = `Hey, I need help answering: "${question}"`;
  return sendNotification({
    type: 'supervisor.help_needed',
    message,
    payload: {
      helpRequestId: helpRequest?._id,
      customerName: helpRequest?.customerName,
      question,
      status: helpRequest?.status,
    },
  });
}

export async function notifyCustomerAnswered({ customerName, answer, helpRequestId }) {
  const message = `${customerName}: Your question has been answered - ${answer}`;
  return sendNotification({
    type: 'customer.follow_up',
    message,
    payload: { helpRequestId, customerName, answer },
  });
}
