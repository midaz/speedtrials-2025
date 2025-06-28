import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getViolationCodeDescription, getContaminantCodeDescription } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ViolationExplanation {
  title: string;
  explanation: string;
  actionNeeded: string;
  whyItMatters: string;
  urgency: string;
  timeframe: string;
}

// Cache for violation explanations to avoid repeated API calls
const explanationCache = new Map<string, ViolationExplanation>();

export async function POST(request: NextRequest) {
  try {
    const { violationCode, violationCategory, ruleCode, isHealthBased, isMajor, contaminantCode } = await request.json();

    if (!violationCode) {
      return NextResponse.json({ error: 'Violation code is required' }, { status: 400 });
    }

    // Create cache key
    const cacheKey = `${violationCode}-${violationCategory}-${ruleCode}-${isHealthBased}-${isMajor}`;
    
    // Check cache first
    if (explanationCache.has(cacheKey)) {
      return NextResponse.json({ explanation: explanationCache.get(cacheKey) });
    }

    // Get actual violation description from reference data
    const violationDesc = getViolationCodeDescription(violationCode);
    const contaminantDesc = contaminantCode ? getContaminantCodeDescription(contaminantCode.toString()) : null;

    // Prepare context for AI
    const urgencyLevel = isHealthBased === 'Y' ? 'HIGH PRIORITY - Health-based' : 'Standard Priority - Procedural';
    
    // Build enhanced context with actual violation description
    const actualViolationDescription = violationDesc ? violationDesc.VALUE_DESCRIPTION : 'Unknown violation type';
    const contaminantInfo = contaminantDesc ? `\n- Contaminant: ${contaminantDesc.VALUE_DESCRIPTION}` : '';

    const prompt = `You are an expert water system compliance advisor helping Georgia water operators understand violations. 

Here is the EXACT violation information from Georgia's SDWIS database:
- Violation Code: ${violationCode}
- Official Description: "${actualViolationDescription}"
- Category: ${violationCategory || 'Not specified'}
- Rule: ${ruleCode || 'Not specified'}
- Health-based: ${isHealthBased === 'Y' ? 'Yes' : 'No'}
- Major violation: ${isMajor === 'Y' ? 'Yes' : 'No'}${contaminantInfo}

Using this EXACT violation description, explain what this means for a water system operator in plain English.

Provide a response in this JSON format:
{
  "title": "Brief, clear title of what this violation means",
  "explanation": "2-3 sentences explaining what happened in operator-friendly language",
  "actionNeeded": "Specific steps the operator should take",
  "whyItMatters": "Why this violation is important for water safety/compliance",
  "urgency": "${urgencyLevel}",
  "timeframe": "Typical timeframe for addressing this (e.g., 'within 24 hours', 'within 30 days')"
}

Focus on being practical and actionable. Avoid regulatory jargon. Assume the operator wants to fix this quickly and correctly.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let explanation;
    try {
      explanation = JSON.parse(response);
    } catch {
      // If JSON parsing fails, create a basic structure
      explanation = {
        title: "Violation Explanation",
        explanation: response,
        actionNeeded: "Contact your regulatory authority for specific guidance",
        whyItMatters: "Compliance with water quality regulations ensures public safety",
        urgency: urgencyLevel,
        timeframe: "As soon as possible"
      };
    }

    // Cache the result
    explanationCache.set(cacheKey, explanation);

    return NextResponse.json({ explanation });

  } catch (error) {
    console.error('AI explanation error:', error);
    
    // Fallback explanation if AI fails
    const fallbackExplanation = {
      title: "Violation Requires Attention",
      explanation: "This violation indicates a compliance issue that needs to be addressed. Please review the specific requirements for this violation type.",
      actionNeeded: "Contact your laboratory or regulatory authority for specific guidance on resolving this violation.",
      whyItMatters: "Addressing violations promptly helps ensure water quality and regulatory compliance.",
      urgency: "Standard Priority",
      timeframe: "Review as soon as possible"
    };

    return NextResponse.json({ explanation: fallbackExplanation });
  }
} 