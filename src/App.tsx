import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";

type Area = "Business" | "Tech & Career" | "Personal";
type Priority = "high" | "normal" | "low";
type Filter = "all" | "today" | "upcoming" | "overdue" | "completed";

type Task = {
  id: number;
  title: string;
  area: Area;
  done: boolean;
  priority: Priority;
  due: string;
  project: string;
  tags: string[];
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const seed: Task[] = [
  { id: 1, title: "Check RCN prices", area: "Business", done: false, priority: "high", due: todayKey(), project: "RCN Trading", tags: ["follow-up"] },
  { id: 2, title: "Call supplier", area: "Business", done: false, priority: "normal", due: todayKey(), project: "RCN Trading", tags: ["call"] },
  { id: 3, title: "Complete React lesson", area: "Tech & Career", done: true, priority: "normal", due: todayKey(), project: "Full Stack", tags: ["learning"] },
  { id: 4, title: "Read about AI agents", area: "Tech & Career", done: false, priority: "high", due: todayKey(), project: "Tech Radar", tags: ["learning", "AI"] },
  { id: 5, title: "Apply for 2 jobs", area: "Tech & Career", done: false, priority: "high", due: addDays(1), project: "Career", tags: ["jobs"] },
  { id: 6, title: "Buy household items", area: "Personal", done: true, priority: "normal", due: todayKey(), project: "Home", tags: ["errand"] },
  { id: 7, title: "Plan tomorrow", area: "Personal", done: false, priority: "normal", due: todayKey(), project: "Life", tags: ["planning"] },
];

const areaMeta: Record<Area, { icon: string; line: string }> = {
  Business: { icon: "◆", line: "Build what you don't want to leave." },
  "Tech & Career": { icon: "◇", line: "Keep learning. Technology won't wait." },
  Personal: { icon: "○", line: "Protect the life you're building." },
};

const priorityLabel: Record<Priority, string> = { high: "HIGH", normal: "NORMAL", low: "LOW" };

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem("command-center-tasks-v2");
      return saved ? JSON.parse(saved) : seed;
    } catch {
      return seed;
    }
  });
  const [active, setActive] = useState<"Dashboard" | Area>("Dashboard");
  const [filter, setFilter] = useState<Filter>("today");
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newArea, setNewArea] = useState<Area>("Business");
  const [newPriority, setNewPriority] = useState<Priority>("normal");
  const [newDue, setNewDue] = useState(todayKey());
  const [newProject, setNewProject] = useState("");
  const [newTags, setNewTags] = useState("");

  useEffect(() => localStorage.setItem("command-center-tasks-v2", JSON.stringify(tasks)), [tasks]);

  const today = todayKey();
  const completed = tasks.filter(t => t.done).length;
  const todayTasks = tasks.filter(t => t.due === today);
  const todayCompleted = todayTasks.filter(t => t.done).length;
  const momentum = Math.round((todayCompleted / Math.max(todayTasks.length, 1)) * 100);

  const visibleTasks = useMemo(() => {
    const areaTasks = active === "Dashboard" ? tasks : tasks.filter(t => t.area === active);
    const q = search.trim().toLowerCase();
    return areaTasks
      .filter(t => {
        if (filter === "today") return t.due === today && !t.done;
        if (filter === "upcoming") return t.due > today && !t.done;
        if (filter === "overdue") return t.due < today && !t.done;
        if (filter === "completed") return t.done;
        return true;
      })
      .filter(t => !q || `${t.title} ${t.project} ${t.tags.join(" ")}`.toLowerCase().includes(q));
  }, [active, filter, search, tasks, today]);

  const openAdd = () => {
    setEditing(null);
    setNewTask(""); setNewArea(active === "Dashboard" ? "Business" : active); setNewPriority("normal");
    setNewDue(today); setNewProject(""); setNewTags(""); setAdding(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task); setNewTask(task.title); setNewArea(task.area); setNewPriority(task.priority);
    setNewDue(task.due); setNewProject(task.project); setNewTags(task.tags.join(", ")); setAdding(true);
  };

  const saveTask = () => {
    if (!newTask.trim()) return;
    const next: Task = {
      id: editing?.id ?? Date.now(), title: newTask.trim(), area: newArea, done: editing?.done ?? false,
      priority: newPriority, due: newDue, project: newProject.trim() || "Inbox",
      tags: newTags.split(",").map(x => x.trim()).filter(Boolean).slice(0, 4),
    };
    setTasks(ts => editing ? ts.map(t => t.id === editing.id ? next : t) : [next, ...ts]);
    setAdding(false);
  };

  const toggle = (id: number) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: number) => setTasks(ts => ts.filter(t => t.id !== id));

  const go = (destination: "Dashboard" | Area) => {
    setActive(destination); setMenu(false); setSearch("");
    if (destination === "Dashboard") setFilter("today");
    else setFilter("all");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#09090b] text-white">
      <Ambient />
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[.06] bg-[#09090b]/55 px-5 py-4 backdrop-blur-xl sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button onClick={() => go("Dashboard")} className="flex items-center gap-3 text-left">
            <span className="font-heading text-[21px] tracking-tight sm:text-[25px]">Command Center</span>
            <span className="select-none text-[24px]">✳︎</span>
          </button>
          <nav className="hidden items-center gap-7 text-[15px] text-white/55 md:flex">
            {(["Dashboard", "Business", "Tech & Career", "Personal"] as const).map(item => (
              <button key={item} onClick={() => go(item)} className={`transition-colors hover:text-white ${active === item ? "text-white" : ""}`}>{item}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={openAdd} className="hidden rounded-full bg-white px-4 py-2 text-sm text-black transition-transform hover:scale-105 sm:block">+ Add task</button>
            <button onClick={() => setMenu(v => !v)} className="flex flex-col gap-[5px] md:hidden" aria-label="Menu">
              <span className={`h-[2px] w-6 bg-white transition-transform duration-300 ${menu ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-[2px] w-6 bg-white transition-opacity duration-300 ${menu ? "opacity-0" : ""}`} />
              <span className={`h-[2px] w-6 bg-white transition-transform duration-300 ${menu ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-20 flex flex-col justify-center gap-7 bg-black/95 px-8 backdrop-blur-xl md:hidden">
          {(["Dashboard", "Business", "Tech & Career", "Personal"] as const).map(item => <button key={item} onClick={() => go(item)} className="text-left text-[32px] text-white">{item}</button>)}
          <button onClick={openAdd} className="mt-3 w-fit rounded-full bg-white px-6 py-3 text-black">+ Add task</button>
        </motion.div>}
      </AnimatePresence>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8 md:px-10">
        <AnimatePresence mode="wait">
          {active === "Dashboard" ? (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .45 }}>
              <div className="flex flex-col justify-center">
                <p className="mb-2 text-sm uppercase tracking-[.18em] text-white/40">Personal operating system</p>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="max-w-4xl font-heading text-[clamp(42px,7vw,84px)] leading-[.92] tracking-[-.055em]">Build your future.<br /><span className="text-white/35">One task at a time.</span></h1>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-white/45">Business. Technology. Personal life. One place to decide what matters today — and actually move it forward.</p>
                  </div>
                  <div className="lg:pb-2"><p className="text-sm text-white/35">{formatLongDate()}</p><p className="mt-1 text-2xl">{todayCompleted}/{todayTasks.length} done today</p></div>
                </div>
              </div>

              <div className="mt-10 grid gap-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
                <MomentumCard momentum={momentum} completed={todayCompleted} total={todayTasks.length} />
                {(["Business", "Tech & Career", "Personal"] as Area[]).map((area, i) => <AreaCard key={area} area={area} tasks={tasks} onClick={() => go(area)} index={i} />)}
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
                <FocusSection tasks={tasks} onToggle={toggle} onEdit={openEdit} onAdd={openAdd} onSeeAll={() => { setActive("Dashboard"); setFilter("all"); }} />
                <aside className="space-y-3"><Quote completed={todayCompleted} /><ProgressCard tasks={tasks} completed={completed} /></aside>
              </div>
            </motion.div>
          ) : (
            <motion.div key={active} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .4 }}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-sm uppercase tracking-[.18em] text-white/40">{areaMeta[active].icon} {active}</p><h1 className="mt-2 font-heading text-[clamp(40px,6vw,70px)] leading-none tracking-[-.05em]">{areaMeta[active].line}</h1></div>
                <button onClick={openAdd} className="w-fit rounded-full bg-white px-5 py-3 text-sm text-black transition-transform hover:scale-105">+ Add task</button>
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks, projects, tags..." className="w-full rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 outline-none placeholder:text-white/25 focus:border-white/25" /></div>
                <div className="flex flex-wrap gap-2">{(["all", "today", "upcoming", "overdue", "completed"] as Filter[]).map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${filter === f ? "border-white bg-white text-black" : "border-white/10 text-white/45 hover:text-white"}`}>{f}</button>)}</div>
              </div>
              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[.045] p-4 backdrop-blur-xl sm:p-6">
                <TaskList tasks={visibleTasks} onToggle={toggle} onEdit={openEdit} onDelete={remove} />
                {visibleTasks.length === 0 && <EmptyState filter={filter} onAdd={openAdd} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>{adding && <TaskModal editing={editing} title={newTask} setTitle={setNewTask} area={newArea} setArea={setNewArea} priority={newPriority} setPriority={setNewPriority} due={newDue} setDue={setNewDue} project={newProject} setProject={setNewProject} tags={newTags} setTags={setNewTags} onClose={() => setAdding(false)} onSave={saveTask} />}</AnimatePresence>
    </main>
  );
}

function AreaCard({ area, tasks, onClick, index }: { area: Area; tasks: Task[]; onClick: () => void; index: number }) {
  const own = tasks.filter(t => t.area === area); const done = own.filter(t => t.done).length; const pct = Math.round((done / Math.max(own.length, 1)) * 100);
  return <motion.button onClick={onClick} whileHover={{ y: -4 }} whileTap={{ scale: .985 }} className="group rounded-[28px] border border-white/10 bg-white/[.045] p-5 text-left backdrop-blur-xl">
    <div className="flex items-center justify-between"><span className="text-xl">{areaMeta[area].icon}</span><span className="text-sm text-white/35">{done}/{own.length}</span></div>
    <p className="mt-9 text-xl">{area}</p><p className="mt-1 text-sm text-white/40">{areaMeta[area].line}</p>
    <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: .25 + index * .08, duration: .8 }} className="h-full rounded-full bg-white" /></div>
  </motion.button>;
}

