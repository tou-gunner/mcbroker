#!/bin/bash

echo "🚀 Setting up Insurance CMS..."
echo ""

# Install TipTap dependencies
echo "📦 Installing TipTap dependencies..."
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell @tiptap/extension-image

echo ""
echo "✅ Dependencies installed!"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client generated!"
echo ""

echo "📋 Next steps:"
echo "1. Review your database connection in .env"
echo "2. Run migration: npx prisma migrate dev --name improved_insurance_schema"
echo "3. (Optional) Add full-text search index manually to your database"
echo "4. Start dev server: pnpm dev"
echo "5. Visit: http://localhost:3000/admin/insurance"
echo ""
echo "✨ Setup complete!"

