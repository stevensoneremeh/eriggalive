"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createReportAction } from "@/lib/community-actions"
import type { ReportReason, ReportTargetType } from "@/types/database"
import { Loader2 } from "lucide-react"

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetId: number
  targetType: ReportTargetType
}

const reportReasons: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or Misleading" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "misinformation", label: "False Information" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "other", label: "Other" },
]

export function ReportDialog({ isOpen, onClose, targetId, targetType }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, startSubmitTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = () => {
    if (!reason) {
      toast({ title: "Reason Required", description: "Please select a reason for the report.", variant: "destructive" })
      return
    }
    startSubmitTransition(async () => {
      const result = await createReportAction(targetId, targetType, reason as ReportReason, notes)
      if (result.success) {
        toast({ title: "Report Submitted", description: "Thank you for your feedback. We will review it shortly." })
        onClose()
        setReason("")
        setNotes("")
      } else {
        toast({ title: "Error", description: result.error || "Failed to submit report.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {targetType === "post" ? "Post" : "Comment"}</DialogTitle>
          <DialogDescription>Help us understand the problem. What is wrong with this {targetType}?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide more details (optional)"
              className="col-span-3 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
