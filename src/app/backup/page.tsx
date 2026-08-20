'use client';

import { useRef, useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { initFromAPI } from '@/core/store/poker-store';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type Step = 'idle' | 'choosing' | 'confirm-replace';

export default function BackupPage() {
  const mounted = useMounted();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleExport() {
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.text();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Backup descargado.');
    } catch (err) {
      setStatus(`Error al exportar: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingJson(reader.result as string);
      setStep('choosing');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function doImport(replace: boolean) {
    if (!pendingJson) return;
    try {
      const data = JSON.parse(pendingJson);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replace, ...data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await initFromAPI();
      setStatus(replace ? 'Datos reemplazados.' : 'Datos importados (merge).');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    }
    setPendingJson(null);
    setStep('idle');
  }

  function cancel() {
    setPendingJson(null);
    setStep('idle');
  }

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-serif text-2xl text-brass-300">Backup</h1>
      <p className="text-sm text-ivory-dim">
        Todos los datos son locales. El backup es el único puente entre dispositivos.
      </p>

      {status && (
        <div className="rounded-lg border border-brass-700 bg-felt-700 px-4 py-3 text-sm text-brass-300">
          {status}
          <button onClick={() => setStatus(null)} className="ml-3 align-middle text-ivory-dim hover:text-ivory" aria-label="Cerrar">
            <Icon name="close" size={16} className="inline" />
          </button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ivory-dim">Exportar</h2>
        <Button onClick={handleExport} className="w-full">
          Descargar backup JSON
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ivory-dim">Importar</h2>

        {step === 'idle' && (
          <>
            <p className="text-xs text-ivory-dim">
              Seleccioná un archivo .json exportado previamente.
            </p>
            <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full">
              Seleccionar archivo JSON
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          </>
        )}

        {step === 'choosing' && (
          <div className="rounded-xl border border-brass-700 bg-felt-700 p-4 space-y-3">
            <p className="text-sm font-semibold text-ivory">Archivo listo. ¿Cómo importar?</p>
            <p className="text-xs text-ivory-dim">
              <strong>Merge</strong>: agrega datos nuevos sin borrar los actuales (recomendado).<br />
              <strong>Reemplazar</strong>: borra todo y usa solo el backup.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => doImport(false)} className="w-full">
                Merge (recomendado)
              </Button>
              <Button variant="danger" onClick={() => setStep('confirm-replace')} className="w-full">
                Reemplazar todo
              </Button>
              <Button variant="ghost" onClick={cancel} className="w-full">Cancelar</Button>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={step === 'confirm-replace'}
        onClose={cancel}
        onConfirm={() => doImport(true)}
        title="Reemplazar todos los datos"
        message="Esto borrará todos los jugadores, sesiones y transacciones actuales y los reemplazará con el backup. ¿Confirmar?"
        confirmLabel="Reemplazar todo"
        confirmVariant="danger"
      />
    </div>
  );
}
