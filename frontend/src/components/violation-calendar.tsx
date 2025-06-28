'use client';

import { useState, useEffect } from 'react';
import { ViolationCalendarData, Violation } from '@/lib/database';

interface AIExplanation {
  title: string;
  explanation: string;
  actionNeeded: string;
  whyItMatters: string;
  urgency: string;
  timeframe: string;
}

interface ViolationCalendarProps {
  data: ViolationCalendarData[];
  from: string;
  to: string;
  totalViolations: number;
}

interface ViolationDetailsProps {
  date: string;
  violations: Violation[];
  onClose: () => void;
}

function ViolationDetails({ date, violations, onClose }: ViolationDetailsProps) {
  const [explanations, setExplanations] = useState<Map<string, AIExplanation>>(new Map());
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());
  
  const healthBasedViolations = violations.filter(v => v.IS_HEALTH_BASED_IND === 'Y');
  const proceduralViolations = violations.filter(v => v.IS_HEALTH_BASED_IND !== 'Y');

  // Auto-fetch AI explanations when violations change
  useEffect(() => {
    const fetchExplanations = async () => {
      const newLoadingSet = new Set<string>();
      
      for (const violation of violations) {
        const violationKey = violation.VIOLATION_ID;
        
        // Skip if we already have this explanation
        if (explanations.has(violationKey)) continue;
        
        newLoadingSet.add(violationKey);
        
        try {
          const response = await fetch('/api/violation/explain', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              violationCode: violation.VIOLATION_CODE,
              violationCategory: violation.VIOLATION_CATEGORY_CODE,
              ruleCode: violation.RULE_CODE,
              isHealthBased: violation.IS_HEALTH_BASED_IND,
              isMajor: violation.IS_MAJOR_VIOL_IND,
              contaminantCode: violation.CONTAMINANT_CODE,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setExplanations(prev => new Map(prev).set(violationKey, data.explanation));
          }
        } catch (error) {
          console.error('Failed to fetch explanation for violation:', violationKey, error);
        } finally {
          newLoadingSet.delete(violationKey);
        }
      }
      
      setLoadingExplanations(newLoadingSet);
    };

    if (violations.length > 0) {
      fetchExplanations();
    }
  }, [violations, explanations]);

  return (
    <div className="mt-6 bg-blue-50/50 rounded-xl border border-blue-200 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Violations on {new Date(date).toLocaleDateString()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-colors"
            title="Close details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {healthBasedViolations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Health-Based Violations ({healthBasedViolations.length})
              </h4>
              <div className="space-y-3">
                {healthBasedViolations.map((violation) => {
                  const explanation = explanations.get(violation.VIOLATION_ID);
                  const isLoading = loadingExplanations.has(violation.VIOLATION_ID);
                  
                  return (
                    <div key={violation.VIOLATION_ID} className="bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-red-900 mb-1">
                              Code: {violation.VIOLATION_CODE}
                            </div>
                            <div className="text-sm text-red-700 mb-1">
                              Category: {violation.VIOLATION_CATEGORY_CODE}
                            </div>
                            <div className="text-sm text-red-600">
                              Status: {violation.VIOLATION_STATUS}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-red-600 mb-2">
                              Rule: {violation.RULE_CODE}
                            </div>
                            {violation.IS_MAJOR_VIOL_IND === 'Y' && (
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                Major
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* AI Explanation */}
                        {isLoading && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-3">
                            <div className="flex items-center text-red-700">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm font-medium">🤖 AI analyzing violation...</span>
                            </div>
                          </div>
                        )}
                        
                        {explanation && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-red-900 mb-2">
                                  🤖 {explanation.title}
                                </h4>
                                <p className="text-sm text-red-800 mb-3">
                                  {explanation.explanation}
                                </p>
                                <div className="space-y-2">
                                  <div>
                                    <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                                      Action Needed:
                                    </h5>
                                    <p className="text-sm text-red-700">
                                      {explanation.actionNeeded}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                                        Why it matters:
                                      </h5>
                                      <p className="text-xs text-red-600">
                                        {explanation.whyItMatters}
                                      </p>
                                    </div>
                                    <div className="ml-4">
                                      <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                                        {explanation.timeframe}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {proceduralViolations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                Procedural Violations ({proceduralViolations.length})
              </h4>
              <div className="space-y-3">
                {proceduralViolations.map((violation) => {
                  const explanation = explanations.get(violation.VIOLATION_ID);
                  const isLoading = loadingExplanations.has(violation.VIOLATION_ID);
                  
                  return (
                    <div key={violation.VIOLATION_ID} className="bg-white border border-orange-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-medium text-orange-900 mb-1">
                              Code: {violation.VIOLATION_CODE}
                            </div>
                            <div className="text-sm text-orange-700 mb-1">
                              Category: {violation.VIOLATION_CATEGORY_CODE}
                            </div>
                            <div className="text-sm text-orange-600">
                              Status: {violation.VIOLATION_STATUS}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-orange-600 mb-2">
                              Rule: {violation.RULE_CODE}
                            </div>
                            {violation.IS_MAJOR_VIOL_IND === 'Y' && (
                              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                Major
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* AI Explanation */}
                        {isLoading && (
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mt-3">
                            <div className="flex items-center text-orange-700">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm font-medium">🤖 AI analyzing violation...</span>
                            </div>
                          </div>
                        )}
                        
                        {explanation && (
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mt-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mr-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-orange-900 mb-2">
                                  🤖 {explanation.title}
                                </h4>
                                <p className="text-sm text-orange-800 mb-3">
                                  {explanation.explanation}
                                </p>
                                <div className="space-y-2">
                                  <div>
                                    <h5 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                                      Action Needed:
                                    </h5>
                                    <p className="text-sm text-orange-700">
                                      {explanation.actionNeeded}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                                        Why it matters:
                                      </h5>
                                      <p className="text-xs text-orange-600">
                                        {explanation.whyItMatters}
                                      </p>
                                    </div>
                                    <div className="ml-4">
                                      <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full font-medium">
                                        {explanation.timeframe}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getViolationLevel(value: number): string {
  if (value === 0) return 'bg-gray-100';
  if (value <= 2) return 'bg-yellow-200';
  if (value <= 4) return 'bg-orange-300';
  if (value <= 6) return 'bg-orange-400';
  return 'bg-red-500';
}

function generateYearDays(year: number) {
  const days = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  
  // Start from the first Sunday of the year or before
  const firstDay = new Date(start);
  firstDay.setDate(start.getDate() - start.getDay());
  
  const current = new Date(firstDay);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Add days to complete the grid (make it a full rectangle)
  while (days.length % 7 !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export default function ViolationCalendar({ data, from, to, totalViolations }: ViolationCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; violations: Violation[] } | null>(null);
  
  // Year navigation state
  const currentYear = new Date().getFullYear();
  const startYear = new Date(from).getFullYear();
  const endYear = new Date(to).getFullYear();
  
  // Find the most recent year with data, or default to current year
  const getInitialYear = () => {
    if (data.length === 0) return currentYear;
    
    const currentYearHasData = data.some(item => 
      new Date(item.day).getFullYear() === currentYear
    );
    
    if (currentYearHasData) return currentYear;
    
    const yearsWithData = [...new Set(data.map(item => 
      new Date(item.day).getFullYear()
    ))].sort((a, b) => b - a);
    
    return yearsWithData[0] || currentYear;
  };
  
  const [selectedYear, setSelectedYear] = useState(getInitialYear());

  // Filter data for selected year
  const yearData = data.filter(item => {
    const itemYear = new Date(item.day).getFullYear();
    return itemYear === selectedYear;
  });

  // Create a map for quick lookup
  const violationMap = new Map();
  yearData.forEach(item => {
    violationMap.set(item.day, item);
  });

  const handlePreviousYear = () => {
    if (selectedYear > startYear) {
      setSelectedYear(selectedYear - 1);
      setSelectedDay(null); // Close details when changing years
    }
  };

  const handleNextYear = () => {
    if (selectedYear < endYear) {
      setSelectedYear(selectedYear + 1);
      setSelectedDay(null); // Close details when changing years
    }
  };

  const handleDayClick = (date: Date, dayData?: ViolationCalendarData) => {
    if (dayData && dayData.violations.length > 0) {
      const dateString = date.toISOString().split('T')[0];
      
      // Toggle: if clicking the same day, close the details
      if (selectedDay && selectedDay.date === dateString) {
        setSelectedDay(null);
      } else {
        setSelectedDay({
          date: dateString,
          violations: dayData.violations
        });
      }
    }
  };

  // Generate all days for the year
  const yearDays = generateYearDays(selectedYear);
  const weeks = [];
  for (let i = 0; i < yearDays.length; i += 7) {
    weeks.push(yearDays.slice(i, i + 7));
  }

  // Month labels
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Violation History
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {totalViolations.toLocaleString()} total violations since 1985
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousYear}
              disabled={selectedYear <= startYear}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-xl font-bold text-gray-900 min-w-[80px] text-center">
              {selectedYear}
            </div>
            
            <button
              onClick={handleNextYear}
              disabled={selectedYear >= endYear}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-gray-600">
          Click on any day with violations to see details below. Click the same day again or the close button to hide details. Darker colors indicate more severe violations.
        </p>
      </div>

      {/* Month labels */}
      <div className="mb-2">
        <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 ml-6">
          {monthLabels.map((month) => (
            <div key={month} className="text-center">
              {month}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mb-8">
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col text-xs text-gray-500 mr-2 justify-around h-24">
            <div>Mon</div>
            <div>Wed</div>
            <div>Fri</div>
          </div>
          
          {/* Calendar */}
          <div className="flex-1">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
              {weeks.map((week, weekIndex) => 
                week.map((day, dayIndex) => {
                  const dateString = day.toISOString().split('T')[0];
                  const dayData = violationMap.get(dateString);
                  const isCurrentYear = day.getFullYear() === selectedYear;
                  const violationLevel = dayData ? getViolationLevel(dayData.value) : 'bg-gray-100';
                  const isSelected = selectedDay && selectedDay.date === dateString;
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        w-3 h-3 rounded-sm cursor-pointer border-2 transition-all duration-200
                        ${isCurrentYear ? violationLevel : 'bg-gray-50'}
                        ${dayData?.violations.length ? 'hover:ring-2 hover:ring-blue-300 hover:scale-110' : ''}
                        ${isSelected ? 'border-blue-500 ring-2 ring-blue-300 scale-110' : 'border-white'}
                      `}
                      onClick={() => isCurrentYear && handleDayClick(day, dayData)}
                      title={
                        isCurrentYear && dayData 
                          ? `${day.toLocaleDateString()}: ${dayData.healthBased} health-based, ${dayData.procedural} procedural violations`
                          : day.toLocaleDateString()
                      }
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
            <span className="font-medium">No violations</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
            <span className="font-medium">Procedural</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="font-medium">Health-based</span>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-medium">
            {selectedYear}: {yearData.reduce((sum, d) => sum + d.violations.length, 0)} violations
          </div>
        </div>
      </div>

      {/* Inline violation details */}
      {selectedDay && (
        <ViolationDetails
          date={selectedDay.date}
          violations={selectedDay.violations}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
} 