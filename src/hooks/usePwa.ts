import { useEffect, useState } from 'react';
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function usePwa() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches,
  );
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const before = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const after = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', before);
    window.addEventListener('appinstalled', after);
    return () => {
      window.removeEventListener('beforeinstallprompt', before);
      window.removeEventListener('appinstalled', after);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setHelp(true);
      return;
    }
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  }
  return { installed, help, install };
}
