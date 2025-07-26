import { processHTML } from './html_parser.js';
import { google } from 'googleapis';
import { classifyAndSummarize } from './pipeline.js';

function parseEmail(message) {
  const headers = message.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
  const from = headers.find(h => h.name === 'From')?.value || '(no sender)';

  let body = '';
  let attachments = [];

  // Recursive function to walk through MIME parts
  function walkParts(parts) {
    for (const part of parts) {
      if (part.parts) {
        walkParts(part.parts); // nested multiparts
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
        });
      }
    }
  }

  if (message.payload.parts) {
    walkParts(message.payload.parts);
  } else if (message.payload.body?.data) {
    // fallback for simple emails
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }
  body = processHTML(body); // Process HTML content if present
  return { from, subject, body, attachments };
}

/**
 * Lists the messages in the user's account along with classification and summarization.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listMessages(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 25,
  });

  const messages = res.data.messages || [];
  if (messages.length === 0) {
    console.log('No emails found.');
    return;
  }

  const parsedEmails = [];

  const emailPromises = messages.map(async ({ id }) => {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const parsed = parseEmail(msg.data);
    const result = {
      from: parsed.from,
      subject: parsed.subject,
      body: parsed.body,
    };

    try {
      const output = await classifyAndSummarize.invoke(parsed.body);

      console.log(`From: ${parsed.from}`);
      console.log(`Subject: ${parsed.subject}`);
      console.log(`Summary: ${output.summary.content}`);
      console.log(`Classification: ${JSON.stringify(output.classification, null, 2)}`);
      console.log('-----------------------------------');

      result.classification = output.classification;
      result.summary = output.summary.content;
    } catch (err) {
      console.error(`Error during processing email: ${parsed.subject}`);
      console.error(err.message);
    }

    return result;
  });

  return await Promise.all(emailPromises);
}


export default listMessages;