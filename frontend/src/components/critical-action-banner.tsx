'use client';

import { useState, useEffect } from 'react';

interface UrgentAction {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  actionNeeded: string;
  timeframe: string;
  reason: string;
  nextSteps: string[];
}

interface CriticalActionBannerProps {
  pwsid: string;
}

export default function CriticalActionBanner({ pwsid }: CriticalActionBannerProps) {
  const [urgentAction, setUrgentAction] = useState<UrgentAction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrgentAction() {
      try {
        setLoading(true);
        const response = await fetch(`/api/action/urgent?pwsid=${pwsid}`);
        
        if (response.ok) {
          const data = await response.json();
          setUrgentAction(data.urgentAction);
        }
      } catch (error) {
        console.error('Failed to fetch urgent action:', error);
      } finally {
        setLoading(false);
      }
    }

    if (pwsid) {
      fetchUrgentAction();
    }
  }, [pwsid]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
            <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">🚨 Analyzing compliance status...</h4>
            <p className="text-sm text-blue-700">Processing SDWIS data to identify urgent actions</p>
          </div>
        </div>
      </div>
    );
  }

  if (!urgentAction) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-1">✅ No Urgent Actions Required</h4>
            <p className="text-sm text-green-700">System appears to be in compliance with current requirements</p>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical': return {
        bg: 'from-red-50 to-pink-50',
        border: 'border-red-300', 
        text: 'text-red-900',
        icon: 'bg-gradient-to-br from-red-500 to-pink-600',
        badge: 'bg-red-100 text-red-800',
        emoji: '🚨'
      };
      case 'high': return {
        bg: 'from-orange-50 to-yellow-50',
        border: 'border-orange-300',
        text: 'text-orange-900', 
        icon: 'bg-gradient-to-br from-orange-500 to-yellow-600',
        badge: 'bg-orange-100 text-orange-800',
        emoji: '⚠️'
      };
      case 'medium': return {
        bg: 'from-blue-50 to-indigo-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        icon: 'bg-gradient-to-br from-blue-500 to-indigo-600', 
        badge: 'bg-blue-100 text-blue-800',
        emoji: '📋'
      };
      default: return {
        bg: 'from-gray-50 to-slate-50',
        border: 'border-gray-300',
        text: 'text-gray-900',
        icon: 'bg-gradient-to-br from-gray-500 to-slate-600',
        badge: 'bg-gray-100 text-gray-800',
        emoji: '📋'
      };
    }
  };

  const style = getPriorityStyle(urgentAction.priority);

  return (
    <div className={`bg-gradient-to-r ${style.bg} rounded-xl border ${style.border} p-6 shadow-lg`}>
      <div className="flex items-start">
        {/* Priority Icon */}
        <div className={`w-12 h-12 ${style.icon} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
          <span className="text-xl">{style.emoji}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <h3 className={`text-xl font-bold ${style.text} mr-3`}>
              {urgentAction.title}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${style.badge}`}>
              {urgentAction.priority} PRIORITY
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Action Details */}
            <div>
              <div className="mb-4">
                <h4 className={`font-semibold ${style.text} mb-2`}>🎯 Action Needed:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {urgentAction.actionNeeded}
                </p>
              </div>

              <div className="mb-4">
                <h4 className={`font-semibold ${style.text} mb-2`}>⏰ Timeframe:</h4>
                <p className="text-gray-700 font-medium">
                  {urgentAction.timeframe}
                </p>
              </div>

              <div>
                <h4 className={`font-semibold ${style.text} mb-2`}>📋 Why This Matters:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {urgentAction.reason}
                </p>
              </div>
            </div>

            {/* Right Column - Next Steps */}
            <div>
              <h4 className={`font-semibold ${style.text} mb-3`}>🚀 Next Steps:</h4>
              <div className="space-y-3">
                {urgentAction.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-6 h-6 ${style.icon} rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5`}>
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button className={`px-4 py-2 ${style.icon} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}>
              Take Action
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              View Details
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Contact Regulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 