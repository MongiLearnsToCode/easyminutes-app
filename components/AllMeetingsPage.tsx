import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MeetingSummary } from '../types';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SearchIcon, TrashIcon, ArrowLeftIcon, HistoryIcon, FileTextIcon, ViewGridIcon, ViewListIcon, EditIcon } from '../constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from './ConfirmationDialog';
import DOMPurify from 'dompurify';
import { Id } from '../convex/_generated/dataModel';

type Layout = 'list' | 'grid';
type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

const MeetingCard: React.FC<{
    minute: MeetingSummary;
    onSelect: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ minute, onSelect, onEdit, onDelete }) => {
    const sanitizedTitle = DOMPurify.sanitize(minute.title);
    const sanitizedSummary = DOMPurify.sanitize(minute.summary);

    return (
        <div 
            onClick={() => onSelect(minute.id)}
            className="group flex flex-col bg-card rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(minute.id)}
        >
            <div className="p-5 flex-grow">
                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors truncate mb-1" dangerouslySetInnerHTML={{ __html: sanitizedTitle }}></h3>
                <p className="text-sm text-muted-foreground mb-3">{new Date(minute.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizedSummary || 'No summary available.' }}></p>
            </div>
            <div className="border-t border-border p-3 flex justify-between items-center bg-muted rounded-b-xl">
                    <p className="text-xs text-muted-foreground font-medium">
                    {minute.attendees.length} Attendee{minute.attendees.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center space-x-1 transition-opacity opacity-100">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(minute.id); }}
                        className="p-2 rounded-full text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        aria-label={`Edit meeting: ${sanitizedTitle}`}
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(minute.id); }}
                        className="p-2 rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label={`Delete meeting: ${sanitizedTitle}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const AllMeetingsPage: React.FC<{
    onSelectMeeting: (id: string) => void;
    onBack: () => void;
}> = ({ onSelectMeeting, onBack }) => {
    const meetings = useQuery(api.minutes.getAllMinutes)?.map(m => ({...m, id: m._id, createdAt: m._creationTime})) || [];
    const deleteMinute = useMutation(api.minutes.deleteMinute);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [layout, setLayout] = useState<Layout>('list');
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');
    const [loading, setLoading] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; meetingId: string | null; meetingTitle: string }>({ isOpen: false, meetingId: null, meetingTitle: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string, title: string) => {
        setDeleteConfirmation({ isOpen: true, meetingId: id, meetingTitle: title });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation.meetingId) return;
        
        setIsDeleting(true);
        try {
            await deleteMinute({ id: deleteConfirmation.meetingId as Id<"minutes"> });
            setDeleteConfirmation({ isOpen: false, meetingId: null, meetingTitle: '' });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete the meeting summary.");
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ isOpen: false, meetingId: null, meetingTitle: '' });
    };

    const sortedAndFilteredMeetings = useMemo(() => {
        let processedMeetings = [...meetings];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            processedMeetings = processedMeetings.filter(m =>
                m.title.toLowerCase().includes(lowercasedTerm) ||
                m.attendees.some(a => a.toLowerCase().includes(lowercasedTerm))
            );
        }

        switch (sortOption) {
            case 'title-asc':
                processedMeetings.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                processedMeetings.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'date-asc':
                processedMeetings.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'date-desc':
            default:
                processedMeetings.sort((a, b) => b.createdAt - a.createdAt);
                break;
        }

        return processedMeetings;
    }, [meetings, searchTerm, sortOption]);

    return (
        <main className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8 animate-fade-in max-w-7xl">
            <div className="max-w-6xl mx-auto bg-card p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <button onClick={onBack} className="flex items-center space-x-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                        <HistoryIcon className="w-7 h-7 mr-3 text-primary" />
                        All Meetings
                    </h2>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full sm:flex-grow">
                         <input
                            type="text"
                            placeholder="Search all meetings by title or attendee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring/50 bg-background text-foreground"
                            aria-label="Search all meetings"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-end sm:justify-start gap-4">
                        <div className="relative flex-shrink-0">
                            <label htmlFor="sort-meetings" className="sr-only">Sort by</label>
                            <select
                                id="sort-meetings"
                                value={sortOption}
                                onChange={e => setSortOption(e.target.value as SortOption)}
                                className="h-full block bg-background pl-3 pr-10 py-2 text-base border border-input focus:outline-none focus:ring-2 focus:ring-ring/50 sm:text-sm rounded-lg appearance-none cursor-pointer text-foreground"
                            >
                                <option value="date-desc">Date: Newest</option>
                                <option value="date-asc">Date: Oldest</option>
                                <option value="title-asc">Title: A-Z</option>
                                <option value="title-desc">Title: Z-A</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                <svg className="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                         <div className="flex items-center p-1 bg-muted rounded-lg">
                            <button onClick={() => setLayout('list')} aria-label="List view" className={`p-1.5 rounded-md transition-colors ${layout === 'list' ? 'bg-background shadow' : 'hover:bg-muted/50'}`}>
                                <ViewListIcon className={`w-5 h-5 ${layout === 'list' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </button>
                            <button onClick={() => setLayout('grid')} aria-label="Grid view" className={`p-1.5 rounded-md transition-colors ${layout === 'grid' ? 'bg-background shadow' : 'hover:bg-muted/50'}`}>
                                <ViewGridIcon className={`w-5 h-5 ${layout === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-4" role="alert">{error}</div>}
                
                {loading && <div className="text-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-muted-foreground">Loading meetings...</p></div>}

                {!loading && sortedAndFilteredMeetings.length > 0 ? (
                    layout === 'list' ? (
                        <div className="space-y-3">
                            {sortedAndFilteredMeetings.map(minute => (
                                <div
                                    key={minute.id}
                                    onClick={() => onSelectMeeting(minute.id)}
                                    className="p-4 rounded-xl cursor-pointer group transition-all duration-200 bg-card hover:shadow-md hover:border-primary border border-border flex items-start justify-between gap-4"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && onSelectMeeting(minute.id)}
                                >
                                    <div className="flex items-start gap-4 flex-grow min-w-0">
                                        <div className="bg-primary/10 p-3 rounded-lg mt-1 flex-shrink-0">
                                        <FileTextIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors truncate">{minute.title}</h3>
                                            <p className="text-sm text-muted-foreground">{new Date(minute.createdAt).toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                                Attendees: {minute.attendees.length > 0 ? minute.attendees.join(', ') : 'No attendees listed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1 transition-opacity opacity-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectMeeting(minute.id); }}
                                            className="p-2 rounded-full text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                            aria-label={`Edit meeting: ${minute.title}`}
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(minute.id, minute.title); }}
                                            className="p-2 rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                            aria-label={`Delete meeting: ${minute.title}`}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {sortedAndFilteredMeetings.map(minute => (
                                <MeetingCard key={minute.id} minute={minute} onSelect={onSelectMeeting} onEdit={onSelectMeeting} onDelete={(id) => handleDeleteClick(id, minute.title)} />
                            ))}
                        </div>
                    )
                ) : !loading && (
                    <div className="text-center text-muted-foreground py-24">
                        <h3 className="text-xl font-semibold">No Meetings Found</h3>
                        <p>{searchTerm ? "Try adjusting your search or sort criteria." : "Your saved meeting summaries will appear here."}</p>
                    </div>
                )}
                 <p className="text-xs text-muted-foreground mt-6 text-center">Your minutes are securely stored in the cloud.</p>
            </div>
            
            <ConfirmationDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Meeting Summary"
                description={`Are you sure you want to delete "${deleteConfirmation.meetingTitle}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isDeleting}
            />
        </main>
    );
};

export default AllMeetingsPage;