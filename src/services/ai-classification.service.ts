import OpenAI from 'openai';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';

interface ClassificationResult {
  suggestedTypeId: string;
  suggestedTypeName: string;
  confidence: 'high' | 'medium' | 'low';
  matches: boolean;
  explanation: string;
}

export async function classifyServiceRequest(
  title: string,
  description: string,
  selectedTypeId?: string
): Promise<ClassificationResult> {
  // Fetch available service types from database
  const serviceTypes = await prisma.complaintType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true },
  });

  if (serviceTypes.length === 0) {
    throw new Error('No service types available');
  }

  // If no API key, return a simple keyword-based classification
  if (!config.openaiApiKey) {
    return keywordBasedClassification(title, description, selectedTypeId, serviceTypes);
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
  });

  const serviceTypeList = serviceTypes
    .map((t: { id: string; name: string; description: string | null }) => `- ${t.name} (ID: ${t.id}): ${t.description || 'General ' + t.name + ' services'}`)
    .join('\n');

  const prompt = `You are a service request classifier for a home services company. Based on the issue title and description, determine the most appropriate service type.

Available service types:
${serviceTypeList}

Issue Title: ${title}
Issue Description: ${description || 'No additional description provided'}

Analyze the issue and respond with JSON only (no markdown, no code blocks):
{
  "suggestedTypeId": "the ID of the most appropriate service type",
  "suggestedTypeName": "the name of the service type",
  "confidence": "high|medium|low",
  "explanation": "brief explanation of why this type was chosen"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON response (handle potential markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
    }
    const result = JSON.parse(jsonContent);

    // Check if the selected type matches the suggested type
    const matches = !selectedTypeId || selectedTypeId === result.suggestedTypeId;

    return {
      suggestedTypeId: result.suggestedTypeId,
      suggestedTypeName: result.suggestedTypeName,
      confidence: result.confidence,
      matches,
      explanation: result.explanation,
    };
  } catch (error) {
    console.error('AI classification error:', error);
    // Fall back to keyword-based classification
    return keywordBasedClassification(title, description, selectedTypeId, serviceTypes);
  }
}

function keywordBasedClassification(
  title: string,
  description: string,
  selectedTypeId: string | undefined,
  serviceTypes: { id: string; name: string; description: string | null }[]
): ClassificationResult {
  const text = `${title} ${description}`.toLowerCase();

  // Keyword mappings for common service types
  const keywordMap: Record<string, string[]> = {
    'Plumbing': ['water', 'leak', 'pipe', 'drain', 'toilet', 'faucet', 'tap', 'sink', 'shower', 'plumb', 'flooding', 'clog', 'blocked'],
    'Electrical': ['electric', 'power', 'outlet', 'switch', 'light', 'wire', 'circuit', 'spark', 'voltage', 'socket'],
    'AC Maintenance': ['ac', 'air condition', 'cooling', 'hvac', 'compressor', 'thermostat', 'cold air', 'hot air', 'freon'],
    'Carpentry': ['wood', 'door', 'cabinet', 'furniture', 'shelf', 'cupboard', 'drawer', 'carpent'],
    'Painting': ['paint', 'wall', 'color', 'coating', 'primer'],
    'Pest Control': ['pest', 'insect', 'cockroach', 'ant', 'rodent', 'mouse', 'rat', 'bug', 'termite'],
    'General Maintenance': ['repair', 'fix', 'broken', 'maintenance', 'general'],
    'Cleaning': ['clean', 'wash', 'dust', 'sweep', 'mop', 'sanitize'],
    'Appliance Repair': ['appliance', 'washing machine', 'dryer', 'refrigerator', 'fridge', 'oven', 'microwave', 'dishwasher'],
  };

  let bestMatch: { type: typeof serviceTypes[0]; score: number } | null = null;

  for (const serviceType of serviceTypes) {
    const keywords = keywordMap[serviceType.name] || [];
    let score = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score++;
      }
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { type: serviceType, score };
    }
  }

  // Default to General Maintenance if no keywords match
  if (!bestMatch || bestMatch.score === 0) {
    const generalType = serviceTypes.find(t => t.name.includes('General') || t.name.includes('Maintenance'));
    bestMatch = { type: generalType || serviceTypes[0], score: 0 };
  }

  const matches = !selectedTypeId || selectedTypeId === bestMatch.type.id;
  const confidence = bestMatch.score >= 2 ? 'high' : bestMatch.score === 1 ? 'medium' : 'low';

  return {
    suggestedTypeId: bestMatch.type.id,
    suggestedTypeName: bestMatch.type.name,
    confidence,
    matches,
    explanation: bestMatch.score > 0
      ? `Matched based on keywords in the issue description`
      : `Default classification - consider reviewing the service type`,
  };
}
