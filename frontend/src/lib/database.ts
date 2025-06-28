import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), '..', 'h2operator.db');
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export interface WaterSystem {
  PWSID: string;
  PWS_NAME: string;
  PWS_TYPE_CODE: string;
  POPULATION_SERVED_COUNT: number;
  PWS_ACTIVITY_CODE: string;
  CITY_NAME: string;
  STATE_CODE: string;
  OWNER_TYPE_CODE: string;
  PRIMARY_SOURCE_CODE: string;
}

export interface Violation {
  VIOLATION_ID: string;
  PWSID: string;
  COMPL_PER_BEGIN_DATE: string;
  COMPL_PER_END_DATE: string;
  VIOLATION_CODE: string;
  VIOLATION_CATEGORY_CODE: string;
  IS_HEALTH_BASED_IND: string;
  IS_MAJOR_VIOL_IND: string;
  VIOLATION_STATUS: string;
  CONTAMINANT_CODE: number;
  VIOL_FIRST_REPORTED_DATE: string;
  RULE_CODE: number;
}

export interface ViolationCalendarData {
  day: string; // YYYY-MM-DD format
  value: number; // Weighted severity score
  healthBased: number; // Count of health-based violations
  procedural: number; // Count of procedural violations
  violations: Violation[];
}

export interface TopViolator {
  PWSID: string;
  PWS_NAME: string;
  CITY_NAME: string;
  violation_count: number;
}

export interface ViolationCodeDescription {
  VALUE_CODE: string;
  VALUE_DESCRIPTION: string;
}

export function searchWaterSystems(query: string): WaterSystem[] {
  const database = getDatabase();
  
  // Search by PWSID or PWS_NAME
  const stmt = database.prepare(`
    SELECT 
      PWSID,
      PWS_NAME,
      PWS_TYPE_CODE,
      POPULATION_SERVED_COUNT,
      PWS_ACTIVITY_CODE,
      CITY_NAME,
      STATE_CODE,
      OWNER_TYPE_CODE,
      PRIMARY_SOURCE_CODE
    FROM sdwa_pub_water_systems 
    WHERE PWS_ACTIVITY_CODE = 'A' 
      AND (
        UPPER(PWSID) LIKE UPPER(?) 
        OR UPPER(PWS_NAME) LIKE UPPER(?)
        OR UPPER(CITY_NAME) LIKE UPPER(?)
      )
    ORDER BY PWS_NAME
    LIMIT 50
  `);
  
  const searchTerm = `%${query}%`;
  return stmt.all(searchTerm, searchTerm, searchTerm) as WaterSystem[];
}

