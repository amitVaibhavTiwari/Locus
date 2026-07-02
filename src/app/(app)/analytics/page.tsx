"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function Analytics() {
  const metrics = [
    {
      title: "Completed Tasks",
      value: "156",
      change: "+12.5%",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Active Projects",
      value: "8",
      change: "+2",
      icon: Target,
      color: "text-primary",
    },
    {
      title: "Team Members",
      value: "24",
      change: "+3",
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Avg. Completion Time",
      value: "4.2 days",
      change: "-0.8d",
      icon: Clock,
      color: "text-warning",
    },
  ];

  const projectStats = [
    { name: "E-commerce Platform", completed: 78, total: 95, progress: 82 },
    { name: "Mobile App Redesign", completed: 45, total: 60, progress: 75 },
    { name: "Dashboard Analytics", completed: 32, total: 50, progress: 64 },
    { name: "Marketing Website", completed: 18, total: 25, progress: 72 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track your team's performance and project progress
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    metric.change.startsWith("+")
                      ? "text-success"
                      : "text-warning"
                  }
                >
                  {metric.change}
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Progress */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Project Progress
          </CardTitle>
          <CardDescription>
            Current status of all active projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {project.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {project.completed}/{project.total} tasks
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {project.progress}% complete
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle>Team Velocity</CardTitle>
            <CardDescription>Story points completed per sprint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Velocity Chart Placeholder
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>
              Current workload across team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Distribution Chart Placeholder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
