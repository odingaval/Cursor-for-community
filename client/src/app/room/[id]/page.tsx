"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RoomLoading } from "@/components/RoomLoading";

const RoomWorkspace = dynamic(
  () => import("@/components/RoomWorkspace").then((m) => m.RoomWorkspace),
  { ssr: false, loading: () => <RoomLoading message="Loading editor…" /> }
);

function RoomPageContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string | null>(null);

  const role = (searchParams.get("role") === "mentor" ? "mentor" : "member") as
    | "member"
    | "mentor";

  useEffect(() => {
    const name =
      searchParams.get("name") ||
      sessionStorage.getItem("cfc_userName") ||
      "Anonymous";
    setUserName(name);
  }, [searchParams]);

  if (userName === null) {
    return <RoomLoading message="Preparing session…" />;
  }

  return <RoomWorkspace roomId={roomId} userName={userName} role={role} />;
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<RoomLoading message="Loading room…" />}>
      <RoomPageContent roomId={id} />
    </Suspense>
  );
}
