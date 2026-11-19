import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-aqua"
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {label}
    </Link>
  );
}

export function BackToChecklist() {
  return <BackLink href="/" label="Checklist" />;
}
