import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { supabase } from '@/lib/supabase';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Attempting login with Supabase...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return { 
          success: false, 
          error: this.getReadableError(error.message) 
        };
      }

      if (data.user && data.session) {
        console.log('Login successful, fetching user profile...');
        
        // Fetch user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return { success: false, error: 'Failed to fetch user profile' };
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: profile?.username || data.user.email!.split('@')[0],
          displayName: profile?.display_name || profile?.username || data.user.email!.split('@')[0],
          avatar: profile?.avatar_url || undefined,
          createdAt: new Date(data.user.created_at),
          lastLoginAt: new Date(),
        };

        // Store auth data
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        
        console.log('Login completed successfully');
        return { success: true, user };
      }

      return { success: false, error: 'Login failed - no user data received' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('Attempting registration with Supabase...');
      
      // Check if username is already taken before attempting registration
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', credentials.username)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking username availability:', checkError);
        return { success: false, error: 'Unable to verify username availability. Please try again.' };
      }

      if (existingProfile) {
        return { success: false, error: 'Username is already taken. Please choose a different username.' };
      }

      // Attempt registration
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            display_name: credentials.displayName || credentials.username,
          }
        }
      });

      if (error) {
        console.error('Supabase registration error:', error);
        return { 
          success: false, 
          error: this.getReadableError(error.message) 
        };
      }

      if (data.user) {
        console.log('Registration successful, user created:', data.user.id);
        
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify that the profile was created by the trigger
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          // Try to create the profile manually as a fallback
          const { error: manualProfileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: credentials.username,
              display_name: credentials.displayName || credentials.username,
              email: data.user.email,
            });

          if (manualProfileError) {
            console.error('Manual profile creation failed:', manualProfileError);
            return { 
              success: false, 
              error: 'Registration completed but profile creation failed. Please contact support.' 
            };
          }
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          username: credentials.username,
          displayName: credentials.displayName || credentials.username,
          createdAt: new Date(data.user.created_at),
          lastLoginAt: new Date(),
        };

        // If user is immediately confirmed (email confirmation disabled)
        if (data.session) {
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        }
        
        console.log('Registration completed successfully');
        return { 
          success: true, 
          user,
        };
      }

      return { success: false, error: 'Registration failed - no user data received' };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('Logging out...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
      }

      // Clear stored data
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local storage
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Update stored user data if session exists
        const user = await this.getStoredUser();
        if (!user) {
          // Recreate user data from session
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username || session.user.email!.split('@')[0],
            displayName: profile?.display_name || profile?.username || session.user.email!.split('@')[0],
            avatar: profile?.avatar_url || undefined,
            createdAt: new Date(session.user.created_at),
            lastLoginAt: new Date(),
          };

          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  private getReadableError(errorMessage: string): string {
    // Convert Supabase error messages to user-friendly messages
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    if (errorMessage.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (errorMessage.includes('Unable to validate email address')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('signup is disabled')) {
      return 'New registrations are currently disabled. Please contact support.';
    }
    if (errorMessage.includes('Database error saving new user')) {
      return 'Registration failed: The chosen username might already be taken, or there was an issue creating your profile. Please try a different username or contact support.';
    }
    if (errorMessage.includes('duplicate key value violates unique constraint')) {
      return 'This username or email is already taken. Please choose different credentials.';
    }
    
    // Return original message if no specific mapping found
    return errorMessage;
  }

  // Get current Supabase session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService;