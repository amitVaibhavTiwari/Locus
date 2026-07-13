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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProject, archiveProject } from "@/actions/projects";

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
  const [isPending, startTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();

  const [projectName, setProjectName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState<string>(project.visibility);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");

  const expectedArchiveText = `archive ${project.name}`;
  const canConfirmArchive =
    archiveConfirmText.trim().toLowerCase() ===
    expectedArchiveText.toLowerCase();

  const isDirty =
    projectName.trim() !== project.name ||
    description !== (project.description ?? "") ||
    visibility !== project.visibility;

  const handleSave = () => {
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

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
          description: "Project settings updated.",
        });
      }
    });
  };

  const handleArchive = () => {
    if (!canConfirmArchive) return;
    startArchiveTransition(async () => {
      const result = await archiveProject(project.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setArchiveDialogOpen(false);
      toast({
        title: "Project archived",
        description: "The project is now hidden from the projects list.",
      });
      router.push("/projects");
    });
  };

  const handleRestore = () => {
    startArchiveTransition(async () => {
      const result = await archiveProject(project.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Project restored",
          description: "The project is active again.",
        });
        router.push("/projects");
      }
    });
  };

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-4xl font-bold">Project Settings</h1>
        <p className="text-base text-muted-foreground mt-1">
          Manage this project&apos;s details and preferences.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-lg bg-muted/40 px-5 py-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold">General</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Basic project information.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-muted/40 px-5 py-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Visibility</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Control who can see this project.
            </p>
          </div>
          <div className="space-y-1.5">
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="visibility" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {visibility === "private"
                ? "Only members added to this project can see it."
                : "All workspace members can see this project."}
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </Button>
        </div>

        {userRole === "owner" && (
          <section className="rounded-lg bg-muted/40 px-5 py-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-destructive">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Irreversible or impactful actions.
              </p>
            </div>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium">
                  {project.archived ? "Restore project" : "Archive project"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {project.archived
                    ? "Make this project active and visible to the team again."
                    : "Hide this project from the projects list. It can be restored later."}
                </p>
              </div>
              {project.archived ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  disabled={isArchiving}
                  className="shrink-0 gap-2"
                >
                  {isArchiving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArchiveRestore className="w-4 h-4" />
                  )}
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={() => {
                    setArchiveConfirmText("");
                    setArchiveDialogOpen(true);
                  }}
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive this project?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {project.name}
              </span>{" "}
              will be hidden from the projects list but can be restored later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="archive-confirm">
              Type{" "}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                archive {project.name}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="archive-confirm"
              value={archiveConfirmText}
              onChange={(e) => setArchiveConfirmText(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => e.key === "Enter" && handleArchive()}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirmArchive || isArchiving}
              onClick={handleArchive}
              className="gap-2"
            >
              {isArchiving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              Archive project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
