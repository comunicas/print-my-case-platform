import { ReactNode } from "react";

interface DSSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function DSSection({ id, title, description, children }: DSSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border pb-12 mb-12">
      <header className="mb-6">
        <h2 className="md-headline-medium text-foreground">{title}</h2>
        {description && (
          <p className="md-body-medium text-muted-foreground mt-2 max-w-3xl">{description}</p>
        )}
      </header>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

export function DSExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="md-title-small text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  );
}