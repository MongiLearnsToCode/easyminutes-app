import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MeetingSummary, ActionItem, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { MicIcon, TextIcon, SpinnerIcon, CheckCircleIcon, TrashIcon, PlusIcon, UploadIcon, FileTextIcon, FileAudioIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, MailIcon, EditIcon } from '../constants';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { InputValidator } from '../security-fixes/inputValidation';
import { SecureFileUpload } from '../security-fixes/secureFileUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from './ConfirmationDialog';
import { AttendeeAvatar } from './AttendeeAvatar';
import { EmptyState } from './EmptyState';
import { Id } from '../convex/_generated/dataModel';
// import ProPrompt from './ProPrompt';
import { useToast } from '@/components/ui/toast';
import { USER_MESSAGES } from '../constants/userMessages';
import { useFreeGenGate, gateAndGenerate } from '../lib/useFreeGenGate';
import BlockingProModal from './BlockingProModal';
// import BlockingProModal from './BlockingProModal';
import ProPrompt from './ProPrompt';
import { useGetSubscription } from '../services/subscriptionService';
import Waveform from './Waveform';

type ActiveTab = 'text' | 'voice' | 'upload';

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 mt-8 pb-2 border-b border-border">
        {children}
    </h4>
);

const AddItemButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <Button
        onClick={onClick}
        variant="ghost"
        size="sm"
        className="flex items-center space-x-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-3 ml-1 h-auto p-1"
    >
        <PlusIcon className="w-4 h-4" />
        <span>{children}</span>
    </Button>
);

