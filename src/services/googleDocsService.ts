import { SavedInvestigation } from '../lib/investigationStore';

/**
 * Service to generate a Google Doc report from an investigation.
 */
export async function createGoogleDocReport(
  investigation: SavedInvestigation,
  accessToken: string
): Promise<string> {
  // 1. Create a new Google Doc
  const docRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Earth Trace Report: ${investigation.title}`
    }),
  });

  if (!docRes.ok) {
    throw new Error('Failed to create Google Doc');
  }

  const doc = await docRes.json();
  const docId = doc.documentId;

  // 2. Prepare content to write to the document
  const content = [
    { insertText: { text: `Earth Trace Investigation Report\n\n` } },
    { insertText: { text: `Title: ${investigation.title}\n` } },
    { insertText: { text: `Date: ${new Date().toLocaleDateString()}\n\n` } },
    { insertText: { text: `Summary:\n${investigation.aiInsight?.scientificSummary || 'No summary available.'}\n\n` } },
    { insertText: { text: `Key Takeaways:\n` } },
    ...(investigation.aiInsight?.keyTakeawayBullets.map((bullet: string) => ({
      insertText: { text: `• ${bullet}\n` }
    })) || []),
    { insertText: { text: `\nData Source: ${investigation.source}\n` } },
  ];

  // 3. Send batchUpdate request to write content
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: content.reverse() // Docs API prepends, so reverse to maintain order
    }),
  });

  if (!updateRes.ok) {
    throw new Error('Failed to update Google Doc content');
  }

  return docId;
}
