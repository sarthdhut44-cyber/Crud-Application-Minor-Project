// --- Zenith Application Script ---

// Helper function to format date offsets (offsets from today in days)
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Pre-populated demo data to ensure a premium visual experience out-of-the-box
const DEMO_TASKS = [
  {
    id: "demo-1",
    title: "Design glassmorphism UI mockups",
    desc: "Create premium high-fidelity layouts for the client dashboard using custom CSS blur effects and vibrant gradients.",
    category: "Work",
    priority: "high",
    status: "In Progress",
    dueDate: getDateOffset(1),
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-2",
    title: "Purchase fresh pantry groceries",
    desc: "Pick up organic vegetables, almond milk, whole grain sourdough, and pre-workout supplement.",
    category: "Shopping",
    priority: "low",
    status: "Todo",
    dueDate: getDateOffset(0),
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-3",
    title: "High-intensity cardio session",
    desc: "Complete 45 minutes of HIIT followed by a stretching routine to maintain core stability.",
    category: "Health",
    priority: "medium",
    status: "Completed",
    dueDate: getDateOffset(-1),
    createdAt: new Date().toISOString(),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // completed 1 day ago
  },
  {
    id: "demo-4",
    title: "Review database replication logs",
    desc: "Analyze connection pool performance and check queries latency during peak operational hours.",
    category: "Work",
    priority: "high",
    status: "Completed",
    dueDate: getDateOffset(-2),
    createdAt: new Date().toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // completed 2 days ago
  },
  {
    id: "demo-5",
    title: "Read 2 chapters of Outliers",
    desc: "Read chapters regarding cumulative advantage and 10,000-hour mastery rules.",
    category: "Personal",
    priority: "low",
    status: "Todo",
    dueDate: getDateOffset(4),
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-6",
    title: "Refactor core API authentication",
    desc: "Replace legacy sessions with JWT and configure refresh token rotation security measures.",
    category: "Work",
    priority: "high",
    status: "Todo",
    dueDate: getDateOffset(3),
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-7",
    title: "Weekly cardio health checkup",
    desc: "Log vitals, active heart rate stats, and sleep metrics in the fitness tracker dashboard.",
    category: "Health",
    priority: "medium",
    status: "Completed",
    dueDate: getDateOffset(-3),
    createdAt: new Date().toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // completed 3 days ago
  },
  {
    id: "demo-8",
    title: "Monthly hosting plan renewal",
    desc: "Process invoice for production cluster nodes and configure auto-scaling thresholds.",
    category: "Work",
    priority: "medium",
    status: "Completed",
    dueDate: getDateOffset(-5),
    createdAt: new Date().toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // completed 5 days ago
  }
];

// --- APP STATE ---
let tasks = [];
let deletedTaskPlaceholder = null; // Soft-undo placeholder
let activeView = "dashboard";
let activeCategory = "all";
let searchQuery = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  initTheme();
  initEventListeners();
  switchView(activeView);
  showToast("Welcome back! Loading your workspace.", "info");
});

// Load tasks from LocalStorage or seed demo data
function loadTasks() {
  const stored = localStorage.getItem("zenith_tasks");
  if (stored) {
    tasks = JSON.parse(stored);
  } else {
    tasks = [...DEMO_TASKS];
    saveTasks();
  }
}

// Save tasks to LocalStorage and trigger view refreshes
function saveTasks() {
  localStorage.setItem("zenith_tasks", JSON.stringify(tasks));
  updateSidebarCounts();
  renderCurrentView();
}

// --- RENDERING ROUTER ---
function renderCurrentView() {
  if (activeView === "dashboard") {
    renderDashboard();
  } else if (activeView === "board") {
    renderBoard();
  } else if (activeView === "list") {
    renderList();
  }
}

// Switch between dashboard, board, and list panels
function switchView(viewName) {
  activeView = viewName;
  
  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-view") === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Switch display panel
  document.querySelectorAll(".view-panel").forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  // Adjust header text based on view
  const title = document.getElementById("view-title");
  const subtitle = document.getElementById("view-subtitle");
  
  if (viewName === "dashboard") {
    title.textContent = "Dashboard Overview";
    subtitle.textContent = "Track your goals, performance metrics, and pending tasks.";
  } else if (viewName === "board") {
    title.textContent = "Project Board";
    subtitle.textContent = "Drag and drop tasks between lanes to manage project lifecycle.";
  } else if (viewName === "list") {
    title.textContent = "All Tasks";
    subtitle.textContent = "Query, filter, and sort tasks in a details grid layout.";
  }

  renderCurrentView();
}