export function getWaterSystemByPWSID(pwsid: string): WaterSystem | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      PWSID,
      PWS_NAME,
      PWS_TYPE_CODE,
      POPULATION_SERVED_COUNT,
      PWS_ACTIVITY_CODE,
      CITY_NAME,
      STATE_CODE,
      OWNER_TYPE_CODE,
      PRIMARY_SOURCE_CODE
    FROM sdwa_pub_water_systems 
    WHERE PWSID = ? AND PWS_ACTIVITY_CODE = 'A'
  `);
  
  return stmt.get(pwsid) as WaterSystem | null;
}

export function getViolationsByPWSID(pwsid: string, startDate?: string, endDate?: string): Violation[] {
  const database = getDatabase();
  
  let query = `
    SELECT 
      VIOLATION_ID,
      PWSID,
      COMPL_PER_BEGIN_DATE,
      COMPL_PER_END_DATE,
      VIOLATION_CODE,
      VIOLATION_CATEGORY_CODE,
      IS_HEALTH_BASED_IND,
      IS_MAJOR_VIOL_IND,
      VIOLATION_STATUS,
      CONTAMINANT_CODE,
      VIOL_FIRST_REPORTED_DATE,
      RULE_CODE
    FROM sdwa_violations_enforcement 
    WHERE PWSID = ?
      AND COMPL_PER_BEGIN_DATE IS NOT NULL 
      AND COMPL_PER_BEGIN_DATE != 'nan'
  `;
  
  const params: (string)[] = [pwsid];
  
  if (startDate && endDate) {
    // Convert MM/DD/YYYY to YYYY-MM-DD for comparison
    query += ` AND date(substr(COMPL_PER_BEGIN_DATE, 7, 4) || '-' || 
                      printf('%02d', CAST(substr(COMPL_PER_BEGIN_DATE, 1, 2) AS INTEGER)) || '-' || 
                      printf('%02d', CAST(substr(COMPL_PER_BEGIN_DATE, 4, 2) AS INTEGER))) >= date(?)
               AND date(substr(COMPL_PER_BEGIN_DATE, 7, 4) || '-' || 
                      printf('%02d', CAST(substr(COMPL_PER_BEGIN_DATE, 1, 2) AS INTEGER)) || '-' || 
                      printf('%02d', CAST(substr(COMPL_PER_BEGIN_DATE, 4, 2) AS INTEGER))) <= date(?)`;
    params.push(startDate, endDate);
  }
  
  query += ` ORDER BY COMPL_PER_BEGIN_DATE DESC`;
  
  const stmt = database.prepare(query);
  return stmt.all(...params) as Violation[];
}

export function getViolationCalendarData(pwsid: string, startDate: string, endDate: string): ViolationCalendarData[] {
  const violations = getViolationsByPWSID(pwsid, startDate, endDate);
  
  // Group violations by date
  const violationsByDate = new Map<string, Violation[]>();
  
  violations.forEach(violation => {
    if (violation.COMPL_PER_BEGIN_DATE && violation.COMPL_PER_BEGIN_DATE !== 'nan') {
      // Convert MM/DD/YYYY to YYYY-MM-DD format
      const dateParts = violation.COMPL_PER_BEGIN_DATE.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[0].padStart(2, '0');
        const day = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        const date = `${year}-${month}-${day}`;
        
        if (!violationsByDate.has(date)) {
          violationsByDate.set(date, []);
        }
        violationsByDate.get(date)!.push(violation);
      }
    }
  });
  
  // Convert to calendar data format
  const calendarData: ViolationCalendarData[] = [];
  
  violationsByDate.forEach((dayViolations, date) => {
    let healthBased = 0;
    let procedural = 0;
    
    dayViolations.forEach(violation => {
      if (violation.IS_HEALTH_BASED_IND === 'Y') {
        healthBased++;
      } else {
        procedural++;
      }
    });
    
    // Calculate weighted severity score
    // Health-based violations get weight of 3, procedural get weight of 1
    const value = (healthBased * 3) + (procedural * 1);
    
    calendarData.push({
      day: date,
      value,
      healthBased,
      procedural,
      violations: dayViolations
    });
  });
  
  return calendarData;
}

export function getTopViolators(limit: number = 30): TopViolator[] {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      p.PWSID,
      p.PWS_NAME,
      p.CITY_NAME,
      COUNT(v.VIOLATION_ID) as violation_count
    FROM sdwa_pub_water_systems p 
    LEFT JOIN sdwa_violations_enforcement v ON p.PWSID = v.PWSID
    WHERE p.PWS_ACTIVITY_CODE = 'A'
    GROUP BY p.PWSID
    HAVING violation_count > 0
    ORDER BY violation_count DESC
    LIMIT ?
  `);
  
  return stmt.all(limit) as TopViolator[];
}

export function getViolationCodeDescription(violationCode: string): ViolationCodeDescription | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT VALUE_CODE, VALUE_DESCRIPTION
    FROM sdwa_ref_code_values 
    WHERE VALUE_TYPE = 'VIOLATION_CODE' AND VALUE_CODE = ?
  `);
  
  return stmt.get(violationCode) as ViolationCodeDescription | null;
}

export function getContaminantCodeDescription(contaminantCode: string): ViolationCodeDescription | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT VALUE_CODE, VALUE_DESCRIPTION
    FROM sdwa_ref_code_values 
    WHERE VALUE_TYPE = 'CONTAMINANT_CODE' AND VALUE_CODE = ?
  `);
  
  return stmt.get(contaminantCode) as ViolationCodeDescription | null;
}