function MomentumCard({ momentum, completed, total }: { momentum: number; completed: number; total: number }) {
  return <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[.08] p-6 backdrop-blur-xl">
    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[.08] blur-3xl" />
    <p className="text-sm uppercase tracking-[.18em] text-white/40">Today's momentum</p>
    <div className="mt-8 flex items-center gap-6"><div className="relative h-24 w-24 shrink-0"><svg viewBox="0 0 100 100" className="-rotate-90"><circle cx="50" cy="50" r="43" fill="none" stroke="white" strokeOpacity=".08" strokeWidth="6" /><motion.circle cx="50" cy="50" r="43" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeDasharray={270.18} initial={{ strokeDashoffset: 270.18 }} animate={{ strokeDashoffset: 270.18 * (1 - momentum / 100) }} transition={{ duration: 1 }} /></svg><span className="absolute inset-0 grid place-items-center text-2xl">{momentum}</span></div><div><p className="text-2xl">{completed} of {total} done</p><p className="mt-1 text-sm text-white/45">{momentum >= 70 ? "You're moving. Keep going." : "Start small. Build momentum."}</p></div></div>
  </motion.div>;
}

function FocusSection({ tasks, onToggle, onEdit, onAdd, onSeeAll }: { tasks: Task[]; onToggle: (id: number) => void; onEdit: (task: Task) => void; onAdd: () => void; onSeeAll: () => void }) {
  const today = todayKey(); const focus = tasks.filter(t => t.due === today).sort((a,b) => Number(a.done)-Number(b.done)).slice(0, 7);
  return <motion.section layout className="rounded-[28px] border border-white/10 bg-white/[.045] p-5 backdrop-blur-xl sm:p-7">
    <div className="mb-5 flex items-end justify-between"><div><p className="text-sm uppercase tracking-[.18em] text-white/40">Focus queue</p><h2 className="mt-1 text-3xl tracking-tight">What matters today</h2></div><div className="flex gap-2"><button onClick={onSeeAll} className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-white/45 hover:text-white sm:block">View all</button><button onClick={onAdd} className="rounded-full bg-white px-4 py-2 text-sm text-black">+ Add</button></div></div>
    <TaskList tasks={focus} onToggle={onToggle} onEdit={onEdit} compact />
    {focus.length === 0 && <EmptyState filter="today" onAdd={onAdd} />}
  </motion.section>;
}

