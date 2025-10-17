import { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    Filter,
    FolderKanban,
    LayoutGrid,
    List,
    MoreHorizontal,
    Plus,
    Search,
    Tag,
    User,
    X,
} from "lucide-react";

// Type definitions
interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: "ongoing" | "completed" | "on-hold";
    progress: number;
    teamMembers: User[];
    tasks: Task[];
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    assignee: User | null;
    dueDate: string;
    createdAt: string;
    tags: string[];
    subtasks?: Subtask[];
}

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

interface User {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email: string;
}

// Sample Data
const sampleUsers: User[] = [
    {
        id: "u1",
        name: "Sarah Johnson",
        avatar: "https://picsum.photos/100/300",
        role: "Project Manager",
        email: "sarah@disraptor.co.za",
    },
    {
        id: "u2",
        name: "James Wilson",
        avatar: "https://picsum.photos/200/300",
        role: "Frontend Developer",
        email: "james@disraptor.co.za",
    },
    {
        id: "u3",
        name: "Lisa Chen",
        avatar: "https://picsum.photos/300/300",
        role: "Backend Developer",
        email: "lisa@disraptor.co.za",
    },
    {
        id: "u4",
        name: "Michael Brown",
        avatar: "https://picsum.photos/400/300",
        role: "UX Designer",
        email: "michael@disraptor.co.za",
    },
    {
        id: "u5",
        name: "Emma Davis",
        avatar: "https://picsum.photos/500/300",
        role: "QA Engineer",
        email: "emma@disraptor.co.za",
    },
];

const sampleProjects: Project[] = [
    {
        id: "p1",
        name: "Website Redesign",
        description: "Complete overhaul of the company website with new branding and improved UX",
        startDate: "2025-06-01",
        endDate: "2025-08-15",
        status: "ongoing",
        progress: 65,
        teamMembers: [sampleUsers[0], sampleUsers[1], sampleUsers[3]],
        tasks: [
            {
                id: "t1",
                title: "Design new homepage",
                description: "Create wireframes and high-fidelity designs for the new homepage",
                status: "done",
                priority: "high",
                assignee: sampleUsers[3],
                dueDate: "2025-06-15",
                createdAt: "2025-06-02",
                tags: ["design", "homepage"],
            },
            {
                id: "t2",
                title: "Implement responsive navigation",
                description: "Code the new responsive navigation menu for all device sizes",
                status: "done",
                priority: "high",
                assignee: sampleUsers[1],
                dueDate: "2025-06-25",
                createdAt: "2025-06-16",
                tags: ["frontend", "responsive"],
            },
            {
                id: "t3",
                title: "Create new product showcase section",
                description: "Design and implement the dynamic product showcase section",
                status: "in-progress",
                priority: "medium",
                assignee: sampleUsers[1],
                dueDate: "2025-07-10",
                createdAt: "2025-06-20",
                tags: ["frontend", "design"],
                subtasks: [
                    { id: "st1", title: "Design product cards", completed: true },
                    { id: "st2", title: "Implement product filtering", completed: false },
                    { id: "st3", title: "Add animation effects", completed: false },
                ],
            },
            {
                id: "t4",
                title: "QA Testing for completed sections",
                description: "Perform comprehensive testing on the completed website sections",
                status: "todo",
                priority: "medium",
                assignee: sampleUsers[4],
                dueDate: "2025-07-20",
                createdAt: "2025-06-30",
                tags: ["testing", "qa"],
            },
            {
                id: "t5",
                title: "SEO Optimization",
                description: "Implement SEO best practices across the website",
                status: "todo",
                priority: "low",
                assignee: null,
                dueDate: "2025-08-01",
                createdAt: "2025-07-01",
                tags: ["seo", "marketing"],
            },
        ],
    },
    {
        id: "p2",
        name: "Mobile App Development",
        description: "Create a companion mobile app for our main service with core functionalities",
        startDate: "2025-07-01",
        endDate: "2025-10-30",
        status: "ongoing",
        progress: 25,
        teamMembers: [sampleUsers[0], sampleUsers[2], sampleUsers[1], sampleUsers[4]],
        tasks: [
            {
                id: "t6",
                title: "App architecture planning",
                description: "Define the architecture and technical stack for the mobile app",
                status: "done",
                priority: "high",
                assignee: sampleUsers[2],
                dueDate: "2025-07-15",
                createdAt: "2025-07-02",
                tags: ["planning", "architecture"],
            },
            {
                id: "t7",
                title: "Design user flows and wireframes",
                description: "Create user flows and wireframes for core app functionality",
                status: "in-progress",
                priority: "high",
                assignee: sampleUsers[3],
                dueDate: "2025-07-25",
                createdAt: "2025-07-10",
                tags: ["design", "ux"],
            },
            {
                id: "t8",
                title: "Implement user authentication",
                description: "Build secure user authentication and account management system",
                status: "todo",
                priority: "high",
                assignee: sampleUsers[2],
                dueDate: "2025-08-10",
                createdAt: "2025-07-20",
                tags: ["backend", "security"],
            },
        ],
    },
    {
        id: "p3",
        name: "CRM Integration",
        description: "Integrate our system with Salesforce CRM for improved customer management",
        startDate: "2025-05-15",
        endDate: "2025-07-01",
        status: "completed",
        progress: 100,
        teamMembers: [sampleUsers[0], sampleUsers[2], sampleUsers[4]],
        tasks: [
            {
                id: "t9",
                title: "API Integration Planning",
                description: "Plan the integration between our system and Salesforce API",
                status: "done",
                priority: "high",
                assignee: sampleUsers[2],
                dueDate: "2025-05-25",
                createdAt: "2025-05-16",
                tags: ["planning", "api"],
            },
            {
                id: "t10",
                title: "Implement data sync",
                description: "Build bi-directional data synchronization between systems",
                status: "done",
                priority: "high",
                assignee: sampleUsers[2],
                dueDate: "2025-06-15",
                createdAt: "2025-05-26",
                tags: ["backend", "data"],
            },
            {
                id: "t11",
                title: "Testing and QA",
                description: "Comprehensive testing of the CRM integration",
                status: "done",
                priority: "medium",
                assignee: sampleUsers[4],
                dueDate: "2025-06-25",
                createdAt: "2025-06-10",
                tags: ["testing", "qa"],
            },
        ],
    },
];

