import {
  Volume2,
  Upload,
  Mic,
    Video,
  Settings,
  Maximize,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";

interface FooterControlsProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function FooterControls({
  onToggleSidebar,
  isSidebarOpen,
}: FooterControlsProps) {
  return (
    <footer className="p-6 flex items-center justify-center gap-4 bg-white">
      <div style={{ width: "60%" }} className="flex items-center justify-between rounded-lg gap-4 px-6">
        <Button className="p-3 rounded-md bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
          <Volume2 color="#029CD4" size={32} />
        </Button>
        <div className="flex items-center gap-4">
          <Button className="p-3 rounded-lg bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
            <Upload color="#029CD4" size={32} />
          </Button>
          <Button className="p-3 rounded-lg bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
            <Mic color="#029CD4" size={32} />
          </Button>

          <Button
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#FF3639",
              borderRadius: "32px",
            }}
            className="text-white shadow-xl hover:bg-red-600 transition-colors"
            variant="destructive"
          >
            <Phone className="fill-current" size={72} />
          </Button>

          <Button className="p-3 rounded-lg bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
            <Video color="#029CD4" size={32} />
          </Button>
          <Button className="p-3 rounded-lg bg-[#FAFAFB] text-sky-500 hover:bg-gray-200">
            <Settings color="#029CD4" size={32} />
          </Button>
        </div>
        <Button
          onClick={onToggleSidebar}
          className={`p-3 rounded-lg transition-colors hover:text-white ${isSidebarOpen ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-500"}`}
        >
          <Maximize size={32} />
        </Button>
      </div>
    </footer>
  );
}
