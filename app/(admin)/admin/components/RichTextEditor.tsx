'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { TextAlign } from '@tiptap/extension-text-align';
import React, { useEffect, useState } from 'react';
import { 
  MdFormatBold, 
  MdFormatItalic, 
  MdFormatListBulleted, 
  MdFormatListNumbered,
  MdImage,
  MdTableChart,
  MdUndo,
  MdRedo,
  MdCode,
  MdFormatQuote,
  MdHorizontalRule,
  MdFormatColorText,
  MdFormatColorFill,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify
} from 'react-icons/md';

interface RichTextEditorProps {
  content: string | any;
  onChange: (content: any) => void;
  editable?: boolean;
}

export default function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const savedSelectionRef = React.useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Gapcursor,
      Dropcursor,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25,
        lastColumnResizable: true,
        allowTableNodeSelection: false,
        HTMLAttributes: {
          class: 'custom-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
    ],
    content: content || '',
    editable,
    immediatelyRender: false,
    editorProps: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          // Prevent default behavior on right-click to preserve selection
          if (event.button === 2) { // Right click
            event.preventDefault();
            return true;
          }
          return false;
        },
        contextmenu: (view, event) => {
          if (!editable) return false;
          event.preventDefault();
          event.stopPropagation();
          
          setContextMenu({ x: event.clientX, y: event.clientY });
          return true;
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange({
        json: editor.getJSON(),
        html: editor.getHTML(),
        text: editor.getText(),
      });
    },
  });

  // Only set content when the component first mounts or when loading existing content
  // Do NOT set content on every render or it will reset the cursor position
  useEffect(() => {
    if (!editor || !content) return;
    
    // Only update if content is different (for loading initial content)
    const isSame = JSON.stringify(editor.getJSON()) === JSON.stringify(content);
    if (!isSame && typeof content === 'object') {
      editor.commands.setContent(content, { emitUpdate: false }); 
    }
  }, [editor]); // Only run when editor is initialized, NOT when content changes

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showColorPicker && !target.closest('.relative')) {
        setShowColorPicker(false);
      }
    };
    
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  // Close context menu when clicking anywhere (but not on scroll)
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }
  }, [contextMenu]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    const rows = window.prompt('Number of rows:', '3');
    const cols = window.prompt('Number of columns:', '3');
    
    if (rows && cols) {
      const rowCount = parseInt(rows);
      const colCount = parseInt(cols);
      
      if (rowCount > 0 && colCount > 0) {
        try {
          editor?.chain().focus().insertTable({ rows: rowCount, cols: colCount, withHeaderRow: true }).run();
          console.log('Table inserted successfully');
        } catch (error) {
          console.error('Error inserting table:', error);
        }
      }
    }
  };

  const setColumnWidth = () => {
    const width = window.prompt('Enter column width (e.g., 100px, 20%, auto):', '100px');
    if (width) {
      editor?.chain().focus().setCellAttribute('colwidth', [parseInt(width)]).run();
    }
  };

  const setTableWidth = () => {
    const width = window.prompt('Enter table width (e.g., 100%, 800px):', '100%');
    if (width) {
      // Update table width via custom command
      const { state } = editor!;
      const { selection } = state;
      const table = selection.$anchor.node(-1);
      
      if (table && table.type.name === 'table') {
        editor?.chain().focus().updateAttributes('table', { width }).run();
      }
    }
  };

  if (!editable) {
    return <EditorContent editor={editor} className="prose max-w-none" />;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Bold (Ctrl+B)"
          >
            <MdFormatBold className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Italic (Ctrl+I)"
          >
            <MdFormatItalic className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('code') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Inline Code"
          >
            <MdCode className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Color */}
        <div className="relative flex gap-1">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 flex items-center gap-1"
              type="button"
              title="Text Color"
            >
              <MdFormatColorText className="w-5 h-5" />
              <div 
                className="w-4 h-1 rounded" 
                style={{ backgroundColor: editor?.getAttributes('textStyle').color || '#000000' }}
              />
            </button>
            
            {showColorPicker && (
              <div className="w-[200px] absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => {
                      setCurrentColor(e.target.value);
                      editor?.chain().focus().setColor(e.target.value).run();
                    }}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                
                {/* Preset Colors */}
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {[
                    '#000000', '#374151', '#6B7280', '#DC2626', '#EA580C', '#D97706',
                    '#CA8A04', '#65A30D', '#16A34A', '#059669', '#0891B2', '#0284C7',
                    '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setCurrentColor(color);
                        editor?.chain().focus().setColor(color).run();
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      type="button"
                      title={color}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run();
                    setCurrentColor('#000000');
                  }}
                  className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  type="button"
                >
                  Reset Color
                </button>
                
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="w-full px-2 py-1 text-xs mt-1 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                  type="button"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Alignment */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Align Left"
          >
            <MdFormatAlignLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Align Center"
          >
            <MdFormatAlignCenter className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Align Right"
          >
            <MdFormatAlignRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Justify"
          >
            <MdFormatAlignJustify className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Size (Headings) */}
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level) {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
          className="px-3 py-1 rounded border border-gray-300 text-sm bg-white hover:bg-gray-50 transition-colors"
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' :
            editor.isActive('heading', { level: 4 }) ? '4' :
            editor.isActive('heading', { level: 5 }) ? '5' :
            editor.isActive('heading', { level: 6 }) ? '6' : '0'
          }
          title="Text Size"
        >
          <option value="0">Normal (16px)</option>
          <option value="6">Small (14px)</option>
          <option value="5">Medium (18px)</option>
          <option value="4">Large (20px)</option>
          <option value="3">XL (24px)</option>
          <option value="2">2XL (32px)</option>
          <option value="1">3XL (36px)</option>
        </select>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Lists */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Bullet List"
          >
            <MdFormatListBulleted className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Numbered List"
          >
            <MdFormatListNumbered className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
            type="button"
            title="Quote"
          >
            <MdFormatQuote className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Insert Elements */}
        <div className="flex gap-1">
          <button
            onClick={addTable}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            type="button"
            title="Insert Table (custom size)"
          >
            <MdTableChart className="w-5 h-5" />
          </button>

          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            type="button"
            title="Insert Image"
          >
            <MdImage className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
            type="button"
            title="Horizontal Line"
          >
            <MdHorizontalRule className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            type="button"
            title="Undo (Ctrl+Z)"
          >
            <MdUndo className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            type="button"
            title="Redo (Ctrl+Y)"
          >
            <MdRedo className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm sm:prose lg:prose-lg max-w-none p-6 min-h-[500px] focus:outline-none"
      />

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-[200px] max-h-[80vh] overflow-y-auto"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Table Operations */}
          {editor?.isActive('table') && (
            <>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Table</div>
              <button
                onClick={() => {
                  editor?.chain().focus().addColumnBefore().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Add Column Before
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().addColumnAfter().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Add Column After
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().deleteColumn().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 transition-colors"
                type="button"
              >
                Delete Column
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  editor?.chain().focus().addRowBefore().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Add Row Before
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().addRowAfter().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Add Row After
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().deleteRow().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 transition-colors"
                type="button"
              >
                Delete Row
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  editor?.chain().focus().deleteTable().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 transition-colors"
                type="button"
              >
                Delete Table
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  setColumnWidth();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Set Column Width
              </button>
              <button
                onClick={() => {
                  setTableWidth();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                Set Table Width
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-3 py-1 text-xs text-gray-500 italic">
                💡 Drag column borders to resize
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Merge Cells</div>
              <button
                onClick={() => {
                  editor?.chain().focus().mergeCells().run();
                  setContextMenu(null);
                }}
                disabled={!editor?.can().mergeCells()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Merge Selected Cells
              </button>
              <button
                onClick={() => {
                  editor?.chain().focus().splitCell().run();
                  setContextMenu(null);
                }}
                disabled={!editor?.can().splitCell()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Split Cell
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Cell Properties</div>
              <button
                onClick={() => {
                  editor?.chain().focus().toggleHeaderCell().run();
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                type="button"
              >
                {editor?.isActive('tableHeader') ? 'Convert to Regular Cell' : 'Convert to Header Cell'}
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}

          {/* General Operations */}
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Edit</div>
          <button
            onClick={() => {
              editor?.chain().focus().undo().run();
              setContextMenu(null);
            }}
            disabled={!editor?.can().undo()}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Undo
          </button>
          <button
            onClick={() => {
              editor?.chain().focus().redo().run();
              setContextMenu(null);
            }}
            disabled={!editor?.can().redo()}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Redo
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          
          {/* Insert Operations */}
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Insert</div>
          <button
            onClick={() => {
              addTable();
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
            type="button"
          >
            Insert Table
          </button>
          <button
            onClick={() => {
              addImage();
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
            type="button"
          >
            Insert Image
          </button>
          <button
            onClick={() => {
              editor?.chain().focus().setHorizontalRule().run();
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
            type="button"
          >
            Insert Horizontal Line
          </button>
        </div>
      )}
    </div>
  );
}

