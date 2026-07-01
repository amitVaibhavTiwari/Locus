"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Play, Square, BarChart3, Clock, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SprintBurndown() {
  const [currentSprint, setCurrentSprint] = useState({
    id: 1,
    name: "Sprint 23",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    status: "active",
    totalPoints: 84,
    completedPoints: 52,
    remainingDays: 7,
  });

  const burndownData = [
    { day: 1, ideal: 84, actual: 84 },
    { day: 2, ideal: 78, actual: 80 },
    { day: 3, ideal: 72, actual: 76 },
    { day: 4, ideal: 66, actual: 68 },
    { day: 5, ideal: 60, actual: 60 },
    { day: 6, ideal: 54, actual: 55 },
    { day: 7, ideal: 48, actual: 52 },
    { day: 8, ideal: 42, actual: null },
    { day: 9, ideal: 36, actual: null },
    { day: 10, ideal: 30, actual: null },
    { day: 11, ideal: 24, actual: null },
    { day: 12, ideal: 18, actual: null },
    { day: 13, ideal: 12, actual: null },
    { day: 14, ideal: 6, actual: null },
    { day: 15, ideal: 0, actual: null },
  ];

  const sprintHistory = [
    {
      id: 3,
      name: "Sprint 22",
      status: "completed",
      velocity: 78,
      completion: 95,
    },
    {
      id: 2,
      name: "Sprint 21",
      status: "completed",
      velocity: 82,
      completion: 88,
    },
    {
      id: 1,
      name: "Sprint 20",
      status: "completed",
      velocity: 75,
      completion: 92,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary";
      case "completed":
        return "bg-success";
      case "planned":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
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

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Play className="w-4 h-4" />
              Start New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Sprint</DialogTitle>
              <DialogDescription>
                Configure your new sprint parameters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sprint-name">Sprint Name</Label>
                <Input id="sprint-name" placeholder="Sprint 24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="sprint-goal">Sprint Goal</Label>
                <Input
                  id="sprint-goal"
                  placeholder="Complete user authentication flow"
                />
              </div>
              <Button className="w-full">Start Sprint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Sprint Overview */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentSprint.name}
                <Badge
                  className={`${getStatusColor(currentSprint.status)} text-white`}
                >
                  {currentSprint.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {currentSprint.startDate} - {currentSprint.endDate}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Square className="w-4 h-4 mr-2" />
              End Sprint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-lg font-semibold">
                  {currentSprint.totalPoints}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-lg font-semibold">
                  {currentSprint.completedPoints}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-lg font-semibold">
                  {currentSprint.remainingDays}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">
                  {Math.round(
                    (currentSprint.completedPoints /
                      currentSprint.totalPoints) *
                      100,
                  )}
                  %
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Burndown Chart */}
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
              <p className="text-sm text-muted-foreground mt-1">
                Current: {currentSprint.completedPoints} points | Ideal:{" "}
                {burndownData[6].ideal} points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint History */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Sprint History</CardTitle>
          <CardDescription>Previous sprint performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sprintHistory.map((sprint) => (
              <div
                key={sprint.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(sprint.status)}`}
                  />
                  <div>
                    <h4 className="font-medium">{sprint.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Velocity: {sprint.velocity} points
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{sprint.completion}%</p>
                  <p className="text-sm text-muted-foreground">Completion</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
