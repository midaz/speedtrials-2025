import { getWaterSystemByPWSID, getViolationCalendarData, ViolationCalendarData } from '@/lib/database';
import ViolationCalendar from '@/components/violation-calendar';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface FacilityPageProps {
  params: {
    pwsid: string;
  };
}

export default function FacilityPage({ params }: FacilityPageProps) {
  const system = getWaterSystemByPWSID(params.pwsid);

  if (!system) {
    notFound();
  }

  // Get violation data from 1985 to present
  const currentDate = new Date();
  const fromDate = '1985-01-01';
  const toDate = currentDate.toISOString().split('T')[0];
  
  let violationData: ViolationCalendarData[] = [];
  try {
    violationData = getViolationCalendarData(params.pwsid, fromDate, toDate);
  } catch (error) {
    console.error('Error fetching violation data:', error);
  }

  // Calculate total violations across all years
  const totalViolations = violationData.reduce((sum, d) => sum + d.violations.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">H2Operator</h1>
                <p className="text-sm text-gray-600">Georgia Water Compliance Intelligence</p>
              </div>
            </Link>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Search</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {system.PWS_NAME}
              </h2>
              <div className="flex items-center space-x-4 text-lg text-gray-600">
                <span className="font-mono bg-blue-100 px-3 py-1 rounded-lg text-blue-800">
                  {system.PWSID}
                </span>
                <span>{system.CITY_NAME}, {system.STATE_CODE}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="relative mr-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                Active System
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-900">
                {system.POPULATION_SERVED_COUNT?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-blue-700 text-sm font-medium">People Served</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-900">
                {system.PWS_TYPE_CODE}
              </div>
              <div className="text-emerald-700 text-sm font-medium">System Type</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-900">
                {system.OWNER_TYPE_CODE}
              </div>
              <div className="text-purple-700 text-sm font-medium">Owner Type</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-900">
                {system.PRIMARY_SOURCE_CODE}
              </div>
              <div className="text-amber-700 text-sm font-medium">Water Source</div>
            </div>
          </div>
        </div>

        {/* Violation Calendar - Full Width */}
        <div className="mb-8">
          <ViolationCalendar 
            data={violationData}
            from={fromDate}
            to={toDate}
            totalViolations={totalViolations}
          />
        </div>

        {/* AI Insights Placeholder */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-8 mt-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Compliance Intelligence</h3>
            <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
              Our AI will analyze this system&apos;s compliance data to provide actionable insights, 
              violation explanations, and recommended next steps for operators.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-purple-200">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-purple-700 font-medium">Feature in development</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 