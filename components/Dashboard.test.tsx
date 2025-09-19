import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { useQuery, useMutation } from 'convex/react';
import * as mammoth from 'mammoth';
import { MeetingSummary, DashboardProps } from '../types';

// Mock all the dependencies
jest.mock('convex/react');
jest.mock('../constants', () => ({
    MicIcon: () => <div>MicIcon</div>,
    TextIcon: () => <div>TextIcon</div>,
    SpinnerIcon: () => <div>SpinnerIcon</div>,
    CheckCircleIcon: () => <div>CheckCircleIcon</div>,
    TrashIcon: () => <div>TrashIcon</div>,
    PlusIcon: () => <div>PlusIcon</div>,
    UploadIcon: () => <div>UploadIcon</div>,
    FileTextIcon: () => <div>FileTextIcon</div>,
    ArrowUpTrayIcon: () => <div>ArrowUpTrayIcon</div>,
    DocumentDuplicateIcon: () => <div>DocumentDuplicateIcon</div>,
    MailIcon: () => <div>MailIcon</div>,
}));
jest.mock('mammoth');
jest.mock('dompurify', () => ({
    sanitize: (text: string) => text,
}));
jest.mock('../security-fixes/secureFileUpload', () => ({
    SecureFileUpload: {
        validateFile: jest.fn().mockReturnValue({ isValid: true }),
        scanForMalware: jest.fn().mockResolvedValue({ isSafe: true }),
    },
}));
jest.mock('@/components/ui/toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        addToast: jest.fn(),
    }),
}));
jest.mock('../lib/useFreeGenGate', () => ({
    useFreeGenGate: () => ({
        canGenerate: true,
        remaining: 10,
        increment: jest.fn(),
        requirePro: jest.fn(),
    }),
    gateAndGenerate: async (_: any, generate: () => any) => await generate(),
}));
jest.mock('../services/subscriptionService', () => ({
    useGetSubscription: () => ({ data: { plan_type: 'pro' } }),
}));
jest.mock('./Waveform', () => () => <div>Waveform</div>);
jest.mock('./ProPrompt', () => () => <div>ProPrompt</div>);
jest.mock('./BlockingProModal', () => () => <div>BlockingProModal</div>);
jest.mock('./ConfirmationDialog', () => ({
    ConfirmationDialog: () => <div>ConfirmationDialog</div>,
}));
jest.mock('./AttendeeAvatar', () => ({
    AttendeeAvatar: () => <div>AttendeeAvatar</div>,
}));
jest.mock('./EmptyState', () => ({
    EmptyState: () => <div>EmptyState</div>,
}));

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockMammoth = mammoth as jest.Mocked<typeof mammoth>;

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
        title: 'Test Meeting',
        summary: 'This is a test summary.',
        attendees: ['John Doe'],
        keyPoints: ['Point 1'],
        actionItems: [{ task: 'Task 1', owner: 'John Doe' }],
        decisions: ['Decision 1'],
    }),
  })
) as jest.Mock;


describe('Dashboard', () => {
    const mockSetCurrentSummary = jest.fn();
    const mockOnNavigate = jest.fn();
    const mockOnSavingStatusChange = jest.fn();

    beforeEach(() => {
        mockUseQuery.mockReturnValue([]);
        const mockAddMinute = jest.fn().mockImplementation(summary => Promise.resolve({ ...summary, id: 'saved-id', createdAt: Date.now() }));
        mockUseMutation.mockImplementation((mutation: any) => {
            if (mutation === 'minutes.addMinute') {
                return mockAddMinute;
            }
            return jest.fn();
        });
        mockMammoth.extractRawText.mockResolvedValue({ value: 'Test document text' });
        jest.clearAllMocks();
    });

    const renderDashboard = (props: Partial<DashboardProps> = {}) => {
        const defaultProps: DashboardProps = {
            selectedMeetingId: null,
            onSavingStatusChange: mockOnSavingStatusChange,
            currentSummary: null,
            setCurrentSummary: mockSetCurrentSummary,
            onNavigate: mockOnNavigate,
        };
        return render(<Dashboard {...defaultProps} {...props} />);
    };

    it('renders the dashboard with tabs', () => {
        renderDashboard();
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.getByText('Summary')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
        expect(screen.getByText('Voice')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('allows typing in the textarea', () => {
        renderDashboard();
        const textarea = screen.getByPlaceholderText('Paste your meeting notes or raw text here...');
        fireEvent.change(textarea, { target: { value: 'New meeting notes' } });
        expect(textarea).toHaveValue('New meeting notes');
    });

    it('calls the summarize API on generate click', async () => {
        renderDashboard();
        const textarea = screen.getByPlaceholderText('Paste your meeting notes or raw text here...');
        fireEvent.change(textarea, { target: { value: 'New meeting notes' } });

        const generateButton = screen.getByRole('button', { name: /generate minutes/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/summarize', expect.any(Object));
        });

        await waitFor(() => {
            expect(mockSetCurrentSummary).toHaveBeenCalled();
        });
    });
});
