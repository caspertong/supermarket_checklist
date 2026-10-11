"use client";

import { Checklist } from "@/components/checklist";
import { Gate } from "@/components/gate";

export default function Home() {
  return <Gate>{({ member, signOut }) => <Checklist member={member} onSignOut={signOut} />}</Gate>;
}
