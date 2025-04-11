"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReactNode } from "react";

type FieldComponentProps = {
  label: string;
  className?: string;
};

type FieldTypes = {
  text: (props: FieldComponentProps) => ReactNode;
  textarea: (props: FieldComponentProps) => ReactNode;
  date: (props: FieldComponentProps) => ReactNode;
};

type Field = {
  id: string;
  type: keyof FieldTypes;
  label: string;
  className?: string;
};

const fieldTypes: FieldTypes = {
  text: ({ label, className }) => (
    <Input placeholder={label} className={className || "w-full"} />
  ),
  textarea: ({ label, className }) => (
    <Textarea placeholder={label} className={className || "w-full"} />
  ),
  date: ({ className }) => <Calendar className={className || "w-full"} />,
};

function SortableItem({
  id,
  field,
  onEdit,
}: {
  id: string;
  field: Field;
  onEdit: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center gap-4 w-full"
    >
      <div className="flex items-center gap-4 w-full">
        <div
          className="cursor-move p-2 text-gray-400 hover:text-black"
          {...attributes}
          {...listeners}
        >
          ⠿
        </div>
        <div className="w-full">{fieldTypes[field.type](field)}</div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
        ✏️
      </Button>
    </div>
  );
}

export default function AdminUI() {
  const [fields, setFields] = useState<Field[]>([
    { id: "1", type: "text", label: "Text Field", className: "w-full" },
    { id: "2", type: "textarea", label: "Textarea Field", className: "w-full" },
    { id: "3", type: "date", label: "Date Field", className: "w-full" },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<keyof FieldTypes>("text");
  const [editClass, setEditClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const activeField = fields.find((f) => f.id === activeId) || null;

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over?.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setFields((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const openEditModal = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;
    setEditingId(id);
    setEditLabel(field.label);
    setEditType(field.type);
    setEditClass(field.className || "");
    setShowModal(true);
  };

  const handleSaveEdit = () => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === editingId
          ? { ...f, label: editLabel, type: editType, className: editClass }
          : f
      )
    );
    setEditingId(null);
    setEditLabel("");
    setEditType("text");
    setEditClass("");
    setShowModal(false);
  };

  return (
    <div className="p-10 max-w-3xl mx-auto space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {fields.map((field) => (
              <SortableItem
                key={field.id}
                id={field.id}
                field={field}
                onEdit={openEditModal}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeField && (
            <div className="w-[300px] bg-white border rounded-xl p-4 shadow-md">
              {fieldTypes[activeField.type](activeField)}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <small>Placeholder</small>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Field Label"
              />
            </div>
            <div>
              <small>Type</small>
              <Select
                value={editType}
                onValueChange={(val) => setEditType(val as keyof FieldTypes)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <small>Class Name</small>
              <Input
                value={editClass}
                onChange={(e) => setEditClass(e.target.value)}
                placeholder="e.g. w-full text-red-500"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
