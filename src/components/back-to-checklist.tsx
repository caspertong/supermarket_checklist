import Link from "next/link";

export function BackToChecklist() {
  return (
    <Link
      href="/"
      className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-aqua"
    >
      <span aria-hidden className="text-base leading-none">←</span>
      Checklist
    </Link>
  );
}
