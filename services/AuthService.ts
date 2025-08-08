import { supabase } from './dbService';
import { USER_MESSAGES } from '../constants/userMessages';

class AuthService {
  async signUp(email, password, fullName?) {
    const { user, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) {
      throw new Error(error.message);
    }
    return user;
  }

  async signIn(email, password) {
    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session);
    });
    return subscription;
  }

  async sendPasswordResetEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  }

  getCurrentUser() {
    return supabase.auth.getUser();
  }
}

export const authService = new AuthService();