import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { MeetingSummary } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const getCurrentUser = async (): Promise<User> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("User not authenticated. Please log in.");
    }
    return user;
};

// This is the data structure expected from the Gemini service.
type MeetingData = Omit<MeetingSummary, 'id' | 'createdAt' | 'userId'>;

// Convert database row to MeetingSummary interface
const dbRowToMeetingSummary = (row: any): MeetingSummary => {
    console.log('Database row structure:', Object.keys(row)); // Debug log to see actual column names
    return {
        id: row.id,
        createdAt: row.created_at || row.createdAt,
        title: row.title,
        attendees: row.attendees || [],
        summary: row.summary || '',
        keyPoints: row.keyPoints || row.key_points || row.keypoints || [],
        actionItems: row.actionItems || row.action_items || row.actionitems || [],
        decisions: row.decisions || []
    };
};

export const addMinute = async (summaryData: MeetingData): Promise<MeetingSummary> => {
    const user = await getCurrentUser();
    const { title, attendees, summary, keyPoints, actionItems, decisions } = summaryData;

    const { data, error } = await supabase
        .from('meetings')
        .insert({
            title,
            attendees,
            summary,
            decisions,
            user_id: user.id,
            key_points: keyPoints,     // Consistent snake_case
            action_items: actionItems, // Consistent snake_case
            created_at: new Date().toISOString()
        })
        .select('*')
        .single();

    if (error) {
        console.error('Error adding minute:', error);
        throw new Error(`Failed to save minute: ${error.message}`);
    }
    return dbRowToMeetingSummary(data);
};

export const getAllMinutes = async (): Promise<MeetingSummary[]> => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching minutes:', error);
        throw new Error(`Failed to load minutes: ${error.message}`);
    }
    return (data as MeetingRow[])?.map(dbRowToMeetingSummary) || [];
};

export const updateMinute = async (summary: MeetingSummary): Promise<MeetingSummary> => {
    const user = await getCurrentUser();
    const { id, title, attendees, summary: summaryText, keyPoints, actionItems, decisions, createdAt } = summary;
    
    // Package extended data as JSON in summary field
    const extendedSummary = {
        summary: summaryText,
        keyPoints: keyPoints,
        actionItems: actionItems,
        decisions: decisions
    };
    
    const { data, error } = await supabase
        .from('meetings')
        .update({
            title,
            attendees,
            summary: JSON.stringify(extendedSummary),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();
        
    if (error) {
        console.error('Error updating minute:', error);
        throw new Error(`Failed to update minute: ${error.message}`);
    }
    return dbRowToMeetingSummary(data);
};

export const deleteMinute = async (id: string): Promise<void> => {
    const user = await getCurrentUser();
    const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
    if (error) {
        console.error('Error deleting minute:', error);
        throw new Error(`Failed to delete minute: ${error.message}`);
    }
};

// initDB is kept as a no-op to avoid breaking the useEffect in Dashboard.
// In a larger refactor, this and its call would be removed.
export const initDB = (): Promise<boolean> => {
  return Promise.resolve(true);
};
