/**
 * conversationSummarizer.js
 *
 * Generates a rolling summary of a conversation every SUMMARY_INTERVAL exchanges.
 * The summary is stored as a special role='summary' row in chat_histories.
 *
 * Why this matters:
 *   The LLM reasoning loop only sees the last 2 exchanges for TPM efficiency.
 *   Without summarization, critical context (allergies, prior symptoms, booked
 *   appointments) is silently dropped after the third message. The summary row
 *   is injected at the top of every context window so that information survives
 *   across the entire conversation.
 */

const axios = require('axios');
const { ChatHistory } = require('../../models');

// Trigger a new summary after every N user+assistant exchange pairs
const SUMMARY_INTERVAL = 6;
const SUMMARIZER_MODEL = 'llama-3.1-8b-instant';
const SUMMARIZER_TIMEOUT_MS = 10000;

const SUMMARIZER_SYSTEM_PROMPT = `You are a medical conversation summarizer for a healthcare AI assistant.
Given a conversation history, produce a concise clinical summary that captures:
- Patient-reported symptoms or health concerns
- Medications or allergies mentioned
- Appointments booked, cancelled, or discussed
- Any diagnoses or conditions referenced
- Key decisions or action items

Keep the summary under 200 words. Write in third person ("The patient mentioned...").
Focus only on medically and contextually relevant information.`;

/**
 * Checks if a new summary is due and generates one if so.
 * Called after every assistant response is persisted.
 *
 * @param {string|number} userId
 * @param {string} conversationId
 * @returns {Promise<void>}
 */
async function maybeSummarize(userId, conversationId) {
  if (!conversationId) return;

  try {
    // Count user+assistant messages since last summary
    const lastSummary = await ChatHistory.findOne({
      where: { userId, conversationId, role: 'summary' },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'created_at'],
    });

    const countWhere = {
      userId,
      conversationId,
      role: ['user', 'assistant'],
    };

    // Only count messages after the last summary (or all messages if no summary yet)
    if (lastSummary) {
      const { Op } = require('sequelize');
      countWhere.created_at = { [Op.gt]: lastSummary.created_at };
    }

    const { ChatHistory: CH, sequelize } = require('../../models');
    const { Op } = require('sequelize');

    const messagesSinceLastSummary = await ChatHistory.count({
      where: lastSummary
        ? { userId, conversationId, role: ['user', 'assistant'], created_at: { [Op.gt]: lastSummary.created_at } }
        : { userId, conversationId, role: ['user', 'assistant'] },
    });

    // Each exchange = 1 user + 1 assistant message = 2 rows
    if (messagesSinceLastSummary < SUMMARY_INTERVAL * 2) return;

    // Fetch messages to summarize
    const messages = await ChatHistory.findAll({
      where: lastSummary
        ? { userId, conversationId, role: ['user', 'assistant'], created_at: { [Op.gt]: lastSummary.created_at } }
        : { userId, conversationId, role: ['user', 'assistant'] },
      order: [['created_at', 'ASC']],
      attributes: ['role', 'content'],
    });

    if (messages.length < 4) return;

    const summary = await _generateSummary(messages, lastSummary ? await _getLastSummaryText(userId, conversationId) : null);

    if (summary) {
      await ChatHistory.create({
        userId,
        role: 'summary',
        content: summary,
        conversationId,
        title: null,
      });
      console.log(`[ConversationSummarizer] Summary created for conversation ${conversationId}`);
    }
  } catch (err) {
    // Never crash the main chat flow on summarizer failure
    console.error('[ConversationSummarizer] Failed:', err.message);
  }
}

/**
 * Retrieves the latest summary for a conversation to inject into the LLM context.
 *
 * @param {string|number} userId
 * @param {string} conversationId
 * @returns {Promise<string|null>}
 */
async function getLatestSummary(userId, conversationId) {
  if (!conversationId) return null;

  try {
    const row = await ChatHistory.findOne({
      where: { userId, conversationId, role: 'summary' },
      order: [['created_at', 'DESC']],
      attributes: ['content'],
    });
    return row?.content || null;
  } catch (err) {
    console.error('[ConversationSummarizer] getLatestSummary failed:', err.message);
    return null;
  }
}

async function _getLastSummaryText(userId, conversationId) {
  const row = await ChatHistory.findOne({
    where: { userId, conversationId, role: 'summary' },
    order: [['created_at', 'DESC']],
    attributes: ['content'],
  });
  return row?.content || null;
}

async function _generateSummary(messages, previousSummary) {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const userContent = previousSummary
    ? `PREVIOUS SUMMARY:\n${previousSummary}\n\nNEW CONVERSATION SEGMENT:\n${transcript}\n\nUpdate the summary to incorporate new information.`
    : `CONVERSATION:\n${transcript}`;

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: SUMMARIZER_MODEL,
        messages: [
          { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: SUMMARIZER_TIMEOUT_MS,
      }
    );

    return res.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('[ConversationSummarizer] LLM call failed:', err.message);
    return null;
  }
}

module.exports = { maybeSummarize, getLatestSummary };
