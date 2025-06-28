import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getUrgentAction, getViolationCodeDescription, getContaminantCodeDescription } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ActionResponse {
  urgentAction: {
    priority: 'critical' | 'high' | 'medium';
    title: string;
    actionNeeded: string;
    timeframe: string;
    reason: string;
    nextSteps: string[];
  } | null;
}

// Cache for urgent action responses
const actionCache = new Map<string, { response: ActionResponse; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pwsid = searchParams.get('pwsid');

    if (!pwsid) {
      return NextResponse.json({ error: 'PWSID is required' }, { status: 400 });
    }

    // Check cache first  
    const cached = actionCache.get(pwsid);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.response);
    }

    // Get urgent action from database
    const urgentAction = getUrgentAction(pwsid);
    
    if (!urgentAction || urgentAction.actionType === 'none') {
      const response: ActionResponse = { urgentAction: null };
      actionCache.set(pwsid, { response, timestamp: Date.now() });
      return NextResponse.json(response);
    }

    // Get detailed descriptions for AI context
    const violationDesc = urgentAction.violationCode ? 
      getViolationCodeDescription(urgentAction.violationCode) : null;
    const contaminantDesc = urgentAction.contaminantCode ? 
      getContaminantCodeDescription(urgentAction.contaminantCode) : null;

    // Build AI prompt with real data
    const prompt = `You are a water compliance expert providing urgent action guidance to a Georgia water system operator. Analyze this REAL SDWIS data and provide specific, actionable guidance:

URGENT ACTION DETECTED:
Type: ${urgentAction.actionType}
Priority: ${urgentAction.priority}
Title: ${urgentAction.title}
Description: ${urgentAction.description}
Days Remaining: ${urgentAction.daysRemaining !== null ? urgentAction.daysRemaining : 'N/A'}
Health-Based: ${urgentAction.isHealthBased ? 'YES' : 'NO'}
Violation Code: ${urgentAction.violationCode || 'N/A'}
Violation Description: ${violationDesc?.VALUE_DESCRIPTION || 'N/A'}
Contaminant: ${contaminantDesc?.VALUE_DESCRIPTION || 'N/A'}
Public Notification Tier: ${urgentAction.publicNotificationTier || 'N/A'}

Generate a JSON response with this exact structure:
{
  "priority": "${urgentAction.priority}",
  "title": "<clear, operator-friendly title>",
  "actionNeeded": "<specific action in plain English>",
  "timeframe": "<when this needs to be done>",
  "reason": "<why this is urgent - health/regulatory/compliance impact>",
  "nextSteps": ["<step 1>", "<step 2>", "<step 3>"]
}

Requirements:
- Use specific regulatory timelines for Georgia
- Health-based violations require immediate public notice (24 hours)
- Non-health violations typically require notice within 30 days
- Provide 3 specific next steps the operator should take
- Focus on immediate, actionable steps
- Use operator-friendly language (avoid regulatory jargon)
- Reference specific violation codes/contaminants when relevant`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(response);
    } catch {
      // Fallback response if parsing fails
      aiResponse = {
        priority: urgentAction.priority,
        title: urgentAction.title,
        actionNeeded: urgentAction.isHealthBased ? 
          'Issue public notice immediately and contact state regulatory agency' :
          'Submit compliance response and schedule corrective action',
        timeframe: urgentAction.daysRemaining !== null && urgentAction.daysRemaining <= 1 ? 
          'Immediate (within 24 hours)' : 
          urgentAction.daysRemaining ? `Within ${urgentAction.daysRemaining} days` : 'As soon as possible',
        reason: urgentAction.isHealthBased ? 
          'Health-based violation poses immediate risk to public health' :
          'Regulatory compliance violation requires formal response',
        nextSteps: [
          'Contact state regulatory agency',
          'Review compliance procedures',
          'Document corrective actions taken'
        ]
      };
    }

    const finalResponse: ActionResponse = { urgentAction: aiResponse };
    
    // Cache the result
    actionCache.set(pwsid, { response: finalResponse, timestamp: Date.now() });

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Urgent action API error:', error);
    
    // Fallback response
    return NextResponse.json({
      urgentAction: {
        priority: 'medium',
        title: 'Review Compliance Status',
        actionNeeded: 'Check recent monitoring and inspection requirements',
        timeframe: 'Within 1 week', 
        reason: 'Regular compliance monitoring is essential for system operation',
        nextSteps: [
          'Review recent monitoring results',
          'Check upcoming sampling deadlines',
          'Contact regulatory authority if questions arise'
        ]
      }
    });
  }
} 