export interface SiteVisit {
  VISIT_ID: string;
  VISIT_DATE: string;
  AGENCY_TYPE_CODE: string;
  VISIT_REASON_CODE: string;
  MANAGEMENT_OPS_EVAL_CODE: string;
  SOURCE_WATER_EVAL_CODE: string;
  SECURITY_EVAL_CODE: string;
  PUMPS_EVAL_CODE: string;
  OTHER_EVAL_CODE: string;
  COMPLIANCE_EVAL_CODE: string;
  DATA_VERIFICATION_EVAL_CODE: string;
  TREATMENT_EVAL_CODE: string;
  FINISHED_WATER_STOR_EVAL_CODE: string;
  DISTRIBUTION_EVAL_CODE: string;
  FINANCIAL_EVAL_CODE: string;
  VISIT_COMMENTS: string;
}

export interface EventMilestone {
  EVENT_SCHEDULE_ID: string;
  EVENT_END_DATE: string;
  EVENT_ACTUAL_DATE: string;
  EVENT_COMMENTS_TEXT: string;
  EVENT_MILESTONE_CODE: string;
  EVENT_REASON_CODE: string;
}

export interface ComplianceAnalysis {
  system: WaterSystem;
  violations: {
    active: Violation[];
    total: number;
    healthBased: number;
    procedural: number;
    recentTrend: string;
  };
  inspections: {
    latest: SiteVisit | null;
    recentFindings: string[];
  };
  milestones: EventMilestone[];
}

export function getRecentSiteVisits(pwsid: string, limit: number = 5): SiteVisit[] {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      VISIT_ID, VISIT_DATE, AGENCY_TYPE_CODE, VISIT_REASON_CODE,
      MANAGEMENT_OPS_EVAL_CODE, SOURCE_WATER_EVAL_CODE, SECURITY_EVAL_CODE,
      PUMPS_EVAL_CODE, OTHER_EVAL_CODE, COMPLIANCE_EVAL_CODE,
      DATA_VERIFICATION_EVAL_CODE, TREATMENT_EVAL_CODE,
      FINISHED_WATER_STOR_EVAL_CODE, DISTRIBUTION_EVAL_CODE,
      FINANCIAL_EVAL_CODE, VISIT_COMMENTS
    FROM sdwa_site_visits 
    WHERE PWSID = ? AND VISIT_DATE IS NOT NULL
    ORDER BY VISIT_DATE DESC
    LIMIT ?
  `);
  
  return stmt.all(pwsid, limit) as SiteVisit[];
}

export function getEventMilestones(pwsid: string): EventMilestone[] {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      EVENT_SCHEDULE_ID, EVENT_END_DATE, EVENT_ACTUAL_DATE,
      EVENT_COMMENTS_TEXT, EVENT_MILESTONE_CODE, EVENT_REASON_CODE
    FROM sdwa_events_milestones 
    WHERE PWSID = ?
    ORDER BY EVENT_END_DATE DESC
  `);
  
  return stmt.all(pwsid) as EventMilestone[];
}

export interface UrgentAction {
  actionType: 'violation' | 'inspection' | 'milestone' | 'none';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  daysRemaining: number | null;
  violationCode?: string;
  contaminantCode?: string;
  isHealthBased?: boolean;
  publicNotificationTier?: number;
  actionId: string; // Unique identifier for the action
}

