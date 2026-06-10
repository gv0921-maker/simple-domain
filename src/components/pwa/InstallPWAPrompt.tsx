import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DISMISS_KEY = "glf.pwa.installDismissedAt";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

function dismissedRecently() {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    return Date.now() - parseInt(v, 10) < DISMISS_MS;
  } catch {
    return false;
  }
}

export function InstallPWAPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isMobile() || isStandalone() || dismissedRecently()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari never fires beforeinstallprompt — surface a one-time tip toast.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOSSafari()) {
      iosTimer = setTimeout(() => {
        if (dismissedRecently()) return;
        toast({
          title: "Install GLF on your iPhone",
          description: "Tap the Share button and then Add to Home Screen.",
          duration: 8000,
        });
        try {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
          /* noop */
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [toast]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  };

  if (!visible || !deferred) return null;

  return (
    <div
      className="md:hidden fixed inset-x-2 z-50 rounded-lg border bg-card shadow-lg p-3 flex items-center gap-3"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Install GLF app"
    >
      <Share className="h-5 w-5 text-primary shrink-0" />
      <div className="text-sm flex-1 min-w-0">
        <div className="font-medium">Install GLF app</div>
        <div className="text-xs text-muted-foreground">Faster access from your home screen.</div>
      </div>
      <Button size="sm" onClick={install}>Install</Button>
      <Button size="sm" variant="ghost" onClick={dismiss} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}