"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser } from './UserContext'
import { getUserStats, updateUserStats } from '../lib/db_service'

interface ApiCall {
  timestamp: number
  tokens: number
}

interface ApiContextType {
  apiKey: string
  model: string
  isValid: boolean
  isLoading: boolean
  dailyUsage: number
  maxDailyUsage: number
  dailyTokens: number
  currentRPM: number
  currentTPM: number
  setApiKey: (key: string) => Promise<boolean>
  setModel: (model: string) => void
  validateKey: () => Promise<boolean>
  incrementUsage: (metadata?: any) => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [apiKey, setApiKeyState] = useState('')
  const [model, setModelState] = useState('gemini-1.5-flash-001')
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Usage tracking
  const [dailyUsage, setDailyUsage] = useState(0)
  const [dailyTokens, setDailyTokens] = useState(0)
  const [recentCalls, setRecentCalls] = useState<ApiCall[]>([])
  const [currentRPM, setCurrentRPM] = useState(0)
  const [currentTPM, setCurrentTPM] = useState(0)
  
  const maxDailyUsage = 1500
  const maxRPM = 15
  const maxTPM = 1000000

  // Refresh real-time stats (RPM/TPM)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      
      setRecentCalls(prev => {
        const active = prev.filter(call => call.timestamp > oneMinuteAgo)
        setCurrentRPM(active.length)
        setCurrentTPM(active.reduce((sum, call) => sum + call.tokens, 0))
        return active
      })
    }, 5000)
    
    return () => clearInterval(timer)
  }, [])

  // Sync with Database or LocalStorage
  useEffect(() => {
    async function loadStats() {
      const today = new Date().toDateString()
      let initialKey = localStorage.getItem('user_gemini_key') || ''
      let initialModel = localStorage.getItem('user_gemini_model') || 'gemini-1.5-flash-001'
      let initialUsage = parseInt(localStorage.getItem('gemini_daily_usage') || '0', 10)
      let initialTokens = parseInt(localStorage.getItem('gemini_daily_tokens') || '0', 10)
      let lastUsageDate = localStorage.getItem('gemini_usage_date')

      if (user) {
        const stats = await getUserStats(user.uid)
        if (stats) {
          initialKey = stats.api_key || initialKey
          initialModel = stats.preferred_model || initialModel
          
          if (stats.last_usage_date === today) {
            initialUsage = stats.daily_usage || 0
            initialTokens = stats.daily_tokens || 0
          } else {
            initialUsage = 0
            initialTokens = 0
            await updateUserStats(user.uid, {
              daily_usage: 0,
              daily_tokens: 0,
              last_usage_date: today
            })
          }
          lastUsageDate = stats.last_usage_date
        }
      } else {
        // Fallback for non-logged in users (reset if day changed)
        if (lastUsageDate !== today) {
          initialUsage = 0
          initialTokens = 0
          localStorage.setItem('gemini_usage_date', today)
        }
      }

      setApiKeyState(initialKey)
      setModelState(initialModel)
      setDailyUsage(initialUsage)
      setDailyTokens(initialTokens)

      if (initialKey) {
        validateInternal(initialKey).then(valid => setIsValid(valid))
      }
    }

    loadStats()
  }, [user])

  const incrementUsage = async (metadata?: any) => {
    const tokens = metadata?.totalTokenCount || metadata?.total_tokens || 0
    const now = Date.now()
    const today = new Date().toDateString()

    const newUsage = dailyUsage + 1
    const newTokens = dailyTokens + tokens

    setDailyUsage(newUsage)
    setDailyTokens(newTokens)
    setRecentCalls(prev => [...prev, { timestamp: now, tokens }])

    // Update Local Storage
    localStorage.setItem('gemini_daily_usage', newUsage.toString())
    localStorage.setItem('gemini_daily_tokens', newTokens.toString())
    localStorage.setItem('gemini_usage_date', today)

    // Update Database if user logged in
    if (user) {
      try {
        await updateUserStats(user.uid, {
          daily_usage: newUsage,
          daily_tokens: newTokens,
          last_usage_date: today
        })
      } catch (err) {
        console.warn("Failed to sync stats to PocketBase, keeping local only.");
      }
    }
  }

  const validateInternal = async (key: string): Promise<boolean> => {
    if (!key) return false
    setIsLoading(true)
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: key })
      })
      
      if (response.ok) {
        setIsValid(true)
        return true
      } else {
        setIsValid(false)
        return false
      }
    } catch (e) {
      setIsValid(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const setApiKey = async (key: string): Promise<boolean> => {
    setApiKeyState(key)
    localStorage.setItem('user_gemini_key', key)
    if (user) {
      await updateUserStats(user.uid, { api_key: key })
    }
    const valid = await validateInternal(key)
    return valid
  }

  const setModel = async (newModel: string) => {
    setModelState(newModel)
    localStorage.setItem('user_gemini_model', newModel)
    if (user) {
      await updateUserStats(user.uid, { preferred_model: newModel })
    }
  }

  const validateKey = async () => {
    return validateInternal(apiKey)
  }

  return (
    <ApiContext.Provider value={{ 
      apiKey, model, isValid, isLoading, 
      dailyUsage, maxDailyUsage, dailyTokens,
      currentRPM, currentTPM,
      setApiKey, setModel, validateKey, incrementUsage 
    }}>
      {children}
    </ApiContext.Provider>
  )
}

export function useApi() {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}
