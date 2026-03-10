# ToDo — Kanban Task Management App

A fast, polished, local-first Kanban task management app built with React 18 + Vite. No sign-up, no cloud — just open and manage your day.

**🔗 [Live Demo](https://kanban-board-style-to-do-list.vercel.app/)**


## ✨ Features

### Core Board
- **5 Fixed Columns**: To Do → Up Next → In Progress → In Review → Done ✓
- **Drag & Drop**: Move tasks between columns with smooth animations (@dnd-kit)
- **Priority Auto-Sort**: Tasks automatically sort by High → Medium → Low → None
- **WIP Limits**: Soft work-in-progress limits with visual warnings (yellow at limit, red over)

### Task Management
- **Notion-Style Modal**: Full-featured task editor with live state updates
- **Priority Levels**: High (🔴), Medium (🔵), Low (🟢)
- **Due Dates**: Validated date input with overdue/today/past warnings
- **Assignees**: Free-text with deterministic color avatars
- **Labels/Tags**: Global label system with custom colors
- **Checklists**: Draggable subtasks with progress tracking
- **Comments**: Real-time posting without reopening modal
- **File Attachments**: Drag-and-drop upload with image/PDF/text viewer (Lightbox)

### Advanced Features
- **Multiple Boards**: Create, switch, rename, delete up to 10 boards
- **Search**: Real-time search across titles and descriptions
- **Filters**: Priority, due date, labels, hide completed — with AND/OR logic
- **Swimlanes**: Group tasks by priority, assignee, or label
- **List View**: Sortable table with inline column change
- **Analytics Dashboard**: Stats, bar charts, WIP status, and activity log
- **Due Date Reminders**: Auto-updating banner for overdue/due today tasks

### Design & UX
- **Dark/Light Themes**: Zero-flash theme switching with localStorage persistence
- **Responsive Layout**: Desktop (5 cols), Tablet (scroll), Mobile (snap scroll + dots)
- **Smooth Animations**: Card entrance, modal transitions, hover effects
- **Accessibility**: ARIA labels, focus management, keyboard navigation

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework with Hooks |
| Vite | Build tool and dev server |
| @dnd-kit | Drag and drop (two separate contexts) |
| CSS Variables | Theming — zero hardcoded colors |
| localStorage | Data persistence — key: `todo_app_v1` |

## 🚀 Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd todo-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/        # 18 React components
│   ├── Board.jsx      # DndContext #1 + column grid
│   ├── Column.jsx     # Header + task list
│   ├── TaskCard.jsx   # Card with metadata
│   ├── TaskModal.jsx  # Create/Edit modal (live state)
│   ├── Checklist.jsx  # DndContext #2 + sortable items
│   ├── Comments.jsx   # Real-time dispatch
│   ├── Attachments.jsx # FileReader + Lightbox
│   └── ...            # 11 more components
├── context/           # BoardContext (useReducer)
├── hooks/             # useLocalStorage
├── utils/             # 6 utility modules
├── constants/         # Fixed columns + default labels
└── styles/            # CSS variables + global styles
```

## 🏗️ Architecture

- **State**: React Context + useReducer — single source of truth
- **Persistence**: localStorage saves on every state change
- **Modal Pattern**: Live reads from context (never stale snapshots)
- **Real-Time**: Comments/attachments dispatch immediately — no Save needed
- **Drag & Drop**: Two DndContext scopes — board-level and checklist-level
- **Migration**: Auto-patches old data formats on load

## 📋 Data Storage

All data stored in `localStorage` under key `todo_app_v1`:
- Multiple boards with independent tasks
- Labels, activity log, WIP limits per board
- Theme preference
- File attachments as base64 (4MB warning threshold)

## 🎨 Design System

- **Dark mode** (default): Deep charcoal + Lemon Yellow accent
- **Light mode**: Zinc/White + Yellow 400 accent
- **Typography**: Inter font, 4 weight levels
- **Spacing**: Consistent 8px grid system
- **Colors**: All via CSS custom properties

## 📊 Privacy

Zero data leaves the browser. No analytics, no tracking, no telemetry, no external APIs.

## License

MIT