function TaskList({ tasks, onToggle, onEdit, onDelete, compact = false }: { tasks: Task[]; onToggle: (id: number) => void; onEdit: (task: Task) => void; onDelete?: (id: number) => void; compact?: boolean }) {
  return <div className="space-y-1"><AnimatePresence initial={false}>{tasks.map(task => <motion.div layout key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="group flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[.045]">
    <button onClick={() => onToggle(task.id)} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all ${task.done ? "border-white bg-white text-black" : "border-white/25 group-hover:border-white"}`}>{task.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}</button>
    <button onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left"><span className={`block truncate text-[16px] transition-all ${task.done ? "text-white/30 line-through" : "text-white"}`}>{task.title}</span><span className="mt-1 block truncate text-xs text-white/30">{task.project}{task.tags.length ? ` · ${task.tags.join(" · ")}` : ""}</span></button>
    {!compact && <span className="hidden text-xs text-white/30 sm:block">{formatDue(task.due)}</span>}
    {task.priority === "high" && <span className="hidden text-[10px] tracking-wider text-white/45 sm:block">{priorityLabel[task.priority]}</span>}
    {onDelete && <button onClick={() => onDelete(task.id)} className="px-2 text-white/20 opacity-0 transition-opacity hover:text-white group-hover:opacity-100">×</button>}
  </motion.div>)}</AnimatePresence></div>;
}

function ProgressCard({ tasks, completed }: { tasks: Task[]; completed: number }) {
  const total = tasks.length; const pct = Math.round((completed / Math.max(total,1))*100);
  return <motion.div whileHover={{ y: -3 }} className="rounded-[28px] border border-white/10 bg-white/[.045] p-6 backdrop-blur-xl"><p className="text-sm uppercase tracking-[.18em] text-white/35">All-time progress</p><div className="mt-4 flex items-end justify-between"><span className="text-5xl tracking-[-.05em]">{pct}%</span><span className="pb-1 text-white/35">{completed}/{total}</span></div><div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-white" /></div><p className="mt-3 text-sm text-white/40">The goal isn't a perfect day. It's forward motion.</p></motion.div>;
}

function Quote({ completed }: { completed: number }) {
  const quotes = ["Consistency beats intensity.", "Build the business. Build the skill. Build the life.", "Don't wait for motivation. Create evidence.", "Small wins compound."];
  return <motion.div className="rounded-[28px] border border-white/10 bg-white/[.045] p-6"><p className="text-xs uppercase tracking-[.18em] text-white/35">Daily thought</p><AnimatePresence mode="wait"><motion.p key={completed} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xl leading-snug">“{quotes[completed % quotes.length]}”</motion.p></AnimatePresence></motion.div>;
}

function EmptyState({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  return <div className="py-12 text-center"><p className="text-white/35">{filter === "overdue" ? "Nothing overdue. Keep it that way." : "Nothing here yet. Add something worth moving forward."}</p><button onClick={onAdd} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white">+ Add a task</button></div>;
}

function TaskModal({ editing, title, setTitle, area, setArea, priority, setPriority, due, setDue, project, setProject, tags, setTags, onClose, onSave }: any) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-md">
    <motion.div initial={{ y: 24, scale: .98 }} animate={{ y: 0, scale: 1 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#151518] p-6 shadow-2xl sm:p-7">
      <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-white/35">{editing ? "Edit task" : "New task"}</p><h3 className="mt-1 text-2xl">Move something forward.</h3></div><button onClick={onClose} className="text-white/35 hover:text-white">Esc</button></div>
      <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key === "Enter" && onSave()} placeholder="What needs to move forward?" className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[.05] px-4 py-4 outline-none placeholder:text-white/25 focus:border-white/30" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Area"><select value={area} onChange={e=>setArea(e.target.value)}>{(["Business","Tech & Career","Personal"] as Area[]).map(a=><option key={a}>{a}</option>)}</select></Field>
        <Field label="Priority"><select value={priority} onChange={e=>setPriority(e.target.value)}>{(["high","normal","low"] as Priority[]).map(p=><option key={p} value={p}>{priorityLabel[p]}</option>)}</select></Field>
        <Field label="Due date"><input type="date" value={due} onChange={e=>setDue(e.target.value)} /></Field>
        <Field label="Project"><input value={project} onChange={e=>setProject(e.target.value)} placeholder="e.g. RCN Trading" /></Field>
      </div>
      <Field label="Tags"><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="learning, follow-up, AI" /></Field>
      <button onClick={onSave} className="mt-6 w-full rounded-full bg-white py-3 text-black transition-transform hover:scale-[1.01]">{editing ? "Save changes" : "Add task"}</button>
    </motion.div>
  </motion.div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs uppercase tracking-wider text-white/30">{label}</span><div className="rounded-2xl border border-white/10 bg-white/[.04] [&_input]:w-full [&_input]:bg-transparent [&_input]:px-4 [&_input]:py-3 [&_input]:outline-none [&_select]:w-full [&_select]:bg-[#151518] [&_select]:px-4 [&_select]:py-3 [&_select]:outline-none">{children}</div></label>; }

function formatDue(value: string) { const d = new Date(`${value}T00:00:00`); const today = new Date(`${todayKey()}T00:00:00`); const diff = Math.round((d.getTime()-today.getTime())/86400000); if(diff===0)return "Today"; if(diff===1)return "Tomorrow"; if(diff===-1)return "Yesterday"; return d.toLocaleDateString(undefined,{day:"numeric",month:"short"}); }
function formatLongDate() { return new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"}); }

function Ambient() {
  const mx = useMotionValue(50); const my = useMotionValue(30); const x = useSpring(mx,{stiffness:80,damping:30}); const y = useSpring(my,{stiffness:80,damping:30});
  useEffect(()=>{const move=(e:MouseEvent)=>{mx.set((e.clientX/window.innerWidth)*100);my.set((e.clientY/window.innerHeight)*100)};window.addEventListener("mousemove",move);return()=>window.removeEventListener("mousemove",move)},[mx,my]);
  return <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden"><motion.div style={{left:`${x.get()}%`,top:`${y.get()}%`}} className="absolute h-[45vw] w-[45vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[.055] blur-[120px]"/><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.08),transparent_40%)]"/><div className="noise absolute inset-0 opacity-50"/></div>;
}

export default App;
