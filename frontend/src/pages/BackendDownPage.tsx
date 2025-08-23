import React, { useState } from 'react';
import { Server, Database, Home, RefreshCw, AlertTriangle, Clock, Wifi, WifiOff, CheckCircle, XCircle, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/contexts/AuthContext';

interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    service: string;
    timestamp: string;
    version: string;
    database: 'connected' | 'disconnected';
}

interface BackendDownPageProps {
    onRetry?: () => void;
    onGoHome?: () => void;
}

const BackendDownPage: React.FC<BackendDownPageProps> = ({ onGoHome }) => {
    const [manualRetryCount, setManualRetryCount] = useState(0);

    // Health check to monitor backend and database status
    const {
        data: healthData,
        isError,
        error,
        failureCount,
        refetch,
        isLoading
    } = useQuery<HealthResponse>({
        queryKey: ['backend-health'],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data: HealthResponse = await response.json();

                // Check if both backend and database are healthy
                // const isFullyHealthy = data.status === 'healthy' && data.database === 'connected';

                // if (isFullyHealthy) {
                //     // Backend is back online, redirect or notify parent
                //     if (onRetry) {
                //         onRetry();
                //     } else {
                //         window.location.reload();
                //     }
                // }

                return data;
            } catch (err) {
                // Handle specific connection errors
                if (err instanceof Error) {
                    if (err.message.includes('ERR_CONNECTION_REFUSED') ||
                        err.message.includes('Failed to fetch') ||
                        err.name === 'TypeError') {
                        throw new Error('Backend server is offline (Connection Refused)');
                    }
                }
                throw err;
            }
        },
        // retry: (failureCount, error) => {
        //     console.error('Backend is offline. Retrying...', error);
        //     // Only retry twice to prevent backend throttling
        //     return failureCount < 2;
        // },
        // retryDelay: 5000, // Wait 5 seconds between retries
        // refetchInterval: 15000, // Check every 15 seconds
        // refetchIntervalInBackground: false,
        // enabled: true
    });

    const handleManualRetry = () => {
        setManualRetryCount(prev => prev + 1);
        refetch();
    };

    const handleGoHome = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            window.location.href = '/';
        }
    };

    const handleContactSupport = () => {
        const subject = encodeURIComponent('Backend Services Down - Urgent');
        const body = encodeURIComponent(`
            Service Status: ${getServiceStatus()}
            Database Status: ${getDatabaseStatus()}
            Error: ${getErrorMessage()}
            Time: ${new Date().toISOString()}
            Retry Attempts: ${failureCount + manualRetryCount}

            Please investigate the backend/database connectivity issue.
        `);
        window.open(`mailto:support@lms-disraptor.co.za?subject=${subject}&body=${body}`, '_blank');
    };

    // Helper functions to determine status
    const isBackendOnline = () => {
        return !isError && healthData;
    };

    const isDatabaseConnected = () => {
        return healthData?.database === 'connected';
    };

    const getServiceStatus = () => {
        if (isError) return 'offline';
        if (!healthData) return 'checking';
        return healthData.status === 'healthy' ? 'online' : 'degraded';
    };

    const getDatabaseStatus = () => {
        if (isError || !healthData) return 'unknown';
        return healthData.database === 'connected' ? 'connected' : 'disconnected';
    };

    const getErrorMessage = () => {
        if (!error) return 'No error';
        if (error instanceof Error) {
            if (error.message.includes('Connection Refused')) {
                return 'Backend server is not responding';
            }
            return error.message;
        }
        return 'Unknown error occurred';
    };

    const getMainStatusText = () => {
        if (isError) {
            return 'Backend Offline';
        }
        if (healthData?.database === 'disconnected') {
            return 'Database Connection Lost';
        }
        if (healthData?.status === 'unhealthy') {
            return 'Service Degraded';
        }
        if (isBackendOnline() && isDatabaseConnected()) {
            return 'All Services Online';
        }
        return 'Checking Services...';
    };

    const getMainStatusMessage = () => {
        if (isError) {
            return 'Unable to reach the backend server. The service may be down for maintenance or experiencing technical difficulties.';
        }
        if (healthData?.database === 'disconnected') {
            return 'The backend server is running but cannot connect to the database. Data operations are currently unavailable.';
        }
        if (healthData?.status === 'unhealthy') {
            return 'The backend services are experiencing issues. Some functionality may be limited or unavailable.';
        }
        return 'Checking the status of backend services and database connectivity...';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-slate-900 dark:via-green-950 dark:to-cyan-950 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-200/30 dark:bg-red-800/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-yellow-200/30 dark:bg-yellow-800/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-red-200/30 dark:bg-red-800/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
                {/* Main Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-12">
                    {/* Icon Section */}
                    <div className="mb-8">
                        <div className="relative inline-flex items-center justify-center">
                            {/* Background Circle */}
                            <div className={`w-32 h-32 bg-gradient-to-br ${isDatabaseConnected() && isBackendOnline() ? ' from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50' : 'from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50'} rounded-full flex items-center justify-center shadow-lg`}>
                                <div className={`w-24 h-24 bg-gradient-to-br ${isDatabaseConnected() && isBackendOnline() ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-full flex items-center justify-center relative`}>
                                    {isLoading ? (
                                        <RefreshCw className="w-12 h-12 text-white animate-spin" />
                                    ) : isBackendOnline() && isDatabaseConnected() ? <Wifi className="w-12 h-12 text-white" /> : (
                                        <WifiOff className="w-12 h-12 text-white" />
                                    )}

                                    {/* Animated Warning Icons */}
                                    {!isBackendOnline() && !isDatabaseConnected() ? (
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -left-4 w-6 h-6 bg-red-200 dark:bg-red-800 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute -bottom-2 -right-6 w-4 h-4 bg-orange-200 dark:bg-orange-800 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${isBackendOnline() && isDatabaseConnected() ? 'from-green-500 to-cyan-500' : 'from-red-500 to-orange-500'} bg-clip-text text-transparent mb-4`}>
                                {getMainStatusText()}
                            </h1>
                            <div className={`w-24 h-1 bg-gradient-to-r ${isBackendOnline() && isDatabaseConnected() ? 'from-green-500 to-cyan-500' : 'from-red-500 to-orange-500'} rounded-full mx-auto mb-6`}></div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                                {healthData?.service || 'Leave Management System API'} is experiencing issues
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                {getMainStatusMessage()}
                            </p>
                        </div>
                    </div>

                    {/* Service Status Grid */}
                    <div className="mt-8 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Service Status</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Backend Server Status */}
                            <div className={`${isBackendOnline() ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-xl p-4`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Server className={`w-5 h-5 ${isBackendOnline() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                    <span className={`font-medium ${isBackendOnline() ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        Backend Server
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isBackendOnline() ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`text-sm ${isBackendOnline() ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        {getServiceStatus()}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 ${isBackendOnline() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isBackendOnline() ? `Version ${healthData?.version || '1.0.0'}` : getErrorMessage()}
                                </p>
                            </div>

                            {/* Database Status */}
                            <div className={`${isDatabaseConnected() ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-xl p-4`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Database className={`w-5 h-5 ${isDatabaseConnected() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                    <span className={`font-medium ${isDatabaseConnected() ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        Database
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isDatabaseConnected() ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`text-sm ${isDatabaseConnected() ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        {getDatabaseStatus()}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 ${isDatabaseConnected() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isDatabaseConnected() ? 'All database operations available' : 'Data operations unavailable'}
                                </p>
                            </div>
                        </div>

                        {/* Health Data Display */}
                        {healthData && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block">Service</span>
                                        <span className="text-gray-600 dark:text-gray-400">{healthData.service}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block">Version</span>
                                        <span className="text-gray-600 dark:text-gray-400">{healthData.version}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 block">Last Check</span>
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                                            {new Date(healthData.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Connection Details */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Detected</span>
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400">{new Date().toLocaleTimeString()}</span>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <RefreshCw className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Retries</span>
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400">{failureCount + manualRetryCount}</span>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Wifi className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Auto Check</span>
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400">Every 15s</span>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Priority</span>
                                    </div>
                                    <span className="text-red-600 dark:text-red-400 font-medium">High</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                        <button
                            onClick={handleManualRetry}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Checking...' : 'Retry Connection'}
                        </button>

                        <button
                            onClick={handleGoHome}
                            className="border-2 border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium px-8 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>
                    </div>

                    {/* Emergency Information */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Technical Issue Details</h4>
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                        {isError ?
                                            'The backend server is not responding (ERR_CONNECTION_REFUSED). This typically indicates the server is offline or unreachable.' :
                                            healthData?.database === 'disconnected' ?
                                                'The backend server is running but cannot establish a connection to the database. Data operations are temporarily unavailable.' :
                                                'System is experiencing degraded performance. Some features may be limited.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <strong>Automatic monitoring is active.</strong> The page will refresh automatically once services are restored.
                            For urgent matters, please contact our support team immediately.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <button
                                onClick={handleContactSupport}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium"
                            >
                                Emergency Support
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <a href="tel:+27111234567" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                Call: +27 11 123 4567
                            </a>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Error Code: 503 • Service Unavailable • {isError ? 'Backend Offline' : healthData?.database === 'disconnected' ? 'Database Disconnected' : 'Service Degraded'}
                    </p>
                </div>
            </div>

            {/* Floating Animation Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"></div>
            <div className="absolute bottom-1/4 left-8 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
        </div >
    );
};

export default BackendDownPage;