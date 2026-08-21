"use client";

import { useRef, useState, useTransition } from "react";
import { startTakeover } from "@/app/actions";
import { useBoard } from "@/components/board-context";
import { GlobeIcon, Spinner } from "@/components/icons";
import { TakeoverCountdown } from "@/components/takeover-countdown";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDollars } from "@/lib/format";
import { initialFor } from "@/lib/identity";

export function TakeoverCard() {
  const { board } = useBoard();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openModal() {
    setError(null);
    dialogRef.current?.showModal();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }
  function closeModal() { if (!pending) dialogRef.current?.close(); }
  function reserve() {
    if (!identity.trim()) {
      setError("Enter the website or @handle you want pinned at #1.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await startTakeover({ identity });
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  return (
    <>
      {board.takeover ? <ActivePass takeover={board.takeover} /> : <AvailablePass priceCents={board.takeoverPriceCents} onReserve={openModal} />}
      <dialog ref={dialogRef} onCancel={(event) => { if (pending) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }} className="m-auto w-[calc(100%-2rem)] max-w-lg border-2 border-foreground bg-card p-0 text-foreground shadow-hard backdrop:bg-foreground/55 backdrop:backdrop-blur-[2px]">
        <header className="flex items-start justify-between gap-5 border-b-2 border-foreground px-5 py-4 sm:px-6">
          <div><p className="text-[0.65rem] font-black tracking-[0.2em] text-primary uppercase">One-hour takeover</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Reserve page one</h2></div>
          <button type="button" onClick={closeModal} disabled={pending} aria-label="Close takeover dialog" className="flex size-9 shrink-0 items-center justify-center border border-foreground text-xl font-bold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40">×</button>
        </header>
        <div className="px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 border-2 border-foreground">
            <div className="border-r-2 border-foreground p-4"><p className="text-[0.6rem] font-black tracking-[0.15em] text-muted-foreground uppercase">Takeover price</p><p className="mt-1 text-4xl font-black tabular-nums">{formatDollars(board.takeoverPriceCents)}</p></div>
            <div className="p-4"><p className="text-[0.6rem] font-black tracking-[0.15em] text-muted-foreground uppercase">You reserve</p><p className="mt-2 text-sm font-black">#1 · 1 hour</p></div>
          </div>
          <label htmlFor="takeover-identity" className="mt-5 block text-xs font-black tracking-[0.12em] uppercase">Website or X handle</label>
          <div className="relative mt-2"><GlobeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input ref={inputRef} id="takeover-identity" value={identity} onChange={(event) => setIdentity(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") reserve(); }} disabled={pending} placeholder="example.com or @handle" className="h-12 border-foreground pl-10" aria-invalid={Boolean(error)} aria-describedby={error ? "takeover-notes takeover-error" : "takeover-notes"} /></div>
          <div id="takeover-notes" className="mt-5 border border-foreground bg-muted/60 p-4"><p className="text-[0.62rem] font-black tracking-[0.17em] uppercase">Before you reserve</p><ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground"><li>• Your listing is pinned at #1 for one hour.</li><li>• Existing page-one positions stay frozen.</li><li>• New bids fill any open page-one slots and freeze there.</li><li>• The displayed amount is charged in full at checkout.</li></ul></div>
          {error ? <p id="takeover-error" role="alert" className="mt-3 text-xs font-bold text-destructive">{error}</p> : null}
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t-2 border-foreground px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><Button type="button" variant="ghost" onClick={closeModal} disabled={pending}>Cancel</Button><Button type="button" variant="chunky" onClick={reserve} disabled={pending}>{pending ? <><Spinner className="size-4" />Opening checkout…</> : `Reserve for ${formatDollars(board.takeoverPriceCents)}`}</Button></footer>
      </dialog>
    </>
  );
}

function AvailablePass({ priceCents, onReserve }: { priceCents: number; onReserve: () => void }) {
  return (
    <section className="overflow-hidden border-2 border-foreground bg-card shadow-hard">
      <h2 className="border-b-2 border-foreground px-4 py-3 text-[0.65rem] font-black tracking-[0.18em] uppercase">Front page takeover</h2>
      <div className="grid grid-cols-[6.5rem_1fr] border-b-2 border-foreground">
        <div className="flex min-h-40 flex-col items-center justify-center border-r-2 border-foreground bg-primary text-primary-foreground"><span className="text-[0.58rem] font-black tracking-[0.2em] uppercase">Page</span><span className="text-6xl leading-none font-black tracking-[-0.08em] tabular-nums">01</span></div>
        <div className="flex flex-col justify-center p-4"><h3 className="text-2xl leading-none font-black tracking-[-0.04em]">Own the front page</h3><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Hold every page-one position for one uninterrupted hour.</p></div>
      </div>
      <div className="grid grid-cols-2 border-b-2 border-foreground"><LedgerCell label="Duration" value="1 hour" /><LedgerCell label="Guaranteed" value="Spot #1" border /></div>
      <div className="border-b-2 border-foreground px-4 py-4"><p className="text-[0.6rem] font-black tracking-[0.16em] text-muted-foreground uppercase">Takeover price</p><p className="mt-1 text-4xl font-black tracking-[-0.04em] tabular-nums">{formatDollars(priceCents)}</p><p className="mt-1 text-[11px] font-bold text-muted-foreground">2× the standing top bid</p></div>
      <ul className="space-y-2 border-b-2 border-foreground px-4 py-4 text-xs font-bold"><li>✓ Pinned at #1</li><li>✓ Occupied positions are frozen</li><li>✓ Open page-one slots remain available</li></ul>
      <div className="p-4"><Button type="button" variant="chunky" onClick={onReserve} className="w-full">Reserve page one · {formatDollars(priceCents)}</Button></div>
    </section>
  );
}

function ActivePass({ takeover }: { takeover: NonNullable<ReturnType<typeof useBoard>["board"]["takeover"]> }) {
  return (
    <section className="overflow-hidden border-2 border-foreground bg-card shadow-hard">
      <h2 className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 text-[0.65rem] font-black tracking-[0.16em] uppercase"><span>Page one · reserved</span><span className="size-2 bg-primary" aria-hidden="true" /></h2>
      <a href={takeover.sourceUrl} target="_blank" rel="sponsored noopener noreferrer" className="flex items-center gap-3 border-b-2 border-foreground p-4 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"><Avatar src={takeover.imageUrl} alt="" fallback={initialFor(takeover.label)} className="size-12 rounded-none border border-foreground" /><div className="min-w-0"><p className="truncate text-base font-black">{takeover.label}</p><p className="mt-1 text-[0.58rem] font-black tracking-[0.13em] text-primary uppercase">Page-one holder</p></div></a>
      <div className="border-b-2 border-foreground bg-primary px-4 py-5 text-primary-foreground"><p className="text-[0.58rem] font-black tracking-[0.17em] uppercase">Time remaining</p><TakeoverCountdown endsAt={takeover.endsAt} className="mt-1 block text-4xl font-black tracking-[-0.04em]" /></div>
      <div className="grid grid-cols-2 border-b-2 border-foreground"><LedgerCell label="Position" value="#01" /><LedgerCell label="Paid" value={formatDollars(takeover.amountCents)} border /></div>
      <div className="p-4 text-xs leading-relaxed text-muted-foreground"><p className="font-bold text-foreground">Occupied positions are frozen.</p><p className="mt-1">New bids fill open page-one slots until all 50 are occupied.</p></div>
    </section>
  );
}

function LedgerCell({ label, value, border = false }: { label: string; value: string; border?: boolean }) {
  return <div className={border ? "border-l-2 border-foreground p-3" : "p-3"}><p className="text-[0.55rem] font-black tracking-[0.15em] text-muted-foreground uppercase">{label}</p><p className="mt-1 text-lg font-black tabular-nums">{value}</p></div>;
}
