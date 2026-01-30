import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Video, Calendar, MoreVertical, Plus } from "lucide-react";
import Image from "next/image";

export default function DashboardContent() {
  const meetings = [1, 2, 3, 4, 5]; // Placeholder for your meeting data

  return (
    <div className="p-10 font-inter">
      {/* Top actions */}
      <div className="flex justify-center gap-16 mt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-[#029CD4] flex items-center justify-center shadow-lg cursor-pointer">
            <Video className="w-8 h-8 text-white" />
          </div>
          <span className="font-semibold text-lg">New Meeting</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-[#FAFAFB] flex items-center justify-center shadow cursor-pointer">
            <Calendar className="w-8 h-8 text-[#029CD4]" />
          </div>
          <span className="font-semibold text-lg">Schedule</span>
        </div>
      </div>

      {/* Join input */}
      <div className="flex justify-center gap-3 mt-10">
        <Input placeholder="Enter Link or Code" className="w-96 h-11" />
        <Button className="bg-[#029CD4] h-11 px-8 hover:bg-[#028bbd]">
          Join
        </Button>
      </div>

      {/* Meeting history section */}
      <div className="mt-20 px-4 md:px-20">
        <h3 className="font-semibold mb-6 text-lg">Meeting History</h3>

        <div className="flex items-start gap-4">
          {/* STATIC ACCENT BAR (#029CD44D) */}
          <div className="w-[45px] h-[118px] bg-[#029CD44D] rounded-sm flex items-center justify-center shrink-0">
            <div className="w-6 h-6 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#029CD4]" />
            </div>
          </div>

          {/* SCROLLABLE CARDS */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {meetings.map((_, i) => (
                <div
                  key={i}
                  className="w-[258px] h-[118px] bg-white rounded-[10px] p-4 shadow-sm border border-gray-50 shrink-0 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-[#029CD4] font-semibold text-[16px] leading-none truncate pr-2">
                      Health Community Meet Up
                    </h4>
                    <MoreVertical className="w-4 h-4 text-[#00000080] cursor-pointer" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[#00000080] font-normal text-[12px] leading-none">
                      20th, December 2025
                    </p>
                    <p className="text-[#00000080] font-normal text-[12px] leading-none">
                      11:00 pm
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#00000080] font-normal text-[12px] leading-none">
                      6 Guests
                    </span>
                    {/* Simple Avatar Stack */}
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((avatar) => (
                        <div
                          key={avatar}
                          className="w-6 h-6 rounded-full border border-white bg-gray-200 overflow-hidden"
                        >
                          <Image
                            src={`https://i.pravatar.cc/150?u=${avatar + i}`}
                            alt="user"
                            width={24}
                            height={24}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
