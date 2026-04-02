import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdherenceStatusProps {
  lastDoseTimestamp: string | null;
  scheduledHour: number | null;
  scheduledMinute: number | null;
}

const AdherenceStatus = ({ lastDoseTimestamp, scheduledHour, scheduledMinute }: AdherenceStatusProps) => {
  const getStatus = () => {
    if (scheduledHour === null || scheduledMinute === null) return "no-schedule";
    if (!lastDoseTimestamp) return "missed";

    const now = new Date();
    const lastDose = new Date(lastDoseTimestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), scheduledHour, scheduledMinute);

    // If scheduled time hasn't passed yet today, check yesterday
    if (now < today) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const diffMs = Math.abs(lastDose.getTime() - yesterday.getTime());
      return diffMs < 2 * 60 * 60 * 1000 ? "on-time" : "missed"; // 2 hour window
    }

    const diffMs = Math.abs(lastDose.getTime() - today.getTime());
    return diffMs < 2 * 60 * 60 * 1000 ? "on-time" : "missed";
  };

  const status = getStatus();

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Adherence Status</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "no-schedule" ? (
          <p className="text-muted-foreground text-sm">No schedule set</p>
        ) : status === "on-time" ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <div>
              <p className="font-display font-bold text-success text-lg">On Time</p>
              <p className="text-xs text-muted-foreground">Medication taken as scheduled</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <XCircle className="w-8 h-8 text-danger" />
            <div>
              <p className="font-display font-bold text-danger text-lg">Missed</p>
              <p className="text-xs text-muted-foreground">Dose not taken on schedule</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdherenceStatus;
