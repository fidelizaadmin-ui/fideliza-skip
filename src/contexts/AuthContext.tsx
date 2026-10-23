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
  }) => Promise<{ user: UserRecord; verificationSent: boolean }>
  logout: () => void
  refreshUser: () => Promise<void>
  updateDocument: (documentValue: string) => Promise<UserRecord>
  updateProfile: (params: {
    name: string
    phone?: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<UserRecord>
  generateCustomerCode: () => string
  requestVerificationEmail: (email?: string) => Promise<{ success: boolean; message: string }>
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
      const rec = pb.authStore.record as any
      setUser({
        id: rec.id,
        email: rec.email,
        name: rec.name || 'Usuário',
        role: (rec.role as UserRole) || 'customer',
        customer_code: rec.customer_code,
        phone: rec.phone,
        document: rec.document,
        avatar: rec.avatar,
        verified: !!rec.verified,
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

    // Ao iniciar, se logado, tenta um refresh silencioso para trazer dados mais frescos (ex: verified)
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => syncUser())
        .catch(() => {
          /* ignore refresh errors on boot */
        })
    }

    const unsubscribe = pb.authStore.onChange(() => {
      syncUser()
    })

    // Sincroniza quando a janela/aba ganha foco (ex: usuário clicou no link de verificação em outra aba)
    const handleFocus = () => {
      if (pb.authStore.isValid) {
        pb.collection('users')
          .authRefresh()
          .then(() => syncUser())
          .catch(() => {
            /* ignore refresh errors on focus */
          })
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const login = async (email: string, pass: string): Promise<UserRecord> => {
    const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
    const rec = authData.record as any
    const userData: UserRecord = {
      id: rec.id,
      email: rec.email,
      name: rec.name || 'Usuário',
      role: (rec.role as UserRole) || 'customer',
      customer_code: rec.customer_code,
      phone: rec.phone,
      document: rec.document,
      avatar: rec.avatar,
      verified: !!rec.verified,
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
  }): Promise<{ user: UserRecord; verificationSent: boolean }> => {
    const { email, password, name, role, phone, document } = params
    const customerCode = role === 'customer' ? generateCustomerCode() : undefined
    const cleanEmail = email.trim()

    // 1. Create user
    await pb.collection('users').create({
      email: cleanEmail,
      password,
      passwordConfirm: password,
      name: name.trim(),
      role,
      customer_code: customerCode,
      phone: phone?.trim(),
      document: document?.trim(),
    })

    // 2. Disparar e-mail de verificação via Gmail do owner (endpoint customizado ou fallback nativo)
    let verificationSent = false
    try {
      await pb.send('/backend/v1/auth/request-verification', {
        method: 'POST',
        body: { email: cleanEmail },
      })
      verificationSent = true
    } catch (apiErr) {
      console.warn('Endpoint customizado falhou, tentando fallback nativo:', apiErr)
      try {
        await pb.collection('users').requestVerification(cleanEmail)
        verificationSent = true
      } catch (verErr) {
        console.warn('Não foi possível disparar e-mail de verificação no cadastro:', verErr)
        verificationSent = false
      }
    }

    // 3. Auto log in
    const loggedUser = await login(cleanEmail, password)
    return { user: loggedUser, verificationSent }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const fresh = await pb.collection('users').authRefresh()
        const rec = fresh.record as any
        setUser({
          id: rec.id,
          email: rec.email,
          name: rec.name || 'Usuário',
          role: (rec.role as UserRole) || 'customer',
          customer_code: rec.customer_code,
          phone: rec.phone,
          document: rec.document,
          avatar: rec.avatar,
          verified: !!rec.verified,
          created: rec.created,
          updated: rec.updated,
        })
      } catch (err) {
        console.error('Failed to refresh user:', err)
      }
    }
  }

  const requestVerificationEmail = async (
    targetEmail?: string,
  ): Promise<{ success: boolean; message: string }> => {
    const emailToSend = (targetEmail || user?.email || '').trim()
    if (!emailToSend) {
      return { success: false, message: 'Nenhum e-mail disponível para verificação.' }
    }

    try {
      // 1. Tenta endpoint customizado conectado ao Gmail do Owner
      const res = await pb.send('/backend/v1/auth/request-verification', {
        method: 'POST',
        body: { email: emailToSend },
      })
      return {
        success: true,
        message:
          res?.message ||
          'E-mail de confirmação enviado com sucesso! Verifique sua caixa de entrada e spam.',
      }
    } catch (apiErr: any) {
      console.warn('Endpoint customizado falhou, tentando requestVerification nativo:', apiErr)
      // 2. Fallback para requisição nativa (interceptada pelo hook onMailerRecordVerificationSend)
      try {
        await pb.collection('users').requestVerification(emailToSend)
        return {
          success: true,
          message:
            'E-mail de confirmação enviado com sucesso! Verifique sua caixa de entrada e spam.',
        }
      } catch (err: any) {
        console.error('Erro ao solicitar verificação de e-mail:', err)
        return {
          success: false,
          message:
            'Não foi possível enviar o e-mail no momento. Verifique o endereço digitado ou tente novamente mais tarde.',
        }
      }
    }
  }

  const updateDocument = async (documentValue: string): Promise<UserRecord> => {
    if (!user) {
      throw new Error('Nenhum usuário autenticado.')
    }
    const clean = documentValue.replace(/\D/g, '')
    const updated = await pb.collection('users').update(user.id, {
      document: clean,
    })
    const rec = updated as unknown as UserRecord
    const nextUser: UserRecord = {
      ...user,
      document: rec.document || clean,
      updated: rec.updated,
    }
    setUser(nextUser)
    return nextUser
  }

  const updateProfile = async (params: {
    name: string
    phone?: string
    currentPassword?: string
    newPassword?: string
  }): Promise<UserRecord> => {
    if (!user) {
      throw new Error('Nenhum usuário autenticado.')
    }

    const payload: Record<string, any> = {
      name: params.name.trim(),
      phone: params.phone?.trim() || '',
    }

    if (params.newPassword && params.newPassword.trim()) {
      if (!params.currentPassword) {
        throw new Error('Informe sua senha atual para definir uma nova senha.')
      }
      payload.oldPassword = params.currentPassword
      payload.password = params.newPassword
      payload.passwordConfirm = params.newPassword
    }

    const updated = await pb.collection('users').update(user.id, payload)
    const rec = updated as any

    const nextUser: UserRecord = {
      ...user,
      name: rec.name || params.name.trim(),
      phone: rec.phone ?? params.phone?.trim(),
      updated: rec.updated,
    }

    setUser(nextUser)

    // Se houve alteração de senha, atualiza o token do authStore sem deslogar
    if (params.newPassword && params.newPassword.trim()) {
      try {
        await pb.collection('users').authWithPassword(user.email, params.newPassword)
      } catch (authRefreshErr) {
        console.warn('Senha atualizada, falha ao reautenticar automaticamente:', authRefreshErr)
      }
    }

    return nextUser
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
    updateDocument,
    updateProfile,
    generateCustomerCode,
    requestVerificationEmail,
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
