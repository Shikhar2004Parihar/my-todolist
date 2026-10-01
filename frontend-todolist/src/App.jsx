import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  Clock3,
  Inbox,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'daymark-tasks-v1';
const categories = ['Work', 'Personal', 'Study'];
const views = [
  { id: 'today', label: 'Today', icon: Clock3 },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarDays },
  { id: 'all', label: 'All tasks', icon: ListTodo },
  { id: 'completed', label: 'Completed', icon: CheckCheck },
];

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startingTasks() {
  return [
    { id: 'sample-1', title: 'Plan the week ahead', category: 'Personal', dueDate: dateOffset(0), priority: 'high', completed: false },
    { id: 'sample-2', title: 'Send project update to the team', category: 'Work', dueDate: dateOffset(0), priority: 'medium', completed: false },
    { id: 'sample-3', title: 'Read a few pages', category: 'Study', dueDate: dateOffset(0), priority: 'low', completed: true },
    { id: 'sample-4', title: 'Book a little time for yourself', category: 'Personal', dueDate: dateOffset(1), priority: 'low', completed: false },
    { id: 'sample-5', title: 'Review notes from this week', category: 'Study', dueDate: dateOffset(2), priority: 'medium', completed: false },
  ];
}

function readTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return stored;
  } catch {
    // Start fresh if saved data is unavailable.
  }
  return startingTasks();
}

