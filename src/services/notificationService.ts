import { NotificationItem, UserRole } from '../types';

type NotificationListener = (item: NotificationItem) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = false;

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public playChime() {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Ignore audio failure if user has not interacted
    }
  }

  public broadcast(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const newItem: NotificationItem = {
      ...item,
      id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.playChime();
    this.listeners.forEach((listener) => {
      try {
        listener(newItem);
      } catch (err) {
        console.error('Error in notification listener', err);
      }
    });

    return newItem;
  }
}

export const notificationService = new NotificationService();
