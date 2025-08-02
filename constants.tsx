import React from 'react';
import { 
  Mic,
  AlignLeft,
  Upload,
  FileText,
  FileAudio,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  Share,
  Copy,
  Mail,
  Clock,
  Search,
  ArrowLeft,
  LayoutGrid,
  List
} from 'lucide-react';

export const LogoIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4.22222L4.22222 16L16 27.7778L27.7778 16L16 4.22222Z" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 18.5556C17.4142 18.5556 18.5556 17.4142 18.5556 16C18.5556 14.5858 17.4142 13.4445 16 13.4445C14.5858 13.4445 13.4444 14.5858 13.4444 16C13.4444 17.4142 14.5858 18.5556 16 18.5556Z" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.22222 16H2.66666" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M29.3333 16H27.7778" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 4.22222V2.66666" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 29.3333V27.7778" stroke="#F45D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Use lucide-react icons for consistency
export const MicIcon = Mic;
export const TextIcon = AlignLeft;
export const UploadIcon = Upload;
export const FileTextIcon = FileText;
export const FileAudioIcon = FileAudio;
export const SpinnerIcon = Loader2;
export const CheckCircleIcon = CheckCircle2;
export const TrashIcon = Trash2;
export const PlusIcon = Plus;
export const ArrowUpTrayIcon = Share;
export const DocumentDuplicateIcon = Copy;
export const MailIcon = Mail;
export const HistoryIcon = Clock;
export const SearchIcon = Search;
export const ArrowLeftIcon = ArrowLeft;
export const ViewGridIcon = LayoutGrid;
export const ViewListIcon = List;
