"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Search, ArchiveRestore } from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { useToast } from "@/hooks/use-toast";
import { archiveProject } from "@/actions/projects";

interface Project {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  updated_at: string;
}

interface ArchivedProjectsClientProps {
  projects: Project[];
}

export function ArchivedProjectsClient({
  projects: initialProjects,
}: ArchivedProjectsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [recoverTarget, setRecoverTarget] = useState<Project | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const filtered = searchQuery.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : projects;

  const expectedText = `recover ${recoverTarget?.name ?? ""}`;
  const canConfirm =
    confirmText.trim().toLowerCase() === expectedText.toLowerCase();

  const openRecover = (project: Project) => {
    setConfirmText("");
    setRecoverTarget(project);
  };

  const handleRecover = () => {
    if (!recoverTarget || !canConfirm) return;
    const target = recoverTarget;
    setRecoverTarget(null);
    setProjects((prev) => prev.filter((p) => p.id !== target.id));
    startTransition(async () => {
      const result = await archiveProject(target.id);
      if (result.error) {
        setProjects((prev) => [...prev, target]);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Project restored",
          description: `"${target.name}" is now active.`,
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
              className="-ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                Archived Projects
              </h1>
              <span className="flex items-center justify-center min-w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold px-2">
                {projects.length}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-1 ml-10">
            Projects hidden from the main list
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search archived projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDateTime(project.updated_at, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRecover(project)}
              >
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Recover
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            {searchQuery ? (
              <p className="text-muted-foreground">
                No archived projects match &ldquo;{searchQuery}&rdquo;.
              </p>
            ) : (
              <p className="text-muted-foreground">No archived projects.</p>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={!!recoverTarget}
        onOpenChange={(open) => !open && setRecoverTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center items-center gap-1">
            <DialogTitle className="text-xl font-semibold">
              Recover this project?
            </DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-semibold">{recoverTarget?.name}</span> will
              be restored and visible to the team again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 mt-4">
            <Label
              htmlFor="recover-confirm"
              className="text-center font-semibold block"
            >
              Type to confirm
            </Label>
            <p className="text-sm text-center text-foreground/70 tracking-wide select-none">
              Recover {recoverTarget?.name}
            </p>
            <Input
              id="recover-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              // placeholder={`recover ${recoverTarget?.name}`}
              autoComplete="off"
              className="text-center"
              onKeyDown={(e) => e.key === "Enter" && handleRecover()}
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRecoverTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canConfirm}
              onClick={handleRecover}
            >
              <ArchiveRestore className="w-4 h-4 mr-2" />
              Recover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
