import { Clock, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";

interface LastDoseCardProps {
  timestamp: string | null;
  amount: number | null;
}

const LastDoseCard = ({ timestamp, amount }: LastDoseCardProps) => {
  if (!timestamp) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Pill className="w-4 h-4" /> Last Dose Taken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No doses recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  const date = new Date(timestamp);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Pill className="w-4 h-4" /> Last Dose Taken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-display font-bold text-foreground">
          {amount} pill{amount !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{format(date, "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</p>
      </CardContent>
    </Card>
  );
};

export default LastDoseCard;
