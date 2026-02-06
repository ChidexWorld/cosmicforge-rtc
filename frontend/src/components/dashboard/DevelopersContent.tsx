"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Code2,
  Key,
  Globe,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DevelopersContent() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col font-inter bg-white/50">
      <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 bg-white">
        <div>
          <h1 className="text-2xl font-bold text-[#343434] flex items-center gap-2">
            <Code2 className="w-8 h-8 text-[#029CD4]" />
            Developer Guide
          </h1>
          <p className="text-[#00000080] mt-1">
            Build powerful real-time video applications with CosmicForge RTC
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/settings")}
          variant="outline"
          className="hidden sm:flex"
        >
          <Key className="w-4 h-4 mr-2" />
          Get API Keys
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-12">
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F5FA] flex items-center justify-center text-[#029CD4]">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#343434]">
                What is CosmicForge RTC?
              </h2>
            </div>
            <div className="pl-[52px] space-y-4 text-gray-600 leading-relaxed">
              <p>
                CosmicForge RTC is a developer-first platform designed to
                simplify the integration of real-time audio and video
                communications into your applications. Whether you&apos;re building a
                telehealth platform, an educational tool, or a social video app,
                specific infrastructure often becomes a bottleneck.
              </p>
              <p>
                We provide a robust, scalable Backend-as-a-Service (BaaS)
                solution that handles the heavy lifting—signaling, media
                transport, and session management—so you can focus on building
                your frontend experience.
              </p>
            </div>
          </section>

          {/* Core Features */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F5FA] flex items-center justify-center text-[#029CD4]">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#343434]">
                Core Capabilities
              </h2>
            </div>
            <div className="pl-[52px] grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#343434] mb-2">
                  Instant Meetings
                </h3>
                <p className="text-sm text-gray-500">
                  Create and join meetings instantly with low-latency signaling
                  and high-quality media streams.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#343434] mb-2">
                  Secure Rooms
                </h3>
                <p className="text-sm text-gray-500">
                  Protect your sessions with private meeting modes and
                  role-based access control.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#343434] mb-2">
                  Participant Management
                </h3>
                <p className="text-sm text-gray-500">
                  Real-time events for participant joins, leaves, and state
                  changes via webhooks (coming soon).
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[#343434] mb-2">
                  Developer Friendly
                </h3>
                <p className="text-sm text-gray-500">
                  Simple REST API for management and WebSocket interfaces for
                  real-time interaction.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Start Guide */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F5FA] flex items-center justify-center text-[#029CD4]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#343434]">
                Getting Started
              </h2>
            </div>

            <div className="pl-[52px] space-y-6">
              {/* Step 1 */}
              <div className="relative border-l-2 border-gray-200 pl-6 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#029CD4]" />
                <h3 className="font-semibold text-[#343434] mb-1">
                  1. Generate an API Key
                </h3>
                <p className="text-gray-600 mb-3">
                  Navigate to the{" "}
                  <span
                    className="font-medium text-[#029CD4] cursor-pointer hover:underline"
                    onClick={() => router.push("/dashboard/settings")}
                  >
                    Settings Page
                  </span>{" "}
                  and create a new API Key. This key will identify your
                  application in all requests.
                </p>
                <div className="bg-[#1E1E1E] rounded-md p-3 font-mono text-xs text-green-400 overflow-x-auto">
                  X-Api-Key: cf_live_...
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative border-l-2 border-gray-200 pl-6 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#029CD4]" />
                <h3 className="font-semibold text-[#343434] mb-1">
                  2. Create a Meeting
                </h3>
                <p className="text-gray-600 mb-3">
                  Make a POST request to our API to initialize a meeting room.
                </p>
                <div className="bg-[#1E1E1E] rounded-md p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                  <span className="text-purple-400">POST</span> /api/v1/meetings
                  <br />
                  <span className="text-orange-400">Content-Type:</span>{" "}
                  application/json
                  <br />
                  <span className="text-orange-400">X-Api-Key:</span>{" "}
                  YOUR_API_KEY
                  <br />
                  <br />
                  {"{"}
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-400">
                    &quot;title&quot;
                  </span>:{" "}
                  <span className="text-green-400">&quot;My First Meeting&quot;</span>,
                  <br />
                  &nbsp;&nbsp;
                  <span className="text-blue-400">&quot;is_private&quot;</span>:{" "}
                  <span className="text-blue-500">false</span>
                  <br />
                  {"}"}
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative border-l-2 border-transparent pl-6 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#029CD4]" />
                <h3 className="font-semibold text-[#343434] mb-1">
                  3. Connect Users
                </h3>
                <p className="text-gray-600">
                  Use the returned <code>join_url</code> or{" "}
                  <code>meeting_identifier</code> to connect your frontend
                  application to the room.
                </p>
              </div>
            </div>
          </section>

          {/* Integration Model */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F5FA] flex items-center justify-center text-[#029CD4]">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#343434]">
                Integration Model
              </h2>
            </div>
            <div className="pl-[52px]">
              <div className="bg-[#FAFAFB] border border-gray-200 rounded-xl p-6">
                <h4 className="font-medium text-[#343434] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Security First Architecture
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  CosmicForge RTC uses a secure token-based authentication
                  system for end-users. Your backend server communicates with
                  our API using your <strong>Secret API Key</strong> to create
                  meetings.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Refer to the internal README or contact the platform
                  administrator for full Swagger/OpenAPI documentation links for
                  the current environment.
                </p>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
