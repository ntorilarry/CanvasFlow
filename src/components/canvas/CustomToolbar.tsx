"use client";

import { useState, useEffect } from "react";
import type { Editor } from "tldraw";
import { FaMapPin } from "react-icons/fa6";
import { FiCamera } from "react-icons/fi";

interface CustomToolbarProps {
  editor: Editor;
}

export function CustomToolbar({ editor }: CustomToolbarProps) {
  const [currentToolId, setCurrentToolId] = useState(() => editor.getCurrentToolId());

  useEffect(() => {
    return editor.store.listen(() => {
      setCurrentToolId(editor.getCurrentToolId());
    });
  }, [editor]);

  const tools = [
    { id: "pin", icon: <FaMapPin size={20} className="text-red-500" />, label: "Pin Tool (P)" },
    { id: "camera", icon: <FiCamera size={20} />, label: "Camera Tool (C)" },
  ];

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 w-fit flex items-center gap-1 p-1.5 bg-white rounded-xl shadow-lg border border-gray-200 z-[100] touch-none
        bottom-4 top-auto md:top-4 md:bottom-auto"
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => editor.setCurrentTool(tool.id as "pin" | "camera")}
          title={tool.label}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            currentToolId === tool.id
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
