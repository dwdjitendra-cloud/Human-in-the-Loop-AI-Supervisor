import HelpRequest from '../models/HelpRequest.js';
import KnowledgeBase from '../models/KnowledgeBase.js';
import { logger } from '../utils/logger.js';
import { triggerEscalation } from './escalation.js';
import { notifyCustomerAnswered } from './notify.js';

const SALON_INFO = {
  name: 'Bella\'s Hair Salon',
  hours: '9 AM - 6 PM, Monday to Saturday',
  address: '123 Main Street, Downtown',
  phone: '(555) 123-4567',
  services: ['Hair Cut', 'Hair Coloring', 'Styling', 'Perms', 'Treatments'],
};

const SYSTEM_MESSAGE = `You are a real-time voice AI receptionist for a salon called 'Frontdesk Salon'. \n\
You speak to customers over the phone using natural, friendly, and short voice responses. \n\
\n\
Your goals: \n\
1. Greet callers politely and assist them with services, timings, or appointments. \n\
2. If you confidently know an answer, respond in a conversational, human tone (under 20 words). \n\
3. If you are not sure or lack information, say exactly: 'Let me check with my supervisor and get back to you.' \n\
   - Do not guess, make up, or hallucinate answers. \n\
   - When this happens, trigger a 'help_request' event in the backend. \n\
4. Once your supervisor provides the correct answer, repeat it to the caller naturally and save it \n\
   into your knowledge base for future reference. \n\
5. Maintain context across calls, and learn incrementally from supervisor-provided data. \n\
6. Never mention AI, APIs, or system internals. Speak like a friendly human receptionist. \n\
7. Keep all responses clear, confident, and suitable for text-to-speech playback (no long paragraphs).`;

