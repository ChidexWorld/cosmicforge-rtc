"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateMeeting } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiErrorResponse } from "@/types/auth";
import type { AxiosError } from "axios";
import { Calendar, Clock, Lock, Globe, CheckCircle } from "lucide-react";

export default function ScheduleContent() {
  const router = useRouter();
  const createMeeting = useCreateMeeting();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [metadata, setMetadata] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    meeting_identifier: string;
    join_url: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Date and time are required");
      return;
    }

    const start_time = `${date}T${startTime}:00`;
    const end_time = `${date}T${endTime}:00`;

    if (new Date(end_time) <= new Date(start_time)) {
      setError("End time must be after start time");
      return;
    }

    createMeeting.mutate(
      {
        title: title.trim(),
        start_time,
        end_time,
        is_private: isPrivate,
        metadata: metadata.trim() || undefined,
      },
      {
        onSuccess: (response) => {
          setCreated({
            meeting_identifier: response.data.meeting_identifier,
            join_url: response.data.join_url,
          });
        },
        onError: (err: AxiosError<ApiErrorResponse>) => {
          const message =
            err.response?.data?.error?.message || "Failed to schedule meeting";
          setError(message);
        },
      },
    );
  };

  // Success state
  if (created) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(created.join_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 md:p-10 font-inter">
        <div className="max-w-2xl mx-auto mt-4 sm:mt-10 md:mt-20 text-center">
          {/* Success Icon */}
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-500 mx-auto mb-3 sm:mb-4" />

          {/* Title */}
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#343434] mb-1.5 sm:mb-2">
            Meeting Scheduled
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-[#00000080] mb-4 sm:mb-6 px-4">
            Your meeting has been created successfully.
          </p>

          {/* Meeting Details Card */}
          <div className="bg-[#FAFAFB] rounded-xl p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 text-left mb-6 sm:mb-8">
            <div>
              <span className="text-xs sm:text-sm text-[#00000060] uppercase tracking-wide font-medium">
                Meeting Code
              </span>
              <p className="font-mono text-base sm:text-lg md:text-xl font-bold text-[#029CD4] mt-1">
                {created.meeting_identifier}
              </p>
            </div>
            <div className="border-t border-[#E5E5E5] pt-3 sm:pt-4">
              <span className="text-xs sm:text-sm text-[#00000060] uppercase tracking-wide font-medium">
                Join Link
              </span>
              <p className="text-xs sm:text-sm md:text-base text-[#343434] break-all mt-1 leading-relaxed">
                {created.join_url}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="w-full sm:w-auto order-1"
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              onClick={() => router.push("/dashboard/meetings")}
              className="w-full sm:w-auto order-2"
            >
              View Meetings
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreated(null);
                setTitle("");
                setDate("");
                setStartTime("");
                setEndTime("");
                setMetadata("");
                setIsPrivate(true);
              }}
              className="w-full sm:w-auto order-3"
            >
              Schedule Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:p-10 font-inter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-[#343434]">
          Schedule a Meeting
        </h2>
        <p className="text-sm text-[#00000080] mt-1">
          Set up a new meeting and share the link with participants
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-medium text-[#343434]">
            Meeting Title
          </Label>
          <Input
            id="title"
            placeholder="e.g. Weekly Team Standup"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-sm font-medium text-[#343434]">
            <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="startTime"
              className="text-sm font-medium text-[#343434]"
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="endTime"
              className="text-sm font-medium text-[#343434]"
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#343434]">
            Meeting Type
          </Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isPrivate
                  ? "bg-[#029CD4] text-white shadow-sm"
                  : "bg-[#FAFAFB] text-[#00000080] hover:bg-gray-200"
              }`}
            >
              <Lock className="w-4 h-4" />
              Private
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                !isPrivate
                  ? "bg-[#029CD4] text-white shadow-sm"
                  : "bg-[#FAFAFB] text-[#00000080] hover:bg-gray-200"
              }`}
            >
              <Globe className="w-4 h-4" />
              Public
            </button>
          </div>
        </div>

        {/* Metadata / Description */}
        <div className="space-y-1.5">
          <Label
            htmlFor="metadata"
            className="text-sm font-medium text-[#343434]"
          >
            Description{" "}
            <span className="text-[#00000040] font-normal">(optional)</span>
          </Label>
          <textarea
            id="metadata"
            placeholder="Add a description or agenda..."
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            rows={3}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={createMeeting.isPending}
        >
          Schedule Meeting
        </Button>
      </form>
    </div>
  );
}