export function getUrgentAction(pwsid: string): UrgentAction | null {
  const database = getDatabase();
  
  // Get all active violations (no end date or unaddressed)
  const stmt = database.prepare(`
    SELECT 
      VIOLATION_ID,
      VIOLATION_CODE,
      VIOLATION_CATEGORY_CODE,
      IS_HEALTH_BASED_IND,
      CONTAMINANT_CODE,
      PUBLIC_NOTIFICATION_TIER,
      COMPL_PER_BEGIN_DATE,
      COMPL_PER_END_DATE,
      VIOLATION_STATUS,
      VIOL_FIRST_REPORTED_DATE
    FROM sdwa_violations_enforcement 
    WHERE PWSID = ? 
      AND (COMPL_PER_END_DATE IS NULL OR COMPL_PER_END_DATE = 'nan' OR VIOLATION_STATUS = 'Unaddressed')
      AND COMPL_PER_BEGIN_DATE IS NOT NULL 
      AND COMPL_PER_BEGIN_DATE != 'nan'
    ORDER BY 
      CASE WHEN IS_HEALTH_BASED_IND = 'Y' THEN 1 ELSE 2 END,
      CASE WHEN PUBLIC_NOTIFICATION_TIER = 1 THEN 1 
           WHEN PUBLIC_NOTIFICATION_TIER = 2 THEN 2 
           WHEN PUBLIC_NOTIFICATION_TIER = 3 THEN 3 
           ELSE 4 END,
      COMPL_PER_BEGIN_DATE ASC
  `);
  
  interface ActiveViolation {
    VIOLATION_ID: string;
    VIOLATION_CODE: string;
    VIOLATION_CATEGORY_CODE: string;
    IS_HEALTH_BASED_IND: string;
    CONTAMINANT_CODE: number | null;
    PUBLIC_NOTIFICATION_TIER: number | null;
    COMPL_PER_BEGIN_DATE: string;
    COMPL_PER_END_DATE: string | null;
    VIOLATION_STATUS: string;
    VIOL_FIRST_REPORTED_DATE: string;
  }
  
  const activeViolations = stmt.all(pwsid) as ActiveViolation[];
  
  if (activeViolations.length === 0) {
    // Check for recent inspection findings requiring follow-up
    const recentVisits = getRecentSiteVisits(pwsid, 1);
    if (recentVisits.length > 0) {
      const visit = recentVisits[0];
      const hasSignificantDeficiencies = [
        visit.MANAGEMENT_OPS_EVAL_CODE,
        visit.SOURCE_WATER_EVAL_CODE,
        visit.COMPLIANCE_EVAL_CODE,
        visit.TREATMENT_EVAL_CODE
      ].some(code => code === 'S');
      
      if (hasSignificantDeficiencies) {
        return {
          actionType: 'inspection',
          priority: 'high',
          title: 'Address Inspection Findings',
          description: 'Significant deficiencies found during recent inspection require corrective action',
          daysRemaining: null,
          actionId: `inspection-${visit.VISIT_ID}`
        };
      }
    }
    
    return {
      actionType: 'none',
      priority: 'medium',
      title: 'No Urgent Actions',
      description: 'System appears to be in compliance with current monitoring requirements',
      daysRemaining: null,
      actionId: 'none'
    };
  }
  
  // Get the most urgent violation
  const urgentViolation = activeViolations[0];
  
  // Calculate days since violation began
  let daysRemaining: number | null = null;
  if (urgentViolation.COMPL_PER_BEGIN_DATE) {
    const dateParts = urgentViolation.COMPL_PER_BEGIN_DATE.split('/');
    if (dateParts.length === 3) {
      const violationDate = new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[0]) - 1, // month (0-indexed)
        parseInt(dateParts[1]) // day
      );
      const today = new Date();
      const daysSinceViolation = Math.floor((today.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Health-based violations typically require immediate public notice (24 hours)
      // Non-health-based violations have 30 days for public notice
      if (urgentViolation.IS_HEALTH_BASED_IND === 'Y') {
        daysRemaining = Math.max(0, 1 - daysSinceViolation); // 1 day for health-based
      } else {
        daysRemaining = Math.max(0, 30 - daysSinceViolation); // 30 days for non-health-based
      }
    }
  }
  
  // Determine priority
  let priority: 'critical' | 'high' | 'medium' = 'medium';
  if (urgentViolation.IS_HEALTH_BASED_IND === 'Y') {
    priority = 'critical';
  } else if (urgentViolation.PUBLIC_NOTIFICATION_TIER === 2) {
    priority = 'high';
  }
  
  // Get violation description
  const violationDesc = getViolationCodeDescription(urgentViolation.VIOLATION_CODE);
  const contaminantDesc = urgentViolation.CONTAMINANT_CODE ? 
    getContaminantCodeDescription(urgentViolation.CONTAMINANT_CODE.toString()) : null;
  
  return {
    actionType: 'violation',
    priority,
    title: violationDesc?.VALUE_DESCRIPTION || `Violation ${urgentViolation.VIOLATION_CODE}`,
    description: contaminantDesc?.VALUE_DESCRIPTION || 'Compliance violation requires immediate attention',
    daysRemaining,
    violationCode: urgentViolation.VIOLATION_CODE,
    contaminantCode: urgentViolation.CONTAMINANT_CODE?.toString(),
    isHealthBased: urgentViolation.IS_HEALTH_BASED_IND === 'Y',
    publicNotificationTier: urgentViolation.PUBLIC_NOTIFICATION_TIER || undefined,
    actionId: urgentViolation.VIOLATION_ID
  };
}

