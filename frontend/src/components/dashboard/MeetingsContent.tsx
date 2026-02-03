"use client";

import { useState } from "react";
import { useMeetings, useUpdateMeeting, useDeleteMeeting } from "@/hooks";
import type { Meeting, MeetingStatus } from "@/types/meeting";
import type { ApiErrorResponse } from "@/types/auth";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Video,
  Lock,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  getUserTimezone,
  formatShortDateForDisplay,
  formatTimeForDisplay,
  toLocalDateValue,
  toLocalTimeValue,
} from "@/utils/timezone";

const STATUS_FILTERS: { label: string; value: MeetingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Live", value: "live" },
  { label: "Ended", value: "ended" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_STYLES: Record<MeetingStatus, string> = {
  scheduled: "bg-blue-50 text-blue-600",
  live: "bg-green-50 text-green-600",
  ended: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-500",
};

function getDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function MeetingsContent() {
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useMeetings({
    page,
    limit: 10,
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const meetings = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:p-10 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#343434]">
            Meetings
          </h2>
          <p className="text-sm text-[#00000080] mt-1">
            View and manage your meetings
          </p>
        </div>
        {meta && (
          <span className="text-sm text-[#00000080]">
            {meta.total} meeting{meta.total !== 1 ? "s" : ""} total
          </span>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === filter.value
                ? "bg-[#029CD4] text-white shadow-sm"
                : "bg-[#FAFAFB] text-[#00000080] hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-500 font-medium">Failed to load meetings</p>
          <p className="text-sm text-[#00000080] mt-1">
            Please check your connection and try again.
          </p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-[#343434] font-medium">No meetings found</p>
          <p className="text-sm text-[#00000080] mt-1">
            {statusFilter !== "all"
              ? `No ${statusFilter} meetings to show.`
              : "You haven't scheduled any meetings yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Meeting List */}
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={() => setEditingMeeting(meeting)}
                onDelete={() => setDeletingId(meeting.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[#00000080]">
                Page {meta.page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingMeeting(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingId && (
        <DeleteMeetingModal
          meetingId={deletingId}
          onClose={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}

// ─── Meeting Card ────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
}: {
  meeting: Meeting;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isScheduled = meeting.status === "scheduled";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-semibold text-[#343434] text-sm sm:text-base truncate">
              {meeting.title}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize shrink-0 ${STATUS_STYLES[meeting.status]}`}
            >
              {meeting.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#00000080] text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatShortDateForDisplay(meeting.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTimeForDisplay(meeting.start_time)} –{" "}
              {formatTimeForDisplay(meeting.end_time)}
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              {getDuration(meeting.start_time, meeting.end_time)}
            </span>
            <span className="flex items-center gap-1">
              {meeting.is_private ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              {meeting.is_private ? "Private" : "Public"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-[#00000060]">
            <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">
              {meeting.meeting_identifier}
            </span>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isScheduled && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[#029CD4] px-2 sm:px-3"
                onClick={onEdit}
                title="Edit meeting"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 px-2 sm:px-3"
                onClick={onDelete}
                title="Delete meeting"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}
          {(meeting.status === "scheduled" || meeting.status === "live") && (
            <Button
              size="sm"
              className="gap-1.5 px-2 sm:px-3"
              onClick={() => window.open(meeting.join_url, "_blank")}
              title={
                meeting.status === "live" ? "Join meeting now" : "Join meeting"
              }
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {meeting.status === "live" ? "Join Now" : "Join"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditMeetingModal({
  meeting,
  onClose,
}: {
  meeting: Meeting;
  onClose: () => void;
}) {
  const updateMeeting = useUpdateMeeting();

  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(toLocalDateValue(meeting.start_time));
  const [startTime, setStartTime] = useState(
    toLocalTimeValue(meeting.start_time),
  );
  const [endTime, setEndTime] = useState(toLocalTimeValue(meeting.end_time));
  const [isPrivate, setIsPrivate] = useState(meeting.is_private);
  const [metadata, setMetadata] = useState(meeting.metadata || "");
  const [error, setError] = useState("");

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

    updateMeeting.mutate(
      {
        id: meeting.id,
        data: {
          title: title.trim(),
          start_time,
          end_time,
          timezone: getUserTimezone(),
          is_private: isPrivate,
          metadata: metadata.trim() || undefined,
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (err: AxiosError<ApiErrorResponse>) => {
          setError(
            err.response?.data?.error?.message || "Failed to update meeting",
          );
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#343434]">Edit Meeting</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-title"
              className="text-sm font-medium text-[#343434]"
            >
              Meeting Title
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-date"
              className="text-sm font-medium text-[#343434]"
            >
              <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
              Date
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-start"
                className="text-sm font-medium text-[#343434]"
              >
                <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                Start Time
              </Label>
              <Input
                id="edit-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-end"
                className="text-sm font-medium text-[#343434]"
              >
                <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                End Time
              </Label>
              <Input
                id="edit-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Privacy */}
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

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-metadata"
              className="text-sm font-medium text-[#343434]"
            >
              Description{" "}
              <span className="text-[#00000040] font-normal">(optional)</span>
            </Label>
            <textarea
              id="edit-metadata"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1"
              loading={updateMeeting.isPending}
            >
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteMeetingModal({
  meetingId,
  onClose,
}: {
  meetingId: string;
  onClose: () => void;
}) {
  const deleteMeeting = useDeleteMeeting();
  const [error, setError] = useState("");

  const handleDelete = () => {
    setError("");
    deleteMeeting.mutate(meetingId, {
      onSuccess: () => onClose(),
      onError: (err: AxiosError<ApiErrorResponse>) => {
        setError(
          err.response?.data?.error?.message || "Failed to delete meeting",
        );
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-[#343434] mb-1">
          Delete Meeting
        </h3>
        <p className="text-sm text-[#00000080] mb-6">
          Are you sure? This action cannot be undone.
        </p>

        {error && (
          <p className="text-sm text-red-500 font-medium mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            loading={deleteMeeting.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
