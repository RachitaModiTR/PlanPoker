/**
 * Simple sound utility using Web Audio API
 */
export const playRevealSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    
    // Function to play a single note
    const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle'; // Brighter, more game-like sound
        osc.frequency.value = freq;
        
        // Envelope: Attack -> Decay
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05); // Quick attack
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Smooth decay
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    // "Ta-da!" effect: Rising major arpeggio
    playNote(523.25, now, 0.6);       // C5
    playNote(659.25, now + 0.1, 0.6); // E5
    playNote(783.99, now + 0.2, 0.6); // G5
    playNote(1046.50, now + 0.3, 1.2); // C6 (Longer, higher finish)

  } catch (e) {
    console.error('Failed to play sound', e);
  }
};

