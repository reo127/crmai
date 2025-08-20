'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({
    conversionFunnel: {
      new: 0,
      contacted: 0,
      inProgress: 0,
      converted: 0,
      lost: 0,
      followUp: 0,
    },
    sourceAnalysis: [],
    monthlyTrends: [],
    userPerformance: [],
    valueStats: {
      totalValue: 0,
      convertedValue: 0,
      avgLeadValue: 0,
    },
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          conversionFunnel: data.conversionFunnel,
          sourceAnalysis: data.sourceAnalysis,
          monthlyTrends: data.monthlyTrends,
          userPerformance: data.userPerformance,
          valueStats: data.valueStats,
          totalLeads: data.totalLeads,
        });
      } else {
        console.error('Failed to fetch analytics');
        // Set empty data structure if API fails
        setAnalytics({
          conversionFunnel: {
            new: 0,
            contacted: 0,
            inProgress: 0,
            converted: 0,
            lost: 0,
            followUp: 0,
          },
          sourceAnalysis: [],
          monthlyTrends: [],
          userPerformance: [],
          valueStats: {
            totalValue: 0,
            convertedValue: 0,
            avgLeadValue: 0,
          },
          totalLeads: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data structure if there's an error
      setAnalytics({
        conversionFunnel: {
          new: 0,
          contacted: 0,
          inProgress: 0,
          converted: 0,
          lost: 0,
          followUp: 0,
        },
        sourceAnalysis: [],
        monthlyTrends: [],
        userPerformance: [],
        valueStats: {
          totalValue: 0,
          convertedValue: 0,
          avgLeadValue: 0,
        },
        totalLeads: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {user?.role === 'admin' ? 'Company Analytics' : 'My Analytics'}
            </h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {analytics.totalLeads || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${analytics.valueStats?.totalValue?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">
                      ${analytics.valueStats?.convertedValue?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Converted Value</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${analytics.valueStats?.avgLeadValue?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Avg Lead Value</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Funnel */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.conversionFunnel?.new || 0}
                    </div>
                    <div className="text-sm text-gray-600">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analytics.conversionFunnel?.contacted || 0}
                    </div>
                    <div className="text-sm text-gray-600">Contacted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.conversionFunnel?.inProgress || 0}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.conversionFunnel?.followUp || 0}
                    </div>
                    <div className="text-sm text-gray-600">Follow-up</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.conversionFunnel?.converted || 0}
                    </div>
                    <div className="text-sm text-gray-600">Converted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.conversionFunnel?.lost || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Source Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.sourceAnalysis && analytics.sourceAnalysis.length > 0 ? (
                      analytics.sourceAnalysis.map((source) => (
                        <div key={source.name} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-gray-600">
                              {source.leads} leads • {source.converted} converted
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {(source.rate || 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">conversion</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No source data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 ? (
                      analytics.monthlyTrends.map((month) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <div className="font-medium">{month.month}</div>
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-medium text-blue-600">
                                {month.leads}
                              </div>
                              <div className="text-xs text-gray-500">leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-green-600">
                                {month.converted}
                              </div>
                              <div className="text-xs text-gray-500">converted</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {month.leads > 0 ? ((month.converted / month.leads) * 100).toFixed(1) : '0.0'}%
                              </div>
                              <div className="text-xs text-gray-500">rate</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No monthly trend data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Performance - Admin Only */}
            {user?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.userPerformance && analytics.userPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Leads
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Converted
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Conversion Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analytics.userPerformance.map((userPerf) => (
                            <tr key={userPerf.name}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {userPerf.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {userPerf.leads}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {userPerf.converted}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-green-600">
                                  {(userPerf.rate || 0).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No team performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}