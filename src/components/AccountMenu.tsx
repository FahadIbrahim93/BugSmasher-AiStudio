import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User as LucideUser, Shield, X, Cloud, History } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AccountMenu({ onClose }: { onClose: () => void }) {
  const { user, profile, loading: authLoading, signIn, logOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await signIn()
    setLoading(false)
  }

  const handleLogout = async () => {
    await logOut()
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#050505] border border-white/10 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">CENTRAL ACCESS</h2>
              <p className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">Secure Identity Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div key="auth" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-zinc-400 text-sm">Welcome back, operative. Sync your progress to the grid.</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleLogin}
                      disabled={loading || authLoading}
                      className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <p className="text-[10px] text-zinc-600 font-mono text-center">
                      SECURE AUTHENTICATION VIA GOOGLE IDENTITY SERVICE
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <LucideUser className="w-10 h-10 text-white/20" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <h3 className="text-sm font-mono text-zinc-500 uppercase">Authenticated</h3>
                      </div>
                      <p className="text-xl font-bold text-white truncate max-w-[200px]">{profile?.username || user.displayName || 'Unknown'}</p>
                      <p className="text-[10px] font-mono text-zinc-600">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <Cloud className="w-4 h-4 text-blue-400 mb-2" />
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sync Status</p>
                      <p className="text-sm font-bold text-white">READY</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <History className="w-4 h-4 text-purple-400 mb-2" />
                      <p className="text[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Session</p>
                      <p className="text-sm font-bold text-white">ONLINE</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-4 text-red-400 hover:text-red-300 border border-red-500/10 hover:bg-red-500/5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all mt-4"
                  >
                    Terminate Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