// --- SIDEBAR STATS & CATEGORIES ---
function updateSidebarCounts() {
  // Count all
  const filteredTasks = searchQuery 
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery) || t.desc.toLowerCase().includes(searchQuery))
    : tasks;
    
  document.getElementById("count-all").textContent = filteredTasks.length;

  const categories = ["Work", "Personal", "Shopping", "Health"];
  categories.forEach(cat => {
    const count = filteredTasks.filter(t => t.category === cat).length;
    document.getElementById(`count-${cat.toLowerCase()}`).textContent = count;
  });
}

// --- DASHBOARD VIEW RENDERING ---
function renderDashboard() {
  // Filter by category if selected
  const activeTasks = activeCategory === "all" 
    ? tasks 
    : tasks.filter(t => t.category === activeCategory);
    
  // Search query support on dashboard
  const displayTasks = searchQuery
    ? activeTasks.filter(t => t.title.toLowerCase().includes(searchQuery) || t.desc.toLowerCase().includes(searchQuery))
    : activeTasks;

  // Compute Metrics
  const total = displayTasks.length;
  const completed = displayTasks.filter(t => t.status === "Completed").length;
  const inProgress = displayTasks.filter(t => t.status === "In Progress").length;
  const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Animate numbers inside metrics
  animateCount("stat-total", total);
  animateCount("stat-completed", completed);
  animateCount("stat-in-progress", inProgress);
  document.getElementById("stat-productivity").textContent = `${productivityScore}%`;

  // Draw productivity trend chart
  drawProductivityChart(displayTasks);

  // Render upcoming deadlines (Sorted by due date ascending, uncompleted only)
  const upcomingList = document.getElementById("dashboard-recent-list");
  upcomingList.innerHTML = "";
  
  const upcomingTasks = displayTasks
    .filter(t => t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5); // display top 5 upcoming

  if (upcomingTasks.length === 0) {
    upcomingList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4" stroke-linecap="round"/></svg>
        <div class="empty-state-title">No upcoming tasks</div>
        <div class="empty-state-desc">You are completely caught up!</div>
      </div>
    `;
    return;
  }

  upcomingTasks.forEach(task => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
    const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    const card = document.createElement("div");
    card.className = "mini-task-card";
    card.innerHTML = `
      <div class="mini-task-left">
        <div class="checkbox-custom" onclick="toggleTaskStatus('${task.id}')">
          <svg viewBox="0 0 24 24"><path d="M20 6L9 17L4 12" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div class="mini-task-title">${escapeHTML(task.title)}</div>
          <span class="mini-task-tag" style="color: ${getCategoryColor(task.category)}">${task.category}</span>
        </div>
      </div>
      <span class="card-date ${isOverdue ? 'overdue' : ''}">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formattedDate}
      </span>
    `;
    upcomingList.appendChild(card);
  });
}

// Animate count-up metrics for a professional touch
function animateCount(id, endValue) {
  const el = document.getElementById(id);
  const startValue = parseInt(el.textContent) || 0;
  if (startValue === endValue) {
    el.textContent = endValue;
    return;
  }
  
  const duration = 400; // ms
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutQuad curve
    const easeProgress = progress * (2 - progress);
    const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
    el.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      el.textContent = endValue;
    }
  }

  requestAnimationFrame(updateCount);
}

// --- KANBAN BOARD VIEW RENDERING ---
function renderBoard() {
  const columns = {
    "Todo": document.getElementById("list-todo"),
    "In Progress": document.getElementById("list-progress"),
    "Completed": document.getElementById("list-completed")
  };

  // Clear lanes
  Object.values(columns).forEach(col => col.innerHTML = "");

  // Filter tasks by active category
  const activeTasks = activeCategory === "all" 
    ? tasks 
    : tasks.filter(t => t.category === activeCategory);

  // Filter tasks by search query
  const displayTasks = searchQuery
    ? activeTasks.filter(t => t.title.toLowerCase().includes(searchQuery) || t.desc.toLowerCase().includes(searchQuery))
    : activeTasks;

  // Counts tracker
  const counts = { "Todo": 0, "In Progress": 0, "Completed": 0 };

  displayTasks.forEach(task => {
    counts[task.status]++;
    const card = createTaskCard(task);
    columns[task.status].appendChild(card);
  });

  // Update headers counters
  document.getElementById("count-todo").textContent = counts["Todo"];
  document.getElementById("count-progress").textContent = counts["In Progress"];
  document.getElementById("count-completed").textContent = counts["Completed"];

  // Handle empty lanes
  Object.keys(columns).forEach(status => {
    if (counts[status] === 0) {
      columns[status].innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M19 11H5M12 18L5 11L12 4" stroke-linecap="round"/></svg>
          <div class="empty-state-title">Lane is empty</div>
          <div class="empty-state-desc">Drag tasks here or click 'New Task'</div>
        </div>
      `;
    }
  });

  setupDragAndDrop();
}

