import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { getEmbedding, cosineSimilarity } from '@/lib/embeddings';
import { answerQuestion } from '@/lib/ai';

/**
 * POST: Ask LOOP Q&A using vector retrieval and Claude narrative generation.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { question } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question parameter is required' }, { status: 400 });
    }

    const { workspaceId } = session.user;

    // 1. Generate query embedding vector
    const queryVector = await getEmbedding(question);

    // 2. Fetch all feedback items with their embeddings in this workspace
    const embeddings = await db.embedding.findMany({
      where: {
        feedback: {
          workspaceId,
        },
      },
      include: {
        feedback: true,
      },
    });

    if (embeddings.length === 0) {
      return NextResponse.json({
        answer: 'No feedback items with embeddings found in the database. Please ingest feedback first.',
        citations: [],
      });
    }

    // 3. Compute cosine similarity in memory
    const scoredFeedbacks = embeddings.map(emb => {
      let vectorArr: number[] = [];
      try {
        vectorArr = JSON.parse(emb.vector);
      } catch (e) {
        console.error('Failed to parse vector array:', e);
      }

      const similarity = vectorArr.length > 0 ? cosineSimilarity(queryVector, vectorArr) : 0;

      return {
        feedback: emb.feedback,
        similarity,
      };
    });

    // 4. Sort and filter top-K results
    const topMatches = scoredFeedbacks
      .filter(item => item.similarity > 0.15) // Filter out low similarity matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Grab top 10 items as grounding context

    if (topMatches.length === 0) {
      return NextResponse.json({
        answer: 'I could not find any customer feedback semantically relevant to your question. Please try asking about onboarding, billing, SSO, or UI layout.',
        citations: [],
      });
    }

    // 5. Structure context items for Claude
    const contextItems = topMatches.map(item => ({
      content: item.feedback.content,
      channel: item.feedback.channel,
      createdAt: item.feedback.createdAt,
      customerLabel: item.feedback.customerLabel,
    }));

    // 6. Generate grounded response from Claude
    const aiResponse = await answerQuestion(question, contextItems);

    // Map citations to the actual feedback items returned in the response
    const citedFeedbacks = aiResponse.citationsUsed
      .map(idx => topMatches[idx]?.feedback)
      .filter(Boolean);

    return NextResponse.json({
      answer: aiResponse.answer,
      citations: citedFeedbacks,
    });
  } catch (error: any) {
    console.error('Error answering question:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
