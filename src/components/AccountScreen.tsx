import { X, User, Mail, Lock, Crown, Trophy, LogOut, ArrowRight, AlertCircle, CheckCircle, Star, Flame, Gamepad2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authManager } from '../game/database/AuthManager';
import { statsManager } from '../game/database/StatsManager';
import { leaderboardManager } from '../game/database/LeaderboardManager';
import { soundManager } from '../game/SoundManager';

interface AccountScreenProps {
  onClose: () => void;
}

export function AccountScreen({ onClose }: AccountScreenProps) {
  const [mode, setMode] = useState<'main' | 'login' | 'register' | 'upgrade'>('main');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(authManager.getProfile());
  const [stats, setStats] = useState(statsManager.getStats());
  const [myRank, setMyRank] = useState(0);

  useEffect(() => {
    const updateData = () => {
      setProfile(authManager.getProfile());
      setStats(statsManager.getStats());
      setMyRank(leaderboardManager.getMyRank());
    };
    updateData();
    const unsub1 = authManager.subscribe(() => updateData());
    const unsub2 = statsManager.subscribe(() => updateData());
    return () => { unsub1(); unsub2(); };
  }, []);

  const isGuest = profile?.is_guest;

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authManager.signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      } else {
        setMode('main');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authManager.signUp(username, email, password);
      if (!result.success) {
        setError(result.error || 'Registration failed');
      } else {
        setMode('main');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    }
    setLoading(false);
  };

  const handleConvertToAccount = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authManager.convertGuest(username, email, password);
      if (!result.success) {
        setError(result.error || 'Conversion failed');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Conversion failed');
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    authManager.signInAsGuest();
    soundManager.uiClick();
    setMode('main');
  };

  const handleLogout = () => {
    authManager.signOut();
    soundManager.uiClick();
  };

  if (mode !== 'main' && isGuest) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-6 border border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create Account</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-zinc-400 text-sm">
            Convert your guest progress to a permanent account. Your stats and achievements will be saved.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMode('main')}
              className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-600"
            >
              Back
            </button>
            <button
              onClick={handleConvertToAccount}
              disabled={loading}
              className="flex-1 py-3 bg-cyan-500 text-black rounded-lg font-bold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Converting...' : 'Convert Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-6 border border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setMode('main'); setError(''); }}
              className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-600"
            >
              Back
            </button>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 py-3 bg-cyan-500 text-black rounded-lg font-bold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <button
            onClick={() => { setMode('register'); setError(''); }}
            className="w-full text-center text-zinc-400 text-sm hover:text-white"
          >
            Don't have an account? <span className="text-cyan-400">Sign up</span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-6 border border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create Account</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setMode('main'); setError(''); }}
              className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-600"
            >
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 py-3 bg-cyan-500 text-black rounded-lg font-bold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>

          <button
            onClick={() => { setMode('login'); setError(''); }}
            className="w-full text-center text-zinc-400 text-sm hover:text-white"
          >
            Already have an account? <span className="text-cyan-400">Sign in</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-6 border border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Account</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {profile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-2xl font-bold">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{profile.username}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-cyan-400 text-sm flex items-center gap-1">
                    <Star className="w-3 h-3" /> Level {profile.level}
                  </span>
                  <span className="text-purple-400 text-sm flex items-center gap-1">
                    <Crown className="w-3 h-3" /> {profile.crystals} crystals
                  </span>
                </div>
                {profile.is_guest ? (
                  <span className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                    <Crown className="w-3 h-3" /> Guest Player
                  </span>
                ) : (
                  <span className="text-green-400 text-xs flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> {profile.email}
                  </span>
                )}
              </div>
            </div>

            {myRank > 0 && (
              <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Leaderboard Rank</span>
                  <span className="text-xl font-bold text-cyan-400">#{myRank}</span>
                </div>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="text-zinc-500 text-xs">Total Score</div>
                  <div className="text-white font-bold">{stats.total_score.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="text-zinc-500 text-xs">Highest Wave</div>
                  <div className="text-white font-bold">{stats.highest_wave}</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="text-zinc-500 text-xs">Bugs Smashed</div>
                  <div className="text-white font-bold">{stats.bugs_smashed.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <div className="text-zinc-500 text-xs">Games Played</div>
                  <div className="text-white font-bold">{stats.games_played}</div>
                </div>
              </div>
            )}

            {profile.is_guest && (
              <button
                onClick={() => setMode('upgrade')}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Full Account
              </button>
            )}

            {!profile.is_guest ? (
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-red-500/50 text-red-400 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-zinc-700 text-zinc-400 rounded-lg flex items-center justify-center gap-2 hover:text-white hover:border-zinc-600"
              >
                Reset Progress
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-6">
              <User className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-400 mb-4">Sign in to save your progress and compete on leaderboards</p>
              <button
                onClick={handleGuestLogin}
                className="w-full py-3 bg-white text-black rounded-lg font-bold hover:bg-zinc-200"
              >
                Continue as Guest
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-900 px-4 text-zinc-500 text-sm">or</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('login')}
                className="py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-600 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className="py-3 bg-cyan-500 text-black rounded-lg font-bold hover:bg-cyan-400 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}