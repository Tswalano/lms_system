import React, { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, XCircle, X, AlertCircle, Clock, Clock10, UserPlus, Trash2, Loader2, Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toCamelCase } from '../../lib/helper';
import { Pagination } from '@/components/ui/Pagination';

interface Document {
    id: number;
    name: string;
    uploadedByDisplay: string;
    uploadedById: string;
    avatar: string;
    date: string;
    status: 'active' | 'draft' | 'archived';
    signatureRate: number;
    folder: string;
    size: string;
    fileUrl: string;
    priority?: string;
    mimeType?: string;
    fileBase64?: string | null;
    version?: number;
    expiryDate?: string | null;
    renewalFrequencyDays?: number | null;
}

interface AssignedUser {
    assignmentId: number;
    id: string;
    name: string;
    signedAt?: string;
    status?: string;
    documentVersion?: number;
    signatureType?: 'typed' | 'drawn' | null;
    signatureData?: string | null;
    isCurrentVersion?: boolean;
}

interface SignatureStatus {
    signed: AssignedUser[];
    notSigned: AssignedUser[];
    currentVersion?: number;
}

interface ActiveUser {
    id: number;
    firstName: string;
    lastName: string;
    jobTitle?: string;
}

interface DocumentViewModalProps {
    showViewModal: boolean;
    setShowViewModal: (show: boolean) => void;
    selectedDocument: Document | null;
    onSendReminder?: (docId: number) => void;
    isReminderLoading?: boolean;
}

const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
        case 'overdue': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
        case 'viewed': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
        default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
};

const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
        case 'signed': return <CheckCircle className="w-3 h-3" />;
        case 'pending': return <Clock className="w-3 h-3" />;
        case 'overdue': return <AlertCircle className="w-3 h-3" />;
        default: return <Clock className="w-3 h-3" />;
    }
};

interface Department {
    id: number;
    name: string;
}

