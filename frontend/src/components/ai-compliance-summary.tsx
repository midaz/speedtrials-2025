'use client';

import { useState, useEffect } from 'react';

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

interface AIComplianceSummaryProps {
  pwsid: string;
}

export default function AIComplianceSummary({ pwsid }: AIComplianceSummaryProps) {
  const [summary, setSummary] = useState<FacilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const response = await fetch(`/api/facility/summary?pwsid=${pwsid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch facility summary');
        }
        
        const data = await response.json();
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (pwsid) {
      fetchSummary();
    }
  }, [pwsid]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Analyzing Facility</h3>
          <p className="text-gray-600 mb-4">
            Processing compliance data, violations, and inspection history...
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-purple-200">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-purple-700 font-medium">Generating insights</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Analysis Unavailable</h3>
          <p className="text-gray-600">
            {error || 'Unable to generate compliance summary at this time.'}
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' };
      case 'caution': return { bg: 'from-yellow-50 to-orange-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' };
      case 'critical': return { bg: 'from-red-50 to-pink-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' };
      default: return { bg: 'from-gray-50 to-slate-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' };
    }
  };

  const statusStyle = getStatusColor(summary.statusLevel);

  return (
    <div className={`bg-gradient-to-r ${statusStyle.bg} rounded-2xl border ${statusStyle.border} p-8`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">🤖 AI Compliance Intelligence</h3>
            <p className="text-gray-600">Real-time analysis of facility compliance data</p>
          </div>
        </div>
        
        {/* Health Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${statusStyle.text} mb-1`}>
            {summary.healthScore}/100
          </div>
          <div className={`text-sm font-medium ${statusStyle.text} uppercase tracking-wide`}>
            {summary.statusLevel} Status
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Urgent */}
        <div className="bg-white rounded-xl p-4 border border-red-200">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h4 className="font-semibold text-red-900">🚨 URGENT</h4>
          </div>
          <div className="space-y-2">
            {summary.priorityActions.urgent.length > 0 ? (
              summary.priorityActions.urgent.map((action, index) => (
                <div key={index} className="text-sm text-red-800 bg-red-50 rounded p-2">
                  • {action}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">No urgent actions</div>
            )}
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-xl p-4 border border-orange-200">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-orange-900">📋 THIS WEEK</h4>
          </div>
          <div className="space-y-2">
            {summary.priorityActions.thisWeek.length > 0 ? (
              summary.priorityActions.thisWeek.map((action, index) => (
                <div key={index} className="text-sm text-orange-800 bg-orange-50 rounded p-2">
                  • {action}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">No weekly actions</div>
            )}
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl p-4 border border-blue-200">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="font-semibold text-blue-900">🗓️ THIS MONTH</h4>
          </div>
          <div className="space-y-2">
            {summary.priorityActions.thisMonth.length > 0 ? (
              summary.priorityActions.thisMonth.map((action, index) => (
                <div key={index} className="text-sm text-blue-800 bg-blue-50 rounded p-2">
                  • {action}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic">No monthly actions</div>
            )}
          </div>
        </div>
      </div>

      {/* Insights & Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="bg-white rounded-xl p-4 border border-purple-200">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-semibold text-purple-900">💡 AI INSIGHTS</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary.insights}
          </p>
        </div>

        {/* Recent Information */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mr-2">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900">📊 FACILITY STATUS</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Inspection:</span>
              <span className="font-medium text-gray-900">{summary.lastInspection}</span>
            </div>
            {summary.nextMilestones.length > 0 && (
              <div>
                <span className="text-gray-600">Upcoming:</span>
                <div className="mt-1 space-y-1">
                  {summary.nextMilestones.slice(0, 3).map((milestone, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1">
                      • {milestone}
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