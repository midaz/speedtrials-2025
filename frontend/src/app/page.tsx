'use client';

import { useState, useEffect } from 'react';
import { WaterSystem, TopViolator } from '@/lib/database';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WaterSystem[]>([]);
  const [topViolators, setTopViolators] = useState<TopViolator[]>([]);
  const [loading, setLoading] = useState(false);
  const [topViolatorsLoading, setTopViolatorsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch top violators on page load
  useEffect(() => {
    const fetchTopViolators = async () => {
      try {
        const response = await fetch('/api/top-violators');
        const data = await response.json();
        
        if (response.ok) {
          setTopViolators(data.results);
        } else {
          console.error('Failed to fetch top violators:', data.error);
        }
      } catch (error) {
        console.error('Error fetching top violators:', error);
      } finally {
        setTopViolatorsLoading(false);
      }
    };

    fetchTopViolators();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  // Show violations table only when no search query or results
  const showViolationsTable = query.length < 2 && results.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-blue-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">H2Operator</h1>
                <p className="text-sm text-gray-600 font-medium">Georgia Water Compliance Intelligence</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Water System
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Search for water treatment facilities by ID or name to view compliance status, 
            violations, and inspection history.
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter Water System ID (e.g., GA0010000) or Facility Name (e.g., Baxley)"
              className="w-full pl-12 pr-4 py-4 text-md text-gray-700 placeholder:text-gray-500 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Search Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Found {results.length} water system{results.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {results.map((system) => (
                <Link
                  key={system.PWSID}
                  href={`/facility/${system.PWSID}`}
                  className="block px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-blue-900 transition-colors">
                        {system.PWS_NAME}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-800 transition-all">
                          {system.PWSID}
                        </span>
                        <span>{system.CITY_NAME}, {system.STATE_CODE}</span>
                        <span>{system.POPULATION_SERVED_COUNT?.toLocaleString()} people served</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top Violators Table */}
        {showViolationsTable && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Facilities by Violations
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Water systems with the highest number of compliance violations
              </p>
            </div>
            
            {topViolatorsLoading ? (
              <div className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
                        <div className="flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Violations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topViolators.map((violator) => (
                      <Link
                        key={violator.PWSID}
                        href={`/facility/${violator.PWSID}`}
                        className="table-row hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {violator.PWS_NAME}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {violator.PWSID}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {violator.CITY_NAME}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                violator.violation_count >= 50 ? 'bg-red-100 text-red-800 animate-pulse' :
                                violator.violation_count >= 20 ? 'bg-orange-100 text-orange-800' :
                                violator.violation_count >= 10 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {violator.violation_count >= 50 && (
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {violator.violation_count.toLocaleString()}
                              </span>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </td>
                      </Link>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {query.length >= 2 && results.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No water systems found</h3>
            <p className="text-sm text-gray-600">Try searching with a different term or check your spelling.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Powered by Georgia Environmental Protection Division data</p>
            <p className="text-sm mt-2">Helping water operators stay compliant and communities stay informed</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
