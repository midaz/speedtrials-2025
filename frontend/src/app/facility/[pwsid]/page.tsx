import { getWaterSystemByPWSID } from '@/lib/database';
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
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
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

        {/* System Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              System Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Public Water System ID</span>
                <span className="font-mono font-medium">{system.PWSID}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">System Name</span>
                <span className="font-medium text-right">{system.PWS_NAME}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Location</span>
                <span className="font-medium">{system.CITY_NAME}, {system.STATE_CODE}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Population Served</span>
                <span className="font-medium">{system.POPULATION_SERVED_COUNT?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">System Type</span>
                <span className="font-medium">{system.PWS_TYPE_CODE}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Primary Water Source</span>
                <span className="font-medium">{system.PRIMARY_SOURCE_CODE}</span>
              </div>
            </div>
          </div>

          {/* Compliance Overview */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compliance Overview
            </h3>
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Detailed Compliance Data</h4>
                <p className="text-gray-600">
                  Violation history, inspection records, and compliance status will be displayed here.
                </p>
                <div className="mt-4 text-sm text-blue-600">
                  Coming soon: AI-powered compliance insights
                </div>
              </div>
            </div>
          </div>
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