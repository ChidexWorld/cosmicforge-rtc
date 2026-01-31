import { MoreVertical, Mic, Video, Paperclip, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      {/* Participants Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Participant (2)</h3>
          <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <div className="space-y-4">
          <ParticipantItem name="Abubakar Teslim" role="Host" isMuted={false} />
          <ParticipantItem name="Janet Adeyemi" isMuted={true} />
        </div>
      </div>

      {/* Chat Room Section */}
      <div className="flex-1 flex flex-col border rounded-xl bg-gray-50/50">
        <div className="p-3 border-b flex justify-between items-center bg-white rounded-t-xl">
          <span className="text-sm font-medium text-gray-600">Chat Room</span>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          <p className="text-xs text-center text-blue-500 italic">
            Janet is Typing...
          </p>
          {/* Messages would map here */}
        </div>

        <div className="p-3 bg-white border-t rounded-b-xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Type here..."
                className="pl-10 bg-gray-100 rounded-full text-sm"
              />
            </div>
            <button className="p-2 bg-sky-500 rounded-full text-white shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantItem({
  name,
  role,
  isMuted,
}: {
  name: string;
  role?: string;
  isMuted: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
          />
          <AvatarFallback>AT</AvatarFallback>
        </Avatar>
        <span className="text-sm text-gray-600 font-medium">{name}</span>
        {role && (
          <span className="text-[10px] text-sky-500 font-bold ml-1">
            {role}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {isMuted ? (
          <Mic className="w-4 h-4 text-gray-300" />
        ) : (
          <Mic className="w-4 h-4 text-sky-500" />
        )}
        <Video className="w-4 h-4 text-sky-500" />
      </div>
    </div>
  );
}
