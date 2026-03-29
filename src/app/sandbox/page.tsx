"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SandboxLayout } from "@/components/sandbox";

function SandboxContent() {
  const searchParams = useSearchParams();
  const levelId = searchParams.get("level") ?? undefined;

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <SandboxLayout levelId={levelId} />
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-3.5rem)]" />}>
      <SandboxContent />
    </Suspense>
  );
}
