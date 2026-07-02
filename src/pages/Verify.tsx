import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BrandMark } from '@/components/BrandMark';
import { BRAND } from '@/lib/brand';
import { CheckCircle2, XCircle, Award } from 'lucide-react';

export default function VerifyPage() {
  const { certNo } = useParams();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [cert, setCert] = useState<any>(null);

  useEffect(() => {
    if (!certNo) return;
    (async () => {
      const { data } = await supabase.from('certificates').select('*').eq('cert_number', certNo).maybeSingle();
      if (data) { setCert(data); setStatus('valid'); } else setStatus('invalid');
    })();
  }, [certNo]);

  return (
    <div className="min-h-screen-safe bg-background flex flex-col">
      <header className="container flex items-center justify-between py-4">
        <Link to="/"><BrandMark /></Link>
      </header>
      <main className="flex-1 container flex items-center justify-center py-10">
        <div className="w-full max-w-lg rounded-3xl border bg-card p-8 shadow-card text-center">
          {status === 'loading' && <p className="text-muted-foreground">Verifying…</p>}
          {status === 'invalid' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold mt-4">Invalid Certificate</h1>
              <p className="text-muted-foreground mt-1">We couldn't find a certificate with number <span className="font-mono">{certNo}</span>.</p>
            </>
          )}
          {status === 'valid' && cert && (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-success/15 text-success flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold mt-4">Verified</h1>
              <p className="text-sm text-muted-foreground">Issued by {BRAND.name}</p>
              <div className="mt-6 p-5 rounded-2xl bg-primary-soft text-left">
                <div className="flex items-center gap-2 text-primary"><Award className="w-4 h-4" /><span className="text-xs uppercase tracking-widest font-semibold">Certified</span></div>
                <p className="font-display text-xl font-bold mt-1">{cert.module_title}</p>
                <p className="text-sm mt-1">Awarded to <span className="font-semibold">{cert.student_name}</span></p>
                <p className="text-xs text-muted-foreground mt-2">Certificate No · <span className="font-mono">{cert.cert_number}</span></p>
                <p className="text-xs text-muted-foreground">Issued · {new Date(cert.issued_at).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
