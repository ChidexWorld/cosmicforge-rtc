import { MicOff, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PARTICIPANTS = [
  { id: 1, name: "Natura", muted: false, color: "bg-orange-100" },
  {
    id: 2,
    name: "Cecile",
    muted: false,
    isVerified: true,
    color: "bg-blue-400",
  },
  { id: 3, name: "Nico", muted: false, color: "bg-green-500" },
  { id: 4, name: "Bryan", muted: true, color: "bg-purple-200" },
  { id: 5, name: "Azzura", muted: true, color: "bg-purple-300" },
  { id: 6, name: "Ahmed", muted: true, color: "bg-yellow-400" },
  { id: 7, name: "Marry", muted: false, color: "bg-sky-300" },
  { id: 8, name: "Diana", muted: false, color: "bg-orange-200" },
  { id: 9, name: "Lucas", muted: false, color: "bg-blue-50" },
  { id: 10, name: "Mike", muted: true, color: "bg-pink-400" },
  { id: 11, name: "Daniel", muted: true, color: "bg-orange-100" },
  { id: 12, name: "Shandy", muted: true, color: "bg-pink-300" },
];

export default function VideoGrid() {
  return (
    <div className="h-full w-full p-8 md:p-12 bg-gray-50/30 overflow-y-auto">
      <div className="flex flex-wrap gap-4 justify-center content-start">
        {[...PARTICIPANTS]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((user) => (
            <div
              key={user.id}
              style={{
                width: "277px",
                height: "186px",
                borderRadius: "8px",
                borderWidth: "1px",
              }}
              className={`relative overflow-hidden shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-[1.02] border-[#272EA766] ${user.color}`}
            >
              {/* Participant Placeholder / Video Stream */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white/20">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  />
                  <AvatarFallback className="text-2xl font-bold">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Label Overlay */}
              <div
                style={{
                  backgroundColor: "#00000080",
                  borderColor: "#00000080",
                  backdropFilter: "blur(20px)",
                  borderWidth: "1px",
                  borderTopRightRadius: "10px",
                }}
                className="absolute bottom-0 left-0 flex items-center gap-2 border px-3 py-1"
              >
                {user.isVerified && (
                  <ShieldCheck className="w-3 h-3 text-blue fill-current" />
                )}
                <span className="text-white text-xs font-medium">
                  {user.name}
                </span>
              </div>

              {/* Muted Indicator Overlay */}
              {user.muted && (
                <div
                  style={{
                    backgroundColor: "#00000080",
                    borderColor: "#00000080",
                    backdropFilter: "blur(20px)",
                    borderWidth: "1px",
                    right: "20px",
                    borderTopLeftRadius: "10px",
                  }}
                  className="absolute bottom-0 py-1 px-3 rounded-t-lg"
                >
                  <MicOff className=" text-white" size={16} />
                </div>
              )}

              {/* Active Speaker Border (Optional Highlight) */}
              {user.id === 2 && (
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg pointer-events-none" />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
