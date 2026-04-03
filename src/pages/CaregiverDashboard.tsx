import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Activity, LogOut, User, Plus, Eye, Trash2, Stethoscope, Users,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  created_at: string;
}

const CaregiverDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New patient form
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [adding, setAdding] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setPhoneNumber(profile.phone_number || "");
      }
      // Fetch patients
      const { data } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setPatients(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAddPatient = async () => {
    if (!newName.trim() || !newAge.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          caregiver_id: user!.id,
          name: newName.trim(),
          age: parseInt(newAge),
          condition: newCondition.trim(),
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-create a dispenser for the patient
      await supabase.from("dispensers").insert({ patient_id: data.id });

      setPatients((prev) => [data, ...prev]);
      setNewName("");
      setNewAge("");
      setNewCondition("");
      setDialogOpen(false);
      toast({ title: "Patient added", description: `${data.name} has been registered.` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add patient";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePatient = async (id: string, name: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Patient removed", description: `${name} has been removed.` });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">MedDispenser</h1>
              <p className="text-xs text-muted-foreground">Caregiver Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} title="Edit Profile">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Caregiver Info Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Caregiver Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground">{fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{phoneNumber || "—"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/profile")}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* My Patients */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> My Patients
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Patient Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <Input type="number" value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder="65" min={0} max={150} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Condition</Label>
                    <Input value={newCondition} onChange={(e) => setNewCondition(e.target.value)} placeholder="Hypertension, Diabetes..." />
                  </div>
                  <Button onClick={handleAddPatient} disabled={adding || !newName.trim() || !newAge.trim()} className="w-full">
                    {adding ? "Adding..." : "Add Patient"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading patients...</p>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No patients yet. Click "Add Patient" to register one.
              </p>
            ) : (
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Age {patient.age} · {patient.condition || "No condition listed"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => navigate(`/patient/${patient.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePatient(patient.id, patient.name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CaregiverDashboard;