export const aiAgent = {
  async processCall(customerName, question) {
    logger.info(`Processing call from ${customerName}: "${question}"`);
    logger.info(`System Message: ${SYSTEM_MESSAGE}`);

    try {
      const knownAnswer = await this.searchKnowledgeBase(question);

      if (knownAnswer) {
        logger.info(`Found answer in knowledge base for: ${question}`);
        const response = knownAnswer.answer;

        knownAnswer.usageCount += 1;
        await knownAnswer.save();

        return {
          success: true,
          response,
          escalated: false,
          fromKnowledge: true,
        };
      }

      const defaultAnswer = this.getDefaultAnswer(question);
      if (defaultAnswer) {
        logger.info(`Found default answer for: ${question}`);
        return {
          success: true,
          response: defaultAnswer,
          escalated: false,
          fromKnowledge: false,
        };
      }

      logger.info(`Escalating question from ${customerName}: "${question}"`);
      const helpRequest = await triggerEscalation(customerName, question);

      return {
        success: true,
        response: 'Let me check with my supervisor and get back to you.',
        escalated: true,
        helpRequestId: helpRequest._id,
      };
    } catch (error) {
      logger.error('Error in aiAgent.processCall:', error.message);
      return {
        success: false,
        response: 'Sorry, I encountered an error. Please try again later.',
        escalated: false,
      };
    }
  },

  async searchKnowledgeBase(question) {
    try {
      const normalize = (s) => (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const STOP = new Set([
        'do','does','is','are','the','a','an','of','on','in','to','for','what','your','you','i','we','and','or','with','my','our','hi','hello','good','morning','evening','afternoon','at','how','when','where','please','can','could','would'
      ]);

      const tokenize = (s) => normalize(s)
        .split(' ')
        .filter(Boolean);

      const filterTokens = (tokens) => tokens.filter(t => t.length >= 2);
      const isContentToken = (t) => !STOP.has(t) && t.length >= 3;

      // Levenshtein distance (small) for fuzzy token match (handles jitu vs jeetu)
      const lev = (a, b) => {
        if (a === b) return 0;
        const m = a.length, n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + cost,
            );
          }
        }
        return dp[m][n];
      };

      const fuzzyEq = (a, b) => {
        if (a === b) return true;
        const d = lev(a, b);
        if (a.length <= 5 || b.length <= 5) return d <= 1;
        return d <= 2;
      };

      const qTokensRaw = tokenize(question);
      const qTokens = filterTokens(qTokensRaw);
      if (!qTokens.length) return null;
      const qContent = qTokens.filter(isContentToken);

      // Load all KB entries and compute a Jaccard-like fuzzy similarity
      const entries = await KnowledgeBase.find({});
      let best = null;
      let bestScore = 0;

      for (const e of entries) {
        const t = filterTokens(tokenize(e.question));
        if (!t.length) continue;
        const tContent = t.filter(isContentToken);

        // Greedy fuzzy matching for intersection size
        const used = new Array(t.length).fill(false);
        let inter = 0;
        for (const qt of qTokens) {
          let matched = false;
          for (let i = 0; i < t.length; i++) {
            if (used[i]) continue;
            if (qt === t[i] || fuzzyEq(qt, t[i])) { used[i] = true; matched = true; break; }
          }
          if (matched) inter++;
        }
        const union = new Set([...qTokens, ...t]).size || 1;
        const jaccard = inter / union;

        // Require content token agreement when at least two content tokens exist in query
        let contentMatches = 0;
        if (qContent.length >= 2) {
          const usedC = new Array(tContent.length).fill(false);
          for (const qc of qContent) {
            for (let i = 0; i < tContent.length; i++) {
              if (usedC[i]) continue;
              if (qc === tContent[i] || fuzzyEq(qc, tContent[i])) { usedC[i] = true; contentMatches++; break; }
            }
          }
        }

        // Score emphasizes content matches and overall overlap
        const score = jaccard + (contentMatches >= 2 ? 0.5 : contentMatches === 1 ? 0.2 : 0);

        if (score > bestScore) { bestScore = score; best = e; }
      }

      // Accept only if score is sufficiently high to avoid cross-person bleed
      if (best && bestScore >= 0.6) {
        return best;
      }
      return null;
    } catch (error) {
      logger.error('Error searching knowledge base:', error.message);
      return null;
    }
  },

  getDefaultAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    // Conversational and service-related questions
    if (
      lowerQuestion.includes('what services do you offer') ||
      lowerQuestion.includes('services available') ||
      lowerQuestion.includes('can you help me with') ||
      lowerQuestion.includes('do you provide') ||
      lowerQuestion.includes('what can you do')
    ) {
      return `We offer the following services: ${SALON_INFO.services.join(', ')}. If you have a specific need, just ask!`;
    }

    if (lowerQuestion.includes('how are you') || lowerQuestion.includes('how r u') || lowerQuestion.includes('how do you do')) {
      return "I'm an AI assistant, here to help you! How can I assist you today?";
    }

    if (lowerQuestion.includes('hour') || lowerQuestion.includes('open')) {
      return `${SALON_INFO.name} is open ${SALON_INFO.hours}`;
    }

    if (lowerQuestion.includes('address') || lowerQuestion.includes('location')) {
      return `We're located at ${SALON_INFO.address}`;
    }

    if (lowerQuestion.includes('phone') || lowerQuestion.includes('call')) {
      return `You can reach us at ${SALON_INFO.phone}`;
    }

    if (lowerQuestion.includes('service')) {
      return `We offer the following services: ${SALON_INFO.services.join(', ')}`;
    }

    if (lowerQuestion.includes('name')) {
      return `Welcome to ${SALON_INFO.name}!`;
    }

    return null;
  },

  async followUpWithCustomer(customerName, answer, helpRequestId) {
  logger.info(`Automated Agent following up with ${customerName} - Answer: "${answer}"`);
    logger.info(`[CUSTOMER NOTIFICATION] ${customerName}: Your question has been answered - ${answer}`);

    // Optional webhook delivery
    notifyCustomerAnswered({ customerName, answer, helpRequestId }).catch(() => {});

    return {
      success: true,
      message: 'Customer notified with answer',
    };
  },
};
