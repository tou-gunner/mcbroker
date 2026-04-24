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

// Single source of truth for RichTextEditor's extension list. Imported by
// both the browser editor (app/(admin)/admin/components/RichTextEditor.tsx)
// and the server-side HTML→ProseMirror conversion in scripts/seed-agl-content.ts
// so generateJSON output round-trips cleanly back through the editor.
export const richTextExtensions = [
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
];
