"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

interface UserProfile {
  name: string
  emoji: string
  email: string
}

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const [emoji, name] = (currentUser.displayName || '👤|Visitor').split('|')
        setProfile({
          emoji: emoji || '👤',
          name: name || 'Visitor',
          email: currentUser.email || ''
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAuthModalOpen, 
      setIsAuthModalOpen 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
