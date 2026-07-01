"use client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const projectNames: Record<string, string> = {
  "1": "E-commerce Platform",
  "2": "Mobile App Redesign",
  "3": "Dashboard Analytics",
  "4": "Marketing Website",
};

const ProjectAnalytics = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  if (!projectId || !projectNames[projectId]) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project Not Found
          </h1>
          <p className="text-muted-foreground mt-2">
            The requested project could not be found.
          </p>
        </div>
      </div>
    );
  }

  const projectName = projectNames[projectId];

  const stats = [
    {
      title: "Total Tasks",
      value: "24",
      change: "+4 this week",
      icon: CheckCircle,
      color: "primary",
    },
    {
      title: "Completed",
      value: "18",
      change: "+6 this week",
      icon: CheckCircle,
      color: "success",
    },
    {
      title: "In Progress",
      value: "4",
      change: "Same as last week",
      icon: Clock,
      color: "warning",
    },
    {
      title: "Blocked",
      value: "2",
      change: "+1 this week",
      icon: AlertCircle,
      color: "destructive",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/project/${projectId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {projectName} - Analytics
        </h1>
        <p className="text-muted-foreground">
          View project performance and metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border shadow-custom-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-success flex items-center mt-2">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-custom-sm">
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <p>
                Analytics charts and detailed metrics will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectAnalytics;
