"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
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

// Constants
const MAX_FIELDS = 10;

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

function AvailableFieldItem({
  field,
  onClick,
  disabled,
}: {
  field: Field;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-4 bg-white rounded-xl shadow-md ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-gray-100"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <span>{field.label}</span>
    </div>
  );
}

function FormArea({ children }: { children: ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: "form-area",
  });

  return (
    <div
      ref={setNodeRef}
      className="w-3/4 p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-[200px]"
    >
      {children}
    </div>
  );
}

export default function AdminUI() {
  const [fields, setFields] = useState<Field[]>([]);
  const [availableFields] = useState<Field[]>([
    { id: "text", type: "text", label: "Text Field" },
    { id: "textarea", type: "textarea", label: "Textarea Field" },
    { id: "date", type: "date", label: "Date Field" },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<keyof FieldTypes>("text");
  const [editClass, setEditClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddField = (fieldType: Field) => {
    if (fields.length >= MAX_FIELDS) {
      console.warn(`Maximum of ${MAX_FIELDS} fields reached`);
      return;
    }

    const newField = {
      ...fieldType,
      id: `${fieldType.id}-${Date.now()}`,
      label: `${fieldType.label} ${fields.length + 1}`,
    };
    setFields((prev) => [...prev, newField]);
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
    setShowModal(false);
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-8">
          <div className="w-1/4 bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Available Fields</h3>
            <div className="space-y-4">
              {availableFields.map((field) => (
                <AvailableFieldItem
                  key={field.id}
                  field={field}
                  onClick={() => handleAddField(field)}
                  disabled={fields.length >= MAX_FIELDS}
                />
              ))}
            </div>
          </div>

          <FormArea>
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

            {fields.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                Click fields to add them to your form
              </div>
            )}

            {fields.length >= MAX_FIELDS && (
              <div className="text-red-500 text-center py-2 text-sm">
                Maximum of {MAX_FIELDS} fields reached
              </div>
            )}
          </FormArea>
        </div>

        <DragOverlay>
          {activeField ? (
            <div className="p-4 bg-white rounded-xl shadow-md cursor-grabbing w-[200px]">
              {fieldTypes[activeField.type]({
                label: activeField.label,
                className: activeField.className,
              })}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Field Modal */}
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
