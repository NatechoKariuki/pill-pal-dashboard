import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setDateOfBirth(data.date_of_birth || "");
        setPhoneNumber(data.phone_number || "");
        setMedicalNotes(data.medical_notes || "");
      }
      setFetching(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        phone_number: phoneNumber || null,
        medical_notes: medicalNotes || null,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved", description: "Your profile has been updated." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Patient Profile</h1>
            <p className="text-xs text-muted-foreground">Manage your medical information</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-xs text-muted-foreground">Date of Birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone Number</Label>
                <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-muted-foreground">Medical Notes</Label>
              <Textarea id="notes" value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Allergies, conditions, or other relevant medical information..." rows={4} />
            </div>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
