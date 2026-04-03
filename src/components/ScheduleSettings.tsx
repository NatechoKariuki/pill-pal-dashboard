import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleSettingsProps {
  dispenserId?: string;
}

const ScheduleSettings = ({ dispenserId }: ScheduleSettingsProps) => {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchedule = async () => {
      let query = supabase.from("schedule").select("*").limit(1);
      if (dispenserId) query = query.eq("dispenser_id", dispenserId);
      const { data } = await query.maybeSingle();
      if (data) {
        setHour(String(data.scheduled_hour));
        setMinute(String(data.scheduled_minute).padStart(2, "0"));
        setMedicineName(data.medicine_name || "");
        setScheduleId(data.id);
      }
    };
    fetchSchedule();
  }, [dispenserId]);

  const handleSave = async () => {
    const h = parseInt(hour);
    const m = parseInt(minute);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      toast({ title: "Invalid time", description: "Please enter valid hours (0-23) and minutes (0-59).", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload: any = { scheduled_hour: h, scheduled_minute: m, medicine_name: medicineName };
      if (dispenserId) payload.dispenser_id = dispenserId;

      if (scheduleId) {
        await supabase.from("schedule").update(payload).eq("id", scheduleId);
      } else {
        const { data } = await supabase.from("schedule").insert(payload).select().single();
        if (data) setScheduleId(data.id);
      }
      toast({ title: "Schedule saved", description: `Medication time set to ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
    } catch {
      toast({ title: "Error", description: "Failed to save schedule.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Settings className="w-4 h-4" /> Target Medication Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label htmlFor="medicine" className="text-xs text-muted-foreground">Medicine Name</Label>
            <Input id="medicine" type="text" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="w-44 font-display text-lg" placeholder="Aspirin" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hour" className="text-xs text-muted-foreground">Hours (0–23)</Label>
            <Input id="hour" type="number" min={0} max={23} value={hour} onChange={(e) => setHour(e.target.value)} className="w-20 text-center font-display text-lg" placeholder="08" />
          </div>
          <span className="text-2xl font-bold text-muted-foreground pb-1">:</span>
          <div className="space-y-1.5">
            <Label htmlFor="minute" className="text-xs text-muted-foreground">Minutes (0–59)</Label>
            <Input id="minute" type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(e.target.value)} className="w-20 text-center font-display text-lg" placeholder="00" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your ESP32 can fetch this schedule via the REST API to sync dispenser timing.
        </p>
      </CardContent>
    </Card>
  );
};

export default ScheduleSettings;
