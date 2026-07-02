"use client";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
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

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Note {
  id: string;
  type: "text" | "checklist";
  title: string;
  content?: string;
  items?: ChecklistItem[];
  timestamp: Date;
}

interface ImportantLink {
  id: string;
  url: string;
  label: string;
  tags?: string[];
}

const SortableNote = ({
  note,
  onDelete,
  onToggleItem,
  onEdit,
}: {
  note: Note;
  onDelete: (id: string) => void;
  onToggleItem: (noteId: string, itemId: string) => void;
  onEdit: (note: Note) => void;
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

  const completedItems = note.items?.filter((item) => item.checked).length || 0;
  const totalItems = note.items?.length || 0;

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
              {note.timestamp.toLocaleDateString("en-US", {
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
          {note.items?.map((item) => (
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
  link: ImportantLink;
  onDelete: (id: string) => void;
  onEdit: (link: ImportantLink) => void;
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
                href={link.url}
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
            {link.tags && link.tags.length > 0 && (
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

export function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      type: "text",
      title: "Team Meeting Notes",
      content:
        "Discussed Q1 goals and project timelines. Sarah to follow up on resource allocation.",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "checklist",
      title: "Sprint Tasks",
      items: [
        { id: "c1", text: "Complete user authentication", checked: true },
        { id: "c2", text: "Review pull requests", checked: false },
        { id: "c3", text: "Update documentation", checked: false },
      ],
      timestamp: new Date(),
    },
  ]);

  const [links, setLinks] = useState<ImportantLink[]>([
    {
      id: "1",
      url: "https://docs.example.com",
      label: "API Documentation",
      tags: ["docs", "backend"],
    },
    {
      id: "2",
      url: "https://design.example.com",
      label: "Design System",
      tags: ["design", "ui"],
    },
    {
      id: "3",
      url: "https://jira.example.com",
      label: "Project Board",
      tags: ["project"],
    },
  ]);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingLink, setEditingLink] = useState<ImportantLink | null>(null);
  const [newNoteType, setNewNoteType] = useState<"text" | "checklist">("text");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTags, setNewLinkTags] = useState("");

  // Delete confirmation states
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addNote = () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Note title is required",
        variant: "destructive",
      });
      return;
    }

    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? {
                ...note,
                title: newNoteTitle,
                content: newNoteType === "text" ? newNoteContent : undefined,
                items:
                  newNoteType === "checklist"
                    ? checklistItems
                        .filter((item) => item.trim())
                        .map((text, index) => ({
                          id: `item-${index}`,
                          text,
                          checked: note.items?.[index]?.checked || false,
                        }))
                    : undefined,
              }
            : note,
        ),
      );
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    } else {
      const note: Note = {
        id: Date.now().toString(),
        type: newNoteType,
        title: newNoteTitle,
        content: newNoteType === "text" ? newNoteContent : undefined,
        items:
          newNoteType === "checklist"
            ? checklistItems
                .filter((item) => item.trim())
                .map((text, index) => ({
                  id: `item-${index}`,
                  text,
                  checked: false,
                }))
            : undefined,
        timestamp: new Date(),
      };

      setNotes([...notes, note]);
      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
    }

    setEditingNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setChecklistItems([""]);
    setNoteDialogOpen(false);
  };

  const addLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      toast({
        title: "Error",
        description: "Label and URL are required",
        variant: "destructive",
      });
      return;
    }

    if (editingLink) {
      setLinks(
        links.map((link) =>
          link.id === editingLink.id
            ? {
                ...link,
                url: newLinkUrl,
                label: newLinkLabel,
                tags: newLinkTags
                  ? newLinkTags.split(",").map((tag) => tag.trim())
                  : undefined,
              }
            : link,
        ),
      );
      toast({
        title: "Link updated",
        description: "Your link has been updated successfully.",
      });
    } else {
      const link: ImportantLink = {
        id: Date.now().toString(),
        url: newLinkUrl,
        label: newLinkLabel,
        tags: newLinkTags
          ? newLinkTags.split(",").map((tag) => tag.trim())
          : undefined,
      };

      setLinks([...links, link]);
      toast({
        title: "Link added",
        description: "Your link has been added successfully.",
      });
    }

    setEditingLink(null);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setNewLinkTags("");
    setLinkDialogOpen(false);
  };

  const confirmDeleteNote = () => {
    if (deleteNoteId) {
      setNotes(notes.filter((note) => note.id !== deleteNoteId));
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
      setDeleteNoteId(null);
    }
  };

  const confirmDeleteLink = () => {
    if (deleteLinkId) {
      setLinks(links.filter((link) => link.id !== deleteLinkId));
      toast({
        title: "Link deleted",
        description: "The link has been removed.",
      });
      setDeleteLinkId(null);
    }
  };

  const toggleChecklistItem = (noteId: string, itemId: string) => {
    setNotes(
      notes.map((note) => {
        if (note.id === noteId && note.items) {
          return {
            ...note,
            items: note.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item,
            ),
          };
        }
        return note;
      }),
    );
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard.",
    });
  };

  const handleNoteDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setNotes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteType(note.type);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || "");
    setChecklistItems(note.items?.map((item) => item.text) || [""]);
    setNoteDialogOpen(true);
  };

  const handleEditLink = (link: ImportantLink) => {
    setEditingLink(link);
    setNewLinkLabel(link.label);
    setNewLinkUrl(link.url);
    setNewLinkTags(link.tags?.join(", ") || "");
    setLinkDialogOpen(true);
  };

  const noteToDelete = notes.find((n) => n.id === deleteNoteId);
  const linkToDelete = links.find((l) => l.id === deleteLinkId);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes */}
        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
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
                  if (!open) {
                    setEditingNote(null);
                    setNewNoteTitle("");
                    setNewNoteContent("");
                    setChecklistItems([""]);
                  }
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
                        <Label htmlFor="checklist-item">Checklist Items</Label>
                        <div className="space-y-2">
                          {checklistItems.map((item, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...checklistItems];
                                  newItems[index] = e.target.value;
                                  setChecklistItems(newItems);
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
                              setChecklistItems([...checklistItems, ""])
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
                      <Button onClick={addNote}>
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
                        onToggleItem={toggleChecklistItem}
                        onEdit={handleEditNote}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="bg-card border border-border hover:shadow-md transition-shadow duration-200">
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
                  if (!open) {
                    setEditingLink(null);
                    setNewLinkLabel("");
                    setNewLinkUrl("");
                    setNewLinkTags("");
                  }
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
                      <Button onClick={addLink}>
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

      {/* Delete Note Confirmation */}
      <AlertDialog
        open={!!deleteNoteId}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Confirmation */}
      <AlertDialog
        open={!!deleteLinkId}
        onOpenChange={(open) => !open && setDeleteLinkId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{linkToDelete?.label}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLink}
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
