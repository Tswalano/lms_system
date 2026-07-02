import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
    useReviewQuestions,
    useCreateQuestion,
    useUpdateQuestion,
    useDeleteQuestion,
    useReorderQuestions,
    useQuestionSets,
    useSaveQuestionSet,
    useDeleteQuestionSet,
    useSetQuestionSetMembers,
    useQuestionSetAssignments,
    useAssignQuestionSet,
    type AdminReviewQuestion,
    type QuestionSetApi,
    type QuestionReviewType,
    type QuestionType,
} from "@/hooks/useReviewQuestions";
import { usePerformanceCycles, useAdminPerformanceSummary, useSyncCycle } from "@/hooks/usePerformanceReview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    ArrowDown, ArrowUp, ArrowLeft, CheckCircle2, FolderKanban, ListChecks,
    Loader2, Pencil, Plus, RefreshCw, Star, Trash2, Users,
} from "lucide-react";

const appPrimaryButtonClass = "rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";
const appOutlineButtonClass = "rounded-lg border-gray-200 bg-white/90 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:hover:bg-slate-700";
const softPanelClass = "rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900";

// Shared dropdown styling — matches the Select pattern used across the rest of the app
// (ManageEmployeesPage, ApplyLeavePage, document modals) instead of the shadcn defaults.
const appSelectTriggerClass = "bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600";
const appSelectContentClass = "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600";
const appSelectItemClass = "hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800";

const REVIEW_TYPE_LABELS: Record<QuestionReviewType, string> = {
    self_review: "Self review",
    peer_review: "Peer review",
    manager_appraisal: "Manager appraisal",
    next_steps: "Next steps",
};

const REVIEW_TYPE_BADGES: Record<QuestionReviewType, string> = {
    self_review: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    peer_review: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
    manager_appraisal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    next_steps: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
};

// Phase is derivable from the review type, so it is not exposed in the UI
const PHASE_FOR_REVIEW_TYPE: Record<QuestionReviewType, 'self' | 'peer' | 'nomination'> = {
    self_review: 'self',
    peer_review: 'peer',
    manager_appraisal: 'self',
    next_steps: 'self',
};

interface QuestionFormState {
    id?: string;
    category: string;
    // 'select' shows the category dropdown; 'custom' shows a text input for a brand-new category
    categoryMode: 'select' | 'custom';
    subcategory: string;
    questionText: string;
    guidanceText: string;
    questionType: QuestionType;
    reviewType: QuestionReviewType;
    targetRole: string;
}

const emptyQuestionForm: QuestionFormState = {
    category: "",
    categoryMode: 'select',
    subcategory: "",
    questionText: "",
    guidanceText: "",
    questionType: "rating",
    reviewType: "self_review",
    targetRole: "",
};

const PerformanceReviewQuestionsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'questions' | 'sets' | 'assignments'>('questions');

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                            <ListChecks className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Review Questions</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage questions, organise question sets and assign them to employees</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/performance-review-admin')} className={cn(appOutlineButtonClass, "gap-1.5")}>
                        <ArrowLeft className="w-4 h-4" /> Back to cycles
                    </Button>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800 w-fit">
                    {([
                        { key: 'questions', label: 'Questions', icon: <ListChecks className="w-3.5 h-3.5" /> },
                        { key: 'sets', label: 'Question Sets', icon: <FolderKanban className="w-3.5 h-3.5" /> },
                        { key: 'assignments', label: 'Employee Assignments', icon: <Users className="w-3.5 h-3.5" /> },
                    ] as const).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                                activeTab === tab.key
                                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'questions' && <QuestionsTab />}
            {activeTab === 'sets' && <QuestionSetsTab />}
            {activeTab === 'assignments' && <AssignmentsTab />}
        </div>
    );
};

// ─────────────────────────────────────────────
// Questions tab
// ─────────────────────────────────────────────

