"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3, Clock, Target } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/date";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "active" | "completed";
  totalIssues: number;
  completedIssues: number;
}

interface SprintBurndownClientProps {
  activeSprint: Sprint | null;
  completedSprints: Sprint[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary",
  completed: "bg-success",
  planned: "bg-muted",
};

export function SprintBurndownClient({
  activeSprint,
  completedSprints,
}: SprintBurndownClientProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Sprint Burndown
          </h1>
          <p className="text-muted-foreground">
            Track sprint progress and team velocity
          </p>
        </div>
      </div>

      {activeSprint ? (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {activeSprint.name}
                  <Badge className="bg-primary text-white">active</Badge>
                </CardTitle>
                <CardDescription>
                  {formatDate(activeSprint.start_date)} —{" "}
                  {formatDate(activeSprint.end_date)}
                  {activeSprint.goal && (
                    <span className="ml-2 text-foreground/70">
                      · Goal: {activeSprint.goal}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-lg font-semibold">
                    {activeSprint.totalIssues}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-lg font-semibold">
                    {activeSprint.completedIssues}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Days Remaining
                  </p>
                  <p className="text-lg font-semibold">
                    {daysUntil(activeSprint.end_date) ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold">
                    {activeSprint.totalIssues > 0
                      ? Math.round(
                          (activeSprint.completedIssues /
                            activeSprint.totalIssues) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            {activeSprint.totalIssues > 0 && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {activeSprint.completedIssues}/{activeSprint.totalIssues}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((activeSprint.completedIssues / activeSprint.totalIssues) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm">No active sprint at the moment.</p>
            <p className="text-xs mt-1">
              Start a sprint from the Sprints page to see data here.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Actual vs. Ideal sprint progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Burndown Chart Visualization
              </p>
              {activeSprint && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSprint.completedIssues} completed /{" "}
                  {activeSprint.totalIssues} total tasks
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Sprint History</CardTitle>
          <CardDescription>Previous sprint performance</CardDescription>
        </CardHeader>
        <CardContent>
          {completedSprints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No completed sprints yet.
            </p>
          ) : (
            <div className="space-y-4">
              {completedSprints.map((sprint) => {
                const pct =
                  sprint.totalIssues > 0
                    ? Math.round(
                        (sprint.completedIssues / sprint.totalIssues) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={sprint.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${STATUS_COLORS[sprint.status] ?? "bg-muted"}`}
                      />
                      <div>
                        <h4 className="font-medium">{sprint.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sprint.start_date)} —{" "}
                          {formatDate(sprint.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{pct}%</p>
                      <p className="text-sm text-muted-foreground">
                        {sprint.completedIssues}/{sprint.totalIssues} tasks
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
