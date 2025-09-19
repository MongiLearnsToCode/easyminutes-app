import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { authClient } from '@/lib/auth-client';
import { ThemeProvider } from '../contexts/ThemeContext';
import { MeetingSummary } from '../types';

// Mock the authClient
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Mock the useTheme hook
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseSession = authClient.useSession as jest.Mock;

describe('Header', () => {
  const mockOnNavigate = jest.fn();

  const savingStatusUnsaved: HeaderProps['savingStatus'] = {
    isAutoSaving: false,
    hasUnsavedChanges: true,
    currentSummary: { id: '1' } as MeetingSummary,
  };
  const savingStatusSaving: HeaderProps['savingStatus'] = {
    isAutoSaving: true,
    hasUnsavedChanges: true,
    currentSummary: { id: '1' } as MeetingSummary,
  };
  const savingStatusSaved: HeaderProps['savingStatus'] = {
    isAutoSaving: false,
    hasUnsavedChanges: false,
    currentSummary: { id: '1' } as MeetingSummary,
  };

  beforeEach(() => {
    mockOnNavigate.mockClear();
    mockUseSession.mockClear();
  });

  const renderHeader = (props: Partial<HeaderProps> = {}) => {
    const defaultProps: HeaderProps = {
      currentView: 'dashboard',
      onNavigate: mockOnNavigate,
      ...props,
    };
    return render(
      <ThemeProvider>
        <Header {...defaultProps} />
      </ThemeProvider>
    );
  };

  it('renders the header with logo and title', () => {
    mockUseSession.mockReturnValue({ data: null });
    renderHeader();
    expect(screen.getByText('Easy Minutes')).toBeInTheDocument();
  });

  it('highlights the active navigation link based on currentView prop', () => {
    mockUseSession.mockReturnValue({ data: null });
    renderHeader({ currentView: 'allMeetings' });
    const allMeetingsButton = screen.getByRole('button', { name: /all meetings/i });
    expect(allMeetingsButton).toHaveClass('bg-primary');
  });

  it('calls onNavigate with the correct view when a navigation link is clicked', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({ data: null });
    renderHeader();
    const pricingButton = screen.getByRole('button', { name: /pricing/i });
    await user.click(pricingButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('pricing');
  });

  it('shows UserAvatar when authenticated', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: '123' } } });
    renderHeader();
    expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument();
  });

  it('does not show UserAvatar when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null });
    renderHeader();
    expect(screen.queryByRole('button', { name: /open user menu/i })).not.toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({ data: { user: { id: '123' } } });
    renderHeader();

    const userAvatarTrigger = screen.getByRole('button', { name: /open user menu/i });
    await user.click(userAvatarTrigger);

    const logoutButton = await screen.findByText('Log out');
    await user.click(logoutButton);

    expect(authClient.signOut).toHaveBeenCalled();
  });

  it('displays "Saving..." when isAutoSaving is true', () => {
    mockUseSession.mockReturnValue({ data: null });
    renderHeader({ savingStatus: savingStatusSaving });
    const savingElements = screen.getAllByText('Saving...');
    expect(savingElements.length).toBeGreaterThan(0);
  });

  it('displays "Saved" when hasUnsavedChanges is false', () => {
    mockUseSession.mockReturnValue({ data: null });
    renderHeader({ savingStatus: savingStatusSaved });
    const savedElements = screen.getAllByText('Saved');
    expect(savedElements.length).toBeGreaterThan(0);
  });

  it('opens mobile menu on hamburger click', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({ data: null });
    renderHeader();
    const hamburger = screen.getByLabelText('Open menu');
    await user.click(hamburger);
    // In the mobile menu, the buttons might have different roles or labels
    // For now, let's just check if one of the links is visible
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  });
});


// Minimal implementation for HeaderProps
type HeaderProps = {
    currentView: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings' | 'success';
    onNavigate: (view: 'dashboard' | 'allMeetings' | 'pricing' | 'profile' | 'settings') => void;
    savingStatus?: {
        isAutoSaving: boolean;
        hasUnsavedChanges: boolean;
        currentSummary: MeetingSummary;
    };
};
