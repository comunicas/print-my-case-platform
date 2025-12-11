import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ReportEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  showUploadLink?: boolean;
}

export function ReportEmptyState({ 
  icon: Icon, 
  title, 
  description,
  showUploadLink = true,
}: ReportEmptyStateProps) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">{description}</p>
        {showUploadLink && (
          <Button asChild variant="outline">
            <Link to="/uploads">Ir para Uploads</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
