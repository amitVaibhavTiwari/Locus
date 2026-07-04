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
import { Save, Archive, ArchiveRestore } from "lucide-react";
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
  const [, startTransition] = useTransition();

  const [projectName, setProjectName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState<string>(project.visibility);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");

  const expectedArchiveText = `archive ${project.name}`;
  const canConfirmArchive =
    archiveConfirmText.trim().toLowerCase() ===
    expectedArchiveText.toLowerCase();

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
          description: "Project settings updated.",
        });
      }
    });
  };

  const handleArchive = () => {
    if (!canConfirmArchive) return;
    startTransition(async () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Project Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage how this project appears and behaves for your team
        </p>
      </div>

      <section className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="max-w-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger id="visibility" className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </section>

      {userRole === "owner" && (
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-destructive">
              Danger Zone
            </h2>
            {/* <p className="text-xs text-muted-foreground mt-0.5">
              These actions are hard to undo. Be careful.
            </p> */}
          </div>

          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-foreground">
                {project.archived ? "Restore project" : "Archive project"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {project.archived
                  ? "Make this project active and visible to the team again."
                  : "Hide this project from the projects list. It can be restored later."}
              </p>
            </div>
            {project.archived ? (
              <Button variant="outline" size="sm" onClick={handleRestore}>
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => {
                  setArchiveConfirmText("");
                  setArchiveDialogOpen(true);
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            )}
          </div>
        </section>
      )}

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center items-center gap-1">
            <DialogTitle className="text-xl font-semibold">
              Archive this project?
            </DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-semibold"> {project.name}</span> will be
              hidden from the projects list but can be restored later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 mt-4">
            <Label
              htmlFor="archive-confirm"
              className="text-center font font-semibold block"
            >
              Type below text to confirm
            </Label>
            <p className=" text-sm text-center text-foreground/70 tracking-wide select-none">
              Archive {project.name}
            </p>
            <Input
              id="archive-confirm"
              value={archiveConfirmText}
              onChange={(e) => setArchiveConfirmText(e.target.value)}
              // placeholder={`archive ${project.name}`}
              autoComplete="off"
              className="text-center"
              onKeyDown={(e) => e.key === "Enter" && handleArchive()}
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canConfirmArchive}
              onClick={handleArchive}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
