import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord, UserRole } from '@/types'

interface AuthContextType {
  user: UserRecord | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<UserRecord>
  register: (params: {
    email: string
    password: string
    name: string
    role: UserRole
    phone?: string
    document?: string
  }) => Promise<UserRecord>
  logout: () => void
  refreshUser: () => Promise<void>
  generateCustomerCode: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function generateCustomerCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CLI-${num}`
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUser = () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as unknown as UserRecord
      setUser({
        id: rec.id,
        email: rec.email,
        name: rec.name || 'Usuário',
        role: (rec.role as UserRole) || 'customer',
        customer_code: rec.customer_code,
        phone: rec.phone,
        document: rec.document,
        avatar: rec.avatar,
        created: rec.created,
        updated: rec.updated,
      })
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    syncUser()
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      syncUser()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string): Promise<UserRecord> => {
    const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
    const rec = authData.record as unknown as UserRecord
    const userData: UserRecord = {
      id: rec.id,
      email: rec.email,
      name: rec.name || 'Usuário',
      role: (rec.role as UserRole) || 'customer',
      customer_code: rec.customer_code,
      phone: rec.phone,
      document: rec.document,
      avatar: rec.avatar,
      created: rec.created,
      updated: rec.updated,
    }
    setUser(userData)
    return userData
  }

  const register = async (params: {
    email: string
    password: string
    name: string
    role: UserRole
    phone?: string
    document?: string
  }): Promise<UserRecord> => {
    const { email, password, name, role, phone, document } = params
    const customerCode = role === 'customer' ? generateCustomerCode() : undefined

    // Create user
    await pb.collection('users').create({
      email: email.trim(),
      password,
      passwordConfirm: password,
      name: name.trim(),
      role,
      customer_code: customerCode,
      phone: phone?.trim(),
      document: document?.trim(),
    })

    // Auto log in
    return await login(email, password)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const fresh = await pb.collection('users').authRefresh()
        const rec = fresh.record as unknown as UserRecord
        setUser({
          id: rec.id,
          email: rec.email,
          name: rec.name || 'Usuário',
          role: (rec.role as UserRole) || 'customer',
          customer_code: rec.customer_code,
          phone: rec.phone,
          document: rec.document,
          avatar: rec.avatar,
          created: rec.created,
          updated: rec.updated,
        })
      } catch (err) {
        console.error('Failed to refresh user:', err)
      }
    }
  }

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    generateCustomerCode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
