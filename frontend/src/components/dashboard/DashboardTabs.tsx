"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const tabs = ["Dashboard", "Meetings", "Schedule"];

export default function DashboardTabs({
  onChange,
}: {
  onChange: (tab: string) => void;
}) {
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="flex gap-3 sm:gap-4 md:gap-6 border-b px-4 sm:px-6 md:px-8 overflow-x-auto">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          onClick={() => {
            setActive(tab);
            onChange(tab);
          }}
          className={cn(
            "py-3 sm:py-4 text-xs sm:text-sm font-medium relative rounded-none whitespace-nowrap",
            active === tab ? "text-[#029CD4]" : "text-gray-400",
          )}
        >
          {tab}

          {active === tab && (
            <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#029CD4]" />
          )}
        </Button>
      ))}
    </div>
  );
}
