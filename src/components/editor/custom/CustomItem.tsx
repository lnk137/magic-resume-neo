import { cloneCustomItems, isCustomFieldBold } from "@/lib/customItems";
import { useCallback, useState } from "react";
import {
  motion,
  useDragControls,
  Reorder,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { GripVertical, Eye, EyeOff, ChevronDown, Trash2, Copy, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import Field from "../Field";

import { CustomItem as CustomItemType, CustomField } from "@/types/resume";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ThemeModal from "@/components/shared/ThemeModal";
const CustomItemEditor = ({
  item,
  onSave,
  sectionId,
}: {
  item: CustomItemType;
  sectionId: string;
  onSave: (item: CustomItemType) => void;
}) => {
  const handleChange = (field: keyof CustomItemType, value: string) => {
    onSave({ ...item, [field]: value });
  };

  const fields: { key: CustomField; label: string }[] = [
    { key: "title", label: "内容－左" }, { key: "subtitle", label: "内容－中" },
    { key: "dateRange", label: "内容－右" }, { key: "description", label: "详细描述" },
  ];
  const label = (field: CustomField) => item.fieldLabels?.[field] || fields.find((entry) => entry.key === field)!.label;
  return (
    <div className="space-y-5">
      <details className="rounded-md border border-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">字段与排版</summary>
        <div className="space-y-3 border-t border-border p-3">
          {fields.map(({ key, label: defaultLabel }) => (
            <div key={key} className="flex items-center gap-3">
              <Input aria-label={`${defaultLabel}字段名称`} placeholder={defaultLabel} value={item.fieldLabels?.[key] ?? ""} onChange={(event) => onSave({ ...item, fieldLabels: { ...item.fieldLabels, [key]: event.target.value } })} className="h-8 min-w-0 flex-1" />
              <Switch aria-label={`在简历中显示${defaultLabel}`} checked={!item.hiddenFields?.includes(key)} onCheckedChange={(checked) => onSave({ ...item, hiddenFields: checked ? (item.hiddenFields ?? []).filter((field) => field !== key) : [...(item.hiddenFields ?? []), key] })} />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-sm">正文对齐</span>
            <div className="flex gap-1">
              {([{ value: "left", label: "左对齐", icon: AlignLeft }, { value: "center", label: "居中", icon: AlignCenter }, { value: "right", label: "右对齐", icon: AlignRight }] as const).map(({ value, label, icon: Icon }) => (
                <Button key={value} type="button" variant={(item.alignment ?? "left") === value ? "secondary" : "ghost"} size="sm" aria-label={label} aria-pressed={(item.alignment ?? "left") === value} onClick={() => onSave({ ...item, alignment: value })}><Icon className="h-4 w-4" /></Button>
              ))}
            </div>
          </div>
        </div>
      </details>
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={label("title")}
            bold={isCustomFieldBold(item, "title")}
            onBoldChange={(bold) => onSave({ ...item, fieldBold: { ...item.fieldBold, title: bold } })}
            colorPath={`customData.${sectionId}.${item.id}.title`}
            value={item.title}
            onChange={(value) => handleChange("title", value)}
            placeholder="左侧内容"
          />
          <Field
            label={label("subtitle")}
            bold={isCustomFieldBold(item, "subtitle")}
            onBoldChange={(bold) => onSave({ ...item, fieldBold: { ...item.fieldBold, subtitle: bold } })}
            colorPath={`customData.${sectionId}.${item.id}.subtitle`}
            value={item.subtitle}
            onChange={(value) => handleChange("subtitle", value)}
            placeholder="中间内容"
          />
        </div>

        <Field
          label={label("dateRange")}
            bold={isCustomFieldBold(item, "dateRange")}
            onBoldChange={(bold) => onSave({ ...item, fieldBold: { ...item.fieldBold, dateRange: bold } })}
            colorPath={`customData.${sectionId}.${item.id}.dateRange`}
          value={item.dateRange}
          onChange={(value) => handleChange("dateRange", value)}
          placeholder="右侧内容"
        />

        <Field
          label={label("description")}
            colorPath={`customData.${sectionId}.${item.id}.description`}
          value={item.description}
          onChange={(value) => handleChange("description", value)}
          type="editor"
          placeholder="请输入详细描述..."
        />
      </div>
    </div>
  );
};

const CustomItem = ({
  item,
  sectionId,
}: {
  item: CustomItemType;
  sectionId: string;
}) => {
  const { updateCustomItem, removeCustomItem, updateResume, activeResume } = useResumeStore();
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateCustomItem(sectionId, item.id, { visible: !item.visible });
        setIsUpdating(false);
      }, 10);
    },
    [item, updateCustomItem, isUpdating, sectionId]
  );

  return (
    <Reorder.Item
      id={item.id}
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "rounded-lg border overflow-hidden flex group",
        "bg-card hover:border-primary/50",
        "border-border"
      )}
    >
      <div
        onPointerDown={(event) => {
          if (expandedId === item.id) return;
          dragControls.start(event);
        }}
        className={cn(
          "w-8 flex items-center justify-center border-r shrink-0 touch-none",
          "border-border",
          expandedId === item.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-muted/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            "text-muted-foreground",
            expandedId === item.id && "opacity-50"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-3 py-3 flex items-center justify-between cursor-pointer select-none",
            expandedId === item.id && "bg-muted/10"
          )}
          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                 "font-medium truncate text-foreground"
              )}
            >
              {item.title || "未命名模块"}
            </h3>
            {item.subtitle && (
              <p
                className={cn(
                  "text-sm truncate",
                  "dark:text-muted-foreground text-gray-500"
                )}
              >
                {item.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-0.5 ml-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label={item.visible ? "隐藏条目" : "显示条目"}
              disabled={isUpdating}
              onClick={handleVisibilityToggle}
            >
              {item.visible ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="复制条目" title="复制条目" onClick={(event) => {
              event.stopPropagation();
              if (!activeResume) return;
              const entries = activeResume.customData?.[sectionId] ?? [];
              const index = entries.findIndex((entry) => entry.id === item.id);
              const { items: [copy], fieldColors } = cloneCustomItems([item], sectionId, sectionId, activeResume.globalSettings?.fieldColors);
              updateResume(activeResume.id, {
                customData: { ...activeResume.customData, [sectionId]: [...entries.slice(0, index + 1), copy, ...entries.slice(index + 1)] },
                globalSettings: { ...activeResume.globalSettings, fieldColors },
              });
            }}><Copy className="h-4 w-4" /></Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="删除条目"
              className={cn(
                "text-sm h-8 w-8 p-0",
                "dark:hover:bg-red-900/50 dark:text-red-400 hover:bg-red-50 text-red-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <ThemeModal
              isOpen={deleteDialogOpen}
              title={item.title}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                removeCustomItem(sectionId, item.id);
                setExpandedId(null);
                setDeleteDialogOpen(false);
              }}
            />

            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === item.id ? 180 : 0,
              }}
            >
              <ChevronDown
                className={cn("w-5 h-5", "text-muted-foreground")}
              />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {expandedId === item.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "px-4 pb-4 space-y-4",
                  "border-border"
                )}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    "bg-border"
                  )}
                />
                <CustomItemEditor
                  item={item}
                  sectionId={sectionId}
                  onSave={(updatedItem) => {
                    updateCustomItem(sectionId, item.id, updatedItem);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

export default CustomItem;
