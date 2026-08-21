const STEPS = [
  { title: "Pick a number", body: "Any whole dollar. It buys the highest place it can afford." },
  { title: "Pay once", body: "No account, no subscription. The payment is what claims the place." },
  { title: "You're listed", body: "Your entry goes live the moment it clears, and clicks start counting." },
];

/** Three chips that make the mechanic obvious without reading the rules. */
export function HowItWorks() {
  return (
    <section className="rounded-md border border-border p-3">
      <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        How it works
      </h2>
      <ol className="mt-3 flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-xs font-black text-primary tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-pretty text-muted-foreground">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