function prettyDate(value) {
  if (!value) return 'No date';
  const date = new Date(`${value}T12:00:00`);
  if (value === dateOffset(0)) return 'Today';
  if (value === dateOffset(1)) return 'Tomorrow';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function App() {
  const [tasks, setTasks] = useState(readTasks);
  const [activeView, setActiveView] = useState('today');
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [draftDate, setDraftDate] = useState(dateOffset(0));
  const [draftCategory, setDraftCategory] = useState('Work');
  const [draftPriority, setDraftPriority] = useState('medium');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('task-search')?.focus();
      }
    }

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const today = dateOffset(0);
  const shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  const completedCount = tasks.filter((task) => task.completed).length;
  const todayTasks = tasks.filter((task) => !task.completed && task.dueDate === today);
  const remainingToday = todayTasks.length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (activeView === 'today') return task.dueDate === today && !task.completed;
        if (activeView === 'upcoming') return task.dueDate > today && !task.completed;
        if (activeView === 'completed') return task.completed;
        return !task.completed;
      })
      .filter((task) => activeCategory === 'All' || task.category === activeCategory)
      .filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((first, second) => (first.dueDate || '9999').localeCompare(second.dueDate || '9999'));
  }, [tasks, activeView, activeCategory, query, today]);

  const viewCounts = {
    today: tasks.filter((task) => task.dueDate === today && !task.completed).length,
    upcoming: tasks.filter((task) => task.dueDate > today && !task.completed).length,
    all: tasks.filter((task) => !task.completed).length,
    completed: completedCount,
  };

  function addTask(event) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTasks((current) => [{
      id: crypto.randomUUID(),
      title,
      category: draftCategory,
      dueDate: draftDate,
      priority: draftPriority,
      completed: false,
    }, ...current]);
    setDraft('');
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function saveEdit(id) {
    const title = editValue.trim();
    if (title) setTasks((current) => current.map((task) => task.id === id ? { ...task, title } : task));
    setEditingId(null);
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => !task.completed));
  }

  const title = activeView === 'today' ? 'Today' : views.find((view) => view.id === activeView)?.label;
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#today" onClick={() => setActiveView('today')} aria-label="Daymark home">
          <span className="brand-mark"><Check size={19} strokeWidth={3} /></span>
          <span className="brand-name">S-DAYMARK</span>
        </a>

        <div className="side-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Task views">
          {views.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => { setActiveView(id); setActiveCategory('All'); }}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              <span className="nav-count">{viewCounts[id]}</span>
            </button>
          ))}
        </nav>

        <div className="side-label category-label">YOUR LISTS <button className="side-add" title="Add a task" onClick={() => document.getElementById('new-task')?.focus()}><Plus size={15} /></button></div>
        <div className="category-list">
          <button className={`category-item ${activeCategory === 'All' ? 'category-active' : ''}`} onClick={() => setActiveCategory('All')}>
            <span className="category-dot dot-all"><Inbox size={13} /></span><span>Everything</span>
          </button>
          {categories.map((category) => (
            <button key={category} className={`category-item ${activeCategory === category ? 'category-active' : ''}`} onClick={() => setActiveCategory(activeCategory === category ? 'All' : category)}>
              <span className={`category-dot dot-${category.toLowerCase()}`} />
              <span>{category}</span>
              <span className="category-count">{tasks.filter((task) => task.category === category && !task.completed).length}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-note"><Sparkles size={16} /><span>A little progress<br />goes a long way.</span></div>
          <div className="profile-row"><div className="avatar">Y</div><div className="profile-copy"><strong>Your space</strong><span>Personal planner</span></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ArrowRight size={13} /><strong>{activeCategory === 'All' ? title : activeCategory}</strong></div>
          <label className="search-box"><Search size={17} /><input id="task-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your tasks" aria-label="Search tasks" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}<kbd>{shortcutLabel}</kbd></label>
        </header>

        <div className="dashboard-grid">
          <section className="task-column">
            <div className="page-heading">
              <div className="eyebrow"><span className="eyebrow-dot" /> {dateLabel}</div>
              <div className="heading-row"><div><h1>{activeCategory === 'All' ? title : activeCategory}</h1><p className="heading-subtitle">{activeView === 'today' ? remainingToday === 0 ? 'A clear day. Make it yours.' : `You have ${remainingToday} ${remainingToday === 1 ? 'thing' : 'things'} to focus on.` : `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'} to keep things moving.`}</p></div>
                <div className="heading-stamp"><span>{new Intl.DateTimeFormat('en', { day: '2-digit' }).format(new Date())}</span><small>{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date()).toUpperCase()}</small></div>
              </div>
            </div>

            <form className="composer" onSubmit={addTask}>
              <div className="composer-main"><span className="composer-plus"><Plus size={19} /></span><input id="new-task" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What needs your attention?" aria-label="New task" /><button className="add-button" type="submit" disabled={!draft.trim()}>Add task <span>↵</span></button></div>
              <div className="composer-options">
                <label className="composer-select date-select"><CalendarDays size={14} /><input aria-label="Due date" type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} /></label>
                <label className="composer-select"><span className={`category-dot dot-${draftCategory.toLowerCase()}`} /><select aria-label="Task list" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={13} /></label>
                <label className="composer-select priority-select"><span className={`priority-dot ${draftPriority}`} /><select aria-label="Priority" value={draftPriority} onChange={(event) => setDraftPriority(event.target.value)}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select><ChevronDown size={13} /></label>
              </div>
            </form>

            <div className="list-toolbar"><div className="list-title"><span className="list-title-mark"><ListTodo size={16} /></span><h2>{activeView === 'today' ? 'Your tasks' : title}</h2><span className="task-total">{visibleTasks.length}</span></div><button className="sort-button" title="Tasks are sorted by due date"><ArrowDownWideNarrow size={15} /><span>Due date</span></button></div>

            <div className="task-list">
              {visibleTasks.map((task, index) => (
                <article key={task.id} className={`task-row ${task.completed ? 'is-complete' : ''}`} style={{ '--row-index': index }}>
                  <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task.id)} aria-label={task.completed ? 'Mark as incomplete' : 'Complete task'}>{task.completed && <Check size={13} strokeWidth={3} />}</button>
                  <div className="task-content">
                    {editingId === task.id ? <input className="edit-input" autoFocus value={editValue} onChange={(event) => setEditValue(event.target.value)} onBlur={() => saveEdit(task.id)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(task.id); if (event.key === 'Escape') setEditingId(null); }} /> : <button className="task-name" onClick={() => { setEditingId(task.id); setEditValue(task.title); }} title="Click to edit">{task.title}</button>}
                    <div className="task-meta"><span className={`category-tag tag-${task.category.toLowerCase()}`}><span className={`category-dot dot-${task.category.toLowerCase()}`} />{task.category}</span><span className="meta-divider" /><span className={`due-label ${task.dueDate < today && !task.completed ? 'overdue' : ''}`}><CalendarDays size={12} />{prettyDate(task.dueDate)}</span></div>
                  </div>
                  <span className={`priority-label priority-${task.priority}`}><span className={`priority-dot ${task.priority}`} />{task.priority}</span>
                  <button className="delete-task" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button>
                </article>
              ))}
              {visibleTasks.length === 0 && <div className="empty-state"><span className="empty-icon"><Check size={20} /></span><h3>{query ? 'No matches found' : activeView === 'today' ? 'Nothing on the list' : 'All caught up'}</h3><p>{query ? 'Try another search term.' : activeView === 'today' ? 'Add a task above and give your day a little shape.' : 'There is nothing here right now. Enjoy the breathing room.'}</p></div>}
            </div>

            {activeView !== 'completed' && completedCount > 0 && <section className="completed-section"><button className="completed-heading" onClick={() => setActiveView('completed')}><CheckCheck size={16} /><span>Completed</span><span className="task-total">{completedCount}</span><ArrowRight size={14} /></button>{tasks.filter((task) => task.completed).slice(0, 2).map((task) => <article className="task-row completed-preview" key={task.id}><button className="task-check checked" onClick={() => toggleTask(task.id)} aria-label="Mark as incomplete"><Check size={13} strokeWidth={3} /></button><div className="task-content"><button className="task-name">{task.title}</button><div className="task-meta"><span className={`category-tag tag-${task.category.toLowerCase()}`}><span className={`category-dot dot-${task.category.toLowerCase()}`} />{task.category}</span></div></div><button className="delete-task" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button></article>)}</section>}
          </section>

          <aside className="insights-column">
            <section className="focus-card"><div className="focus-top"><span className="focus-kicker">YOUR MOMENTUM</span><span className="focus-spark"><Sparkles size={16} /></span></div><div className="progress-wrap"><div className="progress-ring" style={{ '--progress': `${progress}%` }}><div className="progress-center"><strong>{progress}<small>%</small></strong><span>done</span></div></div><div className="progress-copy"><strong>{completedCount === 0 ? 'A fresh start' : completedCount === 1 ? 'Nice first step' : 'Look at you go'}</strong><span>{completedCount} of {tasks.length} tasks complete</span></div></div><div className="focus-divider" /><div className="focus-footer"><span><span className="status-dot" /> Today's focus</span><strong>{remainingToday} left</strong></div></section>

            <section className="week-card"><div className="section-heading"><div><span className="section-kicker">AT A GLANCE</span><h2>This week</h2></div><CalendarDays size={17} /></div><div className="week-days">{Array.from({ length: 7 }, (_, index) => { const day = new Date(); const mondayOffset = (day.getDay() + 6) % 7; day.setDate(day.getDate() - mondayOffset + index); const key = dateOffsetFrom(day); const count = tasks.filter((task) => task.dueDate === key).length; const isToday = key === today; return <div className={`week-day ${isToday ? 'current-day' : ''}`} key={key}><span>{new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(day)}</span><span className="day-number">{day.getDate()}</span><i className={count ? 'has-tasks' : ''} /></div>; })}</div><div className="week-summary"><span><span className="week-summary-dot" /> Scheduled</span><strong>{tasks.filter((task) => task.dueDate >= today && !task.completed).length} tasks</strong></div></section>

            <section className="note-card"><div className="note-decoration">“</div><p>Small steps every day add up to remarkable things.</p><span>A NOTE TO SELF</span></section>
            {completedCount > 0 && <button className="clear-completed" onClick={clearCompleted}><Trash2 size={14} /> Clear completed tasks</button>}
          </aside>
        </div>
        <footer className="app-footer"><span>Made for the things that matter.</span><span><Circle size={7} fill="currentColor" /> Saved automatically</span></footer>
      </main>
    </div>
  );
}

function dateOffsetFrom(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default App;