export function getComplianceAnalysis(pwsid: string): ComplianceAnalysis | null {
  const system = getWaterSystemByPWSID(pwsid);
  if (!system) return null;

  // Get all violations for trend analysis
  const allViolations = getViolationsByPWSID(pwsid);
  const activeViolations = allViolations.filter(v => 
    v.VIOLATION_STATUS !== 'Archived' && v.VIOLATION_STATUS !== 'Resolved'
  );

  const healthBased = activeViolations.filter(v => v.IS_HEALTH_BASED_IND === 'Y').length;
  const procedural = activeViolations.filter(v => v.IS_HEALTH_BASED_IND !== 'Y').length;

  // Calculate recent trend (comparing last year to previous year)
  const currentYear = new Date().getFullYear();
  const lastYearViolations = allViolations.filter(v => {
    if (!v.COMPL_PER_BEGIN_DATE || v.COMPL_PER_BEGIN_DATE === 'nan') return false;
    const year = parseInt(v.COMPL_PER_BEGIN_DATE.split('/')[2]);
    return year === currentYear - 1;
  }).length;

  const previousYearViolations = allViolations.filter(v => {
    if (!v.COMPL_PER_BEGIN_DATE || v.COMPL_PER_BEGIN_DATE === 'nan') return false;
    const year = parseInt(v.COMPL_PER_BEGIN_DATE.split('/')[2]);
    return year === currentYear - 2;
  }).length;

  let recentTrend = 'stable';
  if (lastYearViolations < previousYearViolations) recentTrend = 'improving';
  if (lastYearViolations > previousYearViolations) recentTrend = 'declining';

  // Get inspection data
  const recentVisits = getRecentSiteVisits(pwsid, 3);
  const latestVisit = recentVisits.length > 0 ? recentVisits[0] : null;
  
  // Extract findings from recent inspections
  const recentFindings: string[] = [];
  recentVisits.forEach(visit => {
    const findings = [];
    if (visit.MANAGEMENT_OPS_EVAL_CODE === 'S') findings.push('Significant management/operations issues');
    if (visit.MANAGEMENT_OPS_EVAL_CODE === 'M') findings.push('Minor management/operations issues');
    if (visit.SOURCE_WATER_EVAL_CODE === 'S') findings.push('Significant source water issues');
    if (visit.SOURCE_WATER_EVAL_CODE === 'M') findings.push('Minor source water issues');
    if (visit.TREATMENT_EVAL_CODE === 'S') findings.push('Significant treatment issues');
    if (visit.TREATMENT_EVAL_CODE === 'M') findings.push('Minor treatment issues');
    if (visit.COMPLIANCE_EVAL_CODE === 'S') findings.push('Significant compliance issues');
    if (visit.COMPLIANCE_EVAL_CODE === 'M') findings.push('Minor compliance issues');
    
    recentFindings.push(...findings);
  });

  const milestones = getEventMilestones(pwsid);

  return {
    system,
    violations: {
      active: activeViolations,
      total: allViolations.length,
      healthBased,
      procedural,
      recentTrend
    },
    inspections: {
      latest: latestVisit,
      recentFindings: [...new Set(recentFindings)] // Remove duplicates
    },
    milestones
  };
} 