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