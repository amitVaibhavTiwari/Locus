"use client";
import React, { useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CreateEpic() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priority || !status || !owner) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Epic created successfully");
    router.push("/epics");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full py-6 px-4 lg:px-8">
        <div className="mb-8 pl-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/epics")}
            className="mb-4 hover:bg-transparent text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Epic</h1>
            <p className="text-muted-foreground mt-2">
              Create a new epic to organize related tasks
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pl-2">
          <div className="space-y-2">
            <Label htmlFor="title">Epic Title *</Label>
            <Input
              id="title"
              placeholder="E.g., User Authentication System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="max-w-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the epic's goals and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="max-w-2xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={setPriority} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Epic Owner *</Label>
              <Select value={owner} onValueChange={setOwner} required>
                <SelectTrigger>
                  <SelectValue placeholder="Assign owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="mike">Mike Johnson</SelectItem>
                  <SelectItem value="sarah">Sarah Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/epics")}
            >
              Cancel
            </Button>
            <Button type="submit">Create Epic</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
