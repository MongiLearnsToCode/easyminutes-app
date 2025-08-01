import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MeetingSummary, ActionItem, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, SummarizeAudioInput } from '../types';
import { summarizeMinutes } from '../services/geminiService';
import { initDB, getAllMinutes, addMinute, updateMinute, deleteMinute } from '../services/dbService';
import { MicIcon, TextIcon, SpinnerIcon, CheckCircleIcon, TrashIcon, PlusIcon, UploadIcon, FileTextIcon, FileAudioIcon, HistoryIcon, SearchIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, MailIcon } from '../constants';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { InputValidator } from '../security-fixes/inputValidation';
import { SecureFileUpload } from '../security-fixes/secureFileUpload';

type ActiveTab = 'text' | 'voice' | 'upload';

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-4 mt-8 pb-2 border-b border-gray-200/80">
        {children}
    </h4>
);

const AddItemButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-2 text-sm font-medium text-brand-primary hover:text-opacity-80 transition-colors mt-3 ml-1"
    >
        <PlusIcon className="w-4 h-4" />
        <span>{children}</span>
    </button>
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
        <div className="space-y-6 text-brand-secondary animate-fade-in">
             <div>
                <h4 className="text-sm font-bold text-brand-muted uppercase tracking-wider mb-4 pb-2 border-b border-gray-200/80">
                    Summary
                </h4>
                <textarea
                    value={sanitizedSummary.summary}
                    onChange={(e) => updateSummary({ summary: e.target.value })}
                    className="w-full bg-brand-bg/80 rounded-r-md p-4 text-base text-brand-muted leading-relaxed border-l-4 border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition duration-200 resize-none"
                    placeholder="Meeting summary..."
                    rows={4}
                />
            </div>
            
            <div>
                <SectionHeader>Attendees</SectionHeader>
                <div className="flex flex-wrap gap-2">
                    {sanitizedSummary.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center group bg-gray-200/60 text-brand-secondary text-sm font-medium pl-3 pr-1 py-1 rounded-full shadow-sm">
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
                                <li key={index} className="flex items-start group text-brand-secondary/90 leading-relaxed">
                                    <span className="text-brand-primary font-bold text-lg mr-3 mt-0.5">&#8226;</span>
                                    <input
                                        value={item}
                                        onChange={(e) => handleListChange(section, index, e.target.value)}
                                        className="flex-1 bg-transparent w-full focus:ring-0 border-none p-0"
                                        placeholder={`New ${section === 'keyPoints' ? 'key point' : 'decision'}...`}
                                    />
                                    <button onClick={() => removeListItem(section, index)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity">
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
                        <li key={index} className="flex items-start space-x-4 p-4 bg-white border border-gray-200/80 rounded-xl shadow-sm group">
                            <CheckCircleIcon className="w-7 h-7 text-green-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <input
                                    value={item.task}
                                    onChange={(e) => handleActionItemChange(index, 'task', e.target.value)}
                                    placeholder="Action item task..."
                                    className="font-semibold text-brand-secondary leading-tight w-full bg-transparent p-0 border-none focus:ring-0"
                                />
                                 <div className="flex items-center">
                                    <span className="text-xs font-bold text-brand-primary uppercase">Assigned:</span>
                                    <input
                                      value={item.owner}
                                      onChange={(e) => handleActionItemChange(index, 'owner', e.target.value)}
                                      placeholder="Owner"
                                      className="ml-2 text-xs font-bold text-brand-secondary bg-brand-primary/10 px-2 py-1 rounded-md p-0 border-none focus:ring-0"
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

const Dashboard: React.FC<{ onShowAll: () => void; selectedMeetingId: string | null }> = ({ onShowAll, selectedMeetingId }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('text');
    const [inputText, setInputText] = useState('');
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    
    const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null);
    const [originalSummaryForDiff, setOriginalSummaryForDiff] = useState<MeetingSummary | null>(null);

    const [savedMinutes, setSavedMinutes] = useState<MeetingSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [audioInput, setAudioInput] = useState<SummarizeAudioInput | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [isShareMenuOpen, setShareMenuOpen] = useState(false);
    const [copyStatusText, setCopyStatusText] = useState('Copy to Clipboard');
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);


    const loadMinutesFromDB = useCallback(async () => {
        try {
            setError(null);
            const minutes = await getAllMinutes();
            setSavedMinutes(minutes);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load saved minutes.");
            console.error(e);
        }
    }, []);

    useEffect(() => {
        initDB().then(() => {
            loadMinutesFromDB();
        });
    }, [loadMinutesFromDB]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputText]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShareMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [shareMenuRef]);
    
    const formatSummaryAsText = (summary: MeetingSummary): string => {
        if (!summary) return '';
        const sections = [
            `Title: ${summary.title}`,
            `Date: ${new Date(summary.createdAt).toLocaleString()}`,
            '',
            'SUMMARY',
            '--------------------',
            summary.summary,
            '',
            'ATTENDEES',
            '--------------------',
            summary.attendees.map(a => `- ${a}`).join('\n'),
            '',
            'KEY POINTS',
            '--------------------',
            summary.keyPoints.map(p => `- ${p}`).join('\n'),
            '',
            ...(summary.decisions && summary.decisions.length > 0 ? [
                'DECISIONS MADE',
                '--------------------',
                summary.decisions.map(d => `- ${d}`).join('\n'),
                '',
            ] : []),
            'ACTION ITEMS',
            '--------------------',
            summary.actionItems.map(item => `- ${item.task} (Owner: ${item.owner})`).join('\n')
        ];
        return sections.join('\n');
    };

    const handleCopyToClipboard = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        const textToCopy = formatSummaryAsText(summary);
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyStatusText('Copied!');
            setTimeout(() => {
                setCopyStatusText('Copy to Clipboard');
                setShareMenuOpen(false);
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyStatusText('Failed to copy');
             setTimeout(() => {
                setCopyStatusText('Copy to Clipboard');
            }, 2000);
        });
    }, []);

    const handleShareByEmail = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        const subject = `Meeting Minutes: ${summary.title}`;
        const body = formatSummaryAsText(summary);
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        setShareMenuOpen(false);
    }, []);

    const handleExportDocx = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        setShareMenuOpen(false);
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
        });
    }, []);

    const handleExportPdf = useCallback((summary: MeetingSummary) => {
        if (!summary) return;
        setShareMenuOpen(false);
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
        if (!recognitionRef.current) {
            setError("Speech recognition is not available in your browser.");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            setError(null);
            setCurrentSummary(null);
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };
    
    const processFile = useCallback(async (file: File) => {
        setIsProcessingFile(true);
        setError(null);
        setInputText('');
        setAudioInput(null);
        setCurrentSummary(null);
        
        // Security validation
        const validation = SecureFileUpload.validateFile(file);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid file');
            setUploadedFile(null);
            setIsProcessingFile(false);
            return;
        }
        
        // Malware scan (basic)
        const scanResult = await SecureFileUpload.scanForMalware(file);
        if (!scanResult.isSafe) {
            setError(`Security check failed: ${scanResult.reason}`);
            setUploadedFile(null);
            setIsProcessingFile(false);
            return;
        }
        
        const { name, type } = file;
        try {
            if (type.startsWith('audio/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    setAudioInput({ mimeType: type, data: base64 });
                    setIsProcessingFile(false);
                };
                reader.onerror = () => { setError("Failed to read the audio file."); setIsProcessingFile(false); }
                reader.readAsDataURL(file);
            } else if (name.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
                setInputText(result.value);
                setIsProcessingFile(false);
            } else if (type.startsWith('text/')) {
                setInputText(await file.text());
                setIsProcessingFile(false);
            } else {
                setError(`Unsupported file type: ${type || 'unknown'}. Please upload a text, docx, or audio file.`);
                setUploadedFile(null);
                setIsProcessingFile(false);
            }
        } catch (e) {
            setError("An error occurred while processing the file.");
            setUploadedFile(null);
            setIsProcessingFile(false);
        }
    }, []);

    useEffect(() => {
        if (uploadedFile) {
            processFile(uploadedFile);
        } else {
             setInputText('');
             setAudioInput(null);
        }
    }, [uploadedFile, processFile]);
    
    const hasUnsavedChanges = useMemo(() => {
        if (!currentSummary || !originalSummaryForDiff) return false;
        return JSON.stringify(currentSummary) !== JSON.stringify(originalSummaryForDiff);
    }, [currentSummary, originalSummaryForDiff]);

    const handleGenerate = useCallback(async () => {
        let inputToSummarize: string | SummarizeAudioInput | null = null;
        let sourceIsEmpty = true;
        switch (activeTab) {
            case 'text':
                sourceIsEmpty = !inputText.trim();
                inputToSummarize = inputText;
                break;
            case 'voice':
                sourceIsEmpty = !transcript.trim();
                inputToSummarize = transcript;
                break;
            case 'upload':
                sourceIsEmpty = !audioInput && !inputText.trim();
                inputToSummarize = audioInput || inputText;
                break;
        }
        if (sourceIsEmpty || !inputToSummarize) {
            setError("Please provide some text, a recording, or an uploaded file to summarize.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setCurrentSummary(null);
        setOriginalSummaryForDiff(null);
        try {
            const result = await summarizeMinutes(inputToSummarize);
            const newSummary = await addMinute(result);
            await loadMinutesFromDB();
            setCurrentSummary(newSummary);
            setOriginalSummaryForDiff(newSummary);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, inputText, transcript, audioInput, loadMinutesFromDB]);
    
    const handleSelectMinute = useCallback((minute: MeetingSummary) => {
        setCurrentSummary(minute);
        setOriginalSummaryForDiff(minute);
    }, []);

    // Auto-save edits with debounce
    useEffect(() => {
        if (!hasUnsavedChanges) {
            return;
        }

        const handler = setTimeout(async () => {
            if (!currentSummary) return;
            
            setIsAutoSaving(true);
            try {
                // Update timestamp on each save to reflect last modification time
                const summaryToUpdate = await updateMinute(currentSummary);
                setOriginalSummaryForDiff(summaryToUpdate); // Update baseline after save
                await loadMinutesFromDB(); // Refresh list to reflect new timestamp
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
    }, [currentSummary, hasUnsavedChanges, loadMinutesFromDB]);
    
    useEffect(() => {
        if (selectedMeetingId && savedMinutes.length > 0) {
            const minuteToSelect = savedMinutes.find(m => m.id === selectedMeetingId);
            if (minuteToSelect) {
                handleSelectMinute(minuteToSelect);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMeetingId, savedMinutes]);


    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm("Are you sure you want to delete this meeting summary?")) {
            try {
                await deleteMinute(id);
                await loadMinutesFromDB();
                if (currentSummary?.id === id) {
                    setCurrentSummary(null);
                    setOriginalSummaryForDiff(null);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to delete minutes.");
                console.error(e);
            }
        }
    }, [currentSummary, loadMinutesFromDB]);
    
    const handleFileSelect = (files: FileList | null) => { if (files?.length) setUploadedFile(files[0]); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) setUploadedFile(e.dataTransfer.files[0]);
    };

    const filteredMinutes = useMemo(() => {
        if (!searchTerm) return savedMinutes;
        const lowercasedTerm = searchTerm.toLowerCase();
        return savedMinutes.filter(m => 
            m.title.toLowerCase().includes(lowercasedTerm) || 
            m.attendees.some(a => a.toLowerCase().includes(lowercasedTerm))
        );
    }, [savedMinutes, searchTerm]);
    
    const recentFilteredMinutes = useMemo(() => {
        return filteredMinutes.slice(0, 5);
    }, [filteredMinutes]);

    const tabClasses = (tabName: ActiveTab) =>
        `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer w-1/3 justify-center ${
            activeTab === tabName
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-brand-muted hover:bg-gray-200'
        }`;
        
    const SavingStatus = () => {
        if (!currentSummary) return null;

        if (isAutoSaving) {
            return <div className="flex items-center text-sm text-brand-muted"><SpinnerIcon className="text-brand-primary"/> <span className="ml-2">Saving...</span></div>
        }

        if (!hasUnsavedChanges) {
            return <div className="flex items-center text-sm text-green-600"><CheckCircleIcon className="w-5 h-5"/> <span className="ml-1">All changes saved</span></div>
        }

        return null;
    };

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:items-start">
                {/* Left Column */}
                <div className="lg:col-span-2 bg-brand-surface p-6 rounded-2xl shadow-sm flex flex-col space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-secondary mb-4">Meeting Notes</h2>
                        <div className="flex space-x-2 mb-4 p-1 bg-gray-100 rounded-xl">
                            {/* ...Tabs... */}
                            <div className={tabClasses('text')} onClick={() => setActiveTab('text')}><TextIcon className="w-5 h-5" /><span>Text</span></div>
                            <div className={tabClasses('voice')} onClick={() => setActiveTab('voice')}><MicIcon className="w-5 h-5" /><span>Voice</span></div>
                            <div className={tabClasses('upload')} onClick={() => setActiveTab('upload')}><UploadIcon className="w-5 h-5" /><span>Upload</span></div>
                        </div>
                        
                        <div>
                            {/* ... Tab content ... */}
                             {activeTab === 'text' && <textarea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your meeting notes or raw text here..." className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition duration-200 resize-none overflow-y-hidden" rows={5} />}
                             {activeTab === 'voice' && <div className="flex flex-col min-h-[300px]"><button onClick={toggleRecording} className={`flex items-center justify-center space-x-2 w-full py-3 rounded-lg font-semibold text-white transition-colors duration-200 ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'}`}><MicIcon className="w-5 h-5" /><span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span></button><div className="flex-grow mt-4 p-4 border border-gray-200 rounded-lg overflow-y-auto bg-gray-50"><p className="text-brand-muted whitespace-pre-wrap">{transcript || 'Your live transcription will appear here...'}</p>{isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-2"></div>}</div></div>}
                             {activeTab === 'upload' && <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}><input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} accept=".txt,.md,.docx,audio/*"/>{isProcessingFile ? <div className="flex flex-col items-center"><SpinnerIcon className="text-brand-primary" /><p className="mt-2 text-brand-muted">Processing file...</p></div> : uploadedFile ? <div className="text-center p-4">{audioInput ? <FileAudioIcon className="w-16 h-16 mx-auto text-brand-primary/80" /> : <FileTextIcon className="w-16 h-16 mx-auto text-brand-primary/80" />}<p className="font-semibold text-brand-secondary mt-2 truncate">{uploadedFile.name}</p><p className="text-sm text-brand-muted">{Math.round(uploadedFile.size / 1024)} KB</p><button onClick={() => setUploadedFile(null)} className="mt-4 text-sm font-semibold text-red-600 hover:text-red-800">Remove File</button></div> : <div className="text-center" onClick={() => fileInputRef.current?.click()}><UploadIcon className="w-12 h-12 mx-auto text-gray-400"/><p className="mt-2 font-semibold text-brand-secondary">Drag & drop a file here</p><p className="text-sm text-brand-muted">or click to browse</p><p className="text-xs text-gray-400 mt-4">Supports: TXT, DOCX, MP3, WAV, M4A</p></div>}</div>}
                        </div>
                        
                        <div className="mt-6">
                            <button onClick={handleGenerate} disabled={isLoading || isProcessingFile} className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 transition-all duration-200 disabled:bg-brand-muted disabled:cursor-not-allowed flex items-center justify-center">
                                {isLoading ? <SpinnerIcon /> : 'Generate Minutes'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                             <button onClick={onShowAll} className="text-xl font-bold text-brand-secondary flex items-center hover:text-brand-primary transition-colors group">
                                <HistoryIcon className="w-6 h-6 mr-2 text-brand-primary transition-transform group-hover:scale-110"/>
                                <h3 className="font-bold text-xl">Recent Meetings</h3>
                            </button>
                        </div>
                        <div className="relative mb-4">
                            <input type="text" placeholder="Search by title or attendee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/50"/>
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        </div>
                        <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-2">
                            {recentFilteredMinutes.length > 0 ? recentFilteredMinutes.map(minute => (
                                <div key={minute.id} onClick={() => handleSelectMinute(minute)} className={`p-3 rounded-lg cursor-pointer group transition-colors ${currentSummary?.id === minute.id ? 'bg-brand-primary/10' : 'hover:bg-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-brand-secondary truncate">{minute.title}</h4>
                                            <p className="text-sm text-brand-muted">{new Date(minute.createdAt).toLocaleString()}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(minute.id); }} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-brand-muted pt-8">No saved minutes found.</p>}
                        </div>
                        {savedMinutes.length > 5 && (
                            <div className="mt-4 text-center">
                                <button onClick={onShowAll} className="font-semibold text-brand-primary hover:text-opacity-80 transition-colors py-2">
                                    View All Meetings &rarr;
                                </button>
                            </div>
                        )}
                         <p className="text-xs text-gray-400 mt-4 text-center">Your minutes are securely stored in the cloud.</p>
                    </div>

                </div>

                {/* Right Column */}
                <div className="lg:col-span-3 bg-brand-surface p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-4 gap-4">
                      <div className="flex items-center space-x-3 flex-grow min-w-0">
                          {currentSummary ? (
                            <input
                                value={currentSummary.title}
                                onChange={(e) => setCurrentSummary(cs => cs ? { ...cs, title: e.target.value } : null)}
                                className="w-full bg-transparent text-2xl font-bold text-brand-secondary border-none focus:ring-0 p-0 truncate"
                                placeholder="Meeting Title"
                            />
                          ) : (
                             <h2 className="text-2xl font-bold text-brand-secondary">Summary</h2>
                          )}
                          <SavingStatus />
                      </div>
                      {currentSummary && !isLoading && (
                            <div className="relative" ref={shareMenuRef}>
                                <button
                                    onClick={() => setShareMenuOpen(v => !v)}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-brand-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm"
                                    aria-haspopup="true"
                                    aria-expanded={isShareMenuOpen}
                                >
                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                    <span>Share / Export</span>
                                </button>
                                {isShareMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30 animate-fade-in-fast">
                                        <div className="p-1">
                                            <button
                                                onClick={() => handleCopyToClipboard(currentSummary!)}
                                                className="w-full text-left flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                <DocumentDuplicateIcon className="w-5 h-5"/>
                                                <span>{copyStatusText}</span>
                                            </button>
                                            <button
                                                onClick={() => handleShareByEmail(currentSummary!)}
                                                className="w-full text-left flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                <MailIcon className="w-5 h-5" />
                                                <span>Share via Email</span>
                                            </button>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => handleExportDocx(currentSummary!)}
                                                className="w-full text-left flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                <FileTextIcon className="w-5 h-5 text-blue-600" />
                                                <span>Export as .docx</span>
                                            </button>
                                            <button
                                                onClick={() => handleExportPdf(currentSummary!)}
                                                className="w-full text-left flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                <FileTextIcon className="w-5 h-5 text-red-600" />
                                                <span>Export as .pdf</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="min-h-[400px] p-4 bg-brand-bg/50 rounded-lg">
                        {isLoading && <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-3/4"></div><div className="h-20 bg-gray-200 rounded w-full mt-6"></div><div className="h-6 bg-gray-200 rounded w-1/3 mt-6"></div><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div><div className="h-4 bg-gray-200 rounded w-full"></div></div>}
                        {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg">{error}</div>}
                        {currentSummary && !isLoading && <EditableMinutesDisplay summary={currentSummary} setSummary={setCurrentSummary} />}
                        {!isLoading && !error && !currentSummary && (
                            <div className="text-center text-brand-muted pt-16">
                                <p className="text-lg">Your meeting summary will appear here.</p>
                                <p>Provide notes, record audio, or upload a file and click "Generate Minutes".</p>
                                <p className="mt-4">Or, select a summary from your history.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Dashboard;