'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

/**
 * Banner de instalação PWA para o MyFit.ai.
 * Suporta Android (beforeinstallprompt) e iOS (instrução manual Share → Tela de Início).
 * Segue o padrão canônico estabelecido no l4-comunica, adaptado à identidade visual do MyFit.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(true);
  const [isIOS] = useState(() => getIsIOS());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Evita re-exibir se o usuário já dispensou nesta sessão
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      setDismissed(true);
      return;
    }

    if (!isIOS && typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [isIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
    setShowIOSHint(false);
    setDismissed(true);
  };

  if (dismissed) return null;

  // Banner iOS
  if (isIOS && showIOSHint) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
        <div className="bg-gradient-to-r from-[#0F1115] to-[#151920] border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10">
          <div className="flex items-start gap-3">
            <div className="text-xl shrink-0 pt-0.5">📲</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">Instalar MyFit.ai</p>
              <p className="text-xs text-muted-foreground mt-1">
                Toque em{' '}
                <span className="font-mono bg-white/10 px-1 rounded">Compartilhar</span> e depois em{' '}
                <span className="font-mono bg-white/10 px-1 rounded">Adicionar à Tela de Início</span>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-white transition-colors shrink-0 p-1"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt || !deferredPrompt) return null;

  // Banner Android / Chrome
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
      <div className="bg-gradient-to-r from-[#0F1115] to-[#151920] border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="text-xl shrink-0 pt-0.5">💪</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">Instalar MyFit.ai</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione à tela de início para acesso rápido offline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/20">
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Instalar App
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-muted-foreground rounded-xl text-xs font-semibold transition-all"
          >
            Não agora
          </button>
        </div>
      </div>
    </div>
  );
}
