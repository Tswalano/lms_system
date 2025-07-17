/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
    Mail,
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    MessageCircle,
    Plus,
    Filter,
    Search,
    TrendingUp,
    Users,
    Calendar,
    Settings,
    Bell,
    BarChart3,
    Activity,
    Zap,
    Target,
    ArrowUpRight,
    ChevronRight,
    Star,
    Eye,
    MoreHorizontal,
    RefreshCw,
    Download,
    SortDesc
} from "lucide-react";

const TicketingService = () => {
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const [tickets, setTickets] = useState([
        {
            id: "T-001",
            title: "Unable to access leave balance",
            description: "I cannot see my leave balance in the system. When I click on the leave section, it just shows a loading spinner and never loads the actual balance information.",
            status: "Open",
            priority: "High",
            queue: "Support",
            reporter: "john.doe@company.com",
            reporterName: "John Doe",
            assignee: "Sarah Wilson",
            created: "2024-01-15T10:30:00Z",
            updated: "2024-01-15T14:22:00Z",
            comments: 3,
            avatar: "JD"
        },
        {
            id: "T-002",
            title: "Billing inquiry for premium features",
            description: "I need clarification on the premium subscription charges that appeared on my account. The invoice shows additional charges that I don't understand.",
            status: "In Progress",
            priority: "Medium",
            queue: "Billing",
            reporter: "jane.smith@company.com",
            reporterName: "Jane Smith",
            assignee: "Mike Johnson",
            created: "2024-01-14T09:15:00Z",
            updated: "2024-01-15T11:45:00Z",
            comments: 7,
            avatar: "JS"
        },
        {
            id: "T-003",
            title: "Password reset not working",
            description: "I'm trying to reset my password but I'm not receiving the password reset email. I've checked my spam folder and it's not there either.",
            status: "Pending",
            priority: "Urgent",
            queue: "Technical",
            reporter: "bob.wilson@company.com",
            reporterName: "Bob Wilson",
            assignee: "Alex Chen",
            created: "2024-01-13T16:20:00Z",
            updated: "2024-01-14T12:10:00Z",
            comments: 2,
            avatar: "BW"
        },
        {
            id: "T-004",
            title: "Feature request: Dark mode",
            description: "It would be great to have a dark mode option in the application for better user experience during night work.",
            status: "Open",
            priority: "Low",
            queue: "Support",
            reporter: "alice.brown@company.com",
            reporterName: "Alice Brown",
            assignee: "Emma Davis",
            created: "2024-01-12T14:30:00Z",
            updated: "2024-01-13T09:15:00Z",
            comments: 1,
            avatar: "AB"
        },
        {
            id: "T-005",
            title: "Report generation fails",
            description: "When I try to generate monthly reports, the system throws an error and doesn't complete the process.",
            status: "In Progress",
            priority: "High",
            queue: "Technical",
            reporter: "charlie.davis@company.com",
            reporterName: "Charlie Davis",
            assignee: "Alex Chen",
            created: "2024-01-11T11:20:00Z",
            updated: "2024-01-15T16:30:00Z",
            comments: 5,
            avatar: "CD"
        }
    ]);

    const [queues] = useState([
        {
            name: "Support",
            email: "support@company.com",
            color: "blue",
            description: "General customer support and inquiries",
            agents: 4,
            avgResponseTime: "2.5h"
        },
        {
            name: "Billing",
            email: "billing@company.com",
            color: "emerald",
            description: "Payment and subscription related issues",
            agents: 2,
            avgResponseTime: "1.8h"
        },
        {
            name: "Technical",
            email: "tech@company.com",
            color: "purple",
            description: "Technical issues and bug reports",
            agents: 3,
            avgResponseTime: "3.2h"
        }
    ]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Open": return {
                color: "blue",
                bgColor: "bg-blue-50 dark:bg-blue-950",
                textColor: "text-blue-700 dark:text-blue-300",
                dotColor: "bg-blue-500"
            };
            case "In Progress": return {
                color: "amber",
                bgColor: "bg-amber-50 dark:bg-amber-950",
                textColor: "text-amber-700 dark:text-amber-300",
                dotColor: "bg-amber-500"
            };
            case "Pending": return {
                color: "orange",
                bgColor: "bg-orange-50 dark:bg-orange-950",
                textColor: "text-orange-700 dark:text-orange-300",
                dotColor: "bg-orange-500"
            };
            case "Closed": return {
                color: "emerald",
                bgColor: "bg-emerald-50 dark:bg-emerald-950",
                textColor: "text-emerald-700 dark:text-emerald-300",
                dotColor: "bg-emerald-500"
            };
            default: return {
                color: "gray",
                bgColor: "bg-gray-50 dark:bg-gray-950",
                textColor: "text-gray-700 dark:text-gray-300",
                dotColor: "bg-gray-500"
            };
        }
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case "Urgent": return {
                color: "red",
                bgColor: "bg-red-50 dark:bg-red-950",
                textColor: "text-red-700 dark:text-red-300",
                icon: Zap
            };
            case "High": return {
                color: "orange",
                bgColor: "bg-orange-50 dark:bg-orange-950",
                textColor: "text-orange-700 dark:text-orange-300",
                icon: ArrowUpRight
            };
            case "Medium": return {
                color: "yellow",
                bgColor: "bg-yellow-50 dark:bg-yellow-950",
                textColor: "text-yellow-700 dark:text-yellow-300",
                icon: Target
            };
            case "Low": return {
                color: "green",
                bgColor: "bg-green-50 dark:bg-green-950",
                textColor: "text-green-700 dark:text-green-300",
                icon: Target
            };
            default: return {
                color: "gray",
                bgColor: "bg-gray-50 dark:bg-gray-950",
                textColor: "text-gray-700 dark:text-gray-300",
                icon: Target
            };
        }
    };

    const getQueueConfig = (queueName: string) => {
        const queue = queues.find(q => q.name === queueName);
        return queue ? queue.color : "gray";
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const getTicketStats = () => {
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'Open').length,
            inProgress: tickets.filter(t => t.status === 'In Progress').length,
            pending: tickets.filter(t => t.status === 'Pending').length,
            closed: tickets.filter(t => t.status === 'Closed').length,
            urgent: tickets.filter(t => t.priority === 'Urgent').length
        };
    };

    const stats = getTicketStats();

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.reporter.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesPriority = priorityFilter === "all" || ticket.priority.toLowerCase() === priorityFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
                    {change && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {change}% from last week
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                </div>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon: Icon, isActive, onClick }: any) => (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Navigation */}
            <div className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
                <TabButton
                    id="dashboard"
                    label="Dashboard"
                    icon={BarChart3}
                    isActive={activeTab === "dashboard"}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="tickets"
                    label="All Tickets"
                    icon={Mail}
                    isActive={activeTab === "tickets"}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="queues"
                    label="Queues"
                    icon={Users}
                    isActive={activeTab === "queues"}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="analytics"
                    label="Analytics"
                    icon={TrendingUp}
                    isActive={activeTab === "analytics"}
                    onClick={setActiveTab}
                />
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={Mail}
                            title="Total Tickets"
                            value={stats.total}
                            change={12}
                            color="blue"
                        />
                        <StatCard
                            icon={AlertCircle}
                            title="Open"
                            value={stats.open}
                            change={-8}
                            color="red"
                        />
                        <StatCard
                            icon={Clock}
                            title="In Progress"
                            value={stats.inProgress}
                            change={5}
                            color="amber"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            title="Resolved Today"
                            value="12"
                            change={25}
                            color="emerald"
                        />
                    </div>

                    {/* Recent Activity & Queue Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Tickets */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Recent Tickets
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab("tickets")}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                                    >
                                        View all
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {tickets.slice(0, 4).map((ticket) => {
                                        const statusConfig = getStatusConfig(ticket.status);
                                        // const priorityConfig = getPriorityConfig(ticket.priority);
                                        return (
                                            <div key={ticket.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300`}>
                                                    {ticket.avatar}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                                            {ticket.title}
                                                        </p>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {ticket.reporterName} • {formatTimeAgo(ticket.created)}
                                                    </p>
                                                </div>
                                                <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Queue Performance */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Queue Performance
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {queues.map((queue) => {
                                        const queueTickets = tickets.filter(t => t.queue === queue.name);
                                        const activeTickets = queueTickets.filter(t => t.status !== 'Closed');
                                        return (
                                            <div key={queue.name} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-3 h-3 rounded-full bg-${queue.color}-500`}></div>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                                            {queue.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                        {activeTickets.length}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                        <span>Response time</span>
                                                        <span>{queue.avgResponseTime}</span>
                                                    </div>
                                                    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2`}>
                                                        <div className={`bg-${queue.color}-500 h-2 rounded-full`} style={{ width: '75%' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tickets Tab */}
            {activeTab === "tickets" && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="pending">Pending</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <select
                                    className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="all">All Priority</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                <button className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 flex items-center">
                                    <SortDesc className="w-4 h-4 mr-2" />
                                    Sort
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tickets List */}
                    <div className="space-y-4">
                        {filteredTickets.map((ticket) => {
                            const statusConfig = getStatusConfig(ticket.status);
                            const priorityConfig = getPriorityConfig(ticket.priority);
                            const queueColor = getQueueConfig(ticket.queue);
                            const PriorityIcon = priorityConfig.icon;

                            return (
                                <div
                                    key={ticket.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer group"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="font-mono text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    {ticket.id}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} mr-1.5`}></div>
                                                    {ticket.status}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${priorityConfig.bgColor} ${priorityConfig.textColor}`}>
                                                    <PriorityIcon className="w-3 h-3 mr-1" />
                                                    {ticket.priority}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${queueColor}-100 dark:bg-${queueColor}-900 text-${queueColor}-700 dark:text-${queueColor}-300`}>
                                                    {ticket.queue}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {ticket.title}
                                            </h3>

                                            <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                                {ticket.description}
                                            </p>

                                            <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300`}>
                                                        {ticket.avatar}
                                                    </div>
                                                    <span>{ticket.reporterName}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatTimeAgo(ticket.created)}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>{ticket.comments} comments</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                            <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned to</div>
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    {ticket.assignee}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredTickets.length === 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                                <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                                    No tickets found
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Try adjusting your search criteria or filters
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Queues Tab */}
            {activeTab === "queues" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Support Queues
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Manage ticket routing and team assignments
                            </p>
                        </div>
                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Queue
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {queues.map((queue) => {
                            const queueTickets = tickets.filter(t => t.queue === queue.name);
                            const activeTickets = queueTickets.filter(t => t.status !== 'Closed');
                            const urgentTickets = queueTickets.filter(t => t.priority === 'Urgent');

                            return (
                                <div
                                    key={queue.name}
                                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200"
                                >
                                    <div className={`h-2 bg-gradient-to-r from-${queue.color}-500 to-${queue.color}-600`}></div>

                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-12 h-12 rounded-xl bg-${queue.color}-100 dark:bg-${queue.color}-900 flex items-center justify-center`}>
                                                    <Mail className={`w-6 h-6 text-${queue.color}-600 dark:text-${queue.color}-400`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                        {queue.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {queue.agents} agents
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                                            {queue.description}
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Email Address
                                                </span>
                                                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                                                    {queue.email}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                        {activeTickets.length}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        Active
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                                        {urgentTickets.length}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        Urgent
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                        {queue.avgResponseTime}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        Avg Response
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Performance</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">94%</span>
                                                </div>
                                                <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2`}>
                                                    <div className={`bg-${queue.color}-500 h-2 rounded-full transition-all duration-500`} style={{ width: '94%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Email Integration Status */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                                        Email Integration
                                    </h3>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                        All systems operational
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    Live
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-white/50 dark:bg-emerald-800/20 rounded-xl">
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    47
                                </div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Emails today
                                </div>
                            </div>
                            <div className="text-center p-4 bg-white/50 dark:bg-emerald-800/20 rounded-xl">
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    98.5%
                                </div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Success rate
                                </div>
                            </div>
                            <div className="text-center p-4 bg-white/50 dark:bg-emerald-800/20 rounded-xl">
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    2.1s
                                </div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Avg processing
                                </div>
                            </div>
                            <div className="text-center p-4 bg-white/50 dark:bg-emerald-800/20 rounded-xl">
                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                    5min
                                </div>
                                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Poll interval
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Analytics & Reports
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Performance insights and ticket metrics
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tickets</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                                        {stats.total}
                                    </p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        +12% from last month
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
                                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Resolution Rate</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">94.2%</p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        +2.1% from last month
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response Time</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">2.4h</p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                                        -8min from last month
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900">
                                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Customer Satisfaction</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">4.8</p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                                        <Star className="w-4 h-4 mr-1" />
                                        +0.2 from last month
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900">
                                    <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                Ticket Volume Trend
                            </h3>
                            <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                                    <p className="text-slate-600 dark:text-slate-400">Chart visualization would go here</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                                Queue Performance
                            </h3>
                            <div className="h-64 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <Activity className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-slate-600 dark:text-slate-400">Performance metrics would go here</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketingService;