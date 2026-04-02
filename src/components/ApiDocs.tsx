import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ApiDocs = () => {
  const { toast } = useToast();
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "<YOUR_PROJECT_ID>";
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "<YOUR_ANON_KEY>";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;

  const postLogSnippet = `// ESP32 Arduino — POST pill log
#include <HTTPClient.h>

HTTPClient http;
http.begin("${supabaseUrl}/rest/v1/pill_logs");
http.addHeader("apikey", "${anonKey}");
http.addHeader("Content-Type", "application/json");
http.addHeader("Prefer", "return=minimal");

String payload = "{\\"taken_amount\\":1,\\"remaining_pills\\":25}";
int code = http.POST(payload);
http.end();`;

  const uploadImageSnippet = `// ESP32 Arduino — Upload JPEG to storage
#include <HTTPClient.h>

HTTPClient http;
String filename = "dose_" + String(millis()) + ".jpg";
String url = "${supabaseUrl}/storage/v1/object/pill_images/" + filename;

http.begin(url);
http.addHeader("apikey", "${anonKey}");
http.addHeader("Authorization", "Bearer ${anonKey}");
http.addHeader("Content-Type", "image/jpeg");

// 'fb' is your camera_fb_t* frame buffer
int code = http.POST(fb->buf, fb->len);
http.end();`;

  const fetchScheduleSnippet = `// ESP32 Arduino — Fetch schedule
HTTPClient http;
http.begin("${supabaseUrl}/rest/v1/schedule?select=*&limit=1");
http.addHeader("apikey", "${anonKey}");

int code = http.GET();
String body = http.getString();
// Parse JSON to get scheduled_hour, scheduled_minute
http.end();`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Code snippet copied to clipboard." });
  };

  const CodeBlock = ({ title, code }: { title: string; code: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)} className="gap-1.5 text-xs">
          <Copy className="w-3 h-3" /> Copy
        </Button>
      </div>
      <pre className="bg-secondary rounded-lg p-4 text-xs overflow-x-auto text-secondary-foreground leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Code className="w-4 h-4" /> ESP32 API Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Use these snippets in your ESP32 Arduino sketch to communicate with the dashboard.
        </p>
        <CodeBlock title="1. Post a Pill Log" code={postLogSnippet} />
        <CodeBlock title="2. Upload Camera Image" code={uploadImageSnippet} />
        <CodeBlock title="3. Fetch Medication Schedule" code={fetchScheduleSnippet} />
      </CardContent>
    </Card>
  );
};

export default ApiDocs;
