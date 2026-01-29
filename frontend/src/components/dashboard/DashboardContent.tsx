import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Calendar } from "lucide-react";

export default function DashboardContent() {
  return (
    <div className="p-10">
      {/* Top actions */}
      <div className="flex justify-center gap-16 mt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-[#029CD4] flex items-center justify-center shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <span className="font-medium">New Meeting</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-[#FAFAFB] flex items-center justify-center shadow">
            <Calendar className="w-8 h-8 text-[#029CD4]" />
          </div>
          <span className="font-medium">Schedule</span>
        </div>
      </div>

      {/* Join input */}
      <div className="flex justify-center gap-3 mt-10">
        <Input
          placeholder="Enter Link"
          className="w-96"
        />
        <Button className="bg-[#029CD4]">Join</Button>
      </div>

      {/* Meeting history */}
      <div className="mt-20 px-20">
        <h3 className="font-semibold mb-4">Meeting History</h3>

        <div className="rounded-lg border p-6 text-sm text-gray-400">
          No meetings yet.
        </div>
      </div>
    </div>
  );
}
