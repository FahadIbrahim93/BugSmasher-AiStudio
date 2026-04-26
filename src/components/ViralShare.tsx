import { useState, useCallback } from 'react';
import { Share2, Copy, Check, MessageCircle, Twitter } from 'lucide-react';
import { referralManager } from '../game/ReferralManager';

interface ViralShareProps {
  score: number;
  wave: number;
  kills: number;
  biome?: string;
}

export function ViralShareButton({ score, wave, kills, biome = 'neon_core' }: ViralShareProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = useCallback(() => {
    return `🎮 I scored ${score.toLocaleString()} points in BugSmasher!\n🐛 Wave ${wave} | ${kills} bugs smashed\n⚡ ${biome.replace('_', ' ')}\n\nCan you beat my score?\n\n🔗 ${referralManager.generateReferralLink()}\n#BugSmasher #HighScore`;
  }, [score, wave, kills, biome]);

  const handleNativeShare = useCallback(async () => {
    const text = generateShareText();
    
    try {
      if (navigator.share) {
        await navigator.share({ text });
        referralManager.recordInvite();
        return;
      }
    } catch {
      // fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      referralManager.recordInvite();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      referralManager.recordInvite();
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateShareText]);

  const handleTwitter = useCallback(() => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    referralManager.recordInvite();
  }, [generateShareText]);

  const handleWhatsApp = useCallback(() => {
    const text = generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    referralManager.recordInvite();
  }, [generateShareText]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleNativeShare}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
        
        <button
          onClick={handleTwitter}
          className="py-3 px-4 bg-black/50 hover:bg-black/70 border border-white/10 text-white rounded-full transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleWhatsApp}
          className="py-3 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-full transition-colors"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-xs text-zinc-500 text-center">
        Share with friends to earn rewards!
      </p>
    </div>
  );
}

export function CopyReferralLink() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const link = referralManager.generateReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-white/10 transition-colors"
    >
      <Copy className="w-4 h-4 text-zinc-400" />
      <span className="text-xs text-zinc-400">
        {copied ? 'Link copied!' : 'Copy invite link'}
      </span>
    </button>
  );
}

export function ReferralProgress() {
  const stats = referralManager.getStats();
  const { current, next } = referralManager.getProgressToReward(stats.totalReferrals);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Your referrals</span>
        <span className="text-white font-mono">{stats.totalReferrals}</span>
      </div>
      
      {next && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Next reward</span>
            <span className="text-cyan-400">{next.description}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${Math.min(100, (stats.totalReferrals / next.referrals) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-600">
            {next.referrals - stats.totalReferrals} more to unlock
          </p>
        </div>
      )}
      
      {current && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <p className="text-xs text-green-400">✓ Unlocked: {current.description}</p>
        </div>
      )}
    </div>
  );
}