// Helper to assemble task card DOM
function createTaskCard(task) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
  const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
  const card = document.createElement("div");
  card.className = "task-card";
  card.setAttribute("draggable", "true");
  card.setAttribute("data-id", task.id);
  
  card.innerHTML = `
    <div class="card-header">
      <span class="card-category" style="background: rgba(${getCategoryRGB(task.category)}, 0.1); color: ${getCategoryColor(task.category)}">${task.category}</span>
      <div class="card-menu">
        <button class="card-menu-btn" onclick="toggleCardDropdown(event, '${task.id}')">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        <div class="card-dropdown" id="dropdown-${task.id}">
          <button class="dropdown-item" onclick="openEditTaskModal('${task.id}')">
            <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round"/></svg>
            Edit
          </button>
          <button class="dropdown-item delete" onclick="deleteTask('${task.id}')">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round"/></svg>
            Delete
          </button>
        </div>
      </div>
    </div>
    <div class="card-title">${escapeHTML(task.title)}</div>
    <div class="card-desc">${escapeHTML(task.desc || "No description provided.")}</div>
    <div class="card-footer">
      <span class="card-date ${isOverdue ? 'overdue' : ''}">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${formattedDate}
      </span>
      <span class="badge-priority ${task.priority}">${task.priority}</span>
    </div>
  `;

  // Prevent drag triggers when editing task or clicking dropdown buttons
  card.querySelector(".card-menu").addEventListener("dragstart", (e) => e.stopPropagation());

  return card;
}

// Toggle context options on cards
function toggleCardDropdown(event, taskId) {
  event.stopPropagation();
  
  // Close any open dropdowns first
  document.querySelectorAll(".card-dropdown").forEach(dropdown => {
    if (dropdown.id !== `dropdown-${taskId}`) {
      dropdown.classList.remove("active");
    }
  });

  const dropdown = document.getElementById(`dropdown-${taskId}`);
  dropdown.classList.toggle("active");

  // Close dropdown on click outside
  const closeDropdown = () => {
    dropdown.classList.remove("active");
    document.removeEventListener("click", closeDropdown);
  };
  
  setTimeout(() => document.addEventListener("click", closeDropdown), 0);
}

