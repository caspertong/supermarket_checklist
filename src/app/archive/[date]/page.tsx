"use client";

import { useParams } from "next/navigation";
import { ArchiveDay } from "@/components/archive-views";

export default function ArchiveDatePage() {
  const params = useParams<{ date: string }>();
  return <ArchiveDay date={params.date} />;
}
