"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Sparkles, Ghost, Mail, Lock, Loader2, UserPlus, ShieldCheck, Camera, MapPin, Heart, Award, ChevronRight, Edit3, Save, X, User, Zap } from 'lucide-react'
import { auth } from '../lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { cn } from '../lib/utils'
import { useUser } from './UserContext'
import { useLanguage } from './LanguageContext'

export function UserAuth() {
  const { user: contextUser, isAuthModalOpen: isOpen, setIsAuthModalOpen: setIsOpen } = useUser()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup' | 'profile' | 'edit' | 'setup'>('login')
  
  // Form & Profile State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('😊')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // API Stamina State
  const [usage, setUsage] = useState(0)

  const emojis = [
    '😊', '😂', '❤️', '😍', '✨', '🙌', '🔥', '🤔', '😎', '🎨', 
    '🚀', '🐱', '🐶', '🦊', '🍀', '🌈', '🍎', '🍕', '🌊', '🎸', 
    '🤖', '🎮', '📱', '💻', '💡', '📚', '🌍', '🏔️', '☀️', '🌙'
  ]

  useEffect(() => {
    // Load usage from localStorage
    const savedUsage = localStorage.getItem('gemini_api_usage')
    if (savedUsage) setUsage(parseFloat(savedUsage))

    // Listen for usage updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gemini_api_usage' && e.newValue) {
        setUsage(parseFloat(e.newValue))
      }
    }
    window.addEventListener('storage', handleStorageChange)

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        if (!currentUser.displayName || !currentUser.displayName.includes('|')) {
          setMode('setup')
          setIsOpen(true)
        } else {
          setMode('profile')
          const [emoji, name] = currentUser.displayName.split('|')
          setSelectedEmoji(emoji || '😊')
          setNickname(name || 'Visitor')
        }
      } else {
        setMode('login')
      }
      setLoading(false)
    })
    return () => {
      unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const hpPercentage = Math.max(0, 100 - usage)
  const hpColor = hpPercentage > 60 ? 'bg-green-500' : hpPercentage > 30 ? 'bg-amber-500' : 'bg-red-500'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setAuthLoading(true)
    setError(null)
    try {
      await updateProfile(user, {
        displayName: `${selectedEmoji}|${nickname.trim() || 'Visitor'}`
      })
      setMode('profile')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      // onAuthStateChanged will handle the mode switch
    } catch (err: any) {
      setError(err.message.replace('Firebase:', ''))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        setIsOpen(false)
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, {
          displayName: `${selectedEmoji}|${nickname.trim() || 'Visitor'}`
        })
        setIsOpen(false)
      }
      setEmail('')
      setPassword('')
      setNickname('')
    } catch (err: any) {
      setError(err.message.replace('Firebase:', ''))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setIsOpen(false)
  }

  const getProfile = () => {
    if (!user?.displayName) return { emoji: '👤', name: user?.email?.split('@')[0] || 'Visitor' }
    const parts = user.displayName.split('|')
    return { emoji: parts[0] || '👤', name: parts[1] || 'Visitor' }
  }

  if (loading) return null

  const profile = getProfile()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-foreground/5 rounded-full transition-colors flex items-center gap-2 group"
        aria-label="User account"
      >
        {user ? (
          <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-xl shadow-inner border border-foreground/5">
            {profile.emoji}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/30 group-hover:text-foreground/60 transition-colors">
            <Ghost size={18} strokeWidth={1.5} />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => mode !== 'setup' && setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "fixed md:absolute top-[15%] md:top-full left-4 right-4 md:left-auto md:right-0 md:mt-4",
                "w-auto md:w-[400px] max-h-[70vh] md:max-h-none overflow-y-auto custom-scrollbar",
                "bg-background border border-foreground/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[2rem] md:rounded-[2.5rem] z-[101]"
              )}
            >
              {user && (mode === 'profile' || mode === 'edit' || mode === 'setup') ? (
                <div className="flex flex-col">
                  {/* Profile Header Card */}
                  <div className="p-6 md:p-8 pb-4 md:pb-6 bg-gradient-to-br from-foreground/[0.03] to-transparent">
                    <div className="flex items-start justify-between mb-4 md:mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.8rem] bg-background shadow-2xl flex items-center justify-center text-3xl md:text-4xl border border-foreground/5 relative overflow-hidden group/avatar">
                          {profile.emoji}
                          {(mode === 'edit' || mode === 'setup') && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <Camera size={20} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 border-[3px] border-background" />
                      </div>
                      {mode !== 'setup' && (
                        <button 
                          onClick={() => setIsOpen(false)}
                          className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                        >
                          <X size={18} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>

                    {mode === 'edit' || mode === 'setup' ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Avatar</label>
                          <div className="grid grid-cols-5 xs:grid-cols-6 gap-2 p-3 md:p-4 bg-foreground/[0.02] rounded-2xl md:rounded-3xl border border-foreground/5 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
                            {emojis.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setSelectedEmoji(emoji)}
                                className={cn(
                                  "w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-lg md:text-xl transition-all",
                                  selectedEmoji === emoji ? "bg-foreground text-background scale-110 shadow-lg" : "hover:bg-foreground/10"
                                )}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('identity_basics')}</label>
                          <div className="relative">
                            <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                              type="text"
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value)}
                              className="w-full bg-background border border-foreground/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-xs md:text-sm font-black tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
                              placeholder="YOUR NAME"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="flex-1 bg-foreground text-background py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {mode === 'setup' ? 'Initialize Profile' : 'Save Changes'}
                          </button>
                          {mode !== 'setup' && (
                            <button
                              type="button"
                              onClick={() => setMode('profile')}
                              className="px-4 md:px-6 py-3 md:py-4 border border-foreground/10 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl md:text-2xl font-black tracking-tighter">{profile.name}</h3>
                          <button 
                            onClick={() => setMode('edit')}
                            className="p-1.5 hover:bg-foreground/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] truncate max-w-[200px]">{user.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Profile Content */}
                  {mode === 'profile' && (
                    <div className="p-6 md:p-8 pt-2 md:pt-4 space-y-4 md:space-y-6 animate-in fade-in duration-500">
                      {/* API Stamina Block */}
                      <div className="p-4 md:p-5 bg-foreground/[0.03] border border-foreground/5 rounded-2xl md:rounded-[2rem] space-y-3 shadow-inner">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Zap size={14} className={cn("transition-colors", hpPercentage > 0 ? "text-blue-500 fill-blue-500" : "text-muted-foreground")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('api_stamina')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-black tracking-tighter", hpPercentage > 30 ? "text-foreground" : "text-red-500")}>
                              {hpPercentage.toFixed(1)}%
                            </span>
                            <button 
                              onClick={() => {
                                localStorage.setItem('gemini_api_usage', '0');
                                setUsage(0);
                              }}
                              className="p-1 hover:bg-foreground/5 rounded-md transition-colors"
                              title="Reset Stamina"
                            >
                              <Sparkles size={10} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercentage}%` }}
                            className={cn("h-full transition-colors duration-1000", hpColor)}
                          />
                        </div>
                        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest text-center opacity-60">
                          {t('engine_health')}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <div className="p-2 md:p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl md:rounded-2xl text-center space-y-0.5">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Rank</p>
                          <p className="text-sm md:text-lg font-black tracking-tighter">ELITE</p>
                        </div>
                        <div className="p-2 md:p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl md:rounded-2xl text-center space-y-0.5">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Impact</p>
                          <p className="text-sm md:text-lg font-black tracking-tighter">9.2k</p>
                        </div>
                        <div className="p-2 md:p-3 bg-foreground/[0.02] border border-foreground/5 rounded-xl md:rounded-2xl text-center space-y-0.5">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Stories</p>
                          <p className="text-sm md:text-lg font-black tracking-tighter">14</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 md:p-4 bg-foreground/[0.02] border border-foreground/5 rounded-xl md:rounded-2xl group cursor-pointer hover:bg-foreground/[0.04] transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                              <Award className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest">Membership</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase">Certified Reader</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div className="flex items-center justify-between p-3 md:p-4 bg-foreground/[0.02] border border-foreground/5 rounded-xl md:rounded-2xl group cursor-pointer hover:bg-foreground/[0.04] transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                              <Heart className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest">Toolish Library</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase">Saved Collections</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 md:py-4 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl md:rounded-2xl transition-all text-[9px] font-black uppercase tracking-[0.2em] border border-foreground/5"
                      >
                        <LogOut size={16} />
                        Deauthorize Session
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{t('gate_title')}</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] leading-relaxed">
                        {t('gate_desc')}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                    >
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-3 md:space-y-4" autoComplete="off">
                    {mode === 'signup' && (
                      <div className="space-y-3 md:space-y-4 pb-1 md:pb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('identity_basics')}</label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="YOUR NAME"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={20}
                            autoComplete="off"
                            className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-[10px] md:text-xs font-black tracking-widest focus:outline-none focus:border-foreground/20 transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 md:space-y-3">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
                        <input
                          type="email"
                          placeholder={t('email_address')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="new-password"
                          className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-[10px] md:text-xs font-bold focus:outline-none focus:border-foreground/20 transition-all"
                          required
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
                        <input
                          type="password"
                          placeholder={t('security_key')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full bg-foreground/[0.03] border border-foreground/10 rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 pr-4 text-[10px] md:text-xs font-bold focus:outline-none focus:border-foreground/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-500/10">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-foreground text-background py-4 md:py-5 rounded-xl md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] shadow-foreground/20 disabled:opacity-50"
                    >
                      {authLoading ? <Loader2 size={18} className="animate-spin" /> : (mode === 'login' ? <ShieldCheck size={18} /> : <UserPlus size={18} />)}
                      {mode === 'login' ? t('authenticate') : t('forge_identity')}
                    </button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-foreground/5"></span></div>
                    <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-background px-4 text-muted-foreground tracking-[0.5em]">SYNERGY</span></div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full bg-foreground/[0.02] border border-foreground/5 py-4 md:py-5 rounded-xl md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-foreground/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t('omni_connect')}
                  </button>

                  <div className="pt-1 md:pt-2 text-center">
                    <button
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {mode === 'login' ? t('new_persona') : t('known_entity')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
