'use client';

import { useState } from 'react';
import { ViolationCalendarData, Violation } from '@/lib/database';

interface ViolationCalendarProps {
  data: ViolationCalendarData[];
  from: string;
  to: string;
  totalViolations: number;
}

interface ViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  violations: Violation[];
}

function ViolationModal({ isOpen, onClose, date, violations }: ViolationModalProps) {
  if (!isOpen) return null;

  const healthBasedViolations = violations.filter(v => v.IS_HEALTH_BASED_IND === 'Y');
  const proceduralViolations = violations.filter(v => v.IS_HEALTH_BASED_IND !== 'Y');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Violations on {new Date(date).toLocaleDateString()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {healthBasedViolations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Health-Based Violations ({healthBasedViolations.length})
                </h4>
                <div className="space-y-2">
                  {healthBasedViolations.map((violation) => (
                    <div key={violation.VIOLATION_ID} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-red-900">
                            Code: {violation.VIOLATION_CODE}
                          </div>
                          <div className="text-sm text-red-700">
                            Category: {violation.VIOLATION_CATEGORY_CODE}
                          </div>
                          <div className="text-sm text-red-600">
                            Status: {violation.VIOLATION_STATUS}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-red-600">
                            Rule: {violation.RULE_CODE}
                          </div>
                          {violation.IS_MAJOR_VIOL_IND === 'Y' && (
                            <span className="inline-block mt-1 px-2 py-1 bg-red-200 text-red-800 text-xs rounded">
                              Major
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {proceduralViolations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-orange-800 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  Procedural Violations ({proceduralViolations.length})
                </h4>
                <div className="space-y-2">
                  {proceduralViolations.map((violation) => (
                    <div key={violation.VIOLATION_ID} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-orange-900">
                            Code: {violation.VIOLATION_CODE}
                          </div>
                          <div className="text-sm text-orange-700">
                            Category: {violation.VIOLATION_CATEGORY_CODE}
                          </div>
                          <div className="text-sm text-orange-600">
                            Status: {violation.VIOLATION_STATUS}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-orange-600">
                            Rule: {violation.RULE_CODE}
                          </div>
                          {violation.IS_MAJOR_VIOL_IND === 'Y' && (
                            <span className="inline-block mt-1 px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
                              Major
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedViolations, setSelectedViolations] = useState<Violation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    }
  };

  const handleNextYear = () => {
    if (selectedYear < endYear) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const handleDayClick = (date: Date, dayData?: ViolationCalendarData) => {
    if (dayData && dayData.violations.length > 0) {
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedViolations(dayData.violations);
      setIsModalOpen(true);
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
          Click on any day with violations to see details. Darker colors indicate more severe violations.
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
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        w-3 h-3 rounded-sm cursor-pointer border border-white
                        ${isCurrentYear ? violationLevel : 'bg-gray-50'}
                        ${dayData?.violations.length ? 'hover:ring-2 hover:ring-blue-300' : ''}
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
          <div className="text-gray-500 text-xs mt-1">
            Total since 1985: {totalViolations.toLocaleString()}
          </div>
        </div>
      </div>

      <ViolationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate || ''}
        violations={selectedViolations}
      />
    </div>
  );
} 