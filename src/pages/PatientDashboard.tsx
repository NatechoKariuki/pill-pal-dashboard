import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PillGauge from "@/components/PillGauge";
import LastDoseCard from "@/components/LastDoseCard";
import AdherenceStatus from "@/components/AdherenceStatus";
import ScheduleSettings from "@/components/ScheduleSettings";
import ImageGallery from "@/components/ImageGallery";
import ApiDocs from "@/components/ApiDocs";
import { Activity, ArrowLeft, Cpu, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
}

interface Dispenser {
  id: string;
  device_name: string;
  auth_token: string;
}

const PatientDashboard = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [dispenser, setDispenser] = useState<Dispenser | null>(null);
  const [lastLog, setLastLog] = useState<{ taken_amount: number; remaining_pills: number; timestamp: string } | null>(null);
  const [scheduleHour, setScheduleHour] = useState<number | null>(null);
  const [scheduleMinute, setScheduleMinute] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || !patientId) return;

      // Fetch patient
      const { data: pat } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (!pat) { navigate("/"); return; }
      setPatient(pat);

      // Fetch dispenser
      const { data: disp } = await supabase
        .from("dispensers")
        .select("*")
        .eq("patient_id", patientId)
        .maybeSingle();
      if (disp) setDispenser(disp);

      // Fetch latest pill log for this dispenser
      if (disp) {
        const { data: log } = await supabase
          .from("pill_logs")
          .select("*")
          .eq("dispenser_id", disp.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (log) setLastLog(log);

        // Fetch schedule for this dispenser
        const { data: sched } = await supabase
          .from("schedule")
          .select("*")
          .eq("dispenser_id", disp.id)
          .limit(1)
          .maybeSingle();
        if (sched) {
          setScheduleHour(sched.scheduled_hour);
          setScheduleMinute(sched.scheduled_minute);
        }
      }

      setLoading(false);
    };
    load();
  }, [user, patientId, navigate]);

  // Realtime for this dispenser's pill_logs
  useEffect(() => {
    if (!dispenser) return;
    const channel = supabase
      .channel(`pill_logs_${dispenser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pill_logs" }, (payload) => {
        const newLog = payload.new as any;
        if (newLog.dispenser_id === dispenser.id) {
          setLastLog(newLog);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dispenser]);

  const copyToken = () => {
    if (!dispenser) return;
    navigator.clipboard.writeText(dispenser.auth_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Dispenser auth token copied to clipboard." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading patient dashboard...</p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">{patient.name}</h1>
            <p className="text-xs text-muted-foreground">
              Age {patient.age} · {patient.condition || "No condition listed"}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dispenser Info */}
        {dispenser && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Registered Dispenser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Device Name</p>
                  <p className="text-sm font-medium text-foreground">{dispenser.device_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dispenser ID</p>
                  <p className="text-sm font-mono text-foreground break-all">{dispenser.id}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Auth Token (for ESP32)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-muted/50 px-3 py-2 rounded-md border border-border/50 text-foreground break-all">
                      {dispenser.auth_token}
                    </code>
                    <Button variant="outline" size="icon" className="shrink-0" onClick={copyToken}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Gauges */}
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

        {/* Schedule Settings – pass dispenser id */}
        <ScheduleSettings dispenserId={dispenser?.id} />

        {/* Image Gallery */}
        <ImageGallery />

        {/* API Docs */}
        <ApiDocs dispenserId={dispenser?.id} />
      </main>
    </div>
  );
};

export default PatientDashboard;
