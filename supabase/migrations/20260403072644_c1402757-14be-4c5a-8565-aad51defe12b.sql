
-- Patients table linked to caregiver (authenticated user)
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer NOT NULL,
  condition text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view their own patients" ON public.patients
  FOR SELECT TO authenticated USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can insert their own patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update their own patients" ON public.patients
  FOR UPDATE TO authenticated USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can delete their own patients" ON public.patients
  FOR DELETE TO authenticated USING (auth.uid() = caregiver_id);

-- Dispensers table linked to patient, generates unique ID for ESP32 auth
CREATE TABLE public.dispensers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  device_name text NOT NULL DEFAULT 'Dispenser',
  auth_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dispensers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view dispensers of their patients" ON public.dispensers
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = dispensers.patient_id AND patients.caregiver_id = auth.uid())
  );

CREATE POLICY "Caregivers can insert dispensers for their patients" ON public.dispensers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = dispensers.patient_id AND patients.caregiver_id = auth.uid())
  );

CREATE POLICY "Caregivers can delete dispensers of their patients" ON public.dispensers
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = dispensers.patient_id AND patients.caregiver_id = auth.uid())
  );

-- Allow ESP32 devices to read dispensers publicly by auth_token (for validation)
CREATE POLICY "Public can read dispensers by token" ON public.dispensers
  FOR SELECT TO public USING (true);

-- Add dispenser_id to pill_logs for per-patient tracking
ALTER TABLE public.pill_logs ADD COLUMN dispenser_id uuid REFERENCES public.dispensers(id) ON DELETE SET NULL;

-- Add dispenser_id to schedule for per-patient scheduling
ALTER TABLE public.schedule ADD COLUMN dispenser_id uuid REFERENCES public.dispensers(id) ON DELETE CASCADE;

-- Trigger for updated_at on patients
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
