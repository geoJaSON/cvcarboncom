/**
 * Marks stand-in text that must be replaced before it can ship. Visibly
 * highlighted so it can never go out by accident.
 *
 * Currently the only use is the contact email address, which did not appear
 * anywhere in the legacy site.
 */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-amber-100 decoration-amber-500/50 decoration-dotted underline underline-offset-4">
      {children}
    </span>
  );
}
