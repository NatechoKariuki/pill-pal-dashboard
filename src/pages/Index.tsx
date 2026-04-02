import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PillGauge from "@/components/PillGauge";
import LastDoseCard from "@/components/LastDoseCard";
import AdherenceStatus from "@/components/AdherenceStatus";
import ScheduleSettings from "@/components/ScheduleSettings";
import ImageGallery from "@/components/ImageGallery";
import ApiDocs from "@/components/ApiDocs";
import { Activity, User, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [lastLog, setLastLog] = useState<{ taken_amount: number; remaining_pills: number; timestamp: string } | null>(null);
  const [scheduleHour, setScheduleHour] = useState<number | null>(null);
  const [scheduleMinute, setScheduleMinute] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: logs } = await supabase
        .from("pill_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (logs) setLastLog(logs);

      const { data: sched } = await supabase.from("schedule").select("*").limit(1).maybeSingle();
      if (sched) {
        setScheduleHour(sched.scheduled_hour);
        setScheduleMinute(sched.scheduled_minute);
      }
    };
    fetchData();

    // Real-time subscription for pill_logs
    const channel = supabase
      .channel("pill_logs_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pill_logs" }, (payload) => {
        setLastLog(payload.new as typeof lastLog);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">MedDispenser</h1>
              <p className="text-xs text-muted-foreground">Smart Pill Dispenser Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Profile">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top row: Gauge + Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-sm flex items-center justify-center py-6">
            <CardContent className="p-0">
              <PillGauge remaining={lastLog?.remaining_pills ?? 0} />
            </CardContent>
          </Card>
          <LastDoseCard timestamp={lastLog?.timestamp ?? null} amount={lastLog?.taken_amount ?? null} />
          <AdherenceStatus
            lastDoseTimestamp={lastLog?.timestamp ?? null}
            scheduledHour={scheduleHour}
            scheduledMinute={scheduleMinute}
          />
        </div>

        {/* Schedule Settings */}
        <ScheduleSettings />

        {/* Image Gallery */}
        <ImageGallery />

        {/* API Docs */}
        <ApiDocs />
      </main>
    </div>
  );
};

export default Index;
