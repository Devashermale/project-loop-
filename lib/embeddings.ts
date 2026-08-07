import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to fetch models from HuggingFace Hub and disable local model checks
env.allowLocalModels = false;

let extractorInstance: any = null;

/**
 * Generates a 384-dimensional normalized vector embedding for the input text.
 * Falls back to a random normalized vector if generation fails (e.g., when offline).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!extractorInstance) {
      extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    const cleanText = text.replace(/\n/g, ' ').trim();
    const result = await extractorInstance(cleanText, { pooling: 'mean', normalize: true });
    
    if (result && result.data) {
      const vector = Array.from(result.data) as number[];
      return vector;
    }
    
    throw new Error('Invalid output format from embedding model');
  } catch (error) {
    console.error('Embedding generation failed, utilizing fallback normalized vector:', error);
    
    // Generate a pseudo-random 384-dimensional vector as fallback
    const mockVector = Array.from({ length: 384 }, () => Math.random() - 0.5);
    const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
    return mockVector.map(val => val / (magnitude || 1));
  }
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