// Component
const ProjectManagement = () => {
    const [projects, setProjects] = useState<Project[]>(sampleProjects);
    const [selectedProject, setSelectedProject] = useState<Project | null>(sampleProjects[0]);
    const [view, setView] = useState<"grid" | "list">("grid");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignee: null,
        dueDate: "",
        tags: [],
        subtasks: [],
    });
    const [taskTagInput, setTaskTagInput] = useState("");

    // Calculate project statistics
    const calculateProjectStats = (project: Project) => {
        const totalTasks = project.tasks.length;

        if (totalTasks === 0) return {
            todoCount: 0,
            inProgressCount: 0,
            reviewCount: 0,
            doneCount: 0,
            todoPercentage: 0,
            inProgressPercentage: 0,
            reviewPercentage: 0,
            donePercentage: 0,
        };

        const todoCount = project.tasks.filter(task => task.status === "todo").length;
        const inProgressCount = project.tasks.filter(task => task.status === "in-progress").length;
        const reviewCount = project.tasks.filter(task => task.status === "review").length;
        const doneCount = project.tasks.filter(task => task.status === "done").length;

        return {
            todoCount,
            inProgressCount,
            reviewCount,
            doneCount,
            todoPercentage: (todoCount / totalTasks) * 100,
            inProgressPercentage: (inProgressCount / totalTasks) * 100,
            reviewPercentage: (reviewCount / totalTasks) * 100,
            donePercentage: (doneCount / totalTasks) * 100,
        };
    };

    // Filter tasks based on search and filter
    const getFilteredTasks = () => {
        if (!selectedProject) return [];

        return selectedProject.tasks.filter(task => {
            // Apply status filter
            if (filterStatus && task.status !== filterStatus) return false;

            // Apply search query
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

            return true;
        });
    };

    // Add new task
    const handleAddTask = () => {
        if (!selectedProject || !newTask.title) return;

        const task: Task = {
            id: `t${Date.now()}`,
            title: newTask.title,
            description: newTask.description || "",
            status: newTask.status || "todo",
            priority: newTask.priority || "medium",
            assignee: newTask.assignee || null,
            dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            tags: newTask.tags || [],
            subtasks: newTask.subtasks as Subtask[] || [],
        };

        // Update the selected project
        const updatedProject = {
            ...selectedProject,
            tasks: [...selectedProject.tasks, task],
        };

        // Update projects array
        const updatedProjects = projects.map(p =>
            p.id === selectedProject.id ? updatedProject : p
        );

        setProjects(updatedProjects);
        setSelectedProject(updatedProject);
        setShowTaskModal(false);
        setNewTask({
            title: "",
            description: "",
            status: "todo",
            priority: "medium",
            assignee: null,
            dueDate: "",
            tags: [],
            subtasks: [],
        });
    };

    // Add tag to new task
    const handleAddTag = () => {
        if (!taskTagInput.trim()) return;

        setNewTask({
            ...newTask,
            tags: [...(newTask.tags || []), taskTagInput.trim()],
        });

        setTaskTagInput("");
    };

    // Remove tag from new task
    const handleRemoveTag = (tagToRemove: string) => {
        setNewTask({
            ...newTask,
            tags: (newTask.tags || []).filter(tag => tag !== tagToRemove),
        });
    };

    // Add subtask to new task
    const handleAddSubtask = () => {
        const subtaskInput = document.getElementById("subtask-input") as HTMLInputElement;
        if (!subtaskInput || !subtaskInput.value.trim()) return;

        const newSubtask: Subtask = {
            id: `st${Date.now()}`,
            title: subtaskInput.value.trim(),
            completed: false,
        };

        setNewTask({
            ...newTask,
            subtasks: [...(newTask.subtasks || []), newSubtask],
        });

        subtaskInput.value = "";
    };

    // Remove subtask from new task
    const handleRemoveSubtask = (subtaskId: string) => {
        setNewTask({
            ...newTask,
            subtasks: (newTask.subtasks || []).filter(subtask => subtask.id !== subtaskId),
        });
    };

    // Calculate project progress
    useEffect(() => {
        if (selectedProject) {
            const totalTasks = selectedProject.tasks.length;
            if (totalTasks === 0) return;

            const completedTasks = selectedProject.tasks.filter(task => task.status === "done").length;
            const progress = Math.round((completedTasks / totalTasks) * 100);

            // Only update if progress has changed
            if (progress !== selectedProject.progress) {
                const updatedProject = { ...selectedProject, progress };
                const updatedProjects = projects.map(p =>
                    p.id === selectedProject.id ? updatedProject : p
                );

                setProjects(updatedProjects);
                setSelectedProject(updatedProject);
            }
        }
    }, [selectedProject?.tasks]);

    // Get stats for selected project
    const stats = selectedProject ? calculateProjectStats(selectedProject) : null;

    // Get filtered tasks
    const filteredTasks = getFilteredTasks();

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your projects, assign tasks, and track progress
                    </p>
                </header>

                {/* Project Selection */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                        <div className="flex-1">
                            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Project
                            </label>
                            <select
                                id="project-select"
                                value={selectedProject?.id || ""}
                                onChange={(e) => {
                                    const selected = projects.find(p => p.id === e.target.value);
                                    setSelectedProject(selected || null);
                                }}
                                className="block w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name} ({project.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg"
                                onClick={() => setView("grid")}
                            >
                                <LayoutGrid className={`w-5 h-5 ${view === 'grid' ? 'text-blue-500' : ''}`} />
                            </button>
                            <button
                                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg"
                                onClick={() => setView("list")}
                            >
                                <List className={`w-5 h-5 ${view === 'list' ? 'text-blue-500' : ''}`} />
                            </button>
                            <button
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setShowTaskModal(true)}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Task
                            </button>
                        </div>
                    </div>
                </div>

                {selectedProject && (
                    <>
                        {/* Project Details */}
                        <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedProject.description}</p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedProject.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        selectedProject.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Timeline</div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progress</div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 mb-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${selectedProject.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {selectedProject.progress}% Complete
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Members</div>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {selectedProject.teamMembers.map((member) => (
                                            <img
                                                key={member.id}
                                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-700"
                                                src={member.avatar}
                                                alt={member.name}
                                                title={member.name}
                                            />
                                        ))}
                                        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-medium">
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tasks Status</div>
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-xs text-gray-700 dark:text-gray-300">{stats?.todoCount || 0} Todo</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-xs text-gray-700 dark:text-gray-300">{stats?.inProgressCount || 0} In Progress</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span className="text-xs text-gray-700 dark:text-gray-300">{stats?.reviewCount || 0} Review</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-gray-700 dark:text-gray-300">{stats?.doneCount || 0} Done</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Task Management */}
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
                                        Tasks ({filteredTasks.length})
                                    </h3>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search tasks..."
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        <div className="relative inline-block">
                                            <select
                                                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={filterStatus || ""}
                                                onChange={(e) => setFilterStatus(e.target.value || null)}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="todo">To Do</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <Filter className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks Display */}
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tasks found</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {searchQuery || filterStatus
                                                ? "Try changing your search or filter criteria."
                                                : "Get started by creating a new task."}
                                        </p>
                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                onClick={() => setShowTaskModal(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-1" /> New Task
                                            </button>
                                        </div>
                                    </div>
                                ) : view === "grid" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                }`}
                                                        >
                                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                        </span>
                                                        <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{task.title}</h4>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{task.description}</p>

                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                <span>Subtasks</span>
                                                                <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-blue-600 h-1.5 rounded-full"
                                                                    style={{ width: `${task.subtasks.filter(st => st.completed).length / task.subtasks.length * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {task.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-gray-200"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center">
                                                            {task.assignee ? (
                                                                <div className="flex items-center">
                                                                    <img
                                                                        src={task.assignee.avatar}
                                                                        alt={task.assignee.name}
                                                                        className="w-6 h-6 rounded-full mr-2"
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">{task.assignee.name}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                                                    <User className="w-4 h-4 mr-1" />
                                                                    <span className="text-xs">Unassigned</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`h-1.5 w-full ${task.status === 'done' ? 'bg-green-500' :
                                                    task.status === 'review' ? 'bg-blue-500' :
                                                        task.status === 'in-progress' ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                    }`}></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                            <thead className="bg-gray-50 dark:bg-slate-800">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Task
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Assignee
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Due Date
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Priority
                                                    </th>
                                                    <th scope="col" className="relative px-6 py-3">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-slate-600">
                                                {filteredTasks.map((task) => (
                                                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {task.title}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                                        {task.description}
                                                                    </div>
                                                                    {task.tags.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {task.tags.map((tag, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-200"
                                                                                >
                                                                                    {tag}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                task.status === 'review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                }`}>
                                                                {task.status === 'todo' ? 'To Do' :
                                                                    task.status === 'in-progress' ? 'In Progress' :
                                                                        task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {task.assignee ? (
                                                                <div className="flex items-center">
                                                                    <img
                                                                        src={task.assignee.avatar}
                                                                        alt={task.assignee.name}
                                                                        className="w-6 h-6 rounded-full mr-2"
                                                                    />
                                                                    <span className="text-sm text-gray-900 dark:text-white">{task.assignee.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                }`}>
                                                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">
                                                                Edit
                                                            </button>
                                                            <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:pl-72">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Task</h3>
                            <button
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                                onClick={() => setShowTaskModal(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Task Title *
                                        </label>
                                        <input
                                            type="text"
                                            id="task-title"
                                            placeholder="Enter task title"
                                            className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="task-description"
                                            placeholder="Enter task description"
                                            rows={3}
                                            className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                id="task-status"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                value={newTask.status}
                                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Priority
                                            </label>
                                            <select
                                                id="task-priority"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Assignee
                                            </label>
                                            <select
                                                id="task-assignee"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                value={newTask.assignee?.id || ""}
                                                onChange={(e) => {
                                                    const selectedUser = e.target.value
                                                        ? selectedProject?.teamMembers.find(user => user.id === e.target.value) || null
                                                        : null;
                                                    setNewTask({ ...newTask, assignee: selectedUser });
                                                }}
                                            >
                                                <option value="">Unassigned</option>
                                                {selectedProject?.teamMembers.map(user => (
                                                    <option key={user.id} value={user.id}>{user.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                id="task-due-date"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-lg py-2 px-3 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                value={newTask.dueDate}
                                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tags
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(newTask.tags || []).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                                                        onClick={() => handleRemoveTag(tag)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                placeholder="Add a tag"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-l-lg py-2 px-3 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                value={taskTagInput}
                                                onChange={(e) => setTaskTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && taskTagInput.trim()) {
                                                        e.preventDefault();
                                                        handleAddTag();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                onClick={handleAddTag}
                                            >
                                                <Tag className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Subtasks
                                        </label>
                                        <div className="space-y-2 mb-2">
                                            {(newTask.subtasks || []).map((subtask) => (
                                                <div
                                                    key={subtask.id}
                                                    className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                                                >
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{subtask.title}</span>
                                                    <button
                                                        type="button"
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                        onClick={() => handleRemoveSubtask(subtask.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                id="subtask-input"
                                                placeholder="Add a subtask"
                                                className="block w-full border border-gray-300 dark:border-slate-600 rounded-l-lg py-2 px-3 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddSubtask();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-r-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                onClick={handleAddSubtask}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={() => setShowTaskModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectManagement;