"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Video, Calendar, MoreVertical, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useMeetings } from "@/hooks";
import type { Meeting } from "@/types/meeting";
import { formatDateForDisplay, formatTimeForDisplay } from "@/utils/timezone";

export default function DashboardContent() {
  const router = useRouter();
  const { data, isLoading } = useMeetings({ page: 1, limit: 20 });

  const meetings = data?.data ?? [];

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:p-10 font-inter overflow-hidden">
      {/* Top actions */}
      <div className="flex justify-center gap-8 sm:gap-12 md:gap-16 mt-8 sm:mt-14 md:mt-20">
        <div
          className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => router.push("/dashboard/meetings")}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-[#029CD4] flex items-center justify-center shadow-lg">
            <Video className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          </div>
          <span className="font-semibold text-sm sm:text-base md:text-lg">
            New Meeting
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => router.push("/dashboard/schedule")}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-[#FAFAFB] flex items-center justify-center shadow">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#029CD4]" />
          </div>
          <span className="font-semibold text-sm sm:text-base md:text-lg">
            Schedule
          </span>
        </div>
      </div>

      {/* Join input */}
      <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 md:mt-10 px-2">
        <Input
          placeholder="Enter Link or Code"
          className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[384px] h-10 sm:h-11"
        />
        <Button className="bg-[#029CD4] h-10 sm:h-11 px-5 sm:px-8 hover:bg-[#028bbd] shrink-0">
          Join
        </Button>
      </div>

      {/* Meeting history section */}
      <div className="mt-10 sm:mt-14 md:mt-20 px-0 sm:px-4 md:px-20">
        <h3 className="font-semibold mb-4 sm:mb-6 text-base sm:text-lg">
          Meeting History
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-[#029CD4] animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-[#00000080]">No meetings yet.</p>
        ) : (
          <div className="flex items-start gap-3 sm:gap-4">
            {/* STATIC ACCENT BAR */}
            <div
              className="w-[36px] sm:w-[45px] h-[100px] sm:h-[118px] bg-[#029CD44D] rounded-sm flex items-center justify-center shrink-0 cursor-pointer"
              onClick={() => router.push("/dashboard/schedule")}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#029CD4]" />
              </div>
            </div>

            {/* SCROLLABLE CARDS */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 sm:gap-4 pb-4">
                {meetings.map((meeting: Meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="w-[200px] sm:w-[230px] md:w-[258px] h-[100px] sm:h-[110px] md:h-[118px] bg-white rounded-[10px] p-3 sm:p-4 shadow-sm border border-gray-50 shrink-0 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h4 className="text-[#029CD4] font-semibold text-[13px] sm:text-[15px] md:text-[16px] leading-none truncate pr-2">
          {meeting.title}
        </h4>
        <MoreVertical className="w-4 h-4 text-[#00000080] cursor-pointer shrink-0" />
      </div>

      <div className="space-y-1">
        <p className="text-[#00000080] font-normal text-[11px] sm:text-[12px] leading-none">
          {formatDateForDisplay(meeting.start_time)}
        </p>
        <p className="text-[#00000080] font-normal text-[11px] sm:text-[12px] leading-none">
          {formatTimeForDisplay(meeting.start_time)}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[#00000080] font-normal text-[11px] sm:text-[12px] leading-none">
          {meeting.meeting_identifier}
        </span>
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((avatar) => (
            <div
              key={avatar}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white bg-gray-200 overflow-hidden"
            >
              <Image
                src={`https://i.pravatar.cc/150?u=${meeting.id}-${avatar}`}
                alt="user"
                width={24}
                height={24}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