// --- LIST VIEW RENDERING ---
function renderList() {
  const tableBody = document.getElementById("task-table-body");
  tableBody.innerHTML = "";

  const priorityFilter = document.getElementById("filter-priority").value;
  const statusFilter = document.getElementById("filter-status").value;
  const sortOption = document.getElementById("sort-tasks").value;

  // Filter chains
  let filtered = tasks;

  // Category side-filter
  if (activeCategory !== "all") {
    filtered = filtered.filter(t => t.category === activeCategory);
  }

  // Priority filter
  if (priorityFilter !== "all") {
    filtered = filtered.filter(t => t.priority === priorityFilter);
  }

  // Status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter(t => t.status === statusFilter);
  }

  // Search filter
  if (searchQuery) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchQuery) || 
      t.desc.toLowerCase().includes(searchQuery)
    );
  }

  // Sort logic
  filtered.sort((a, b) => {
    const [field, direction] = sortOption.split("-");
    const mult = direction === "desc" ? -1 : 1;

    if (field === "dueDate") {
      return mult * (new Date(a.dueDate) - new Date(b.dueDate));
    }
    if (field === "title") {
      return mult * a.title.localeCompare(b.title);
    }
    if (field === "priority") {
      const priorityMap = { low: 1, medium: 2, high: 3 };
      return mult * (priorityMap[a.priority] - priorityMap[b.priority]);
    }
    return 0;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr class="table-empty-row">
        <td colspan="6">
          <div class="empty-state" style="padding: 24px;">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8" stroke-linecap="round"/></svg>
            <div class="empty-state-title">No matching tasks found</div>
            <div class="empty-state-desc">Try clearing search or filters</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(task => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
    const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="table-title-col" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</td>
      <td>
        <span class="card-category" style="background: rgba(${getCategoryRGB(task.category)}, 0.1); color: ${getCategoryColor(task.category)}">${task.category}</span>
      </td>
      <td><span class="badge-priority ${task.priority}">${task.priority}</span></td>
      <td><span class="${isOverdue ? 'overdue' : ''}" style="${isOverdue ? 'color: var(--color-danger); font-weight: 600;' : ''}">${formattedDate}</span></td>
      <td>
        <span class="badge-status ${task.status.toLowerCase().replace(" ", "")}">
          ${task.status}
        </span>
      </td>
      <td>
        <div class="action-buttons-cell">
          <button class="btn-icon edit" onclick="openEditTaskModal('${task.id}')" title="Edit Task">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/></svg>
          </button>
          <button class="btn-icon delete" onclick="deleteTask('${task.id}')" title="Delete Task">
            <svg viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// --- CRUD OPERATIONS ---

// CREATE or UPDATE task from Modal Form Submit
function saveTaskForm(event) {
  event.preventDefault();

  const id = document.getElementById("task-id").value;
  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const category = document.getElementById("task-category").value;
  const dueDate = document.getElementById("task-due-date").value;
  const priority = document.getElementById("task-priority").value;
  const status = document.getElementById("task-status").value;

  if (!title || !dueDate) {
    showToast("Please fill in all required fields.", "danger");
    return;
  }

  if (id) {
    // UPDATE operation
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const oldStatus = tasks[index].status;
      
      tasks[index] = {
        ...tasks[index],
        title,
        desc,
        category,
        dueDate,
        priority,
        status,
        updatedAt: new Date().toISOString()
      };

      // Handle completedAt timestamp shifts
      if (status === "Completed" && oldStatus !== "Completed") {
        tasks[index].completedAt = new Date().toISOString();
      } else if (status !== "Completed") {
        delete tasks[index].completedAt;
      }

      showToast("Task updated successfully", "success");
    }
  } else {
    // CREATE operation
    const newTask = {
      id: "task-" + Date.now(),
      title,
      desc,
      category,
      dueDate,
      priority,
      status,
      createdAt: new Date().toISOString()
    };

    if (status === "Completed") {
      newTask.completedAt = new Date().toISOString();
    }

    tasks.push(newTask);
    showToast("Task created successfully", "success");
  }

  saveTasks();
  closeModal();
}

// DELETE operation
function deleteTask(taskId) {
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    // Save backup for Undo function
    deletedTaskPlaceholder = { ...tasks[index] };
    
    // Remove task
    tasks.splice(index, 1);
    saveTasks();

    // Show toast notification with working undo action
    showToast(`Deleted task: "${deletedTaskPlaceholder.title.slice(0, 20)}..."`, "danger", 5000, undoDelete);
  }
}

// UNDO Delete operation
function undoDelete() {
  if (deletedTaskPlaceholder) {
    tasks.push(deletedTaskPlaceholder);
    deletedTaskPlaceholder = null;
    saveTasks();
    showToast("Deletion undone!", "success");
  }
}

// TOGGLE task status quickly via checkbox
function toggleTaskStatus(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const wasCompleted = task.status === "Completed";
    task.status = wasCompleted ? "Todo" : "Completed";
    
    if (task.status === "Completed") {
      task.completedAt = new Date().toISOString();
      showToast("Task completed! Keep it up.", "success");
    } else {
      delete task.completedAt;
      showToast("Task active again", "info");
    }
    
    saveTasks();
  }
}

// --- DRAG AND DROP HANDLERS ---
function setupDragAndDrop() {
  const cards = document.querySelectorAll(".task-card");
  const lists = document.querySelectorAll(".cards-list");

  cards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", card.getAttribute("data-id"));
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });

  lists.forEach(list => {
    const column = list.closest(".board-column");
    const targetStatus = column.getAttribute("data-status");

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      list.classList.add("drag-over");
    });

    list.addEventListener("dragleave", () => {
      list.classList.remove("drag-over");
    });

    list.addEventListener("drop", (e) => {
      e.preventDefault();
      list.classList.remove("drag-over");
      
      const taskId = e.dataTransfer.getData("text/plain");
      const task = tasks.find(t => t.id === taskId);
      
      if (task && task.status !== targetStatus) {
        const oldStatus = task.status;
        task.status = targetStatus;

        // Manage completed timestamps on drag-drop
        if (targetStatus === "Completed" && oldStatus !== "Completed") {
          task.completedAt = new Date().toISOString();
        } else if (targetStatus !== "Completed") {
          delete task.completedAt;
        }

        saveTasks();
        showToast(`Moved task to "${targetStatus}"`, "info");
      }
    });
  });
}

