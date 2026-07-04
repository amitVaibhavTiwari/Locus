"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResizableImage } from "./ResizableImageExtension";

export interface RichTextEditorRef {
  /** Upload all pending pasted images and return the final HTML. Call before submit. */
  flush: () => Promise<string>;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  projectId?: string;
}

const colors = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
  "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#008000", "#FF1493",
  "#1E90FF", "#32CD32", "#FFD700", "#FF6347", "#4B0082", "#FF4500",
  "#00CED1", "#9370DB", "#20B2AA", "#FF69B4", "#8B4513", "#2E8B57",
];

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor({ content, onChange, placeholder = "Start typing...", projectId }, ref) {
    // blob url -> original File, for images pasted but not yet uploaded
    const pendingBlobs = useRef<Map<string, File>>(new Map());
    const projectIdRef = useRef(projectId);
    useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

    const uploadToServer = useCallback(async (file: File): Promise<string | null> => {
      const body = new FormData();
      body.append("file", file);
      if (projectIdRef.current) body.append("projectId", projectIdRef.current);
      try {
        const res = await fetch("/api/upload-image", { method: "POST", body });
        if (!res.ok) return null;
        const { url } = await res.json();
        return url as string;
      } catch {
        return null;
      }
    }, []);

    // Revoke all remaining blob URLs on unmount
    useEffect(() => {
      return () => {
        pendingBlobs.current.forEach((_, url) => URL.revokeObjectURL(url));
      };
    }, []);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        ResizableImage.configure({ inline: true, allowBase64: false }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "center", "right"],
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none focus:outline-none min-h-[360px] p-3",
        },
        handlePaste: (_view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              event.preventDefault();
              const file = items[i].getAsFile();
              if (!file) return true;
              // Stage as a local blob — upload happens only on flush()
              const blobUrl = URL.createObjectURL(file);
              pendingBlobs.current.set(blobUrl, file);
              editor?.chain().focus().setImage({ src: blobUrl }).run();
              return true;
            }
          }
          return false;
        },
      },
    });

    useImperativeHandle(ref, () => ({
      async flush(): Promise<string> {
        if (!editor) return "";

        const html = editor.getHTML();

        // Collect blobs that are still referenced in the current content
        const toUpload: Array<{ blobUrl: string; file: File }> = [];
        for (const [blobUrl, file] of pendingBlobs.current.entries()) {
          if (html.includes(blobUrl)) {
            toUpload.push({ blobUrl, file });
          } else {
            // Removed from editor before submit — just clean up
            URL.revokeObjectURL(blobUrl);
            pendingBlobs.current.delete(blobUrl);
          }
        }

        if (toUpload.length === 0) return html;

        const results = await Promise.all(
          toUpload.map(({ file }) => uploadToServer(file)),
        );

        let finalHtml = html;
        for (let i = 0; i < toUpload.length; i++) {
          const { blobUrl } = toUpload[i];
          const realUrl = results[i];
          if (!realUrl) throw new Error("One or more images failed to upload");
          finalHtml = finalHtml.split(blobUrl).join(realUrl);
          URL.revokeObjectURL(blobUrl);
          pendingBlobs.current.delete(blobUrl);
        }

        return finalHtml;
      },
    }), [editor, uploadToServer]);

    if (!editor) return null;

    return (
      <div className="border rounded-lg overflow-hidden relative">
        <div className="bg-muted/30 border-b p-2 flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            type="button"
            size="sm"
            variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="ghost">
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="flex flex-wrap gap-1.5 max-w-60">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor: color === "#FFFFFF" ? "#e5e7eb" : color,
                    }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="relative">
          <EditorContent editor={editor} />
          {!content && (
            <div className="absolute top-3 left-3 text-muted-foreground text-sm pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
    );
  },
);
