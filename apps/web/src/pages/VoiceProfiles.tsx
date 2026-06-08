import { Play, Sparkles, Upload } from 'lucide-react';

import { Waveform } from '@/components/Waveform';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface VoiceProfile {
  name: string;
  lang: string;
  accent: string;
  gender: string;
  usage: string;
  img: number;
  color: string;
}

const VOICES: VoiceProfile[] = [
  { name: 'Sofia',    lang: 'English · US',      accent: 'Professional', gender: 'Female', usage: '8.2K calls', img: 1,  color: '#EC4899' },
  { name: 'Marcus',  lang: 'English · UK',      accent: 'Conversational', gender: 'Male',   usage: '5.4K calls', img: 13, color: '#3B82F6' },
  { name: 'Isabella', lang: 'Spanish · LATAM',  accent: 'Warm',          gender: 'Female', usage: '3.1K calls', img: 25, color: '#F59E0B' },
  { name: 'Kenji',   lang: 'Japanese',          accent: 'Formal',        gender: 'Male',   usage: '1.8K calls', img: 33, color: '#22C55E' },
  { name: 'Amara',   lang: 'French',            accent: 'Friendly',      gender: 'Female', usage: '2.4K calls', img: 49, color: '#3B82F6' },
  { name: 'Liam',    lang: 'German',            accent: 'Clear',         gender: 'Male',   usage: '1.2K calls', img: 60, color: '#14B8A6' },
  { name: 'Priya',   lang: 'Hindi',             accent: 'Warm',          gender: 'Female', usage: '2.0K calls', img: 28, color: '#F472B6' },
  { name: 'Lucas',   lang: 'Portuguese · BR',   accent: 'Energetic',     gender: 'Male',   usage: '1.6K calls', img: 53, color: '#06B6D4' },
];

function VoiceCard({ voice }: { voice: VoiceProfile }) {
  return (
    <div className="dash-card relative overflow-hidden p-5 flex flex-col gap-4">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full"
        style={{
          background: `radial-gradient(circle, ${voice.color}33 0%, transparent 70%)`,
        }}
      />

      {/* Avatar + meta */}
      <div className="flex items-center gap-3 relative">
        <img
          src={`https://i.pravatar.cc/120?img=${voice.img}`}
          alt={voice.name}
          width={48}
          height={48}
          className="rounded-full shrink-0 object-cover"
          style={{ border: `2px solid ${voice.color}` }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-[hsl(var(--text))] leading-tight">
              {voice.name}
            </span>
            <span
              className="chip text-[10px]"
              style={{ color: voice.color, borderColor: `${voice.color}50`, background: `${voice.color}15` }}
            >
              {voice.gender}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--text-secondary))] mt-0.5 truncate">{voice.lang}</p>
        </div>
      </div>

      {/* Waveform */}
      <div className="relative">
        <Waveform bars={28} height={32} color={voice.color} />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 relative">
        <span className="text-xs text-[hsl(var(--text-tertiary))] truncate">
          {voice.accent} &middot; {voice.usage}
        </span>
        <button
          type="button"
          aria-label={`Play ${voice.name}`}
          className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 shrink-0"
          style={{
            width: 30,
            height: 30,
            background: `${voice.color}1A`,
            border: `1px solid ${voice.color}40`,
            color: voice.color,
          }}
        >
          <Play size={13} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

export function VoiceProfilesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Voice Profiles"
        description="ElevenLabs voices in 29+ languages. Preview, assign, and clone."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Upload size={14} />
              Clone Voice
            </Button>
            <Button variant="default" size="sm">
              <Sparkles size={14} />
              Browse Library
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VOICES.map((voice) => (
          <VoiceCard key={voice.name} voice={voice} />
        ))}
      </div>
    </div>
  );
}
