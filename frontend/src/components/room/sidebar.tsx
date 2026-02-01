import {
  MoreVertical,
  Mic,
  MicOff,
  Video,
  Paperclip,
  Send,
  Pencil,
  Check,
  X,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full px-6 py-6 space-y-5 bg-white rounded-3xl shadow-sm bg-green-500">
      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#343434]">
            Participant <span className="text-[#00000080]">(2)</span>
          </h3>
          <MoreVertical className="w-4 h-4 text-[#0F0F0F] cursor-pointer" />
        </div>

        <div className="space-y-3 py-4">
          <ParticipantItem name="Abubakar Teslim" role="Host" isMuted={false} />
          <ParticipantItem name="Janet Adeyemi" isMuted />
        </div>
      </div>

      {/* Waiting Room */}
      <WaitingRoom />

      {/* Chat Room */}
      <div className="flex-1 flex flex-col rounded-xl shadow-[0_8px_24px_rgba(2,156,212,0.08)] mt-4 mb-6 bg-[#FFFFFF]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-2xl border-b">
          <span className="text-sm font-medium text-gray-600">Chat Room</span>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-center gap-1 text-xs text-purple-500 italic">
            <Pencil className="w-3 h-3" />
            Janet is Typing...
          </div>

          {/* Left message */}
          <div className="flex gap-2 items-end">
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=janet" />
            </Avatar>
            <div className="bg-white px-3 py-2 rounded-xl text-xs text-gray-700 shadow">
              Can u hear my voice
            </div>
          </div>

          {/* Right message */}
          <div className="flex justify-end">
            <div className="bg-sky-500 text-white px-3 py-2 rounded-xl text-xs">
              Ok wait, 5 min
            </div>
          </div>

          {/* Left message */}
          <div className="flex gap-2 items-end">
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=janet" />
            </Avatar>
            <div className="bg-white px-3 py-2 rounded-xl text-xs text-gray-700 shadow">
              Thanks ...
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-2 py-2 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                placeholder="Type here..."
                className="pl-7 h-9 bg-gray-100 rounded-full text-sm"
              />
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[#029CD4] hover:bg-[#028AC0] active:scale-95 transition">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const WAITING_USERS = [
  { id: 1, name: "Samuel Okafor" },
  { id: 2, name: "Grace Ojo" },
  { id: 3, name: "Emeka Nwosu" },
];

function WaitingRoom() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#343434] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#029CD4]" />
          Waiting Room{" "}
          <span className="text-[#00000080]">({WAITING_USERS.length})</span>
        </h3>
        <button className="text-xs text-[#029CD4] font-medium hover:underline">
          Admit All
        </button>
      </div>

      <div className="space-y-2 py-2">
        {WAITING_USERS.map((user) => (
          <WaitingRoomItem key={user.id} name={user.name} />
        ))}
      </div>
    </div>
  );
}

function WaitingRoomItem({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
          />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-[#00000080]">{name}</span>
      </div>

      <div className="flex gap-1.5 items-center">
        <button className="w-7 h-7 rounded-full flex items-center justify-center bg-[#029CD4] hover:bg-[#028AC0] text-white transition">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition">
          <X className="w-3.5 h-3.5" />
        </button>
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
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>

        <span className="text-base font-medium text-[#00000080]">{name}</span>
      </div>

      <div className="flex gap-2 items-center">
        {role && <span className="text-base text-[#029CD4] ml-1">{role}</span>}
        {isMuted ? (
          <MicOff className="w-4 h-4 text-[#DCDFE3]" />
        ) : (
          <Mic className="w-4 h-4 text-[#029CD4]" />
        )}
        <Video className="w-4 h-4 text-[#029CD4]" />
      </div>
    </div>
  );
}
