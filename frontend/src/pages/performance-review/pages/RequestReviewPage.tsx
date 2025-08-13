import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mail, CheckCircle } from 'lucide-react';
import type { TeamMember } from '../types/types';
import { BackButton, PageHeader } from '../Components/SharedComponents';

const RequestReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock current user - replace with your actual auth context
    const currentUser: TeamMember = {
        id: 1,
        name: "Glen Mogane",
        role: "AWS Solutions Architect",
        avatar: "GM",
        department: "Engineering"
    };

    // Mock team members - replace with your actual data source
    const teamMembers: TeamMember[] = [
        { id: 2, name: "Sarah Johnson", role: "Cloud Architect", avatar: "SJ", department: "Engineering" },
        { id: 3, name: "Mike Chen", role: "Platform Engineer", avatar: "MC", department: "Engineering" },
        { id: 4, name: "Emily Davis", role: "Site Reliability Engineer", avatar: "ED", department: "Engineering" },
        { id: 5, name: "Alex Rodriguez", role: "Infrastructure Engineer", avatar: "AR", department: "Engineering" },
        { id: 6, name: "Lisa Thompson", role: "DevOps Lead", avatar: "LT", department: "Engineering" },
        { id: 7, name: "John Smith", role: "Senior DevOps Engineer", avatar: "JS", department: "Engineering" },
        { id: 8, name: "Rachel Park", role: "Security Engineer", avatar: "RP", department: "Engineering" },
    ];

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = (memberId: number) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubmit = () => {
        const requests = selectedMembers.map(reviewerId => {
            const reviewer = teamMembers.find(m => m.id === reviewerId)!;
            return {
                requesterId: currentUser.id,
                reviewerId,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,
                requesterAvatar: currentUser.avatar,
                reviewerName: reviewer.name,
                reviewerRole: reviewer.role,
                reviewerAvatar: reviewer.avatar,
                message: message.trim() || undefined
            };
        });

        // TODO: Submit the requests to your backend or state management
        console.log('Submitting review requests:', requests);

        // Show success message
        alert(`Review request${selectedMembers.length > 1 ? 's' : ''} sent successfully!`);

        // Navigate back to dashboard
        navigate('/performance');
    };

    const handleBack = () => {
        navigate('/performance');
    };

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <BackButton onBack={handleBack} />
                <PageHeader title="Request Peer Review" />

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Team Members</h3>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search team members..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Team Members Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {filteredMembers.map((member) => (
                            <TeamMemberCard
                                key={member.id}
                                member={member}
                                isSelected={selectedMembers.includes(member.id)}
                                onToggle={() => toggleMember(member.id)}
                            />
                        ))}
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Add a personal message to your review request..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedMembers.length === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            Send Review Request{selectedMembers.length > 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const TeamMemberCard = ({ member, isSelected, onToggle }: {
    member: TeamMember;
    isSelected: boolean;
    onToggle: () => void;
}) => {
    return (
        <div
            onClick={onToggle}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                </div>
                {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
            </div>
        </div>
    );
};

export default RequestReviewPage;