// --- MODAL CONTROLLERS ---
function openAddTaskModal() {
  document.getElementById("modal-title-text").textContent = "Create New Task";
  document.getElementById("task-form").reset();
  document.getElementById("task-id").value = "";
  
  // Set default due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("task-due-date").value = tomorrow.toISOString().split("T")[0];

  document.getElementById("task-modal").classList.add("active");
}

function openEditTaskModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    document.getElementById("modal-title-text").textContent = "Edit Task";
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-desc").value = task.desc || "";
    document.getElementById("task-category").value = task.category;
    document.getElementById("task-due-date").value = task.dueDate;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-status").value = task.status;

    document.getElementById("task-modal").classList.add("active");
  }
}

function closeModal() {
  document.getElementById("task-modal").classList.remove("active");
}

// --- DYNAMIC SVG CHART GENERATOR ---
function drawProductivityChart(chartTasks) {
  const chart = document.getElementById("productivity-chart");
  
  // Clear any existing chart details
  chart.querySelectorAll(".chart-node").forEach(n => n.remove());

  // Dimensions matching viewBox="0 0 600 240"
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for trailing 7 days (including today)
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      label: dayNames[d.getDay()],
      count: 0
    });
  }

  // Calculate completions per day
  chartTasks.forEach(task => {
    if (task.status === "Completed" && task.completedAt) {
      const completionDate = task.completedAt.split('T')[0];
      const match = days.find(day => day.dateStr === completionDate);
      if (match) {
        match.count++;
      }
    }
  });

  // Find max completions to scale Y-axis
  const maxCompletions = Math.max(...days.map(d => d.count), 4); // minimum upper grid scale of 4

  // Draw Grid Lines (Horizontal)
  const gridLinesCount = 4;
  for (let i = 0; i <= gridLinesCount; i++) {
    const gridY = paddingTop + (chartHeight * i) / gridLinesCount;
    const value = Math.round((maxCompletions * (gridLinesCount - i)) / gridLinesCount);
    
    // Line element
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", gridY);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", gridY);
    line.setAttribute("class", "chart-grid-line chart-node");
    chart.appendChild(line);

    // Grid labels (Y-axis counts)
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", paddingLeft - 12);
    label.setAttribute("y", gridY + 4);
    label.setAttribute("fill", "var(--text-light)");
    label.setAttribute("font-size", "10px");
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-family", "var(--font-sans)");
    label.setAttribute("font-weight", "600");
    label.setAttribute("class", "chart-node");
    label.textContent = value;
    chart.appendChild(label);
  }

  // Calculate coordinates for points
  const points = days.map((day, idx) => {
    const x = paddingLeft + (chartWidth * idx) / (days.length - 1);
    // Y maps inverted because SVG coordinates increase downwards
    const y = paddingTop + chartHeight - (chartHeight * day.count) / maxCompletions;
    return { x, y, ...day };
  });

  // Assemble path curves (Bezier formulation)
  let dCurve = "";
  let dArea = `M ${points[0].x} ${paddingTop + chartHeight} `;

  points.forEach((pt, idx) => {
    if (idx === 0) {
      dCurve += `M ${pt.x} ${pt.y} `;
      dArea += `L ${pt.x} ${pt.y} `;
    } else {
      // Smooth Bezier handle offsets
      const prev = points[idx - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (pt.x - prev.x) / 2;
      const cpY2 = pt.y;
      
      dCurve += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y} `;
      dArea += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y} `;
    }
  });

  dArea += `L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`;

  // Draw Area element
  const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  areaPath.setAttribute("d", dArea);
  areaPath.setAttribute("class", "chart-gradient-area chart-node");
  chart.appendChild(areaPath);

  // Draw Stroke Path
  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linePath.setAttribute("d", dCurve);
  linePath.setAttribute("class", "chart-line chart-node");
  chart.appendChild(linePath);

  // Draw nodes & tooltips
  points.forEach(pt => {
    // Circle Node
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pt.x);
    circle.setAttribute("cy", pt.y);
    circle.setAttribute("r", "5");
    circle.setAttribute("class", "chart-point chart-node");
    
    // Interactive mouse trackers
    circle.addEventListener("mouseover", (e) => {
      showChartTooltip(e, pt.count, pt.label);
    });
    circle.addEventListener("mouseleave", hideChartTooltip);

    chart.appendChild(circle);

    // Draw X-axis label text
    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", pt.x);
    xLabel.setAttribute("y", paddingTop + chartHeight + 22);
    xLabel.setAttribute("fill", "var(--text-muted)");
    xLabel.setAttribute("font-size", "11px");
    xLabel.setAttribute("text-anchor", "middle");
    xLabel.setAttribute("font-family", "var(--font-sans)");
    xLabel.setAttribute("font-weight", "600");
    xLabel.setAttribute("class", "chart-node");
    xLabel.textContent = pt.label;
    chart.appendChild(xLabel);
  });
}

