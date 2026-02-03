"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LiveRoom from "@/components/room/live-room";
import PreJoinScreen from "@/components/room/pre-join-screen";
import type { JoinMeetingData } from "@/types/meeting";

export default function RoomPage() {
  const params = useParams();
  const id = params?.id as string;
  const [joinData, setJoinData] = useState<JoinMeetingData | null>(null);

  const handleJoin = (data: JoinMeetingData) => {
    setJoinData(data);
  };

  if (!id) return null;

  if (!joinData) {
    return <PreJoinScreen roomId={id} onJoin={handleJoin} />;
  }

  return <LiveRoom joinData={joinData} />;
}
