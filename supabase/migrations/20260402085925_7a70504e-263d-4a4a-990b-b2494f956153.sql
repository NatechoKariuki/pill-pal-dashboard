
-- Create pill_logs table
CREATE TABLE public.pill_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taken_amount INTEGER NOT NULL DEFAULT 1,
  remaining_pills INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pill_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on pill_logs" ON public.pill_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pill_logs" ON public.pill_logs FOR INSERT WITH CHECK (true);

-- Create schedule table
CREATE TABLE public.schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_hour INTEGER NOT NULL CHECK (scheduled_hour >= 0 AND scheduled_hour <= 23),
  scheduled_minute INTEGER NOT NULL CHECK (scheduled_minute >= 0 AND scheduled_minute <= 59),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on schedule" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Allow public insert on schedule" ON public.schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on schedule" ON public.schedule FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on schedule" ON public.schedule FOR DELETE USING (true);

-- Create pill_images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pill_images', 'pill_images', true);

CREATE POLICY "Allow public read on pill_images" ON storage.objects FOR SELECT USING (bucket_id = 'pill_images');
CREATE POLICY "Allow public insert on pill_images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pill_images');
