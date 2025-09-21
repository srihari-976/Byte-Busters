import { createClient } from '@supabase/supabase-js'

// For demo purposes, we'll use a mock Supabase setup
// In production, you would use your actual Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock user data for demo purposes
export const mockUsers = {
  'admin@company.com': {
    user_id: '1',
    username: 'admin',
    email: 'admin@company.com',
    role_id: '1',
    role_name: 'Admin',
    is_active: true,
    password: 'admin123'
  },
  'manager@company.com': {
    user_id: '2',
    username: 'manager',
    email: 'manager@company.com',
    role_id: '2',
    role_name: 'Manager',
    is_active: true,
    password: 'manager123'
  },
  'operator@company.com': {
    user_id: '3',
    username: 'operator',
    email: 'operator@company.com',
    role_id: '3',
    role_name: 'Operator',
    is_active: true,
    password: 'operator123'
  },
  'inventory@company.com': {
    user_id: '4',
    username: 'inventory',
    email: 'inventory@company.com',
    role_id: '4',
    role_name: 'Inventory',
    is_active: true,
    password: 'inventory123'
  }
}

// Mock authentication functions
export const mockAuth = {
  signInWithPassword: async (email: string, password: string) => {
    const user = mockUsers[email as keyof typeof mockUsers]
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials')
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          user_metadata: {
            username: user.username,
            role_id: user.role_id,
            role_name: user.role_name,
            is_active: user.is_active
          }
        },
        session: {
          access_token: `mock-token-${user.user_id}`,
          refresh_token: `mock-refresh-${user.user_id}`
        }
      },
      error: null
    }
  },
  
  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { error: null }
  },
  
  getSession: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { data: { session: null }, error: null }
    }
    
    // Extract user ID from token
    const userId = token.replace('mock-token-', '')
    const user = Object.values(mockUsers).find(u => u.user_id === userId)
    
    if (!user) {
      localStorage.removeItem('token')
      return { data: { session: null }, error: null }
    }
    
    return {
      data: {
        session: {
          access_token: token,
          user: {
            id: user.user_id,
            email: user.email,
            user_metadata: {
              username: user.username,
              role_id: user.role_id,
              role_name: user.role_name,
              is_active: user.is_active
            }
          }
        }
      },
      error: null
    }
  }
}
