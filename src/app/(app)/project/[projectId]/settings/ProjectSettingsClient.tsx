"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Trash2, AlertTriangle, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  updateProject,
  archiveProject,
  deleteProject,
} from "@/actions/projects";

interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  archived: number;
}

interface ProjectSettingsClientProps {
  project: Project;
  userRole: "owner" | "admin";
}

export function ProjectSettingsClient({
  project,
  userRole,
}: ProjectSettingsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [projectName, setProjectName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState<string>(project.visibility);
  const [allowComments, setAllowComments] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const expectedConfirmText = `delete ${project.name}`;
  const canConfirmDelete =
    deleteConfirmText.trim() === expectedConfirmText.trim();

  const handleSave = () => {
    const formData = new FormData();
    formData.set("project_id", project.id);
    formData.set("name", projectName.trim());
    formData.set("description", description);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await updateProject(undefined, formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings saved",
          description: "Project settings have been updated successfully.",
        });
      }
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveProject(project.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: project.archived ? "Project restored" : "Project archived",
          description: project.archived
            ? "The project is now active again."
            : "The project has been archived and hidden from the projects list.",
        });
        router.push("/projects");
      }
    });
  };

  const handleDelete = () => {
    if (!canConfirmDelete) return;
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setDeleteDialogOpen(false);
      toast({
        title: "Project deleted",
        description: `"${project.name}" has been deleted.`,
        variant: "destructive",
      });
      router.push("/projects");
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/project/${project.id}`)}
          className="mb-3 -ml-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Project Settings
        </h1>
        <p className="text-muted-foreground">
          Manage how this project behaves for everyone on the team
        </p>
      </div>

      {/* General */}
      <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Basic project information shown across the workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              A short summary helps new members get up to speed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  Private — only invited members
                </SelectItem>
                <SelectItem value="public">
                  Public — anyone in the workspace
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Control collaboration and notification behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments" className="text-sm font-medium">
                Allow comments
              </Label>
              <p className="text-xs text-muted-foreground">
                Let members comment on tasks and discussions.
              </p>
            </div>
            <Switch
              id="comments"
              checked={allowComments}
              onCheckedChange={setAllowComments}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Email notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Send activity digests and mentions over email.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="bg-card border border-destructive/40 hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Proceed carefully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">
                {project.archived ? "Restore project" : "Archive project"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {project.archived
                  ? "Make this project active and visible again."
                  : "Hide this project from the projects list. You can restore it later."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              {project.archived ? "Restore" : "Archive"}
            </Button>
          </div>

          {userRole === "owner" && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Delete this project
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All tasks, epics, and sprints will be permanently removed.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete project
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All tasks, epics, and sprints in{" "}
              <span className="font-semibold text-foreground">
                {project.name}
              </span>{" "}
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type{" "}
              <span className="font-mono text-foreground">
                delete {project.name}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`delete ${project.name}`}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirmDelete}
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