function showChartTooltip(event, count, dayName) {
  const tooltip = document.getElementById("chart-tooltip");
  tooltip.textContent = `${dayName}: ${count} tasks completed`;
  tooltip.style.opacity = "1";
  
  // Align coordinates relative to chart boundaries
  const wrapper = document.querySelector(".chart-wrapper");
  const wrapperRect = wrapper.getBoundingClientRect();
  const x = event.clientX - wrapperRect.left;
  const y = event.clientY - wrapperRect.top;
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideChartTooltip() {
  const tooltip = document.getElementById("chart-tooltip");
  tooltip.style.opacity = "0";
}

// --- TOAST NOTIFICATIONS CONTROLLER ---
function showToast(message, type = "info", duration = 4000, actionCallback = null) {
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let actionBtnHTML = "";
  if (actionCallback) {
    actionBtnHTML = `<button class="toast-undo-btn">Undo</button>`;
  }

  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    ${actionBtnHTML}
    <button class="toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  `;

  // Bind actions
  if (actionCallback) {
    toast.querySelector(".toast-undo-btn").addEventListener("click", () => {
      actionCallback();
      toast.remove();
    });
  }

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.style.animation = "none";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  });

  // Slide out automatically
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = "none";
      toast.style.transition = "all 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);

  container.appendChild(toast);
}

// --- EVENT LISTENERS SYSTEM ---
function initEventListeners() {
  // Sidebar view routers
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const targetView = item.getAttribute("data-view");
      switchView(targetView);
    });
  });

  // Sidebar Category Filter tags
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");
      renderCurrentView();
    });
  });

  // Main task modal trigger
  document.getElementById("btn-add-task").addEventListener("click", openAddTaskModal);
  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  document.getElementById("btn-cancel-modal").addEventListener("click", closeModal);

  // Form submission
  document.getElementById("task-form").addEventListener("submit", saveTaskForm);

  // List View filters & sorting
  document.getElementById("filter-priority").addEventListener("change", renderList);
  document.getElementById("filter-status").addEventListener("change", renderList);
  document.getElementById("sort-tasks").addEventListener("change", renderList);

  // Search input debouncer
  const searchInput = document.getElementById("global-search");
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    saveTasks(); // re-evaluates all filters and counts
  });

  // Light/Dark Theme buttons
  document.getElementById("theme-light").addEventListener("click", () => setTheme("light"));
  document.getElementById("theme-dark").addEventListener("click", () => setTheme("dark"));
}

// --- THEME UTILS ---
function initTheme() {
  const savedTheme = localStorage.getItem("zenith_theme") || "dark";
  setTheme(savedTheme);
}

function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("zenith_theme", themeName);

  const btnLight = document.getElementById("theme-light");
  const btnDark = document.getElementById("theme-dark");

  if (themeName === "light") {
    btnLight.classList.add("active");
    btnDark.classList.remove("active");
  } else {
    btnDark.classList.add("active");
    btnLight.classList.remove("active");
  }
}

// --- DECORATIVE CATEGORY COLORS ---
function getCategoryColor(category) {
  switch (category) {
    case "Work": return "#a855f7"; // Violet
    case "Personal": return "#06b6d4"; // Cyan
    case "Shopping": return "#f43f5e"; // Rose
    case "Health": return "#10b981"; // Emerald
    default: return "var(--color-primary)";
  }
}

function getCategoryRGB(category) {
  switch (category) {
    case "Work": return "168, 85, 247";
    case "Personal": return "6, 182, 212";
    case "Shopping": return "244, 63, 94";
    case "Health": return "16, 185, 129";
    default: return "99, 102, 241";
  }
}

// Escape HTML characters to prevent XSS vulnerability
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
