import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/lib/theme';
import { useApp } from '@/lib/app-context';
import { Sun, Moon, Monitor, Contrast, TextCursorInput, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme, highContrast, setHighContrast, largeText, setLargeText } = useTheme();
  const { user } = useApp();
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (newPass.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success('Password updated'); setNewPass(''); }
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-2xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Personalise your CampEdge experience.</p>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-display font-semibold mb-3">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {([['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']] as const).map(([val, Icon, label]) => (
              <button key={val} onClick={() => setTheme(val)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${theme === val ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40'}`}>
                <Icon className="w-5 h-5" /> <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-display font-semibold mb-3">Accessibility</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} className="w-4 h-4 accent-primary" />
              <Contrast className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">High contrast mode</p>
                <p className="text-xs text-muted-foreground">Increase contrast for better readability.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} className="w-4 h-4 accent-primary" />
              <TextCursorInput className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Larger text</p>
                <p className="text-xs text-muted-foreground">Increase base font size across the app.</p>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-display font-semibold mb-3">Security</h2>
          <div className="space-y-3">
            <label className="text-sm font-medium">Change password</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              </div>
              <button onClick={changePassword} disabled={saving} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Signed in as {user?.email}</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
