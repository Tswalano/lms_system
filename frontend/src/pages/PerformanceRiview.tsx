import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Send, User, Users, Award, Loader2, FileText, CheckCircle } from "lucide-react";

interface TeamMember {
    id: number;
    name: string;
    role: string;
    avatar: string;
}

interface Question {
    id: string;
    type: 'self' | 'peer' | 'nomination';
    question: string;
    category: string;
}

interface Response {
    questionId: string;
    answer: string | number | { memberId: number; reason: string };
}

type Phase = 'self' | 'peer' | 'nomination' | 'complete';

const PerformanceReview = () => {
    const [currentPhase, setCurrentPhase] = useState<Phase>('self');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Response[]>([]);
    const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string | number | { memberId: number; reason: string }>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dummy data for team members
    const teamMembers: TeamMember[] = [
        { id: 1, name: "John Smith", role: "Senior DevOps Engineer", avatar: "JS" },
        { id: 2, name: "Sarah Johnson", role: "Cloud Architect", avatar: "SJ" },
        { id: 3, name: "Mike Chen", role: "Platform Engineer", avatar: "MC" },
        { id: 4, name: "Emily Davis", role: "Site Reliability Engineer", avatar: "ED" },
        { id: 5, name: "Alex Rodriguez", role: "Infrastructure Engineer", avatar: "AR" },
        { id: 6, name: "Lisa Thompson", role: "DevOps Lead", avatar: "LT" },
        { id: 7, name: "Glen Mitchell", role: "AWS Solutions Architect", avatar: "GM" },
        { id: 8, name: "Rachel Park", role: "Security Engineer", avatar: "RP" },
    ];

    // Enhanced DevOps-focused question bank with 30 questions each for self and peer
    const questionBank = {
        self: [
            { id: 'self-1', type: 'self' as const, category: 'DevOps Technical Skills', question: "What was your most impactful DevOps automation or infrastructure contribution this period?" },
            { id: 'self-2', type: 'self' as const, category: 'DevOps Leadership', question: "Describe a DevOps project where you led the implementation or migration." },
            { id: 'self-3', type: 'self' as const, category: 'Cloud Expertise', question: "How would you rate your proficiency in AWS services? Provide specific examples of services you've implemented." },
            { id: 'self-4', type: 'self' as const, category: 'Infrastructure as Code', question: "Describe your experience with Terraform, CloudFormation, or other IaC tools. What complex infrastructure have you automated?" },
            { id: 'self-5', type: 'self' as const, category: 'CI/CD Pipeline Design', question: "What CI/CD pipelines have you designed or improved? What tools and best practices did you implement?" },
            { id: 'self-6', type: 'self' as const, category: 'Containerization', question: "Describe your experience with Docker and Kubernetes. What container orchestration challenges have you solved?" },
            { id: 'self-7', type: 'self' as const, category: 'Monitoring & Observability', question: "How do you implement monitoring, logging, and alerting? What tools do you use and why?" },
            { id: 'self-8', type: 'self' as const, category: 'Security & Compliance', question: "How do you integrate security into DevOps processes? Describe your DevSecOps practices." },
            { id: 'self-9', type: 'self' as const, category: 'Incident Management', question: "Describe how you handle production incidents. What's your approach to post-mortems and improvement?" },
            { id: 'self-10', type: 'self' as const, category: 'Automation & Scripting', question: "What automation scripts or tools have you built to improve team efficiency?" },
            { id: 'self-11', type: 'self' as const, category: 'Configuration Management', question: "How do you manage configuration across different environments? What tools and strategies do you use?" },
            { id: 'self-12', type: 'self' as const, category: 'Cloud Cost Optimization', question: "What specific steps have you taken to optimize AWS costs and resource utilization?" },
            { id: 'self-13', type: 'self' as const, category: 'Database & Storage', question: "Describe your experience with cloud databases (RDS, DynamoDB) and storage solutions. How do you ensure reliability?" },
            { id: 'self-14', type: 'self' as const, category: 'Networking & Security', question: "How do you design and implement secure network architectures in the cloud (VPCs, security groups, etc.)?" },
            { id: 'self-15', type: 'self' as const, category: 'DevOps Culture', question: "How do you promote DevOps culture and collaboration between development and operations teams?" },
            { id: 'self-16', type: 'self' as const, category: 'Performance Optimization', question: "What performance bottlenecks have you identified and resolved in production systems?" },
            { id: 'self-17', type: 'self' as const, category: 'Disaster Recovery', question: "How do you design and test disaster recovery solutions? Describe your backup and recovery strategies." },
            { id: 'self-18', type: 'self' as const, category: 'Microservices Architecture', question: "What's your experience with microservices deployment and management? How do you handle service discovery and communication?" },
            { id: 'self-19', type: 'self' as const, category: 'Version Control & GitOps', question: "How do you implement GitOps practices? Describe your branching strategies and code review processes." },
            { id: 'self-20', type: 'self' as const, category: 'Load Balancing & Scaling', question: "How do you implement auto-scaling and load balancing? What challenges have you faced with high-traffic applications?" },
            { id: 'self-21', type: 'self' as const, category: 'API Management', question: "Describe your experience with API gateways, rate limiting, and API versioning strategies." },
            { id: 'self-22', type: 'self' as const, category: 'DevOps Metrics', question: "What DevOps metrics do you track (MTTR, deployment frequency, etc.)? How do you use them to drive improvements?" },
            { id: 'self-23', type: 'self' as const, category: 'Cloud Migration', question: "What cloud migration projects have you been involved in? What challenges did you overcome?" },
            { id: 'self-24', type: 'self' as const, category: 'Testing & Quality', question: "How do you integrate automated testing into CI/CD pipelines? What testing strategies do you implement?" },
            { id: 'self-25', type: 'self' as const, category: 'Documentation & Knowledge Sharing', question: "How do you document infrastructure and processes? How do you share DevOps knowledge with the team?" },
            { id: 'self-26', type: 'self' as const, category: 'Tool Evaluation', question: "How do you evaluate and introduce new DevOps tools? What's your process for tool selection?" },
            { id: 'self-27', type: 'self' as const, category: 'Serverless Computing', question: "What's your experience with serverless technologies (Lambda, Fargate)? How do you architect serverless solutions?" },
            { id: 'self-28', type: 'self' as const, category: 'Communication & Stakeholders', question: "How do you communicate technical DevOps concepts to non-technical stakeholders and leadership?" },
            { id: 'self-29', type: 'self' as const, category: 'Continuous Learning', question: "How do you stay updated with DevOps trends and technologies? What certifications or training have you pursued?" },
            { id: 'self-30', type: 'self' as const, category: 'Innovation & Future Goals', question: "What DevOps innovations would you like to implement? What are your goals for the next quarter?" },
        ],
        peer: [
            { id: 'peer-1', type: 'peer' as const, category: 'DevOps Delivery', question: "Rate: Delivers DevOps solutions on time with high quality and reliability." },
            { id: 'peer-2', type: 'peer' as const, category: 'AWS Expertise', question: "Rate: Demonstrates deep proficiency in AWS services and cloud architecture." },
            { id: 'peer-3', type: 'peer' as const, category: 'Infrastructure as Code', question: "Rate: Effectively designs and implements Infrastructure as Code using Terraform/CloudFormation." },
            { id: 'peer-4', type: 'peer' as const, category: 'CI/CD Pipeline Management', question: "Rate: Builds and maintains robust CI/CD pipelines with proper testing and deployment strategies." },
            { id: 'peer-5', type: 'peer' as const, category: 'Containerization & Orchestration', question: "Rate: Shows expertise in Docker, Kubernetes, and container orchestration." },
            { id: 'peer-6', type: 'peer' as const, category: 'Monitoring & Observability', question: "Rate: Implements comprehensive monitoring, logging, and alerting solutions." },
            { id: 'peer-7', type: 'peer' as const, category: 'Security Integration', question: "Rate: Integrates security best practices into DevOps processes (DevSecOps)." },
            { id: 'peer-8', type: 'peer' as const, category: 'Incident Response', question: "Rate: Effectively handles production incidents and implements preventive measures." },
            { id: 'peer-9', type: 'peer' as const, category: 'Automation Skills', question: "Rate: Creates valuable automation scripts and tools that improve team efficiency." },
            { id: 'peer-10', type: 'peer' as const, category: 'Configuration Management', question: "Rate: Manages configuration across environments effectively with proper version control." },
            { id: 'peer-11', type: 'peer' as const, category: 'Cost Optimization', question: "Rate: Actively monitors and optimizes cloud costs and resource utilization." },
            { id: 'peer-12', type: 'peer' as const, category: 'Database & Storage Management', question: "Rate: Effectively manages cloud databases and storage solutions with high availability." },
            { id: 'peer-13', type: 'peer' as const, category: 'Network Security', question: "Rate: Designs secure network architectures and implements proper access controls." },
            { id: 'peer-14', type: 'peer' as const, category: 'Performance Optimization', question: "Rate: Identifies and resolves performance bottlenecks in production systems." },
            { id: 'peer-15', type: 'peer' as const, category: 'Disaster Recovery Planning', question: "Rate: Designs and tests effective disaster recovery and backup solutions." },
            { id: 'peer-16', type: 'peer' as const, category: 'Microservices Architecture', question: "Rate: Successfully implements and manages microservices architectures." },
            { id: 'peer-17', type: 'peer' as const, category: 'GitOps & Version Control', question: "Rate: Implements GitOps practices and maintains clean version control workflows." },
            { id: 'peer-18', type: 'peer' as const, category: 'Scalability Solutions', question: "Rate: Implements effective auto-scaling and load balancing solutions." },
            { id: 'peer-19', type: 'peer' as const, category: 'API Management', question: "Rate: Manages APIs effectively with proper gateways, versioning, and documentation." },
            { id: 'peer-20', type: 'peer' as const, category: 'DevOps Metrics', question: "Rate: Tracks and uses DevOps metrics to drive continuous improvement." },
            { id: 'peer-21', type: 'peer' as const, category: 'Cloud Migration', question: "Rate: Successfully plans and executes cloud migration projects." },
            { id: 'peer-22', type: 'peer' as const, category: 'Testing Integration', question: "Rate: Integrates comprehensive automated testing into CI/CD pipelines." },
            { id: 'peer-23', type: 'peer' as const, category: 'Documentation Quality', question: "Rate: Creates clear, comprehensive documentation for infrastructure and processes." },
            { id: 'peer-24', type: 'peer' as const, category: 'Tool Evaluation', question: "Rate: Evaluates and recommends appropriate DevOps tools for team needs." },
            { id: 'peer-25', type: 'peer' as const, category: 'Serverless Solutions', question: "Rate: Effectively designs and implements serverless architectures." },
            { id: 'peer-26', type: 'peer' as const, category: 'Technical Communication', question: "Rate: Communicates complex DevOps concepts clearly to technical and non-technical audiences." },
            { id: 'peer-27', type: 'peer' as const, category: 'Collaboration', question: "Rate: Collaborates effectively with development teams to improve deployment processes." },
            { id: 'peer-28', type: 'peer' as const, category: 'Problem Solving', question: "Rate: Demonstrates innovative problem-solving skills in DevOps challenges." },
            { id: 'peer-29', type: 'peer' as const, category: 'Continuous Learning', question: "Rate: Actively learns new DevOps technologies and shares knowledge with the team." },
            { id: 'peer-30', type: 'peer' as const, category: 'DevOps Leadership', question: "Rate: Shows leadership in promoting DevOps best practices and culture." },
        ],
        nomination: [
            { id: 'nomination-1', type: 'nomination' as const, category: 'Team Nominations', question: "Who would you trust to lead a critical AWS migration project?" },
            { id: 'nomination-2', type: 'nomination' as const, category: 'Team Nominations', question: "Who demonstrates the strongest expertise in cloud architecture and design?" },
            { id: 'nomination-3', type: 'nomination' as const, category: 'Team Nominations', question: "Who would you choose to implement a complex Infrastructure as Code solution?" },
            { id: 'nomination-4', type: 'nomination' as const, category: 'Team Nominations', question: "Who consistently shows ownership of production systems and reliability?" },
            { id: 'nomination-5', type: 'nomination' as const, category: 'Team Nominations', question: "Who makes CI/CD deployment processes seamless for the entire team?" },
            { id: 'nomination-6', type: 'nomination' as const, category: 'Team Nominations', question: "Who has the best approach to cloud security and compliance practices?" },
            { id: 'nomination-7', type: 'nomination' as const, category: 'Team Nominations', question: "Who would you recommend to present our cloud solutions in a client demo?" },
            { id: 'nomination-8', type: 'nomination' as const, category: 'Team Nominations', question: "Who's the go-to person for containerization and Kubernetes challenges?" },
            { id: 'nomination-9', type: 'nomination' as const, category: 'Team Nominations', question: "Who shows the best cost optimization and resource management skills?" },
            { id: 'nomination-10', type: 'nomination' as const, category: 'Team Nominations', question: "Who excels at explaining complex technical concepts to non-technical stakeholders?" },
            { id: 'nomination-11', type: 'nomination' as const, category: 'Team Nominations', question: "Who would you nominate as a technical mentor for junior team members?" },
            { id: 'nomination-12', type: 'nomination' as const, category: 'Team Nominations', question: "Who demonstrates the strongest problem-solving abilities under pressure?" },
            { id: 'nomination-13', type: 'nomination' as const, category: 'Team Nominations', question: "Who has the most thoughtful approach to disaster recovery and business continuity?" },
            { id: 'nomination-14', type: 'nomination' as const, category: 'Team Nominations', question: "Who shows exceptional adaptability when learning new technologies?" },
            { id: 'nomination-15', type: 'nomination' as const, category: 'Team Nominations', question: "Who made the biggest contribution toward improving our cloud infrastructure this quarter?" },
        ]
    };

    // Initialize questions for current phase - distributed as 10, 8, 7 for total of 25
    const initializePhaseQuestions = (phase: Phase) => {
        if (phase === 'complete') return;

        const phaseQuestions = questionBank[phase];
        const shuffled = [...phaseQuestions].sort(() => Math.random() - 0.5);

        // Distribute 25 questions: Self=10, Peer=8, Nomination=7
        let questionCount;
        if (phase === 'self') questionCount = 10;
        else if (phase === 'peer') questionCount = 8;
        else questionCount = 7; // nomination

        const selected = shuffled.slice(0, questionCount);
        setSessionQuestions(selected);
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
    };

    // Initialize with self review questions
    useEffect(() => {
        initializePhaseQuestions('self');
    }, []);

    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const totalQuestionsInPhase = currentPhase === 'self' ? 10 : currentPhase === 'peer' ? 8 : 7;
    const progress = ((currentQuestionIndex + 1) / totalQuestionsInPhase) * 100;

    const getPhaseTitle = (phase: Phase) => {
        switch (phase) {
            case 'self': return 'Self Review';
            case 'peer': return 'Peer Review';
            case 'nomination': return 'Team Nominations';
            default: return 'Complete';
        }
    };

    const handleNext = () => {
        if (currentAnswer !== '' && currentAnswer !== 0) {
            // Save current response
            const newResponse: Response = {
                questionId: currentQuestion.id,
                answer: currentAnswer
            };

            setResponses(prev => {
                const filtered = prev.filter(r => r.questionId !== currentQuestion.id);
                return [...filtered, newResponse];
            });

            // Check if this is the last question of current phase
            const maxQuestions = currentPhase === 'self' ? 10 : currentPhase === 'peer' ? 8 : 7;
            if (currentQuestionIndex < maxQuestions - 1) {
                // Move to next question in same phase
                setCurrentQuestionIndex(prev => prev + 1);
                setCurrentAnswer('');
            } else {
                // Move to next phase
                if (currentPhase === 'self') {
                    setCurrentPhase('peer');
                    initializePhaseQuestions('peer');
                } else if (currentPhase === 'peer') {
                    setCurrentPhase('nomination');
                    initializePhaseQuestions('nomination');
                } else {
                    setCurrentPhase('complete');
                }
            }
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            // Load previous answer if exists
            const prevResponse = responses.find(r => r.questionId === sessionQuestions[currentQuestionIndex - 1].id);
            setCurrentAnswer(prevResponse?.answer || '');
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        alert('Review submitted successfully!');
    };

    const getQuestionIcon = (type: string) => {
        switch (type) {
            case 'self': return <User className="w-5 h-5" />;
            case 'peer': return <Users className="w-5 h-5" />;
            case 'nomination': return <Award className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const getQuestionColor = (type: string) => {
        switch (type) {
            case 'self': return 'from-blue-500 to-blue-600';
            case 'peer': return 'from-green-500 to-green-600';
            case 'nomination': return 'from-purple-500 to-purple-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getScoreLabel = (score: number) => {
        const labels = {
            5: "Outstanding",
            4: "Above Average",
            3: "Satisfactory",
            2: "Needs Improvement",
            1: "Poor"
        };
        return labels[score as keyof typeof labels];
    };

    const getScoreColor = (score: number) => {
        const colors = {
            5: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
            4: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
            3: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
            2: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
            1: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        };
        return colors[score as keyof typeof colors];
    };

    // Loading state
    if (sessionQuestions.length === 0 && currentPhase !== 'complete') {
        return (
            <div className="flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600 dark:text-gray-400">Preparing your {getPhaseTitle(currentPhase).toLowerCase()} questions...</p>
                </div>
            </div>
        );
    }

    // Completion screen
    if (currentPhase === 'complete') {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">All Phases Complete!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        You've completed all three review phases:
                    </p>
                    <div className="mb-6 space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <User className="w-4 h-4" />
                            <span>Self Review: 10 questions</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Users className="w-4 h-4" />
                            <span>Peer Review: 8 questions</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                            <Award className="w-4 h-4" />
                            <span>Team Nominations: 7 questions</span>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Total responses: {responses.length} / 25
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Submit Complete Review
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Start New Review
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 w-full max-w-3xl">
                {/* Progress Bar */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${getQuestionColor(currentQuestion?.type)} rounded-lg flex items-center justify-center text-white`}>
                                {getQuestionIcon(currentQuestion?.type)}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{getPhaseTitle(currentPhase)}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{currentQuestion?.category}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Question {currentQuestionIndex + 1} of {totalQuestionsInPhase}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                Phase {currentPhase === 'self' ? '1' : currentPhase === 'peer' ? '2' : '3'} of 3
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${currentPhase === 'self' ? 'bg-blue-600' :
                                currentPhase === 'peer' ? 'bg-green-600' : 'bg-purple-600'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                            {currentQuestion?.question}
                        </h2>
                    </div>

                    {/* Answer Input */}
                    <div className="space-y-6">
                        {currentQuestion?.type === 'self' && (
                            <textarea
                                value={currentAnswer as string}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 resize-none text-lg"
                                placeholder="Share your thoughts..."
                                autoFocus
                            />
                        )}

                        {currentQuestion?.type === 'peer' && (
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                        key={score}
                                        onClick={() => setCurrentAnswer(score)}
                                        className={`p-4 rounded-lg border-2 text-center transition-all transform hover:scale-105 ${currentAnswer === score
                                            ? `${getScoreColor(score)} border-current scale-105`
                                            : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                                            }`}
                                    >
                                        <div className="text-2xl font-bold mb-1">{score}</div>
                                        <div className="text-xs font-medium">{getScoreLabel(score)}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentQuestion?.type === 'nomination' && (
                            <div className="space-y-4">
                                <select
                                    value={typeof currentAnswer === 'object' && currentAnswer !== null ? currentAnswer.memberId : ''}
                                    onChange={(e) => setCurrentAnswer({
                                        memberId: parseInt(e.target.value),
                                        reason: typeof currentAnswer === 'object' && currentAnswer !== null ? currentAnswer.reason : ''
                                    })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 text-lg"
                                    autoFocus
                                >
                                    <option value="">Select a team member...</option>
                                    {teamMembers.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} - {member.role}
                                        </option>
                                    ))}
                                </select>

                                {typeof currentAnswer === 'object' && currentAnswer !== null && currentAnswer.memberId && (
                                    <>
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                                {teamMembers.find(m => m.id === currentAnswer.memberId)?.avatar}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                                                    {teamMembers.find(m => m.id === currentAnswer.memberId)?.name}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {teamMembers.find(m => m.id === currentAnswer.memberId)?.role}
                                                </p>
                                            </div>
                                        </div>

                                        <textarea
                                            value={currentAnswer.reason}
                                            onChange={(e) => setCurrentAnswer({
                                                memberId: currentAnswer.memberId,
                                                reason: e.target.value
                                            })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 resize-none"
                                            placeholder="Optional: Why did you choose this person?"
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-600">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: totalQuestionsInPhase }, (_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all ${index <= currentQuestionIndex
                                        ? (currentPhase === 'self' ? 'bg-blue-600' :
                                            currentPhase === 'peer' ? 'bg-green-600' : 'bg-purple-600')
                                        : 'bg-gray-300 dark:bg-slate-600'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={currentAnswer === '' || currentAnswer === 0 || (typeof currentAnswer === 'object' && currentAnswer !== null && !currentAnswer.memberId)}
                            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentPhase === 'self' ? 'bg-blue-600 hover:bg-blue-700' :
                                currentPhase === 'peer' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                        >
                            {currentQuestionIndex === totalQuestionsInPhase - 1 ?
                                (currentPhase === 'nomination' ? 'Complete Review' : `Complete ${getPhaseTitle(currentPhase)}`)
                                : 'Next'
                            }
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceReview;