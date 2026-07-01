"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface ProjectTabsProps {
  projectName: string;
}

const projectMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Project Manager",
    initials: "SJ",
    email: "sarah@company.com",
    avatar: "",
    status: "active",
  },
  {
    id: "2",
    name: "Mike Harrison",
    role: "Frontend Developer",
    initials: "MH",
    email: "mike@company.com",
    avatar: "",
    status: "active",
  },
  {
    id: "3",
    name: "Lisa Thompson",
    role: "UI/UX Designer",
    initials: "LT",
    email: "lisa@company.com",
    avatar: "",
    status: "busy",
  },
  {
    id: "4",
    name: "Robert Kim",
    role: "Backend Developer",
    initials: "RK",
    email: "robert@company.com",
    avatar: "",
    status: "active",
  },
];

const projectAnalytics = {
  tasksCompleted: 23,
  totalTasks: 35,
  completionRate: 66,
  avgCompletionTime: "2.3 days",
  activeSprints: 1,
  burndownRate: "+15%",
  teamEfficiency: 87,
  blockedTasks: 3,
};

export function ProjectTabs({ projectName }: ProjectTabsProps) {
  const [projectSettings, setProjectSettings] = useState({
    visibility: "private",
    allowComments: true,
    requireApproval: false,
    notifications: true,
    autoAssign: false,
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Project Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({projectMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        member.status === "active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {member.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tasks Completed
                    </p>
                    <p className="text-2xl font-bold">
                      {projectAnalytics.tasksCompleted}/
                      {projectAnalytics.totalTasks}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {projectAnalytics.completionRate}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg. Completion
                    </p>
                    <p className="text-2xl font-bold">
                      {projectAnalytics.avgCompletionTime}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Team Efficiency
                    </p>
                    <p className="text-2xl font-bold">
                      {projectAnalytics.teamEfficiency}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Completion</span>
                  <span>{projectAnalytics.completionRate}%</span>
                </div>
                <Progress
                  value={projectAnalytics.completionRate}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Sprints</p>
                  <p className="text-lg font-bold">
                    {projectAnalytics.activeSprints}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Blocked Tasks</p>
                  <p className="text-lg font-bold text-destructive">
                    {projectAnalytics.blockedTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Project Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" defaultValue={projectName} />
                </div>

                <div className="space-y-2">
                  <Label>Project Visibility</Label>
                  <Select defaultValue={projectSettings.visibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-success"></div>
                          Public - Visible to everyone
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          Private - Team members only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access & Permissions
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="comments">Allow Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Team members can comment on tasks
                      </p>
                    </div>
                    <Switch
                      id="comments"
                      checked={projectSettings.allowComments}
                      onCheckedChange={(checked) =>
                        setProjectSettings((prev) => ({
                          ...prev,
                          allowComments: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="approval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Tasks need approval before completion
                      </p>
                    </div>
                    <Switch
                      id="approval"
                      checked={projectSettings.requireApproval}
                      onCheckedChange={(checked) =>
                        setProjectSettings((prev) => ({
                          ...prev,
                          requireApproval: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email updates for project changes
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={projectSettings.notifications}
                      onCheckedChange={(checked) =>
                        setProjectSettings((prev) => ({
                          ...prev,
                          notifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoAssign">Auto-assign Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign tasks to available members
                      </p>
                    </div>
                    <Switch
                      id="autoAssign"
                      checked={projectSettings.autoAssign}
                      onCheckedChange={(checked) =>
                        setProjectSettings((prev) => ({
                          ...prev,
                          autoAssign: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <Button variant="outline">Reset to Default</Button>
                <Button className="gradient-primary text-white">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
