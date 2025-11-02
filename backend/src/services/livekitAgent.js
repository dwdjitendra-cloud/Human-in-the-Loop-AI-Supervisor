// Simulated LiveKit AI Agent for HIL-AI project
// In this simulation we don't actually connect to LiveKit; we mimic call handling behavior.
// Credentials would be loaded from .env if/when we integrate the SDK.

import dotenv from 'dotenv';
dotenv.config();

import { triggerEscalation, notifySupervisor } from './escalation.js';

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const SALON_INFO = {
  name: "Bella's Hair Salon",
  hours: '9 AM - 6 PM, Monday to Saturday',
  address: '123 Main Street, Downtown',
  phone: '(555) 123-4567',
  services: ['Hair Cut', 'Hair Coloring', 'Styling', 'Perms', 'Treatments'],
};

// Simulate receiving a call
export async function receiveCall(customerName, question) {
  console.log(`[LiveKit] Incoming call from ${customerName}: "${question}"`);
  // Basic business info prompt
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes('hour') || lowerQ.includes('open')) {
    return respond(customerName, `${SALON_INFO.name} is open ${SALON_INFO.hours}`);
  }
  if (lowerQ.includes('address') || lowerQ.includes('location')) {
    return respond(customerName, `We're located at ${SALON_INFO.address}`);
  }
  if (lowerQ.includes('phone') || lowerQ.includes('call')) {
    return respond(customerName, `You can reach us at ${SALON_INFO.phone}`);
  }
  if (lowerQ.includes('service')) {
    return respond(customerName, `We offer: ${SALON_INFO.services.join(', ')}`);
  }
  // If unknown, escalate
  return escalate(customerName, question);
}

export function respond(customerName, answer) {
  console.log(`[LiveKit] Responding to ${customerName}: "${answer}"`);
  // Simulate LiveKit publish (in real app, send audio/text)
  return { success: true, answer };
}

export async function escalate(customerName, question) {
  console.log(`[LiveKit] Let me check with my supervisor and get back to you.`);
  // Create a pending help request in DB
  const helpRequest = await triggerEscalation(customerName, question);
  // Simulate supervisor notification (console/webhook stub)
  notifySupervisor(helpRequest);
  return { success: false, escalated: true, helpRequestId: helpRequest._id };
}

// Example usage
// receiveCall('Alice', 'What are your business hours?');
// receiveCall('Bob', 'How do I book a perm?');

// ESM exports above; no CommonJS export.
