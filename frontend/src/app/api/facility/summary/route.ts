import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getComplianceAnalysis, getViolationCodeDescription } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FacilitySummary {
  healthScore: number;
  statusLevel: 'good' | 'caution' | 'critical';
  priorityActions: {
    urgent: string[];
    thisWeek: string[];
    thisMonth: string[];
  };
  insights: string;
  lastInspection: string;
  nextMilestones: string[];
}

// Cache for facility summaries
const summaryCache = new Map<string, { summary: FacilitySummary; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pwsid = searchParams.get('pwsid');

    if (!pwsid) {
      return NextResponse.json({ error: 'PWSID is required' }, { status: 400 });
    }

    // Check cache first
    const cached = summaryCache.get(pwsid);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ summary: cached.summary });
    }

    // Get comprehensive compliance analysis
    const analysis = getComplianceAnalysis(pwsid);
    if (!analysis) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    // Build context for AI analysis
    const activeViolationsContext = analysis.violations.active.map(v => {
      const desc = getViolationCodeDescription(v.VIOLATION_CODE);
      return {
        code: v.VIOLATION_CODE,
        description: desc?.VALUE_DESCRIPTION || 'Unknown violation',
        isHealthBased: v.IS_HEALTH_BASED_IND === 'Y',
        isMajor: v.IS_MAJOR_VIOL_IND === 'Y',
        status: v.VIOLATION_STATUS,
        beginDate: v.COMPL_PER_BEGIN_DATE
      };
    });

    const inspectionContext = analysis.inspections.latest ? {
      date: analysis.inspections.latest.VISIT_DATE,
      findings: analysis.inspections.recentFindings,
      comments: analysis.inspections.latest.VISIT_COMMENTS
    } : null;

    const prompt = `You are an expert water system compliance advisor analyzing a Georgia water facility. Generate a comprehensive compliance summary based on this REAL SDWIS data:

FACILITY: ${analysis.system.PWS_NAME} (${analysis.system.PWSID})
- Type: ${analysis.system.PWS_TYPE_CODE}
- Population: ${analysis.system.POPULATION_SERVED_COUNT?.toLocaleString() || 'N/A'}
- Source: ${analysis.system.PRIMARY_SOURCE_CODE}
- Owner: ${analysis.system.OWNER_TYPE_CODE}

VIOLATIONS:
- Active: ${analysis.violations.active.length} (${analysis.violations.healthBased} health-based, ${analysis.violations.procedural} procedural)
- Total historical: ${analysis.violations.total}
- Recent trend: ${analysis.violations.recentTrend}
- Details: ${JSON.stringify(activeViolationsContext, null, 2)}

INSPECTIONS:
${inspectionContext ? `- Latest: ${inspectionContext.date}
- Findings: ${inspectionContext.findings.join(', ') || 'No significant issues'}
- Comments: ${inspectionContext.comments || 'None'}` : '- No recent inspection data'}

MILESTONES: ${analysis.milestones.length} compliance milestones on record

Generate a JSON response with this exact structure:
{
  "healthScore": <number 0-100 based on compliance status>,
  "statusLevel": "<good|caution|critical>",
  "priorityActions": {
    "urgent": ["<specific action based on health-based violations or overdue items>"],
    "thisWeek": ["<specific action based on minor issues or upcoming deadlines>"],
    "thisMonth": ["<specific action based on inspection findings or preventive measures>"]
  },
  "insights": "<2-3 sentence analysis of facility's compliance standing, trends, and risk factors>",
  "lastInspection": "<date and summary of findings or 'No recent inspection'>",
  "nextMilestones": ["<upcoming compliance requirements or recommended actions>"]
}

Focus on:
- Specific, actionable recommendations based on actual violations
- Real inspection findings and their implications
- Facility-specific context (size, type, source)
- Regulatory timeline awareness
- Risk prioritization (health-based > procedural)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let summary: FacilitySummary;
    try {
      summary = JSON.parse(response);
    } catch {
      // Fallback summary if parsing fails
      summary = {
        healthScore: analysis.violations.healthBased > 0 ? 60 : 85,
        statusLevel: analysis.violations.healthBased > 0 ? 'critical' : 
                    analysis.violations.active.length > 3 ? 'caution' : 'good',
        priorityActions: {
          urgent: analysis.violations.healthBased > 0 ? 
                 ['Resolve health-based violations immediately'] : [],
          thisWeek: analysis.violations.procedural > 0 ? 
                   ['Address procedural violations'] : [],
          thisMonth: ['Review compliance procedures', 'Schedule routine monitoring']
        },
        insights: `Facility has ${analysis.violations.active.length} active violations with ${analysis.violations.recentTrend} trend. Focus on immediate compliance resolution.`,
        lastInspection: inspectionContext?.date || 'No recent inspection',
        nextMilestones: ['Regular monitoring', 'Annual compliance review']
      };
    }

    // Cache the result
    summaryCache.set(pwsid, { summary, timestamp: Date.now() });

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Facility summary error:', error);
    
    // Fallback response
    return NextResponse.json({
      summary: {
        healthScore: 75,
        statusLevel: 'caution',
        priorityActions: {
          urgent: [],
          thisWeek: ['Review facility compliance status'],
          thisMonth: ['Contact regulatory authority for guidance']
        },
        insights: 'Unable to generate detailed analysis. Please review facility records manually.',
        lastInspection: 'Data unavailable',
        nextMilestones: ['Standard compliance monitoring']
      }
    });
  }
} 