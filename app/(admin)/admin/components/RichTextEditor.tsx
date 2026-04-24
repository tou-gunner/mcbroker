'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { richTextExtensions } from '@/app/lib/rich-text-extensions';
import { usePrompt } from './DialogProvider';
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
  const prompt = usePrompt();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const savedSelectionRef = React.useRef<any>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: richTextExtensions,
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
    imageInputRef.current?.click();
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('scope', 'insurance-content');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'upload failed');

      editor.chain().focus().setImage({ src: json.url }).run();
    } catch (err) {
      toast.error(`Image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const validatePositiveInt = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isInteger(n) && n > 0 ? null : 'Enter a positive whole number';
  };

  const addTable = async () => {
    const rows = await prompt({
      title: 'Insert table',
      label: 'Number of rows',
      defaultValue: '3',
      inputType: 'number',
      validate: validatePositiveInt,
    });
    if (rows === null) return;

    const cols = await prompt({
      title: 'Insert table',
      label: 'Number of columns',
      defaultValue: '3',
      inputType: 'number',
      validate: validatePositiveInt,
    });
    if (cols === null) return;

    try {
      editor
        ?.chain()
        .focus()
        .insertTable({
          rows: parseInt(rows, 10),
          cols: parseInt(cols, 10),
          withHeaderRow: true,
        })
        .run();
    } catch (error) {
      console.error('Error inserting table:', error);
      toast.error('Error inserting table');
    }
  };

  const setColumnWidth = async () => {
    const width = await prompt({
      title: 'Column width',
      label: 'Width (e.g. 100px, 20%, auto)',
      defaultValue: '100px',
    });
    if (width === null || !width) return;
    editor?.chain().focus().setCellAttribute('colwidth', [parseInt(width)]).run();
  };

  const setTableWidth = async () => {
    const width = await prompt({
      title: 'Table width',
      label: 'Width (e.g. 100%, 800px)',
      defaultValue: '100%',
    });
    if (width === null || !width) return;
    const { state } = editor!;
    const { selection } = state;
    const table = selection.$anchor.node(-1);

    if (table && table.type.name === 'table') {
      editor?.chain().focus().updateAttributes('table', { width }).run();
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
              editor.isActive('bold') ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Bold (Ctrl+B)"
          >
            <MdFormatBold className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Italic (Ctrl+I)"
          >
            <MdFormatItalic className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('code') ? 'bg-primary/10 text-primary' : 'text-gray-700'
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
                  className="w-full px-2 py-1 text-xs mt-1 bg-primary text-white hover:bg-primary-dark rounded transition-colors"
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
              editor.isActive({ textAlign: 'left' }) ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Align Left"
          >
            <MdFormatAlignLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Align Center"
          >
            <MdFormatAlignCenter className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Align Right"
          >
            <MdFormatAlignRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/10 text-primary' : 'text-gray-700'
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
              editor.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Bullet List"
          >
            <MdFormatListBulleted className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-primary/10 text-primary' : 'text-gray-700'
            }`}
            type="button"
            title="Numbered List"
          >
            <MdFormatListNumbered className="w-5 h-5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('blockquote') ? 'bg-primary/10 text-primary' : 'text-gray-700'
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
            disabled={uploadingImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title={uploadingImage ? 'Uploading…' : 'Insert Image'}
          >
            <MdImage className={`w-5 h-5 ${uploadingImage ? 'animate-pulse' : ''}`} />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />

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
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-secondary transition-colors"
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
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-secondary transition-colors"
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
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-secondary transition-colors"
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

