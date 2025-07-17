import React, { useState } from "react";
import {
    ArrowLeft,
    User,
    Clock,
    MessageCircle,
    Paperclip,
    Send,
    Edit,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    Calendar,
    Tag,
    Users,
    Activity,
    Zap,
    Eye,
    Star,
    Settings,
    Copy,
    Share2
} from "lucide-react";
import { Button } from "./ui/button";

interface TicketDetailsProps {
    ticket: any;
    onBack: () => void;
    onStatusChange: (ticketId: string, newStatus: string) => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, onBack, onStatusChange }) => {
    const [newComment, setNewComment] = useState("");
    const [isWatching, setIsWatching] = useState(false);
    const [comments] = useState([
        {
            id: 1,
            author: "John Doe",
            avatar: "JD",
            content: "I'm having trouble accessing my leave balance. When I click on the leave section, it just shows a loading spinner.",
            timestamp: "2024-01-15T10:30:00Z",
            type: "customer"
        },
        {
            id: 2,
            author: "Sarah Wilson",
            avatar: "SW",
            content: "Hi John, I've received your ticket. Let me check your account settings and permissions.",
            timestamp: "2024-01-15T11:15:00Z",
            type: "agent"
        },
        {
            id: 3,
            author: "Sarah Wilson",
            avatar: "SW",
            content: "I've found the issue. Your role permissions were not properly configured. I've updated them and you should now be able to access your leave balance.",
            timestamp: "2024-01-15T14:22:00Z",
            type: "agent"
        }
    ]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Open": return {
                color: "bg-blue-500",
                bgColor: "bg-blue-50 dark:bg-blue-950",
                textColor: "text-blue-700 dark:text-blue-300",
                icon: AlertCircle
            };
            case "In Progress": return {
                color: "bg-amber-500",
                bgColor: "bg-amber-50 dark:bg-amber-950",
                textColor: "text-amber-700 dark:text-amber-300",
                icon: Activity
            };
            case "Pending": return {
                color: "bg-orange-500",
                bgColor: "bg-orange-50 dark:bg-orange-950",
                textColor: "text-orange-700 dark:text-orange-300",
                icon: Clock
            };
            case "Closed": return {
                color: "bg-emerald-500",
                bgColor: "bg-emerald-50 dark:bg-emerald-950",
                textColor: "text-emerald-700 dark:text-emerald-300",
                icon: CheckCircle2
            };
            default: return {
                color: "bg-gray-500",
                bgColor: "bg-gray-50 dark:bg-gray-950",
                textColor: "text-gray-700 dark:text-gray-300",
                icon: AlertCircle
            };
        }
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case "Urgent": return {
                color: "bg-red-500",
                bgColor: "bg-red-50 dark:bg-red-950",
                textColor: "text-red-700 dark:text-red-300",
                icon: Zap
            };
            case "High": return {
                color: "bg-orange-500",
                bgColor: "bg-orange-50 dark:bg-orange-950",
                textColor: "text-orange-700 dark:text-orange-300",
                icon: ArrowLeft
            };
            case "Medium": return {
                color: "bg-yellow-500",
                bgColor: "bg-yellow-50 dark:bg-yellow-950",
                textColor: "text-yellow-700 dark:text-yellow-300",
                icon: ArrowLeft
            };
            case "Low": return {
                color: "bg-green-500",
                bgColor: "bg-green-50 dark:bg-green-950",
                textColor: "text-green-700 dark:text-green-300",
                icon: ArrowLeft
            };
            default: return {
                color: "bg-gray-500",
                bgColor: "bg-gray-50 dark:bg-gray-950",
                textColor: "text-gray-700 dark:text-gray-300",
                icon: ArrowLeft
            };
        }
    };

    const handleStatusChange = (newStatus: string) => {
        onStatusChange(ticket.id, newStatus);
    };

    const handleSendComment = () => {
        if (newComment.trim()) {
            console.log("Sending comment:", newComment);
            setNewComment("");
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const priorityConfig = getPriorityConfig(ticket.priority);
    const StatusIcon = statusConfig.icon;
    const PriorityIcon = priorityConfig.icon;

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const getUserInitials = (author: string) => {
        const names = author.split(" ");
        if (names.length > 1) {
            return names[0][0] + names[1][0];
        } else {
            return names[0][0];
        }
    };

    const getUserGradient = (userId: string) => {
        const gradients = [
            'from-purple-500 to-pink-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-teal-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500',
            'from-pink-500 to-rose-500',
            'from-cyan-500 to-blue-500',
            'from-teal-500 to-green-500',
            'from-red-500 to-pink-500',
            'from-yellow-500 to-orange-500',
            'from-emerald-500 to-cyan-500',
            'from-violet-500 to-purple-500',
            'from-sky-500 to-blue-500',
            'from-lime-500 to-green-500',
            'from-amber-500 to-orange-500',
            'from-rose-500 to-pink-500'
        ];
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return gradients[Math.abs(hash) % gradients.length];
    };

    return (
        <>
            {/* User Header - keep existing */}
            <div className="mb-6 lg:mb-8">
                <Button
                    onClick={onBack}
                    variant="ghost"
                    className="mb-6 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Team
                </Button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    <div className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${getUserGradient(ticket.id)} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg lg:text-xl">
                            {getUserInitials(ticket.assignee)}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                            {ticket.title}
                        </h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    #{ticket.id}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-auto overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Status & Priority Bar */}
                        <div className="flex flex-wrap gap-4">
                            <div className={`inline-flex items-center px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} font-medium text-sm`}>
                                <StatusIcon className="w-4 h-4 mr-2" />
                                {ticket.status}
                                <div className={`w-2 h-2 rounded-full ${statusConfig.color} ml-2 animate-pulse`}></div>
                            </div>
                            <div className={`inline-flex items-center px-4 py-2 rounded-full ${priorityConfig.bgColor} ${priorityConfig.textColor} font-medium text-sm`}>
                                <PriorityIcon className="w-4 h-4 mr-2" />
                                {ticket.priority} Priority
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                                    <MessageCircle className="w-5 h-5 mr-3 text-blue-500" />
                                    Description
                                </h2>
                            </div>
                            <div className="px-8 py-6">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {ticket.description}
                                </p>
                            </div>
                        </div>

                        {/* Comments & Activity */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                                    <Activity className="w-5 h-5 mr-3 text-emerald-500" />
                                    Activity & Comments
                                    <span className="ml-3 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                        {comments.length}
                                    </span>
                                </h2>
                            </div>
                            <div className="p-8">
                                <div className="space-y-6">
                                    {comments.map((comment, index) => (
                                        <div key={comment.id} className="flex space-x-4">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${comment.type === 'customer'
                                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                                }`}>
                                                {comment.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {comment.author}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${comment.type === 'customer'
                                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                        : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                                        }`}>
                                                        {comment.type}
                                                    </span>
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                                        {formatTimeAgo(comment.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Comment */}
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="space-y-4">
                                        <textarea
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="w-full min-h-[120px] p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100 resize-none transition-all duration-200"
                                        />
                                        <div className="flex items-center justify-between">
                                            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                                                <Paperclip className="w-4 h-4 mr-2" />
                                                Attach File
                                            </button>
                                            <button
                                                onClick={handleSendComment}
                                                disabled={!newComment.trim()}
                                                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <button className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Resolved
                                </button>
                                <button className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Ticket
                                </button>
                                <button className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Escalate
                                </button>
                            </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                                    Ticket Details
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        Status
                                    </label>
                                    <div className="mt-2">
                                        <select
                                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200"
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                        >
                                            <option value="Open">Open</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Queue
                                        </label>
                                        <p className="mt-2 text-slate-900 dark:text-slate-100 font-medium">
                                            {ticket.queue}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Reporter
                                        </label>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                {ticket.reporter}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Assignee
                                        </label>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                {ticket.assignee}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Created
                                        </label>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300 text-sm">
                                                {new Date(ticket.created).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Last Updated
                                        </label>
                                        <div className="mt-2 flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300 text-sm">
                                                {formatTimeAgo(ticket.updated)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SLA Information */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                            SLA Status
                                        </h3>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                            On track
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-emerald-700 dark:text-emerald-300">Response time</span>
                                        <span className="font-medium text-emerald-900 dark:text-emerald-100">2h 15m</span>
                                    </div>
                                    <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2">
                                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TicketDetails;