const EditableMinutesDisplay: React.FC<{ summary: MeetingSummary; setSummary: React.Dispatch<React.SetStateAction<MeetingSummary | null>> }> = ({ summary, setSummary }) => {

    const updateSummary = (update: Partial<MeetingSummary>) => {
        setSummary(current => current ? { ...current, ...update } : null);
    };

    const handleListChange = (field: 'keyPoints' | 'decisions' | 'attendees', index: number, value: string) => {
        const list = summary[field] as string[];
        const newList = [...list];
        newList[index] = value;
        updateSummary({ [field]: newList });
    };

    const addListItem = (field: 'keyPoints' | 'decisions' | 'attendees') => {
        const list = summary[field] as string[];
        updateSummary({ [field]: [...list, ''] });
    };

    const removeListItem = (field: 'keyPoints' | 'decisions' | 'attendees', index: number) => {
        const list = summary[field] as string[];
        updateSummary({ [field]: list.filter((_, i) => i !== index) });
    };
    
    const handleActionItemChange = (index: number, field: keyof ActionItem, value: string) => {
        const newActionItems = [...summary.actionItems];
        newActionItems[index] = { ...newActionItems[index], [field]: value };
        updateSummary({ actionItems: newActionItems });
    };

    const addActionItem = () => {
        updateSummary({ actionItems: [...summary.actionItems, { task: '', owner: '' }] });
    };
    
    const removeActionItem = (index: number) => {
        updateSummary({ actionItems: summary.actionItems.filter((_, i) => i !== index) });
    };

    const sanitizedSummary = {
        ...summary,
        summary: DOMPurify.sanitize(summary.summary),
        attendees: summary.attendees.map(attendee => DOMPurify.sanitize(attendee)),
        keyPoints: summary.keyPoints.map(point => DOMPurify.sanitize(point)),
        decisions: summary.decisions.map(decision => DOMPurify.sanitize(decision)),
        actionItems: summary.actionItems.map(item => ({
            ...item,
            task: DOMPurify.sanitize(item.task),
            owner: DOMPurify.sanitize(item.owner),
        })),
    };

    return (
        <div className="space-y-6 text-foreground animate-fade-in">
             <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border">
                    Summary
                </h4>
                <Textarea
                    value={sanitizedSummary.summary}
                    onChange={(e) => updateSummary({ summary: e.target.value })}
                    className="bg-muted/50 border-l-4 border-primary/50 focus:border-primary/50 resize-none"
                    placeholder="Meeting summary..."
                    rows={4}
                />
            </div>
            
            <div>
                <SectionHeader>Attendees</SectionHeader>
                <div className="flex flex-wrap gap-4">
                    {sanitizedSummary.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                            <AttendeeAvatar name={attendee} />
                            <input
                                value={attendee}
                                onChange={(e) => handleListChange('attendees', index, e.target.value)}
                                className="bg-transparent w-auto focus:ring-0 border-none p-0"
                                placeholder="Attendee Name"
                                size={attendee.length || 15}
                            />
                            <button onClick={() => removeListItem('attendees', index)} className="ml-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity">
                                <TrashIcon className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    ))}
                </div>
                <AddItemButton onClick={() => addListItem('attendees')}>Add Attendee</AddItemButton>
            </div>

            {(['keyPoints', 'decisions'] as const).map(section => {
                if (!sanitizedSummary[section]?.length && section === 'decisions') return null;
                return (
                    <div key={section}>
                        <SectionHeader>{section === 'keyPoints' ? 'Key Points' : 'Decisions Made'}</SectionHeader>
                        <ul className="space-y-3">
                            {sanitizedSummary[section].map((item, index) => 
<li key={index} className="flex items-center group text-muted-foreground/90 leading-relaxed gap-2">
<span className="text-primary font-bold text-lg flex-shrink-0">•</span>
                                    <input
                                        value={item}
                                        onChange={(e) => handleListChange(section, index, e.target.value)}
                                        className="flex-1 bg-transparent w-full focus:ring-0 border-none p-0 py-1"
                                        placeholder={`New ${section === 'keyPoints' ? 'key point' : 'decision'}...`}
                                    />
                                    <button onClick={() => removeListItem(section, index)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity flex-shrink-0 p-1">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </li>
                            )}
                        </ul>
                        <AddItemButton onClick={() => addListItem(section)}>Add {section === 'keyPoints' ? 'Key Point' : 'Decision'}</AddItemButton>
                    </div>
                );
            })}

            <div>
                <SectionHeader>Action Items</SectionHeader>
                <ul className="space-y-3">
                    {sanitizedSummary.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start space-x-4 p-4 bg-card border border-gray-200/80 rounded-xl shadow-sm group">
                            <CheckCircleIcon className="w-7 h-7 text-green-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <input
                                    value={item.task}
                                    onChange={(e) => handleActionItemChange(index, 'task', e.target.value)}
                                    placeholder="Action item task..."
className="font-semibold text-foreground leading-tight w-full bg-transparent p-0 border-none focus:ring-0"
                                />
                                 <div className="flex items-center">
<span className="text-xs font-bold text-primary/80 uppercase">Assigned:</span>
                                    <input
                                      value={item.owner}
                                      onChange={(e) => handleActionItemChange(index, 'owner', e.target.value)}
                                      placeholder="Owner"
className="ml-2 text-xs font-bold text-foreground bg-primary/10 px-2 py-1 rounded-md p-0 border-none focus:ring-0"
                                    />
                                </div>
                            </div>
                            <button onClick={() => removeActionItem(index)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </li>
                    ))}
                </ul>
                <AddItemButton onClick={addActionItem}>Add Action Item</AddItemButton>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ selectedMeetingId: string | null; onSavingStatusChange: (status: { isAutoSaving: boolean; hasUnsavedChanges: boolean; currentSummary: any; } | undefined) => void; currentSummary: any | null; setCurrentSummary: (summary: any | null) => void; onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing' | 'success' | 'profile' | 'settings') => void; }> = ({ selectedMeetingId, onSavingStatusChange, currentSummary, setCurrentSummary, onNavigate }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<ActiveTab>('text');
    const [inputText, setInputText] = useState('');
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [originalSummaryForDiff, setOriginalSummaryForDiff] = useState<MeetingSummary | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; meetingId: string | null; meetingTitle: string }>({ isOpen: false, meetingId: null, meetingTitle: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const savedMinutes = useQuery(api.minutes.getAllMinutes)?.map(m => ({...m, id: m._id, createdAt: m._creationTime})) || [];
    const addMinute = useMutation(api.minutes.addMinute);
    const updateMinute = useMutation(api.minutes.updateMinute);
    const deleteMinute = useMutation(api.minutes.deleteMinute);



    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [proPrompt, setProPrompt] = useState<{ open: boolean; feature: string }>(() => ({ open: false, feature: '' }));
    const [isDragging, setIsDragging] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [copyStatusText, setCopyStatusText] = useState('Copy to Clipboard');
    const { canGenerate, remaining, increment, requirePro } = useFreeGenGate();
    const [showProModal, setShowProModal] = useState(false);
    const [lastProPromptTime, setLastProPromptTime] = useState(0);
    const openProModal = () => setShowProModal(true);
    // const [isTrial, setIsTrial] = useState(false);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputText]);

    // useEffect(() => {
    //     const checkTrialStatus = async () => {
    //         if (session) {
    //             const { isTrialUser } = await subscriptionService.getSubscriptionStatus();
    //             setIsTrial(isTrialUser);
    //         }
    //     };
    //     checkTrialStatus();
    // }, [session]);




    
    const formatSummaryAsText = (summary: MeetingSummary): string => {
        if (!summary) return '';
        const sections = [
            `MEETING: ${summary.title}`,
            `DATE: ${new Date(summary.createdAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`,
            '',
            'SUMMARY',
            '═══════════════════════════════════════════════════════════════',
            summary.summary,
            '',
            'ATTENDEES',
            '═══════════════════════════════════════════════════════════════',
            summary.attendees.map(a => `• ${a}`).join('\n'),
            '',
            'KEY POINTS',
            '═══════════════════════════════════════════════════════════════',
            summary.keyPoints.map(p => `• ${p}`).join('\n'),
            '',
            ...(summary.decisions && summary.decisions.length > 0 ? [
                'DECISIONS MADE',
                '═══════════════════════════════════════════════════════════════',
                summary.decisions.map(d => `• ${d}`).join('\n'),
                '',
            ] : []),
            'ACTION ITEMS',
            '═══════════════════════════════════════════════════════════════',
            summary.actionItems.map((item, index) => {
                const taskNumber = (index + 1).toString().padStart(2, '0');
                return `${taskNumber}. ${item.task}${item.owner ? ` [Assigned: ${item.owner}]` : ''}`;
            }).join('\n')
        ];
        return sections.filter(section => section !== undefined).join('\n');
    };

    const handleCopyToClipboard = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        const textToCopy = formatSummaryAsText(summary);
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('Copied to clipboard!', 'Meeting minutes have been copied to your clipboard.');
            setCopyStatusText('Copied!');
            setTimeout(() => {
                setCopyStatusText('Copy to Clipboard');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast.error('Failed to copy', 'Unable to copy to clipboard. Please try again.');
            setCopyStatusText('Failed to copy');
             setTimeout(() => {
                setCopyStatusText('Copy to Clipboard');
            }, 2000);
        });
    }, [toast]);

    const handleShareByEmail = useCallback((summary: MeetingSummary) => {
        toast.info('Email sharing is not available in this build.');
    }, [toast]);

    const handleExportDocx = useCallback((summary: MeetingSummary) => {
        toast.info('DOCX export is not available in this build.');
    }, [toast]);

    const realHandleExportDocx = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        const doc = new Document({
            creator: "Easy Minutes",
            title: summary.title,
            description: "Meeting Minutes",
            sections: [{
                children: [
                    new Paragraph({ text: summary.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                    new Paragraph({ text: `Date: ${new Date(summary.createdAt).toLocaleDateString()}`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto"}}, spacing: { after: 100 } }),
                    new Paragraph({ children: summary.summary.split('\n').map(line => new TextRun(line)), spacing: { after: 200 } }),
    
                    new Paragraph({ text: "Attendees", heading: HeadingLevel.HEADING_2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto"}}, spacing: { after: 100 } }),
                    ...summary.attendees.map(attendee => new Paragraph({ text: attendee, bullet: { level: 0 }, indent: { left: 720, hanging: 360 } })),
                    new Paragraph({ text: "", spacing: { after: 200 } }),
    
                    new Paragraph({ text: "Key Points", heading: HeadingLevel.HEADING_2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto"}}, spacing: { after: 100 } }),
                    ...summary.keyPoints.map(point => new Paragraph({ text: point, bullet: { level: 0 }, indent: { left: 720, hanging: 360 } })),
                    new Paragraph({ text: "", spacing: { after: 200 } }),
    
                    ...(summary.decisions.length > 0 ? [
                        new Paragraph({ text: "Decisions Made", heading: HeadingLevel.HEADING_2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto"}}, spacing: { after: 100 } }),
                        ...summary.decisions.map(decision => new Paragraph({ text: decision, bullet: { level: 0 }, indent: { left: 720, hanging: 360 } })),
                        new Paragraph({ text: "", spacing: { after: 200 } }),
                    ] : []),
    
                    new Paragraph({ text: "Action Items", heading: HeadingLevel.HEADING_2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto"}}, spacing: { after: 100 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: {size: 70, type: WidthType.PERCENTAGE}, children: [new Paragraph({text: "Task", spacing: {before:120, after:120}})], borders: {bottom: {style: BorderStyle.SINGLE, size: 4}}}),
                                    new TableCell({ width: {size: 30, type: WidthType.PERCENTAGE}, children: [new Paragraph({text: "Assigned", spacing: {before:120, after:120}})], borders: {bottom: {style: BorderStyle.SINGLE, size: 4}}}),
                                ],
                            }),
                            ...summary.actionItems.map(item => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(item.task)] }),
                                    new TableCell({ children: [new Paragraph(item.owner)] }),
                                ]
                            })),
                        ],
                    }),
                ],
            }],
        });
        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_minutes.docx`);
            toast.success('Document exported!', 'Your meeting minutes have been downloaded as a Word document.');
        }).catch(err => {
            console.error('Failed to export DOCX:', err);
            toast.error('Export failed', 'Unable to export as Word document. Please try again.');
        });
    }, []);

    const handleExportPdf = useCallback((summary: MeetingSummary) => {
        toast.info('PDF export is not available in this build.');
    }, [toast]);

    const realHandleExportPdf = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(summary.title, pageWidth / 2, yPos, { align: "center" });
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
                    doc.text(new Date(summary.createdAt).toLocaleString(), pageWidth / 2, yPos, { align: "center" });
        yPos += 10;
        
        const addSection = (title: string, content: string[] | string) => {
            if (!content || (Array.isArray(content) && content.length === 0)) return;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(title, margin, yPos);
            yPos += 6;
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            
            const listContent = (item: string) => {
                const lines = doc.splitTextToSize(`•  ${item}`, pageWidth - (margin * 2) - 5);
                if (yPos + (lines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(lines, margin + 5, yPos);
                yPos += (lines.length * 5) + 3;
            };

            if (Array.isArray(content)) {
                content.forEach(listContent);
            } else {
                const lines = doc.splitTextToSize(content, pageWidth - (margin * 2));
                 if (yPos + (lines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(lines, margin, yPos);
                yPos += (lines.length * 5) + 3;
            }
            yPos += 5;
        };
        
        addSection("Summary", summary.summary);
        addSection("Attendees", summary.attendees);
        addSection("Key Points", summary.keyPoints);
        addSection("Decisions Made", summary.decisions);

        if (summary.actionItems.length > 0) {
            yPos += 5;
            if (yPos > doc.internal.pageSize.getHeight() - 40) { // Check space for header
                doc.addPage();
                yPos = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Action Items", margin, yPos);
            yPos += 6;
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            
            autoTable(doc, {
                startY: yPos + 2,
                head: [['Task', 'Assigned']],
                body: summary.actionItems.map(item => [item.task, item.owner]),
                theme: 'striped',
                headStyles: { fillColor: [42, 86, 153] },
                margin: { left: margin, right: margin },
            });
        }
        
        doc.save(`${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_minutes.pdf`);
        toast.success('PDF exported!', 'Your meeting minutes have been downloaded as a PDF document.');
    }, []);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { return; }
        const recognition: SpeechRecognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if(finalTranscript){
                setTranscript(prev => prev ? `${prev}. ${finalTranscript}` : finalTranscript);
            }
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setError(`Speech recognition error: ${event.error}. Please ensure microphone access is granted.`);
            setIsRecording(false);
        };
        recognition.onend = () => { if (isRecording) { recognition.start(); } };
        recognitionRef.current = recognition;
        return () => { if (recognitionRef.current) { recognitionRef.current.stop(); } };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleRecording = () => {
        toast.info('Audio transcription is not available in this build.');
    };
    
    const processFile = useCallback(async (file: File) => {
        setIsProcessingFile(true);
        setError(null);
        setInputText('');
        setCurrentSummary(null);
        
        toast.info('Processing file', `Analyzing ${file.name}...`);
        
        // Security validation
        const validation = SecureFileUpload.validateFile(file);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid file');
            setUploadedFile(null);
            setIsProcessingFile(false);
            toast.error('File validation failed', validation.error || 'The uploaded file is not valid or supported.');
            return;
        }
        
        // Malware scan (basic)
        const scanResult = await SecureFileUpload.scanForMalware(file);
        if (!scanResult.isSafe) {
            setError(`Security check failed: ${scanResult.reason}`);
            setUploadedFile(null);
            setIsProcessingFile(false);
            toast.error('Security check failed', scanResult.reason || 'The file failed security validation.');
            return;
        }
        
        const { name, type } = file;
        try {
            if (type.startsWith('audio/')) {
                setProPrompt({ open: true, feature: 'Audio Transcription' });
                setUploadedFile(null);
                setIsProcessingFile(false);
                return;
            } else if (name.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
                setInputText(result.value);
                setIsProcessingFile(false);
                toast.success('Document processed!', `Text extracted from ${file.name} successfully.`);
            } else if (type.startsWith('text/')) {
                setInputText(await file.text());
                setIsProcessingFile(false);
                toast.success('Text file processed!', `${file.name} has been loaded and is ready for analysis.`);
            } else {
                setError(`Unsupported file type: ${type || 'unknown'}. Please upload a text, docx, or audio file.`);
                setUploadedFile(null);
                setIsProcessingFile(false);
                toast.error('Unsupported file type', `${type || 'Unknown'} files are not supported. Please upload TXT, DOCX, MP3, WAV, or M4A files.`);
            }
        } catch (e) {
            setError("An error occurred while processing the file.");
            setUploadedFile(null);
            setIsProcessingFile(false);
            toast.error('File processing error', 'An unexpected error occurred while processing the file. Please try again.');
        }
    }, []);

    useEffect(() => {
        if (uploadedFile) {
            processFile(uploadedFile);
        } else {
             setInputText('');
        }
    }, [uploadedFile, processFile]);
    
    const hasUnsavedChanges = useMemo(() => {
        if (!currentSummary || !originalSummaryForDiff) return false;
        return JSON.stringify(currentSummary) !== JSON.stringify(originalSummaryForDiff);
    }, [currentSummary, originalSummaryForDiff]);

    

    const handleGenerate = useCallback(async () => {
        const result = await gateAndGenerate({ canGenerate, remaining, increment, requirePro, openProModal }, async () => {
            let inputToSummarize: string | null = inputText.trim(); // Default to text input only
            if (!inputToSummarize) {
                setError("Please provide some text to summarize.");
                return null;
            }
            setIsLoading(true);
            setError(null);
            setCurrentSummary(null);
            setOriginalSummaryForDiff(null);
            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: inputToSummarize,
                        type: 'text'
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to generate summary');
                }

                const result = await response.json();
                
                const newSummary = {
                    ...result,
                    id: Date.now().toString(),
                    createdAt: Date.now()
                };
                
                setCurrentSummary(newSummary);
                setOriginalSummaryForDiff(newSummary);
                
                // Try to save to database if user is authenticated
                try {
                    const savedSummary = await addMinute(result);
                    setCurrentSummary(savedSummary);
                    setOriginalSummaryForDiff(savedSummary);
                    toast.success('Meeting minutes generated and saved!', 'Your AI-powered meeting summary is ready for review and has been saved.');
                } catch (saveError) {
                    // If save fails (user not authenticated), keep the local version
                    console.log('Unable to save meeting - user may not be authenticated');
                    if (remaining === 1) {
                        toast.info('Last free generation!', `You have one free generation left this session.`);
                    } else if (remaining <= 3) {
                        toast.info('Free generations remaining', `You have ${remaining - 1} free generations left this session.`);
                    }
                    toast.success('Meeting minutes generated!', 'Your AI-powered meeting summary is ready. Sign in to save it permanently.');
                }
                return newSummary;
            } catch (e) {
                setError(e instanceof Error ? e.message : "An unexpected error occurred.");
                toast.error('Generation failed', e instanceof Error ? e.message : 'Unable to generate meeting minutes. Please try again.');
                return null;
            } finally {
                setIsLoading(false);
            }
        });
    }, [inputText, savedMinutes, requirePro, openProModal, increment, remaining, canGenerate]);
    
    const handleSelectMinute = useCallback((minute: MeetingSummary) => {
        setCurrentSummary(minute);
        setOriginalSummaryForDiff(minute);
    }, []);

    const subscription = useGetSubscription();

    // Auto-save edits with debounce
    useEffect(() => {
        if (!hasUnsavedChanges) {
            return;
        }

        const handler = setTimeout(async () => {
            if (!currentSummary) return;

            if (subscription?.plan_type !== 'pro') {
                const now = Date.now();
                // Only show pro prompt once every 30 seconds
                if (now - lastProPromptTime > 30000) {
                    setLastProPromptTime(now);
                    toast.addToast({
                        type: 'info',
                        title: 'Auto-save is a Pro feature',
                        message: 'Subscribe to automatically save your changes.',
                        action: {
                            label: 'Upgrade',
                            onClick: () => onNavigate('pricing')
                        }
                    });
                }
                return;
            }

            setIsAutoSaving(true);
            try {
                // Update timestamp on each save to reflect last modification time
                const summaryToUpdate = await updateMinute(currentSummary);
                setCurrentSummary(summaryToUpdate); // Update current summary with saved version
                setOriginalSummaryForDiff(summaryToUpdate); // Update baseline after save
            } catch (e) {
                console.error("Auto-save failed:", e);
                setError("Failed to save changes automatically.");
            } finally {
                setIsAutoSaving(false);
            }
        }, 1500); // Debounce for 1.5 seconds

        return () => {
            clearTimeout(handler);
        };
    }, [currentSummary, hasUnsavedChanges, toast, subscription]);
    
    // Pass saving status to parent
    useEffect(() => {
        onSavingStatusChange(currentSummary ? {
            isAutoSaving,
            hasUnsavedChanges,
            currentSummary
        } : undefined);
    }, [currentSummary, isAutoSaving, hasUnsavedChanges, onSavingStatusChange]);
    
    useEffect(() => {
        if (selectedMeetingId && savedMinutes.length > 0) {
            const minuteToSelect = savedMinutes.find(m => m.id === selectedMeetingId);
            if (minuteToSelect) {
                handleSelectMinute(minuteToSelect);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMeetingId, savedMinutes]);


    const handleDeleteClick = useCallback((id: string, title: string) => {
        setDeleteConfirmation({ isOpen: true, meetingId: id, meetingTitle: title });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteConfirmation.meetingId) return;
        
        setIsDeleting(true);
        try {
            await deleteMinute({ id: deleteConfirmation.meetingId as Id<"minutes"> });
            if (currentSummary?.id === deleteConfirmation.meetingId) {
                setCurrentSummary(null);
                setOriginalSummaryForDiff(null);
            }
            toast.success('Meeting deleted', `"${deleteConfirmation.meetingTitle}" has been permanently removed from your meetings.`);
            setDeleteConfirmation({ isOpen: false, meetingId: null, meetingTitle: '' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to delete minutes.";
            setError(errorMessage);
            toast.error('Deletion failed', errorMessage);
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    }, [deleteConfirmation.meetingId, deleteConfirmation.meetingTitle, currentSummary, toast]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirmation({ isOpen: false, meetingId: null, meetingTitle: '' });
    }, []);
    
    const handleFileSelect = (files: FileList | null) => { if (files?.length) setUploadedFile(files[0]); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) setUploadedFile(e.dataTransfer.files[0]);
    };



    const tabClasses = (tabName: ActiveTab) =>
        `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer w-1/3 justify-center ${ 
            activeTab === tabName
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-brand-muted hover:bg-gray-200'
        }`;
        

    return (
        <main className="h-full w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">

            <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 xl:gap-8">
                {/* Left Column - Meeting Notes */}
                <div className="lg:col-span-2 bg-card p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm flex flex-col h-full order-1 lg:order-1">
                    <div className="flex flex-col h-full">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Meeting Notes</h2>
                        <div className="flex flex-col flex-1 min-h-0">
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="flex-shrink-0">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="text" className="flex items-center space-x-2">
                                        <TextIcon className="w-4 h-4" />
                                        <span>Text</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="voice" className="flex items-center space-x-2">
                                        <MicIcon className="w-4 h-4" />
                                        <span>Voice</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="upload" className="flex items-center space-x-2">
                                        <UploadIcon className="w-4 h-4" />
                                        <span>Upload</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="flex-1 mt-4">
                                    <Textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Paste your meeting notes or raw text here..."
                                        className="w-full min-h-[200px] resize-none"
                                    />
                                </TabsContent>
                            
                                <TabsContent value="voice" className="flex-1 mt-4">
                                    <div className="flex flex-col h-full space-y-4">
                                        <Button
                                            onClick={toggleRecording}
                                            variant={isRecording ? "destructive" : "default"}
                                            size="lg"
                                            className="w-full flex-shrink-0"
                                        >
                                            <MicIcon className="w-5 h-5 mr-2" />
                                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                                        </Button>
                                        <div className="flex-1 p-4 border border-border rounded-lg overflow-y-auto bg-muted min-h-[200px]">
                                            <p className="text-muted-foreground whitespace-pre-wrap">
                                                {transcript || 'Your live transcription will appear here...'}
                                            </p>
                                            {isRecording && <Waveform />}
                                        </div>
                                    </div>
                                </TabsContent>
                            
                                <TabsContent value="upload" className="flex-1 mt-4">
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative flex flex-col items-center justify-center w-full h-full min-h-[300px] border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
                                            isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted hover:bg-muted/80'
                                        }`}
                                    >
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => handleFileSelect(e.target.files)} 
                                        accept=".txt,.md,.docx,audio/*"
                                    />
                                    {isProcessingFile ? (
                                        <div className="flex flex-col items-center">
                                            <SpinnerIcon className="text-primary" />
                                            <p className="mt-2 text-muted-foreground">Processing file...</p>
                                        </div>
                                    ) : uploadedFile ? (
                                        <Card className="w-full max-w-sm">
                                            <CardContent className="text-center p-4">
                                                <FileTextIcon className="w-16 h-16 mx-auto text-primary/80 mb-2" />
                                                <p className="font-semibold text-foreground truncate">{uploadedFile.name}</p>
                                                <Badge variant="secondary" className="mt-1">
                                                    {Math.round(uploadedFile.size / 1024)} KB
                                                </Badge>
                                                <Button 
                                                    onClick={() => setUploadedFile(null)} 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="mt-4"
                                                >
                                                    Remove File
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="text-center" onClick={() => fileInputRef.current?.click()}>
                                            <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                                            <p className="font-semibold text-foreground mb-2">Drag & drop a file here</p>
                                            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                                            <Badge variant="outline">Supports: TXT, DOCX, MP3, WAV, M4A</Badge>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                        
                        <div className="mt-6 flex flex-col gap-2">
                            <Button 
                                onClick={() => toast.info('Sign up to save your minutes.')}
                                variant="outline"
                                size="lg"
                                className="w-full"
                            >
                                Save
                            </Button>
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isLoading || isProcessingFile} 
                                size="lg" 
                                className="w-full"
                            >
                                {isLoading ? <SpinnerIcon className="mr-2" /> : null}
                                {currentSummary ? 'Regenerate Minutes' : 'Generate Minutes'}
                            </Button>
                        </div>

                        <div className="mt-4">
{currentSummary && (
                            <Button 
                                onClick={() => {
                                    // Clear all input fields
                                    setInputText('');
                                    setTranscript('');
                                    setUploadedFile(null);
                                    
                                    // Clear current meeting summary
                                    setCurrentSummary(null);
                                    setOriginalSummaryForDiff(null);
                                    
                                    // Clear any errors
                                    setError(null);
                                    
                                    // Stop recording if active
                                    if (isRecording && recognitionRef.current) {
                                        recognitionRef.current.stop();
                                        setIsRecording(false);
                                    }
                                    
                                    // Reset to text tab for consistency
                                    setActiveTab('text');
                                }}
                                variant="outline"
                                size="lg"
                                className="w-full"
                            >
                                Start New Meeting
                            </Button>
                            )}
                        </div>
                     </div>
                    </div>



                </div>

                {/* Right Column - Summary */}
                <div className="lg:col-span-3 bg-card p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-sm flex flex-col h-full order-2 lg:order-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-4 flex-shrink-0">
                      <div className="flex items-center space-x-3 flex-grow min-w-0 w-full sm:w-auto">
                          {currentSummary ? (
                            <input
                                value={currentSummary.title}
                                onChange={(e) => setCurrentSummary(cs => cs ? { ...cs, title: e.target.value } : null)}
                                className="w-full bg-transparent text-2xl font-bold text-foreground border-none focus:ring-0 p-0 truncate"
                                placeholder="Meeting Title"
                            />
                          ) : (
                            <h2 className="text-2xl font-bold text-foreground">Summary</h2>
                          )}
                      </div>
                      {currentSummary && !isLoading && (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleCopyToClipboard(currentSummary!)}
className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                    title={copyStatusText}
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Copy</span>
                                </button>
                                <button
                                    onClick={() => toast.info('Sign up to share your minutes.')}
                                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                    title="Share via Email (Pro)"
                                >
                                    <MailIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Email (Pro)</span>
                                </button>                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                            title="Export Options"
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4" />
                                            <span className="hidden sm:inline">Export</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                         <DropdownMenuItem onSelect={() => toast.info('Subscribe to Pro to export as .docx')}>
                                            <FileTextIcon className="w-4 h-4 text-blue-600 mr-2" />
                                            Export as .docx (Pro)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => toast.info('Subscribe to Pro to export as .pdf')}>
                                            <FileTextIcon className="w-4 h-4 text-red-600 mr-2" />
                                            Export as .pdf (Pro)
                                        </DropdownMenuItem>                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 p-4 bg-muted/30 rounded-lg overflow-y-auto min-h-0">
                        {isLoading && (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {currentSummary && !isLoading && <EditableMinutesDisplay summary={currentSummary} setSummary={setCurrentSummary} />}
                        {!isLoading && !error && !currentSummary && (
                            <EmptyState
                                title="Generate Your First Meeting Summary"
                                description="Provide notes, record audio, or upload a file and click 'Generate Minutes'. You can also select a past meeting from your history."
                                icon={<FileTextIcon className="w-16 h-16 text-primary" />}
                            />
                        )}
                    </div>
                </div>
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

            <BlockingProModal
                isOpen={showProModal}
                onClose={() => setShowProModal(false)}
                onSubscribe={() => {
                    setShowProModal(false);
                    onNavigate('pricing');
                }}
            />

            <ProPrompt
                isOpen={proPrompt.open}
                onClose={() => setProPrompt({ open: false, feature: '' })}
                onGoToPricing={() => {
                    setProPrompt({ open: false, feature: '' });
                    onNavigate('pricing');
                }}
                featureLabel={proPrompt.feature}
            />

        </main>
    );
};

export default Dashboard;
