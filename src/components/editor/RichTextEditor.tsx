"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
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

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const colors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#008000",
  "#FF1493",
  "#1E90FF",
  "#32CD32",
  "#FFD700",
  "#FF6347",
  "#4B0082",
  "#FF4500",
  "#00CED1",
  "#9370DB",
  "#20B2AA",
  "#FF69B4",
  "#8B4513",
  "#2E8B57",
];

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
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
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                editor?.chain().focus().setImage({ src: base64 }).run();
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  if (!editor) {
    return null;
  }

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
          variant={
            editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"
          }
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={
            editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
          }
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={
            editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
          }
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
            <div className="flex flex-wrap gap-1.5 max-w-[240px]">
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
}