const QuestionsTab = () => {
    const [typeFilter, setTypeFilter] = useState<QuestionReviewType | 'all'>('all');
    const { data: questions = [], isLoading } = useReviewQuestions(typeFilter === 'all' ? undefined : typeFilter);
    // Unfiltered/all-types fetch so the Category dropdown offers every category in use,
    // not just ones matching the current type filter.
    const { data: allQuestionsForCategories = [] } = useReviewQuestions(undefined, true);
    const createQuestion = useCreateQuestion();
    const updateQuestion = useUpdateQuestion();
    const deleteQuestion = useDeleteQuestion();
    const reorderQuestions = useReorderQuestions();

    const [form, setForm] = useState<QuestionFormState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminReviewQuestion | null>(null);

    const existingCategories = useMemo(() => {
        const set = new Set<string>();
        for (const q of allQuestionsForCategories) set.add(q.category);
        return [...set].sort((a, b) => a.localeCompare(b));
    }, [allQuestionsForCategories]);

    const grouped = useMemo(() => {
        const map = new Map<QuestionReviewType, AdminReviewQuestion[]>();
        for (const q of questions) {
            const list = map.get(q.reviewType) ?? [];
            list.push(q);
            map.set(q.reviewType, list);
        }
        for (const list of map.values()) list.sort((a, b) => a.displayOrder - b.displayOrder);
        return map;
    }, [questions]);

    const openNewQuestionForm = () => {
        setForm({
            ...emptyQuestionForm,
            reviewType: typeFilter === 'all' ? 'self_review' : typeFilter,
            categoryMode: existingCategories.length > 0 ? 'select' : 'custom',
        });
    };

    const openEditQuestionForm = (q: AdminReviewQuestion) => {
        setForm({
            id: q.id,
            category: q.category,
            categoryMode: existingCategories.includes(q.category) ? 'select' : 'custom',
            subcategory: q.subcategory ?? "",
            questionText: q.questionText,
            guidanceText: q.guidanceText ?? "",
            questionType: q.questionType,
            reviewType: q.reviewType,
            targetRole: q.targetRole ?? "",
        });
    };

    const handleSave = async () => {
        if (!form || !form.category.trim() || !form.questionText.trim()) return;
        const payload = {
            category: form.category.trim(),
            subcategory: form.subcategory.trim() || null,
            questionText: form.questionText.trim(),
            guidanceText: form.guidanceText.trim() || null,
            questionType: form.questionType,
            phase: PHASE_FOR_REVIEW_TYPE[form.reviewType],
            reviewType: form.reviewType,
            targetRole: form.reviewType === 'manager_appraisal' ? (form.targetRole || null) : null,
        };
        try {
            if (form.id) {
                await updateQuestion.mutateAsync({ id: form.id, ...payload });
                toast.success("Question updated");
            } else {
                await createQuestion.mutateAsync(payload);
                toast.success("Question created");
            }
            setForm(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save question");
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const result = await deleteQuestion.mutateAsync(deleteTarget.id);
            toast.success(result?.softDeleted ? "Question deactivated (responses preserved)" : "Question deleted");
            setDeleteTarget(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete question");
        }
    };

    const handleToggleActive = async (q: AdminReviewQuestion) => {
        try {
            await updateQuestion.mutateAsync({ id: q.id, isActive: !q.isActive });
            toast.success(q.isActive ? "Question deactivated" : "Question activated");
        } catch {
            toast.error("Failed to update question");
        }
    };

    const handleMove = async (list: AdminReviewQuestion[], index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= list.length) return;
        const a = list[index];
        const b = list[target];
        try {
            await reorderQuestions.mutateAsync([
                { id: a.id, displayOrder: b.displayOrder },
                { id: b.id, displayOrder: a.displayOrder },
            ]);
        } catch {
            toast.error("Failed to reorder questions");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="w-[220px]">
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as QuestionReviewType | 'all')}>
                        <SelectTrigger className={cn(appSelectTriggerClass, "h-10 rounded-lg shadow-sm")}>
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className={appSelectContentClass}>
                            <SelectItem value="all" className={appSelectItemClass}>All review types</SelectItem>
                            {(Object.keys(REVIEW_TYPE_LABELS) as QuestionReviewType[]).map((t) => (
                                <SelectItem key={t} value={t} className={appSelectItemClass}>{REVIEW_TYPE_LABELS[t]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={openNewQuestionForm} className={cn(appPrimaryButtonClass, "gap-1.5")}>
                    <Plus className="w-4 h-4" /> New question
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading questions…</span>
                </div>
            ) : questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-14 text-center">
                    <ListChecks className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No questions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first review question to get started.</p>
                </div>
            ) : (
                [...grouped.entries()].map(([reviewType, list]) => (
                    <div key={reviewType} className={cn(softPanelClass, "overflow-hidden")}>
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", REVIEW_TYPE_BADGES[reviewType])}>
                                {REVIEW_TYPE_LABELS[reviewType]}
                            </span>
                            <span className="text-xs text-gray-400">{list.length} question{list.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {list.map((q, i) => (
                                <div key={q.id} className={cn("flex items-start gap-3 px-5 py-3", !q.isActive && "opacity-50")}>
                                    <div className="flex flex-col gap-0.5 pt-0.5">
                                        <button onClick={() => handleMove(list, i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-slate-600 dark:hover:text-slate-300">
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleMove(list, i, 1)} disabled={i === list.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 dark:text-slate-600 dark:hover:text-slate-300">
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{q.category}{q.subcategory ? ` · ${q.subcategory}` : ""}</span>
                                            {q.questionType === 'rating' && <Star className="w-3 h-3 text-amber-500" />}
                                            {q.targetRole && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {q.targetRole}
                                                </span>
                                            )}
                                            {!q.isActive && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">inactive</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{q.questionText}</p>
                                        {q.guidanceText && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{q.guidanceText}</p>}
                                        <p className="text-[11px] text-gray-400 mt-1">{q.responseCount} response{q.responseCount !== 1 ? "s" : ""} · in {q.setCount} set{q.setCount !== 1 ? "s" : ""}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleActive(q)}
                                            className={cn(appOutlineButtonClass, "h-8 px-2 text-xs")}
                                        >
                                            {q.isActive ? "Deactivate" : "Activate"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditQuestionForm(q)}
                                            className={cn(appOutlineButtonClass, "h-8 w-8 p-0")}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDeleteTarget(q)}
                                            className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Create / Edit Question Dialog */}
            <Dialog open={!!form} onOpenChange={(open) => { if (!open) setForm(null); }}>
                <DialogContent className="overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                    <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {form?.id ? "Edit question" : "New question"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Changes to questions in active cycles apply after running cycle sync.
                        </DialogDescription>
                    </DialogHeader>
                    {form && (
                        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Review type</label>
                                    <Select value={form.reviewType} onValueChange={(v) => setForm({ ...form, reviewType: v as QuestionReviewType })}>
                                        <SelectTrigger className={cn(appSelectTriggerClass, "rounded-xl")}><SelectValue /></SelectTrigger>
                                        <SelectContent className={appSelectContentClass}>
                                            {(Object.keys(REVIEW_TYPE_LABELS) as QuestionReviewType[]).map((t) => (
                                                <SelectItem key={t} value={t} className={appSelectItemClass}>{REVIEW_TYPE_LABELS[t]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer type</label>
                                    <Select value={form.questionType} onValueChange={(v) => setForm({ ...form, questionType: v as QuestionType })}>
                                        <SelectTrigger className={cn(appSelectTriggerClass, "rounded-xl")}><SelectValue /></SelectTrigger>
                                        <SelectContent className={appSelectContentClass}>
                                            <SelectItem value="rating" className={appSelectItemClass}>Rating (1–5)</SelectItem>
                                            <SelectItem value="text" className={appSelectItemClass}>Text</SelectItem>
                                            <SelectItem value="nomination" className={appSelectItemClass}>Nomination</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                    {form.categoryMode === 'select' ? (
                                        <Select
                                            value={existingCategories.includes(form.category) ? form.category : undefined}
                                            onValueChange={(v) => {
                                                if (v === '__new__') {
                                                    setForm({ ...form, categoryMode: 'custom', category: '' });
                                                } else {
                                                    setForm({ ...form, category: v });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={cn(appSelectTriggerClass, "rounded-xl")}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className={appSelectContentClass}>
                                                {existingCategories.map((c) => (
                                                    <SelectItem key={c} value={c} className={appSelectItemClass}>{c}</SelectItem>
                                                ))}
                                                {existingCategories.length > 0 && <SelectSeparator />}
                                                <SelectItem value="__new__" className={appSelectItemClass}>+ Add new category</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                autoFocus
                                                placeholder="e.g. Technical Competence"
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="rounded-xl border-gray-200 dark:border-slate-600"
                                            />
                                            {existingCategories.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setForm({ ...form, categoryMode: 'select', category: '' })}
                                                    className={cn(appOutlineButtonClass, "flex-shrink-0")}
                                                >
                                                    Choose existing
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory (optional)</label>
                                    <Input placeholder="e.g. Task Delivery" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="rounded-xl border-gray-200 dark:border-slate-600" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question text</label>
                                <textarea
                                    rows={3}
                                    value={form.questionText}
                                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
                                    placeholder="Write the question employees will answer…"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guidance text (optional)</label>
                                <textarea
                                    rows={2}
                                    value={form.guidanceText}
                                    onChange={(e) => setForm({ ...form, guidanceText: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
                                    placeholder="Explain the rating scale or what a good answer covers…"
                                />
                            </div>
                            {form.reviewType === 'manager_appraisal' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target role</label>
                                    <Select value={form.targetRole || 'any'} onValueChange={(v) => setForm({ ...form, targetRole: v === 'any' ? '' : v })}>
                                        <SelectTrigger className={cn(appSelectTriggerClass, "rounded-xl")}><SelectValue /></SelectTrigger>
                                        <SelectContent className={appSelectContentClass}>
                                            <SelectItem value="any" className={appSelectItemClass}>Any reviewee</SelectItem>
                                            <SelectItem value="employee" className={appSelectItemClass}>Employees</SelectItem>
                                            <SelectItem value="manager" className={appSelectItemClass}>Managers</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400">Manager-appraisal questions can differ for employee vs manager reviewees.</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                        <Button variant="outline" onClick={() => setForm(null)} className={appOutlineButtonClass}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!form?.category.trim() || !form?.questionText.trim() || createQuestion.isPending || updateQuestion.isPending}
                            className={appPrimaryButtonClass}
                        >
                            {createQuestion.isPending || updateQuestion.isPending ? "Saving…" : form?.id ? "Save changes" : "Create question"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Question Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Question"
                message={
                    deleteTarget
                        ? `Are you sure you want to delete "${deleteTarget.questionText.slice(0, 120)}${deleteTarget.questionText.length > 120 ? "…" : ""}"?${deleteTarget.responseCount > 0 ? " It has recorded responses, so it will be deactivated instead of removed." : " This action cannot be undone."}`
                        : ""
                }
                confirmText="Delete Question"
                cancelText="Cancel"
                isLoading={deleteQuestion.isPending}
            />
        </div>
    );
};

// ─────────────────────────────────────────────
// Question sets tab
// ─────────────────────────────────────────────

const QuestionSetsTab = () => {
    const { data: sets = [], isLoading } = useQuestionSets();
    const { data: questions = [] } = useReviewQuestions(undefined, false);
    const saveSet = useSaveQuestionSet();
    const deleteSet = useDeleteQuestionSet();
    const setMembers = useSetQuestionSetMembers();

    const [setForm, setSetForm] = useState<{ id?: string; name: string; description: string; isDefault: boolean } | null>(null);
    const [membersTarget, setMembersTarget] = useState<QuestionSetApi | null>(null);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [deleteSetTarget, setDeleteSetTarget] = useState<QuestionSetApi | null>(null);

    const questionsByType = useMemo(() => {
        const map = new Map<QuestionReviewType, AdminReviewQuestion[]>();
        for (const q of questions) {
            const list = map.get(q.reviewType) ?? [];
            list.push(q);
            map.set(q.reviewType, list);
        }
        for (const list of map.values()) list.sort((a, b) => a.displayOrder - b.displayOrder);
        return map;
    }, [questions]);

    const handleSaveSet = async () => {
        if (!setForm?.name.trim()) return;
        try {
            await saveSet.mutateAsync({
                id: setForm.id,
                name: setForm.name.trim(),
                description: setForm.description.trim() || null,
                isDefault: setForm.isDefault,
            });
            toast.success(setForm.id ? "Question set updated" : "Question set created");
            setSetForm(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save question set");
        }
    };

    const confirmDeleteSet = async () => {
        if (!deleteSetTarget) return;
        try {
            await deleteSet.mutateAsync(deleteSetTarget.id);
            toast.success("Question set deleted");
            setDeleteSetTarget(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "This set is assigned to employees — unassign it first");
        }
    };

    const handleSaveMembers = async () => {
        if (!membersTarget) return;
        try {
            await setMembers.mutateAsync({ setId: membersTarget.id, questionIds: selectedQuestionIds });
            toast.success("Question set updated. Run cycle sync to apply to active cycles.");
            setMembersTarget(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update set membership");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Employees answer their assigned set; without one they get the default set, or all active questions.
                </p>
                <Button onClick={() => setSetForm({ name: "", description: "", isDefault: false })} className={cn(appPrimaryButtonClass, "gap-1.5")}>
                    <Plus className="w-4 h-4" /> New set
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading question sets…</span>
                </div>
            ) : sets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-14 text-center">
                    <FolderKanban className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No question sets yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Group questions into named sets, then assign a set to individual employees.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sets.map((s) => (
                        <div key={s.id} className={cn(softPanelClass, "p-5")}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{s.name}</h3>
                                        {s.isDefault && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                <CheckCircle2 className="w-3 h-3" /> DEFAULT
                                            </span>
                                        )}
                                    </div>
                                    {s.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{s.description}</p>}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {s.questionCount} question{s.questionCount !== 1 ? "s" : ""} · assigned to {s.assignmentCount} employee{s.assignmentCount !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSetForm({ id: s.id, name: s.name, description: s.description ?? "", isDefault: s.isDefault })}
                                        className={cn(appOutlineButtonClass, "h-8 w-8 p-0")}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteSetTarget(s)}
                                        className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setMembersTarget(s); setSelectedQuestionIds(s.questionIds); }}
                                className={cn(appOutlineButtonClass, "mt-4 w-full gap-1.5")}
                            >
                                <ListChecks className="w-3.5 h-3.5" /> Edit questions in set
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Set Dialog */}
            <Dialog open={!!setForm} onOpenChange={(open) => { if (!open) setSetForm(null); }}>
                <DialogContent className="overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                    <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {setForm?.id ? "Edit question set" : "New question set"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Name the set, then add questions to it.
                        </DialogDescription>
                    </DialogHeader>
                    {setForm && (
                        <div className="px-6 py-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <Input placeholder="e.g. Engineering IC set" value={setForm.name} onChange={(e) => setSetForm({ ...setForm, name: e.target.value })} className="rounded-xl border-gray-200 dark:border-slate-600" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                                <Input placeholder="Who is this set for?" value={setForm.description} onChange={(e) => setSetForm({ ...setForm, description: e.target.value })} className="rounded-xl border-gray-200 dark:border-slate-600" />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={setForm.isDefault}
                                    onChange={(e) => setSetForm({ ...setForm, isDefault: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Use as the default set for employees without an assignment
                            </label>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                        <Button variant="outline" onClick={() => setSetForm(null)} className={appOutlineButtonClass}>Cancel</Button>
                        <Button onClick={handleSaveSet} disabled={!setForm?.name.trim() || saveSet.isPending} className={appPrimaryButtonClass}>
                            {saveSet.isPending ? "Saving…" : setForm?.id ? "Save changes" : "Create set"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Set Membership Dialog */}
            <Dialog open={!!membersTarget} onOpenChange={(open) => { if (!open) setMembersTarget(null); }}>
                <DialogContent className="overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95 max-w-2xl">
                    <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Questions in "{membersTarget?.name}"
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {selectedQuestionIds.length} selected · employees assigned this set only answer these questions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4 max-h-[55vh] overflow-y-auto space-y-4">
                        {[...questionsByType.entries()].map(([reviewType, list]) => (
                            <div key={reviewType}>
                                <p className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2", REVIEW_TYPE_BADGES[reviewType])}>
                                    {REVIEW_TYPE_LABELS[reviewType]}
                                </p>
                                <div className="space-y-1">
                                    {list.map((q) => (
                                        <label key={q.id} className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestionIds.includes(q.id)}
                                                onChange={(e) =>
                                                    setSelectedQuestionIds((prev) =>
                                                        e.target.checked ? [...prev, q.id] : prev.filter((id) => id !== q.id)
                                                    )
                                                }
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">{q.category}</span>
                                                <span className="block text-sm text-gray-800 dark:text-gray-200">{q.questionText}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                        <Button variant="outline" onClick={() => setMembersTarget(null)} className={appOutlineButtonClass}>Cancel</Button>
                        <Button onClick={handleSaveMembers} disabled={setMembers.isPending} className={appPrimaryButtonClass}>
                            {setMembers.isPending ? "Saving…" : "Save set"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Question Set Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteSetTarget}
                onClose={() => setDeleteSetTarget(null)}
                onConfirm={confirmDeleteSet}
                title="Delete Question Set"
                message={`Are you sure you want to delete the question set "${deleteSetTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete Set"
                cancelText="Cancel"
                isLoading={deleteSet.isPending}
            />
        </div>
    );
};

// ─────────────────────────────────────────────
// Employee assignments tab
// ─────────────────────────────────────────────

const AssignmentsTab = () => {
    const [cycleScope, setCycleScope] = useState<string>("global");
    const cycleId = cycleScope === "global" ? undefined : cycleScope;

    const { data: cycles = [] } = usePerformanceCycles();
    const { data: employees = [], isLoading: employeesLoading } = useAdminPerformanceSummary();
    const { data: sets = [] } = useQuestionSets();
    const { data: assignments = [], isLoading: assignmentsLoading } = useQuestionSetAssignments(cycleId);
    const assignSet = useAssignQuestionSet();
    const syncCycle = useSyncCycle();

    const openCycles = cycles.filter((c) => c.status !== 'closed');
    const selectedCycle = openCycles.find((c) => c.id === cycleId);

    // employee → assignment for the current scope (cycle-specific beats global when a cycle is selected;
    // global scope only shows global assignments)
    const assignmentByEmployee = useMemo(() => {
        const map = new Map<string, { setId: string; setName: string; isGlobal: boolean }>();
        for (const a of assignments) {
            const isGlobal = !a.cycle;
            if (!cycleId && !isGlobal) continue;
            const existing = map.get(a.employee.id);
            if (!existing || (existing.isGlobal && !isGlobal)) {
                map.set(a.employee.id, { setId: a.questionSet.id, setName: a.questionSet.name, isGlobal });
            }
        }
        return map;
    }, [assignments, cycleId]);

    const handleAssign = async (employeeId: string, questionSetId: string | null) => {
        try {
            await assignSet.mutateAsync({ employeeId, cycleId: cycleId ?? null, questionSetId });
            toast.success(questionSetId ? "Question set assigned" : "Assignment removed");
            if (selectedCycle?.status === 'active') {
                toast.info("This cycle is active — run sync to apply the change to existing reviews.");
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update assignment");
        }
    };

    const handleSync = async () => {
        if (!cycleId) return;
        try {
            await syncCycle.mutateAsync(cycleId);
            toast.success("Cycle synced — question changes applied");
        } catch {
            toast.error("Failed to sync cycle");
        }
    };

    const isLoading = employeesLoading || assignmentsLoading;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-[260px]">
                        <Select value={cycleScope} onValueChange={setCycleScope}>
                            <SelectTrigger className={cn(appSelectTriggerClass, "h-10 rounded-lg shadow-sm")}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={appSelectContentClass}>
                                <SelectItem value="global" className={appSelectItemClass}>All cycles (global assignment)</SelectItem>
                                {openCycles.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className={appSelectItemClass}>
                                        {c.isTest ? "🧪 " : ""}{c.name} <span className="text-gray-400">({c.status})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedCycle?.status === 'active' && (
                        <Button variant="outline" onClick={handleSync} disabled={syncCycle.isPending} className={cn(appOutlineButtonClass, "gap-1.5")}>
                            <RefreshCw className={cn("w-3.5 h-3.5", syncCycle.isPending && "animate-spin")} /> Sync cycle
                        </Button>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sets.length === 0 ? "Create a question set first to assign it to employees." : "Employees without an assignment use the default set / all questions."}
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading employees…</span>
                </div>
            ) : (
                <div className={cn(softPanelClass, "overflow-hidden")}>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {employees.map((item) => {
                            const current = assignmentByEmployee.get(item.employee.id);
                            return (
                                <div key={item.employee.id} className="flex items-center gap-4 px-5 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.employee.name}</p>
                                        <p className="text-xs text-gray-400">{item.employee.role}</p>
                                    </div>
                                    {current?.isGlobal && cycleId && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                                            from global
                                        </span>
                                    )}
                                    <div className="w-[240px]">
                                        <Select
                                            value={current ? current.setId : "none"}
                                            onValueChange={(v) => handleAssign(item.employee.id, v === "none" ? null : v)}
                                            disabled={assignSet.isPending || sets.length === 0}
                                        >
                                            <SelectTrigger className={cn(appSelectTriggerClass, "h-9 rounded-lg text-sm")}>
                                                <SelectValue placeholder="Default questions" />
                                            </SelectTrigger>
                                            <SelectContent className={appSelectContentClass}>
                                                <SelectItem value="none" className={appSelectItemClass}>Default questions</SelectItem>
                                                {sets.map((s) => (
                                                    <SelectItem key={s.id} value={s.id} className={appSelectItemClass}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceReviewQuestionsPage;
