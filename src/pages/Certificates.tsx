import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { BRAND } from '@/lib/brand';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Award, Download, Share2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Cert { id: string; cert_number: string; student_name: string; module_title: string; issued_at: string }

export default function CertificatesPage() {
  const { user } = useApp();
  const [certs, setCerts] = useState<Cert[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('certificates').select('*').eq('user_id', user.id).order('issued_at', { ascending: false });
      setCerts((data as any) || []);
    })();
  }, [user?.id]);

  const download = async (c: Cert) => {
    try {
      const url = `${window.location.origin}/verify/${c.cert_number}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();

      // background band
      doc.setFillColor(37, 99, 235); doc.rect(0, 0, W, 90, 'F');
      doc.setFillColor(248, 250, 252); doc.rect(0, 90, W, H - 90, 'F');
      doc.setDrawColor(37, 99, 235); doc.setLineWidth(3); doc.rect(24, 24, W - 48, H - 48);

      doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text(BRAND.name, 40, 55);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(BRAND.tagline, 40, 75);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(36);
      doc.text('Certificate of Completion', W / 2, 170, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(14);
      doc.text('This is proudly awarded to', W / 2, 210, { align: 'center' });

      doc.setFont('helvetica', 'bold'); doc.setFontSize(34); doc.setTextColor(37, 99, 235);
      doc.text(c.student_name, W / 2, 260, { align: 'center' });

      doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'normal'); doc.setFontSize(14);
      doc.text('for successfully completing the module', W / 2, 295, { align: 'center' });

      doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text(c.module_title, W / 2, 335, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(71, 85, 105);
      doc.text(`Issued: ${new Date(c.issued_at).toLocaleDateString()}`, 60, H - 60);
      doc.text(`Certificate No: ${c.cert_number}`, 60, H - 42);
      doc.text('Verify at ' + url, 60, H - 24);

      doc.addImage(qr, 'PNG', W - 160, H - 170, 110, 110);
      doc.save(`${BRAND.short}-${c.cert_number}.pdf`);
    } catch (e: any) { toast.error(e.message || 'PDF failed'); }
  };

  const share = async (c: Cert) => {
    const url = `${window.location.origin}/verify/${c.cert_number}`;
    try {
      if (navigator.share) await navigator.share({ title: `${BRAND.name} Certificate`, text: c.module_title, url });
      else { await navigator.clipboard.writeText(url); toast.success('Verification link copied.'); }
    } catch {}
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-4xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground mt-1">Downloadable, shareable and QR-verifiable.</p>
        </header>

        {certs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-10 text-center">
            <Award className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="mt-3 font-medium">No certificates yet</p>
            <p className="text-sm text-muted-foreground">Complete all tasks in a module to earn one.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {certs.map((c) => (
              <div key={c.id} className="rounded-2xl border bg-card shadow-card overflow-hidden">
                <div className="p-5 bg-brand-gradient text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-xs uppercase tracking-widest opacity-90">Certified</p>
                  </div>
                  <p className="font-display font-bold text-lg mt-1">{c.module_title}</p>
                  <p className="text-xs opacity-80 mt-1">Awarded to {c.student_name}</p>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate No</p>
                    <p className="font-mono font-semibold">{c.cert_number}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.issued_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => share(c)} aria-label="Share" className="p-2 rounded-lg border hover:bg-secondary min-h-11 min-w-11 flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => download(c)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
