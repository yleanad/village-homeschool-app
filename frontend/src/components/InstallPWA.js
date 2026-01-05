import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show prompt after a delay if user hasn't installed
      const hasDeclined = localStorage.getItem('pwa-install-declined');
      const lastPrompt = localStorage.getItem('pwa-install-last-prompt');
      const daysSincePrompt = lastPrompt ? 
        (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24) : 999;

      if (!hasDeclined || daysSincePrompt > 7) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt if on Safari
    if (iOS && !standalone) {
      const hasSeenIOSPrompt = localStorage.getItem('pwa-ios-prompt-seen');
      if (!hasSeenIOSPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    const result = await installPrompt.prompt();
    console.log('Install prompt result:', result);
    
    setInstallPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-last-prompt', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-declined', 'true');
    localStorage.setItem('pwa-install-last-prompt', Date.now().toString());
    if (isIOS) {
      localStorage.setItem('pwa-ios-prompt-seen', 'true');
    }
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-[#E0E0E0] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#C8907A] to-[#5B9A8B] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Install Village Friends</h3>
                    <p className="text-white/80 text-sm">Add to your home screen</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white p-1"
                  data-testid="pwa-dismiss-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#5F6F75]">
                    Install this app on your iPhone:
                  </p>
                  <ol className="text-sm text-[#2C3E50] space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C8907A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      <span>Tap the <strong>Share</strong> button in Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C8907A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C8907A] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      <span>Tap <strong>Add</strong> to confirm</span>
                    </li>
                  </ol>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Got it
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#5F6F75]">
                    Get quick access to Village Friends right from your home screen. Works offline too!
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      className="flex-1 bg-[#C8907A] hover:bg-[#B07A66] text-white"
                      data-testid="pwa-install-btn"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      Not now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;
