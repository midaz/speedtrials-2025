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