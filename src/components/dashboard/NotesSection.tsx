"use client";
import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createNote,
  updateNote,
  deleteNote,
  reorderNotes,
  toggleNoteItem,
} from "@/actions/notes";
import {
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from "@/actions/links";

export interface NoteItemData {
  id: string;
  text: string;
  checked: boolean;
  rank: number;
}

export interface NoteData {
  id: string;
  type: "text" | "checklist";
  title: string;
  content: string | null;
  items: NoteItemData[];
  created_at: string;
}

export interface LinkData {
  id: string;
  label: string;
  url: string;
  tags: string[];
  rank: number;
}

interface NotesSectionProps {
  initialNotes: NoteData[];
  initialLinks: LinkData[];
}

const SortableNote = ({
  note,
  onDelete,
  onToggleItem,
  onEdit,
}: {
  note: NoteData;
  onDelete: (id: string) => void;
  onToggleItem: (noteId: string, itemId: string) => void;
  onEdit: (note: NoteData) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? 1.02 : 1,
  };

  const completedItems = note.items.filter((i) => i.checked).length;
  const totalItems = note.items.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-colors duration-150 cursor-grab active:cursor-grabbing group ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">
                {note.title}
              </h4>
              {note.type === "checklist" && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {completedItems}/{totalItems}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(note.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {note.type === "text" ? (
        <p className="text-sm text-muted-foreground mt-3 ml-7 line-clamp-3">
          {note.content}
        </p>
      ) : (
        <div className="space-y-2 mt-3 ml-7">
          {note.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggleItem(note.id, item.id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span
                className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SortableLink = ({
  link,
  onDelete,
  onEdit,
  onCopy,
}: {
  link: LinkData;
  onDelete: (id: string) => void;
  onEdit: (link: LinkData) => void;
  onCopy: (url: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? 1.02 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-colors duration-150 cursor-grab active:cursor-grabbing group ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <a
                href={
                  /^https?:\/\//i.test(link.url)
                    ? link.url
                    : `https://${link.url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {link.label}
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {link.url}
            </p>
            {link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {link.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(link.url);
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(link);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(link.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export function NotesSection({
  initialNotes,
  initialLinks,
}: NotesSectionProps) {
  const [notes, setNotes] = useState<NoteData[]>(initialNotes);
  const [links, setLinks] = useState<LinkData[]>(initialLinks);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [newNoteType, setNewNoteType] = useState<"text" | "checklist">("text");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [checklistItems, setChecklistItems] = useState<
    { text: string; checked: boolean }[]
  >([{ text: "", checked: false }]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTags, setNewLinkTags] = useState("");

  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const resetNoteDialog = () => {
    setEditingNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setChecklistItems([{ text: "", checked: false }]);
    setNewNoteType("text");
  };

  const resetLinkDialog = () => {
    setEditingLink(null);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setNewLinkTags("");
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim()) {
      toast.error("Note title is required");
      return;
    }

    if (editingNote) {
      const updatedItems =
        newNoteType === "checklist"
          ? checklistItems
              .filter((i) => i.text.trim())
              .map((i, idx) => ({
                id: crypto.randomUUID(),
                text: i.text,
                checked: i.checked,
                rank: idx,
              }))
          : [];

      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: newNoteTitle,
                type: newNoteType,
                content: newNoteType === "text" ? newNoteContent : null,
                items: updatedItems,
              }
            : n,
        ),
      );

      startTransition(async () => {
        const res = await updateNote(editingNote.id, {
          title: newNoteTitle,
          type: newNoteType,
          content: newNoteContent,
          items: checklistItems.filter((i) => i.text.trim()),
        });
        if (res.error) toast.error(res.error);
        else toast.success("Note updated");
      });
    } else {
      const tempId = crypto.randomUUID();
      const tempNote: NoteData = {
        id: tempId,
        type: newNoteType,
        title: newNoteTitle,
        content: newNoteType === "text" ? newNoteContent : null,
        items:
          newNoteType === "checklist"
            ? checklistItems
                .filter((i) => i.text.trim())
                .map((i, idx) => ({
                  id: crypto.randomUUID(),
                  text: i.text,
                  checked: false,
                  rank: idx,
                }))
            : [],
        created_at: new Date().toISOString(),
      };
      setNotes((prev) => [...prev, tempNote]);

      startTransition(async () => {
        const res = await createNote({
          type: newNoteType,
          title: newNoteTitle,
          content: newNoteContent,
          items: checklistItems.filter((i) => i.text.trim()).map((i) => i.text),
        });
        if (res.error) {
          toast.error(res.error);
          setNotes((prev) => prev.filter((n) => n.id !== tempId));
        } else if (res.note) {
          setNotes((prev) =>
            prev.map((n) => (n.id === tempId ? res.note! : n)),
          );
          toast.success("Note added");
        }
      });
    }

    resetNoteDialog();
    setNoteDialogOpen(false);
  };

  const handleSaveLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      toast.error("Label and URL are required");
      return;
    }

    if (editingLink) {
      const tags = newLinkTags
        ? newLinkTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      setLinks((prev) =>
        prev.map((l) =>
          l.id === editingLink.id
            ? { ...l, label: newLinkLabel, url: newLinkUrl, tags }
            : l,
        ),
      );

      startTransition(async () => {
        const res = await updateLink(editingLink.id, {
          label: newLinkLabel,
          url: newLinkUrl,
          tags: newLinkTags,
        });
        if (res.error) toast.error(res.error);
        else toast.success("Link updated");
      });
    } else {
      const tempId = crypto.randomUUID();
      const tempLink: LinkData = {
        id: tempId,
        label: newLinkLabel,
        url: newLinkUrl,
        tags: newLinkTags
          ? newLinkTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        rank: links.length,
      };
      setLinks((prev) => [...prev, tempLink]);

      startTransition(async () => {
        const res = await createLink({
          label: newLinkLabel,
          url: newLinkUrl,
          tags: newLinkTags,
        });
        if (res.error) {
          toast.error(res.error);
          setLinks((prev) => prev.filter((l) => l.id !== tempId));
        } else if (res.link) {
          setLinks((prev) =>
            prev.map((l) => (l.id === tempId ? res.link! : l)),
          );
          toast.success("Link added");
        }
      });
    }

    resetLinkDialog();
    setLinkDialogOpen(false);
  };

  const handleConfirmDeleteNote = () => {
    if (!deleteNoteId) return;
    const id = deleteNoteId;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeleteNoteId(null);
    startTransition(async () => {
      const res = await deleteNote(id);
      if (res.error) toast.error(res.error);
      else toast.success("Note deleted");
    });
  };

  const handleConfirmDeleteLink = () => {
    if (!deleteLinkId) return;
    const id = deleteLinkId;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setDeleteLinkId(null);
    startTransition(async () => {
      const res = await deleteLink(id);
      if (res.error) toast.error(res.error);
      else toast.success("Link deleted");
    });
  };

  const handleToggleItem = (noteId: string, itemId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              items: n.items.map((i) =>
                i.id === itemId ? { ...i, checked: !i.checked } : i,
              ),
            }
          : n,
      ),
    );
    startTransition(async () => {
      const res = await toggleNoteItem(noteId, itemId);
      if (res.error) toast.error(res.error);
    });
  };

  const handleNoteDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = notes.findIndex((i) => i.id === active.id);
    const newIndex = notes.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);
    setNotes(reordered);
    startTransition(() => reorderNotes(reordered.map((n) => n.id)));
  };

  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((i) => i.id === active.id);
    const newIndex = links.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered);
    startTransition(() => reorderLinks(reordered.map((l) => l.id)));
  };

  const handleEditNote = (note: NoteData) => {
    setEditingNote(note);
    setNewNoteType(note.type);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content ?? "");
    setChecklistItems(
      note.items.length > 0
        ? note.items.map((i) => ({ text: i.text, checked: i.checked }))
        : [{ text: "", checked: false }],
    );
    setNoteDialogOpen(true);
  };

  const handleEditLink = (link: LinkData) => {
    setEditingLink(link);
    setNewLinkLabel(link.label);
    setNewLinkUrl(link.url);
    setNewLinkTags(link.tags.join(", "));
    setLinkDialogOpen(true);
  };

  const copyLink = (url: string) => {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    navigator.clipboard.writeText(normalized);
    toast.success("Link copied to clipboard");
  };

  const noteToDelete = notes.find((n) => n.id === deleteNoteId);
  const linkToDelete = links.find((l) => l.id === deleteLinkId);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Notes */}
        <Card className="bg-card border border-border dark:border-none hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Notes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {notes.length} {notes.length === 1 ? "note" : "notes"}
                </p>
              </div>
              <Dialog
                open={noteDialogOpen}
                onOpenChange={(open) => {
                  setNoteDialogOpen(open);
                  if (!open) resetNoteDialog();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingNote ? "Edit Note" : "Add New Note"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingNote
                        ? "Update your note"
                        : "Create a text note or a checklist to keep track of important information."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Note Type</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={
                            newNoteType === "text" ? "default" : "outline"
                          }
                          onClick={() => setNewNoteType("text")}
                          className="flex-1"
                        >
                          Text Note
                        </Button>
                        <Button
                          type="button"
                          variant={
                            newNoteType === "checklist" ? "default" : "outline"
                          }
                          onClick={() => setNewNoteType("checklist")}
                          className="flex-1"
                        >
                          Checklist
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note-title">Title</Label>
                      <Input
                        id="note-title"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Enter note title"
                      />
                    </div>
                    {newNoteType === "text" ? (
                      <div className="space-y-2">
                        <Label htmlFor="note-content">Content</Label>
                        <Textarea
                          id="note-content"
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Enter note content"
                          rows={5}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Checklist Items</Label>
                        <div className="space-y-2">
                          {checklistItems.map((item, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={item.text}
                                onChange={(e) => {
                                  const next = [...checklistItems];
                                  next[index] = {
                                    ...next[index],
                                    text: e.target.value,
                                  };
                                  setChecklistItems(next);
                                }}
                                placeholder="Enter item"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  setChecklistItems(
                                    checklistItems.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setChecklistItems([
                                ...checklistItems,
                                { text: "", checked: false },
                              ])
                            }
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setNoteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveNote}>
                        {editingNote ? "Save Changes" : "Add Note"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              id="notes-tasks-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleNoteDragEnd}
            >
              <SortableContext
                items={notes.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        No notes yet. Add your first note!
                      </p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <SortableNote
                        key={note.id}
                        note={note}
                        onDelete={(id) => setDeleteNoteId(id)}
                        onToggleItem={handleToggleItem}
                        onEdit={handleEditNote}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-card border border-border dark:border-none hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Quick Links
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {links.length} {links.length === 1 ? "link" : "links"}
                </p>
              </div>
              <Dialog
                open={linkDialogOpen}
                onOpenChange={(open) => {
                  setLinkDialogOpen(open);
                  if (!open) resetLinkDialog();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingLink ? "Edit Link" : "Add Quick Link"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLink
                        ? "Update your link"
                        : "Add a link to important resources or documentation."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-label">Label *</Label>
                      <Input
                        id="link-label"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="e.g., API Documentation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-url">URL *</Label>
                      <Input
                        id="link-url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link-tags">Tags (comma separated)</Label>
                      <Input
                        id="link-tags"
                        value={newLinkTags}
                        onChange={(e) => setNewLinkTags(e.target.value)}
                        placeholder="e.g., docs, backend, api"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setLinkDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveLink}>
                        {editingLink ? "Save Changes" : "Add Link"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              id="notes-links-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLinkDragEnd}
            >
              <SortableContext
                items={links.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {links.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        No links yet. Add your first link!
                      </p>
                    </div>
                  ) : (
                    links.map((link) => (
                      <SortableLink
                        key={link.id}
                        link={link}
                        onDelete={(id) => setDeleteLinkId(id)}
                        onEdit={handleEditLink}
                        onCopy={copyLink}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={!!deleteNoteId}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{noteToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteLinkId}
        onOpenChange={(open) => !open && setDeleteLinkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{linkToDelete?.label}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