/** Auto-assign configuration panel: flag a document for automatic assignment to new employees */
const AutoAssignPanel: React.FC<{ documentId: number }> = ({ documentId }) => {
    const { authFetch } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [departmentId, setDepartmentId] = useState<string>('any');
    const [role, setRole] = useState<string>('any');
    const [dueDays, setDueDays] = useState<string>('30');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const loadConfig = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const [configRes, deptRes] = await Promise.all([
                authFetch(`/admin-docs/documents/${documentId}/auto-assign`, { method: 'GET' }),
                authFetch('/users/departments', { method: 'GET' }),
            ]);
            const config = await configRes.json();
            if (config.payload) {
                setEnabled(Boolean(config.payload.enabled));
                const rule = config.payload.rules?.[0];
                setDepartmentId(rule?.departmentId != null ? String(rule.departmentId) : 'any');
                setRole(rule?.role ?? 'any');
                setDueDays(rule?.dueDays != null ? String(rule.dueDays) : '30');
            }
            const deptData = await deptRes.json().catch(() => null);
            const rawDepts = deptData?.payload?.departments ?? deptData?.payload ?? [];
            if (Array.isArray(rawDepts)) setDepartments(rawDepts);
        } catch {
            setMessage('Failed to load auto-assign configuration.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOpen = () => {
        if (!open) loadConfig();
        setOpen(prev => !prev);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const hasScope = departmentId !== 'any' || role !== 'any' || dueDays !== '30';
            const response = await authFetch(`/admin-docs/documents/${documentId}/auto-assign`, {
                method: 'PUT',
                body: JSON.stringify({
                    enabled,
                    rules: enabled && hasScope
                        ? [{
                            departmentId: departmentId === 'any' ? null : Number(departmentId),
                            role: role === 'any' ? null : role,
                            dueDays: Number(dueDays) || 30,
                        }]
                        : [],
                }),
            });
            if (!response.ok) throw new Error('Failed to save.');
            setMessage(enabled ? 'New employees matching this scope will receive this document automatically.' : 'Auto-assignment disabled.');
        } catch {
            setMessage('Failed to save auto-assign configuration.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
                onClick={handleToggleOpen}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Auto-assign to new employees
                </span>
                <span className="text-gray-400">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={e => setEnabled(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Automatically assign this document when a new employee is created
                                </span>
                            </label>
                            {enabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Department</label>
                                        <select
                                            value={departmentId}
                                            onChange={e => setDepartmentId(e.target.value)}
                                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="any">Any department</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={String(d.id)}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
                                        <select
                                            value={role}
                                            onChange={e => setRole(e.target.value)}
                                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="any">Any role</option>
                                            <option value="user">Employees</option>
                                            <option value="admin">Admins</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due within (days)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={dueDays}
                                            onChange={e => setDueDays(e.target.value)}
                                            className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                            {message && <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {saving ? 'Saving…' : 'Save auto-assign settings'}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface AuditLogEntry {
    id: number;
    action: 'signed' | 'viewed' | 'reminded' | 'version_updated' | 'expiring_soon' | 'expired' | 'assigned' | 'unassigned';
    performedAt: string;
    user: { id: string; name: string } | null;
    metadata: Record<string, unknown> | null;
}

const AUDIT_ACTION_LABELS: Record<AuditLogEntry['action'], string> = {
    signed: 'Signed',
    viewed: 'Viewed',
    reminded: 'Reminded',
    version_updated: 'Version updated',
    expiring_soon: 'Expiring soon',
    expired: 'Expired',
    assigned: 'Assigned',
    unassigned: 'Unassigned',
};

const AUDIT_ACTION_COLORS: Record<AuditLogEntry['action'], string> = {
    signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    viewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    reminded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    version_updated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    expiring_soon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    assigned: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    unassigned: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function describeAuditMetadata(entry: AuditLogEntry): string | null {
    const m = entry.metadata;
    if (!m) return null;
    if (entry.action === 'version_updated' && m.fromVersion != null && m.toVersion != null) {
        return `v${m.fromVersion} → v${m.toVersion}`;
    }
    if (entry.action === 'signed' && m.signatureType) {
        return `via ${m.signatureType} signature${m.documentVersion != null ? ` (v${m.documentVersion})` : ''}`;
    }
    if (entry.action === 'assigned' && m.via === 'bulk') {
        return 'via bulk assignment';
    }
    return null;
}

const AuditLogPanel: React.FC<{ documentId: number }> = ({ documentId }) => {
    const { authFetch } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAuditLog = async (fetchPage: number, fetchLimit: number) => {
        setLoading(true);
        try {
            const response = await authFetch(`/admin-docs/${documentId}/audit-log?page=${fetchPage}&limit=${fetchLimit}`, { method: 'GET' });
            const data = await response.json();
            if (data.payload) {
                setEntries(data.payload.entries);
                setTotal(data.payload.total);
                setTotalPages(data.payload.totalPages);
            }
        } catch {
            // silently fail — the panel will just show "no activity"
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOpen = () => {
        if (!open) fetchAuditLog(page, pageSize);
        setOpen((prev) => !prev);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchAuditLog(newPage, pageSize);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
        fetchAuditLog(1, newSize);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
                onClick={handleToggleOpen}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                <span className="flex items-center gap-2">
                    <Clock10 className="w-4 h-4 text-indigo-500" />
                    Audit Log
                </span>
                <span className="text-gray-400">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : entries.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No activity recorded yet.</p>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                                {entries.map((entry) => {
                                    const detail = describeAuditMetadata(entry);
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${AUDIT_ACTION_COLORS[entry.action]}`}>
                                                    {AUDIT_ACTION_LABELS[entry.action]}
                                                </span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                    {entry.user?.name || 'System'}
                                                </span>
                                                {detail && (
                                                    <span className="text-xs text-gray-400 truncate">{detail}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {new Date(entry.performedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalItems={total}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                pageSizeOptions={[10, 25, 50]}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
    showViewModal,
    setShowViewModal,
    selectedDocument,
    onSendReminder,
    isReminderLoading = false,
}) => {
    const { authFetch } = useAuth();
    const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Assignment management state
    const [showAssignPanel, setShowAssignPanel] = useState(false);
    const [allUsers, setAllUsers] = useState<ActiveUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [bulkAssigning, setBulkAssigning] = useState(false);
    const [removingAssignmentId, setRemovingAssignmentId] = useState<number | null>(null);
    const [forceRemoveId, setForceRemoveId] = useState<number | null>(null); // assignmentId pending force confirmation
    const [expandedSignatureId, setExpandedSignatureId] = useState<number | null>(null);

    const fetchSignatures = useCallback(async () => {
        if (!selectedDocument) return;
        setLoading(true);
        setError(null);
        try {
            const response = await authFetch(`/admin-docs/${selectedDocument.id}/signatures`, { method: 'GET' });
            if (!response.ok) throw new Error('Failed to fetch signature data.');
            const data = await response.json();
            if (data.payload) {
                setSignatureStatus(data.payload);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [selectedDocument, authFetch]);

    useEffect(() => {
        if (showViewModal && selectedDocument) {
            fetchSignatures();
        } else {
            setSignatureStatus(null);
            setShowAssignPanel(false);
            setUserSearch('');
            setSelectedUserIds([]);
            setForceRemoveId(null);
        }
    }, [showViewModal, selectedDocument, fetchSignatures]);

    const fetchAllUsers = async () => {
        if (allUsers.length > 0) return;
        setUsersLoading(true);
        try {
            const response = await authFetch('/users', { method: 'GET' });
            if (!response.ok) throw new Error('Failed to fetch users.');
            const data = await response.json();
            // GET /users returns { payload: { users: [...], departments: [...] } }
            const rawUsers = data.payload?.users ?? data.payload ?? data;
            const users: ActiveUser[] = Array.isArray(rawUsers)
                ? rawUsers.filter((u: any) => u.isActive !== false && u.isActive !== 0)
                : [];
            setAllUsers(users);
        } catch {
            // silently fail — the search box will stay empty
        } finally {
            setUsersLoading(false);
        }
    };

    const handleToggleAssignPanel = () => {
        if (!showAssignPanel) fetchAllUsers();
        setShowAssignPanel(prev => !prev);
        setUserSearch('');
    };

    const assignedIds = new Set([
        ...(signatureStatus?.signed.map(u => String(u.id)) ?? []),
        ...(signatureStatus?.notSigned.map(u => String(u.id)) ?? []),
    ]);

    const filteredUsers = allUsers.filter(u => {
        if (assignedIds.has(String(u.id))) return false;
        if (!userSearch) return true;
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return fullName.includes(userSearch.toLowerCase());
    });

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkAssign = async () => {
        if (!selectedDocument || selectedUserIds.length === 0) return;
        setBulkAssigning(true);
        try {
            const response = await authFetch('/admin-docs/assignments/bulk', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUserIds, documentId: selectedDocument.id }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Failed to assign users.');
            }
            await fetchSignatures();
            setSelectedUserIds([]);
            setUserSearch('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign users.');
        } finally {
            setBulkAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: number, force = false) => {
        setRemovingAssignmentId(assignmentId);
        try {
            const url = `/admin-docs/assignments/${assignmentId}${force ? '?force=true' : ''}`;
            const response = await authFetch(url, { method: 'DELETE' });
            if (response.status === 409) {
                // User has signed — ask for confirmation
                setForceRemoveId(assignmentId);
                return;
            }
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Failed to remove assignment.');
            }
            setForceRemoveId(null);
            await fetchSignatures();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove assignment.');
        } finally {
            setRemovingAssignmentId(null);
        }
    };

    if (!showViewModal) return null;

    const totalUsers = (signatureStatus?.signed.length ?? 0) + (signatureStatus?.notSigned.length ?? 0);
    const signedPercentage = totalUsers > 0 ? ((signatureStatus?.signed.length ?? 0) / totalUsers) * 100 : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50 flex-shrink-0">
                    <button
                        onClick={() => setShowViewModal(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {selectedDocument && (
                        <div className="flex items-center gap-4 pr-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedDocument.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Uploaded by {selectedDocument.uploadedByDisplay} • {selectedDocument.date}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {selectedDocument && (
                        <div className="space-y-6">
                            {/* Document Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{toCamelCase(selectedDocument.status)}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Size</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedDocument.size}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Signatures</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedDocument.signatureRate}%</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priority</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{toCamelCase(selectedDocument.priority || 'None')}</div>
                                </div>
                                {selectedDocument.expiryDate && (() => {
                                    const daysLeft = Math.ceil((new Date(selectedDocument.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isExpired = daysLeft < 0;
                                    const isSoon = daysLeft >= 0 && daysLeft <= 14;
                                    return (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Expires</div>
                                            <div className={`text-sm font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                                {isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : `In ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Assign User Panel */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={handleToggleAssignPanel}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    <span className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-blue-500" />
                                        Assign to employee
                                    </span>
                                    <span className="text-gray-400">{showAssignPanel ? '▲' : '▼'}</span>
                                </button>
                                {showAssignPanel && (
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                            placeholder="Search employees..."
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                                        />
                                        {usersLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                                {userSearch ? 'No matching employees found.' : 'All active employees are already assigned.'}
                                            </p>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-2">
                                                    <button
                                                        onClick={() => {
                                                            const shownIds = filteredUsers.map(u => String(u.id));
                                                            const allShownSelected = shownIds.every(id => selectedUserIds.includes(id));
                                                            setSelectedUserIds(prev => allShownSelected
                                                                ? prev.filter(id => !shownIds.includes(id))
                                                                : [...new Set([...prev, ...shownIds])]);
                                                        }}
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        {filteredUsers.every(u => selectedUserIds.includes(String(u.id))) ? 'Deselect all shown' : 'Select all shown'}
                                                    </button>
                                                    <span className="text-xs text-gray-400">{selectedUserIds.length} selected</span>
                                                </div>
                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                    {filteredUsers.map(user => {
                                                        const uid = String(user.id);
                                                        const checked = selectedUserIds.includes(uid);
                                                        return (
                                                            <label
                                                                key={uid}
                                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleUserSelection(uid)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                                                    {user.firstName} {user.lastName}
                                                                    {user.jobTitle && <span className="text-gray-400 ml-1">— {user.jobTitle}</span>}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={handleBulkAssign}
                                                    disabled={selectedUserIds.length === 0 || bulkAssigning}
                                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {bulkAssigning ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserPlus className="w-4 h-4" />
                                                    )}
                                                    {bulkAssigning
                                                        ? 'Assigning…'
                                                        : `Assign ${selectedUserIds.length || ''} employee${selectedUserIds.length === 1 ? '' : 's'}`}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Auto-assign for new employees */}
                            <AutoAssignPanel documentId={selectedDocument.id} />

                            {/* Audit trail */}
                            <AuditLogPanel documentId={selectedDocument.id} />

                            {/* Signature Progress */}
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="ml-3 text-gray-500 dark:text-gray-400">Loading signature data...</span>
                                </div>
                            ) : signatureStatus ? (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Signature Progress</h4>
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {signatureStatus.signed.length} of {totalUsers} signed
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${signedPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Signed Users */}
                                    {signatureStatus.signed.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-1.5 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle className="w-5 h-5" />
                                                Signed ({signatureStatus.signed.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {signatureStatus.signed.map(user => (
                                                    <div key={user.assignmentId} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                                                        <div className="flex items-center justify-between p-3">
                                                            <button
                                                                onClick={() => user.signatureData && setExpandedSignatureId(expandedSignatureId === user.assignmentId ? null : user.assignmentId)}
                                                                disabled={!user.signatureData}
                                                                className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-default"
                                                            >
                                                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</span>
                                                                        {user.documentVersion != null && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                                                                                v{user.documentVersion}
                                                                            </span>
                                                                        )}
                                                                        {user.isCurrentVersion === false && (
                                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                                <AlertTriangle className="w-2.5 h-2.5" /> Outdated — re-signature required
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {user.signedAt && (
                                                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                                            {new Date(user.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {user.signatureData && (
                                                                    expandedSignatureId === user.assignmentId
                                                                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                )}
                                                            </button>
                                                            {forceRemoveId === user.assignmentId ? (
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <span className="text-xs text-red-600 dark:text-red-400">Remove signed user?</span>
                                                                    <button
                                                                        onClick={() => handleRemoveAssignment(user.assignmentId, true)}
                                                                        disabled={removingAssignmentId === user.assignmentId}
                                                                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-60"
                                                                    >
                                                                        {removingAssignmentId === user.assignmentId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, remove'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setForceRemoveId(null)}
                                                                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleRemoveAssignment(user.assignmentId)}
                                                                    disabled={removingAssignmentId === user.assignmentId}
                                                                    title="Remove assignment"
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40 flex-shrink-0"
                                                                >
                                                                    {removingAssignmentId === user.assignmentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {expandedSignatureId === user.assignmentId && user.signatureData && (
                                                            <div className="px-3 pb-3">
                                                                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-center">
                                                                    {user.signatureType === 'drawn' ? (
                                                                        <img src={user.signatureData} alt={`${user.name}'s signature`} className="max-h-20" />
                                                                    ) : (
                                                                        <span className="font-signature text-3xl text-slate-800 dark:text-slate-100">
                                                                            {user.signatureData}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Not Signed Users */}
                                    {signatureStatus.notSigned.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-1.5 text-base font-semibold text-red-600 dark:text-red-400">
                                                <XCircle className="w-5 h-5" />
                                                Pending Signatures ({signatureStatus.notSigned.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {signatureStatus.notSigned.map(user => (
                                                    <div key={user.assignmentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                                {getStatusIcon(user.status || 'pending')}
                                                            </div>
                                                            <span className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status || 'pending')} flex items-center gap-1`}>
                                                                {getStatusIcon(user.status || 'pending')}
                                                                {(user.status || 'pending').charAt(0).toUpperCase() + (user.status || 'pending').slice(1)}
                                                            </span>
                                                            <button
                                                                onClick={() => handleRemoveAssignment(user.assignmentId)}
                                                                disabled={removingAssignmentId === user.assignmentId}
                                                                title="Remove assignment"
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                                                            >
                                                                {removingAssignmentId === user.assignmentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {signatureStatus.signed.length > 0 && signatureStatus.notSigned.length === 0 && (
                                        <div className="text-center py-4">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="font-medium">All users have signed this document!</span>
                                            </div>
                                        </div>
                                    )}

                                    {totalUsers === 0 && (
                                        <div className="text-center py-8">
                                            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">No employees assigned yet. Use the panel above to assign employees.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No signature data available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={() => selectedDocument && onSendReminder?.(selectedDocument.id)}
                            disabled={isReminderLoading || !onSendReminder}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isReminderLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Clock10 className="w-4 h-4" />
                            )}
                            {isReminderLoading ? 'Sending...' : 'Send Reminder'}
                        </button>
                        <button
                            onClick={() => setShowViewModal(false)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                            <X className="w-4 h-4" />
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewModal;
