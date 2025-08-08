import { supabase } from './dbService';

class ProfileService {
  async getProfile() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not logged in');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(profile: { full_name?: string; avatar_url?: string }) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async uploadAvatar(file: File) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async completeOnboarding(profile: { full_name?: string; avatar_url?: string }) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not logged in');

     const fallbackName = (profile.full_name && profile.full_name.trim())
      ? profile.full_name.trim()
      : (user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'User'));
    const { data, error } = await supabase
      .from('profiles')
       .update({
        full_name: fallbackName,
        avatar_url: profile.avatar_url,
        onboarding_completed: true,
      })      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const profileService = new ProfileService();