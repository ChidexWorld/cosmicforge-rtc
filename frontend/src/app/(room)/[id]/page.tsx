"use client";

import { useState } from "react";
import VideoGrid from "@/components/room/video-grid";
import Sidebar from "@/components/room/sidebar";
import FooterControls from "@/components/room/footer-controls";

export default function RoomPage({ params }: { params: { id: string } }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main Video Area */}
        <main className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
          <VideoGrid />
        </main>

        {/* Footer Controls */}
        <FooterControls
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* Conditional Sidebar - full height */}
      {isSidebarOpen && (
        <aside className="w-80  flex flex-col h-full transition-all duration-300">
          <Sidebar />
        </aside>
      )}
    </div>
  );
}
