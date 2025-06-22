
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default categories and tasks if nothing in localStorage
const DEFAULT_CATEGORIES_CONFIG = [
  { id: 'routine', name: 'Routine', order: 0, deletable: false, folders: [
      { id: 'default_folder_routine', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
        "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
        "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
      ]}
  ]},
  { id: 'health', name: 'Health', order: 1, deletable: false, folders: [
      { id: 'default_folder_health', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
        "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
        "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
        "Shower consistently", "Social media < 1 hour"
      ]}
  ]},
  { id: 'god', name: 'God', order: 2, deletable: false, folders: [
      { id: 'default_folder_god', name: 'Tasks', type: 'task', order: 0, tasks: [
        "Self-Bible Study", "Thursday congregation", "Sunday congregation",
        "Be the person God expects"
      ]}
  ]},
  { id: 'personal', name: 'Personal', order: 3, deletable: false, folders: [
      { id: 'default_folder_personal', name: 'Tasks', type: 'task', order: 0, tasks: ["Content creation"] }
  ]},
];


const DAILY_TARGET_POINTS = 2700;
let TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Will be updated by current progress plan

const STORAGE_KEY_TASK_COMPLETION_PREFIX = 'lifeTrackerTaskCompletion_';
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_';
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; // May be deprecated or used differently with plans
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';

const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2';
const USER_FOLDERS_KEY = 'lifeTrackerUserFolders_v2';

const STORAGE_KEY_CURRENT_PROGRESS_PLAN = 'lifeTrackerCurrentProgressPlan_v1';
const STORAGE_KEY_PROGRESS_HISTORY = 'lifeTrackerProgressHistory_v1';


let currentCategories = [];
let userFoldersByCategoryId = {};

let currentTaskCompletionStatus = {};

let activeTabId = 'dashboard';
let currentModalDate = null;
let draggedItemElement = null;
let itemToDelete = null;
let editModes = {};
let categoryViewMode = {};
let activeFolderIdForCategory = {};
let activeAddTaskForm = null;

let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;

let longPressTimer = null;
const LONG_PRESS_DURATION = 700;
let currentContextMenuTargetTab = null;
let currentFolderOptionsMenu = { element: null, folderId: null, categoryId: null };

let midnightTimer = null;
let currentEditingNoteItem = null;

let currentProgressPlan = null; // { name: string, startDate: string, startDayOfWeek: number (0-6), targetWeeklyPoints: number }
let progressHistory = []; // [ { name, startDate, endDate, weeklyProgressDetails: { pointsEarned, targetPoints, percentage, totalWeeks?, avgWeeklyPoints? } }, ... ]
let currentView = 'dashboard'; // 'dashboard' or 'progress'


// DOM Elements
const domElements = {
  // Main App Structure
  appContainer: null,
  hamburgerMenuButton: null,
  sideMenu: null,
  sideMenuDashboardLink: null,
  sideMenuProgressLink: null,
  mainContentWrapper: null, // Existing main content area
  progressSystemView: null, // New view for progress system
  
  // Progress System Specific
  progressSystemHeader: null,
  progressSystemBackButton: null,
  progressTabSetup: null,
  progressTabHistory: null,
  progressSetupContent: null,
  progressHistoryContent: null,
  progressSetupForm: null,
  progressPlanNameInput: null,
  progressStartDateInput: null,
  progressStartDaySelect: null,
  progressTargetWeeklyPointsInput: null,
  saveProgressPlanButton: null,
  endCurrentPlanButton: null,
  activePlanSummary: null,
  activePlanNameDisplay: null,
  activePlanStartDateDisplay: null,
  activePlanStartDayDisplay: null,
  activePlanTargetPointsDisplay: null,
  progressHistoryList: null,
  noProgressHistoryMessage: null,

  // Existing Elements
  tabsContainer: null,
  tabContentsContainer: null,
  addCategoryButton: null,
  categorySectionTemplate: null,
  backToFoldersButtonTemplate: null,
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  folderOptionsContextMenu: null,
  ctxRenameFolderButton: null,
  ctxDeleteFolderButton: null,
  dashboardSummariesContainer: null,
  todayProgressFill: null,
  todayPointsStat: null,
  currentWeeklyPlanNameDisplay: null, // For displaying plan name on dashboard
  currentWeekProgressFill: null,
  currentWeekPointsStat: null,
  calendarMonthYearButton: null,
  calendarMonthYear: null,
  calendarGrid: null,
  calendarPrevMonthButton: null,
  calendarNextMonthButton: null,
  monthYearPickerModal: null,
  monthYearPickerContent: null,
  monthYearPickerCloseButton: null,
  pickerMonthsGrid: null,
  pickerYearsList: null,
  dailyNoteInput: null,
  saveNoteButton: null,
  historyModal: null,
  historyModalCloseButton: null,
  historyModalDate: null,
  historyModalPointsValue: null,
  historyModalPointsTotal: null,
  historyPercentageProgressFill: null,
  historyTasksList: null,
  expandTasksButton: null,
  historicalReflectionWrapper: null,
  expandReflectionButton: null,
  historyUserNoteDisplay: null,
  historyUserNoteEdit: null,
  historicalNoteControls: null,
  saveHistoricalNoteButton: null,
  clearHistoricalNoteButton: null,
  historicalNoteStatus: null,
  taskEditControlsTemplate: null,
  deleteConfirmationModal: null,
  deleteConfirmationTitle: null,
  deleteConfirmationMessage: null,
  deleteConfirmationCloseButton: null,
  confirmDeleteButton: null,
  cancelDeleteButton: null,
  fullscreenContentModal: null,
  fullscreenModalTitle: null,
  fullscreenModalArea: null,
  fullscreenModalCloseButton: null,
  addFolderModal: null,
  addFolderModalCloseButton: null,
  addFolderStep1: null,
  addFolderStep2: null,
  selectTaskFolderTypeButton: null,
  selectNotesFolderTypeButton: null,
  addFolderBackButton: null,
  selectedFolderTypeNameSpan: null,
  newFolderNameInput: null,
  createFolderButton: null,
  cancelAddFolderButton: null,
  noteItemTemplate: null,
  noteItemEditTextareaTemplate: null,
  noteItemEditLinkTemplate: null,
  noteItemEditImageTemplate: null,
};

function getProgressFillColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120;
    return `hsl(${hue}, 100%, 50%)`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNormalizedDate(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

function getCurrentMonthYearString() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function createUniqueId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTaskCompletionStorageKey(taskDefinitionId, dateString) {
  return `${STORAGE_KEY_TASK_COMPLETION_PREFIX}${taskDefinitionId}_${dateString}`;
}

// Data Management: Categories, Folders, Tasks (existing functions, slightly adapted if needed)
function loadUserCategories() { return JSON.parse(localStorage.getItem(USER_CATEGORIES_KEY)) || DEFAULT_CATEGORIES_CONFIG.map(c => ({id:c.id, name:c.name, order:c.order, deletable: c.deletable !== undefined ? c.deletable:true})); }
function saveUserCategories(categories) { localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order))); }
function loadUserFolders() { const stored = localStorage.getItem(USER_FOLDERS_KEY); if(stored) {const p = JSON.parse(stored); Object.keys(p).forEach(k => p[k].forEach(f => {if(!f.type)f.type='task'; if(f.type==='task' && !f.tasks)f.tasks=[]; if(f.type==='notes' && !f.content)f.content=[]; if(f.type === 'notes' && f.content) f.content.forEach(i => {if(!i.id) i.id = createUniqueId('noteitem')}) ;})); return p;} const iF={}; DEFAULT_CATEGORIES_CONFIG.forEach(c => {iF[c.id]=(c.folders||[]).map(f=>({id:f.id||createUniqueId('folder'),name:f.name,type:f.type||'task',order:f.order||0,tasks:f.type==='notes'?undefined:(f.tasks||[]).map(t=>typeof t==='string'?{id:createUniqueId('taskdef'),text:t}:{id:t.id||createUniqueId('taskdef'),text:t.text}),content:f.type==='notes'?(f.content||[]):undefined}));}); return iF; }
function saveUserFolders(foldersByCatId) { localStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(foldersByCatId)); }
function migrateOldTaskStructureIfNeeded() { return false; } // Assuming migration already handled or not needed
function initializeTaskCompletionStatusForNewDay() { /* ... existing ... */ }
function getTaskCompletionStatus(taskDefinitionId, dateString) { return currentTaskCompletionStatus[getTaskCompletionStorageKey(taskDefinitionId, dateString)] || false; }
function setTaskCompletionStatus(taskDefinitionId, dateString, isCompleted) { const key = getTaskCompletionStorageKey(taskDefinitionId, dateString); if (isCompleted) currentTaskCompletionStatus[key] = true; else delete currentTaskCompletionStatus[key]; localStorage.setItem(key, isCompleted.toString()); }
function loadTaskCompletionForDate(dateString) { currentTaskCompletionStatus = {}; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX) && key.endsWith(`_${dateString}`)) currentTaskCompletionStatus[key] = localStorage.getItem(key) === 'true'; } }

// Progress Plan Data Management
function loadProgressData() {
    const storedPlan = localStorage.getItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN);
    if (storedPlan) currentProgressPlan = JSON.parse(storedPlan); else currentProgressPlan = null;
    
    const storedHistory = localStorage.getItem(STORAGE_KEY_PROGRESS_HISTORY);
    if (storedHistory) progressHistory = JSON.parse(storedHistory); else progressHistory = [];
    
    if (currentProgressPlan && currentProgressPlan.targetWeeklyPoints) {
        TARGET_POINTS_FOR_WEEKLY_VIEW = currentProgressPlan.targetWeeklyPoints;
    } else {
        TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Default if no plan or old plan structure
    }
}

function saveProgressData() {
    if (currentProgressPlan) localStorage.setItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN, JSON.stringify(currentProgressPlan));
    else localStorage.removeItem(STORAGE_KEY_CURRENT_PROGRESS_PLAN);
    localStorage.setItem(STORAGE_KEY_PROGRESS_HISTORY, JSON.stringify(progressHistory));
}

function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    migrateOldTaskStructureIfNeeded();
    userFoldersByCategoryId = loadUserFolders();
    currentCategories.forEach(cat => {
        if (!userFoldersByCategoryId[cat.id]) userFoldersByCategoryId[cat.id] = [];
        userFoldersByCategoryId[cat.id].forEach(folder => { if (!folder.type) folder.type = 'task'; if (folder.type === 'task' && !folder.tasks) folder.tasks = []; if (folder.type === 'notes' && !folder.content) folder.content = []; });
        if (editModes[cat.id] === undefined) editModes[cat.id] = false;
        if (categoryViewMode[cat.id] === undefined) categoryViewMode[cat.id] = 'list_folders';
        if (activeFolderIdForCategory[cat.id] === undefined) activeFolderIdForCategory[cat.id] = null;
    });
    saveUserCategories(currentCategories); saveUserFolders(userFoldersByCategoryId);
}
function saveDailyNote() { if (!domElements.dailyNoteInput) return; const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const noteContent = domElements.dailyNoteInput.value; localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent); if (currentActiveDate === getTodayDateString() && currentModalDate === currentActiveDate) { const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentActiveDate; const historyDataString = localStorage.getItem(historyKey); if (historyDataString) { try { let historyEntry = JSON.parse(historyDataString); historyEntry.userNote = noteContent; localStorage.setItem(historyKey, JSON.stringify(historyEntry)); } catch (e) { console.warn("Could not live update history note", e); } } } if (domElements.saveNoteButton) { domElements.saveNoteButton.textContent = 'Note Saved!'; setTimeout(() => { if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note'; }, 1500); } }
function loadCurrentDayNote() { if (!domElements.dailyNoteInput) return; const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate); domElements.dailyNoteInput.value = note || ''; }
function saveDayToHistory(dateToSave) { const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateToSave; loadTaskCompletionForDate(dateToSave); const completedTasksHistory = {}; let tasksCompletedCount = 0; let totalTasksForDay = 0; currentCategories.forEach(cat => { completedTasksHistory[cat.id] = []; const foldersInCat = userFoldersByCategoryId[cat.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task') { folder.tasks.forEach(taskDef => { totalTasksForDay++; if (getTaskCompletionStatus(taskDef.id, dateToSave)) { completedTasksHistory[cat.id].push(taskDef.text); tasksCompletedCount++; } }); } }); }); const pointsPerTaskCalculation = totalTasksForDay > 0 ? DAILY_TARGET_POINTS / totalTasksForDay : 0; const finalPointsEarned = Math.round(tasksCompletedCount * pointsPerTaskCalculation); const finalPercentageCompleted = totalTasksForDay > 0 ? Math.round((tasksCompletedCount / totalTasksForDay) * 100) : 0; const noteFromDay = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || ""; const historyEntry = { date: dateToSave, completedTasks: completedTasksHistory, userNote: noteFromDay, pointsEarned: finalPointsEarned, percentageCompleted: finalPercentageCompleted, totalTasksOnDate: totalTasksForDay, dailyTargetPoints: DAILY_TARGET_POINTS }; localStorage.setItem(historyKey, JSON.stringify(historyEntry)); localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave); currentCategories.forEach(cat => { const foldersInCat = userFoldersByCategoryId[cat.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task') { folder.tasks.forEach(taskDef => { localStorage.removeItem(getTaskCompletionStorageKey(taskDef.id, dateToSave)); }); } }); }); console.log(`History finalized and saved for ${dateToSave}:`, historyEntry); }
function checkAndClearOldMonthlyData() { const currentMonthYear = getCurrentMonthYearString(); const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED); if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX)) { const parts = key.split('_'); if (parts.length > 2) { const datePart = parts.slice(2).join('_'); if (datePart.length >= 7) { const monthYearOfKey = datePart.substring(0, 7); if (monthYearOfKey === lastProcessedMonthYear) localStorage.removeItem(key); } } } } } localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear); }
function loadAppData() { seedInitialDataIfNeeded(); loadProgressData(); let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); const currentDateStr = getTodayDateString(); if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) { console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`); saveDayToHistory(lastVisitDateStr); initializeTaskCompletionStatusForNewDay(); } else if (!lastVisitDateStr) { console.log("First visit or no last visit date found. Initializing for today."); initializeTaskCompletionStatusForNewDay(); } else { console.log("Resuming session for today:", currentDateStr); loadTaskCompletionForDate(currentDateStr); } localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr); checkAndClearOldMonthlyData(); loadCurrentDayNote(); calendarDisplayDate = new Date(); calendarDisplayDate.setDate(1); calendarDisplayDate.setHours(0,0,0,0); pickerSelectedMonth = calendarDisplayDate.getMonth(); pickerSelectedYear = calendarDisplayDate.getFullYear(); scheduleMidnightTask(); }
function handleMidnightReset() { console.log("Midnight reset triggered."); const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); if (!dateThatJustEnded) { console.error("Cannot perform midnight reset: last visit date unknown."); scheduleMidnightTask(); return; } saveDayToHistory(dateThatJustEnded); const newCurrentDate = getTodayDateString(); localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, newCurrentDate); initializeTaskCompletionStatusForNewDay(); currentTaskCompletionStatus = {}; if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = ''; loadCurrentDayNote(); if (domElements.todayPointsStat) domElements.todayPointsStat.classList.add('progress-value-resetting'); if (domElements.todayProgressFill) domElements.todayProgressFill.classList.add('progress-value-resetting'); updateAllProgress(); setTimeout(() => { if (domElements.todayPointsStat) domElements.todayPointsStat.classList.remove('progress-value-resetting'); if (domElements.todayProgressFill) domElements.todayProgressFill.classList.remove('progress-value-resetting'); }, 500); scheduleMidnightTask(); }
function scheduleMidnightTask() { if (midnightTimer) clearTimeout(midnightTimer); const now = new Date(); const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1); tomorrow.setHours(0, 0, 1, 0); const msUntilMidnight = tomorrow.getTime() - now.getTime(); console.log(`Next midnight reset scheduled in ${msUntilMidnight / 1000 / 60} minutes.`); midnightTimer = setTimeout(handleMidnightReset, msUntilMidnight); }
function getDragAfterElement(container, y, itemSelector) { const draggableElements = Array.from(container.querySelectorAll(`${itemSelector}:not(.dragging):not(.editing)`)); return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest; }, { offset: Number.NEGATIVE_INFINITY, element: null }).element; }
function toggleCategoryEditMode(categoryId) { editModes[categoryId] = !editModes[categoryId]; renderCategoryTasks(categoryId); }
function showTempAddTaskForm(categoryId, folderId, position) { if (activeAddTaskForm) hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position, false); activeAddTaskForm = { categoryId, folderId, position }; const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const formContainer = categorySection.querySelector(formContainerClass); if (!formContainer) return; const triggerButton = formContainer.querySelector('.add-item-trigger-button'); const form = formContainer.querySelector('.new-temp-task-form'); const input = formContainer.querySelector('.new-task-temp-input'); if (triggerButton) triggerButton.classList.add('hidden'); if (form) form.classList.remove('hidden'); if (input) input.focus(); }
function hideTempAddTaskForm(categoryId, folderId, position, resetActiveForm = true) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const formContainer = categorySection.querySelector(formContainerClass); if (!formContainer) return; const triggerButton = formContainer.querySelector('.add-item-trigger-button'); const form = formContainer.querySelector('.new-temp-task-form'); const input = formContainer.querySelector('.new-task-temp-input'); if (triggerButton) triggerButton.classList.remove('hidden'); if (form) form.classList.add('hidden'); if (input) input.value = ''; if (resetActiveForm) activeAddTaskForm = null; }
function handleSaveTempTask(categoryId, folderId, position) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'; const input = categorySection.querySelector(`${formContainerClass} .new-task-temp-input`); const taskText = input.value.trim(); if (taskText) { const newTaskDefinition = { id: createUniqueId('taskdef'), text: taskText }; const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { if (position === 'top') folder.tasks.unshift(newTaskDefinition); else folder.tasks.push(newTaskDefinition); saveUserFolders(userFoldersByCategoryId); renderCategoryTasks(categoryId); updateAllProgress(); hideTempAddTaskForm(categoryId, folderId, position); } else alert('Error: Could not find the task folder or incorrect folder type.'); } else alert('Task text cannot be empty.'); }
function getTaskDefinition(taskDefinitionId) { for (const catId in userFoldersByCategoryId) { const folders = userFoldersByCategoryId[catId]; for (const folder of folders) { if (folder.type === 'task' && folder.tasks) { const taskDef = folder.tasks.find(t => t.id === taskDefinitionId); if (taskDef) return { ...taskDef, categoryId: catId, folderId: folder.id }; } } } return null; }
function startTaskEdit(taskItemElement, taskDef, categoryId, folderId) { if (taskItemElement.classList.contains('editing')) return; taskItemElement.classList.add('editing'); const taskTextSpan = taskItemElement.querySelector('.task-text'); if (taskTextSpan) taskTextSpan.style.display = 'none'; const editControlsTemplate = domElements.taskEditControlsTemplate; if (!editControlsTemplate) return; const editControls = editControlsTemplate.cloneNode(true); editControls.removeAttribute('id'); editControls.style.display = 'flex'; const input = editControls.querySelector('.task-edit-input'); const saveButton = editControls.querySelector('.task-edit-save'); const cancelButton = editControls.querySelector('.task-edit-cancel'); input.value = taskDef.text; saveButton.onclick = () => saveTaskEdit(taskDef.id, categoryId, folderId, input.value, taskItemElement, editControls); cancelButton.onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan); const deleteButton = taskItemElement.querySelector('.task-delete-button-editmode'); if (deleteButton) taskItemElement.insertBefore(editControls, deleteButton); else taskItemElement.appendChild(editControls); input.focus(); input.select(); }
function saveTaskEdit(taskDefinitionId, categoryId, folderId, newText, taskItemElement, editControls) { newText = newText.trim(); if (!newText) { alert("Task text cannot be empty."); return; } const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { const taskDef = folder.tasks.find(t => t.id === taskDefinitionId); if (taskDef) { taskDef.text = newText; saveUserFolders(userFoldersByCategoryId); } } const taskTextSpan = taskItemElement.querySelector('.task-text'); if(taskTextSpan) { taskTextSpan.textContent = newText; taskTextSpan.style.display = ''; } taskItemElement.classList.remove('editing'); editControls.remove(); }
function cancelTaskEdit(taskItemElement, editControls, taskTextSpan) { if (taskTextSpan) taskTextSpan.style.display = ''; taskItemElement.classList.remove('editing'); editControls.remove(); }
function renderTaskItem(taskDef, categoryId, folderId) { const item = document.createElement('li'); item.className = 'task-item'; item.dataset.taskDefId = taskDef.id; item.setAttribute('role', 'listitem'); item.setAttribute('tabindex', '0'); const textSpan = document.createElement('span'); textSpan.className = 'task-text'; textSpan.textContent = taskDef.text; item.appendChild(textSpan); const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const isCompleted = getTaskCompletionStatus(taskDef.id, today); const updateAriaAndClass = (completedState) => { item.setAttribute('aria-label', `${taskDef.text}, ${completedState ? 'completed' : 'not completed'}`); item.classList.toggle('completed', completedState); }; updateAriaAndClass(isCompleted); if (editModes[categoryId]) { const deleteButton = document.createElement('button'); deleteButton.className = 'task-delete-button-editmode icon-button'; deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`; deleteButton.setAttribute('aria-label', `Delete task: ${taskDef.text}`); deleteButton.title = "Delete Task"; deleteButton.onclick = (e) => { e.stopPropagation(); showDeleteConfirmation('task', taskDef.id, `Are you sure you want to delete the task "${taskDef.text}"? This will remove it permanently.`, '', categoryId, folderId); }; item.appendChild(deleteButton); } item.addEventListener('click', (e) => { if (item.classList.contains('editing')) return; if (editModes[categoryId] && e.target === textSpan) { startTaskEdit(item, taskDef, categoryId, folderId); return; } if (!editModes[categoryId]) { const currentCompletion = getTaskCompletionStatus(taskDef.id, today); setTaskCompletionStatus(taskDef.id, today, !currentCompletion); updateAriaAndClass(!currentCompletion); item.classList.remove('animate-task-complete', 'animate-task-uncomplete'); void item.offsetWidth; item.classList.add(!currentCompletion ? 'animate-task-complete' : 'animate-task-uncomplete'); updateAllProgress(); } }); item.addEventListener('keydown', (e) => { if (item.classList.contains('editing')) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!editModes[categoryId]) item.click(); else if (editModes[categoryId] && document.activeElement === item) startTaskEdit(item, taskDef, categoryId, folderId); } }); if (editModes[categoryId] && !item.classList.contains('editing')) { item.draggable = true; item.addEventListener('dragstart', (e) => { if (!editModes[categoryId] || item.classList.contains('editing')) { e.preventDefault(); return; } draggedItemElement = item; setTimeout(() => item.classList.add('dragging'), 0); e.dataTransfer.effectAllowed = 'move'; }); item.addEventListener('dragend', () => { const taskListUl = item.closest('ul.task-list'); if (!taskListUl) return; item.classList.remove('dragging'); draggedItemElement = null; document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => { el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom'); }); const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { const newTaskOrderIds = Array.from(taskListUl.querySelectorAll('.task-item')).map(el => el.dataset.taskDefId); folder.tasks = newTaskOrderIds.map(id => folder.tasks.find(t => t.id === id)).filter(Boolean); saveUserFolders(userFoldersByCategoryId); } }); } else item.draggable = false; return item; }
function showDeleteConfirmation(type, id, message, nameForConfirmation = '', categoryId = null, folderId = null) { itemToDelete = { type, id, nameForConfirmation, categoryId, folderId }; if (domElements.deleteConfirmationModal) { if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message; if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)} Deletion`; domElements.deleteConfirmationModal.classList.remove('hidden'); domElements.confirmDeleteButton.focus(); } }
function confirmDeletion() { if (!itemToDelete) return; const { type, id, categoryId, folderId } = itemToDelete; if (type === 'task') { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'task') { folder.tasks = folder.tasks.filter(t => t.id !== id); saveUserFolders(userFoldersByCategoryId); for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(getTaskCompletionStorageKey(id, ''))) localStorage.removeItem(key); } Object.keys(currentTaskCompletionStatus).forEach(key => { if (key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX + id + "_")) delete currentTaskCompletionStatus[key]; }); renderCategoryTasks(categoryId); } } else if (type === 'category') { const category = currentCategories.find(c => c.id === id); if (category && category.deletable === false) { alert(`Category "${category.name}" is a default category and cannot be deleted.`); hideDeleteConfirmation(); return; } currentCategories = currentCategories.filter(cat => cat.id !== id); saveUserCategories(currentCategories); delete userFoldersByCategoryId[id]; saveUserFolders(userFoldersByCategoryId); const tabButton = document.getElementById(`tab-button-${id}`); if (tabButton) tabButton.remove(); const categorySection = document.getElementById(`category-section-${id}`); if (categorySection) categorySection.remove(); if (activeTabId === id) switchTab('dashboard'); } else if (type === 'folder') { const foldersInCat = userFoldersByCategoryId[categoryId]; if (foldersInCat) { const folderToDelete = foldersInCat.find(f => f.id === id); if (folderToDelete && folderToDelete.type === 'task') { folderToDelete.tasks.forEach(taskDef => { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(getTaskCompletionStorageKey(taskDef.id, ''))) localStorage.removeItem(key); } Object.keys(currentTaskCompletionStatus).forEach(key => { if (key.startsWith(STORAGE_KEY_TASK_COMPLETION_PREFIX + taskDef.id + "_")) delete currentTaskCompletionStatus[key]; }); }); } else if (folderToDelete && folderToDelete.type === 'notes') {} userFoldersByCategoryId[categoryId] = foldersInCat.filter(f => f.id !== id); saveUserFolders(userFoldersByCategoryId); renderCategoryTasks(categoryId); } } else if (type === 'noteItem') { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'notes') { folder.content = folder.content.filter(item => item.id !== id); saveUserFolders(userFoldersByCategoryId); renderNotesFolderContent(folder, categoryId, document.querySelector(`#category-section-${categoryId} .notes-folder-content-wrapper`)); } } updateAllProgress(); hideDeleteConfirmation(); }
function hideDeleteConfirmation() { if (domElements.deleteConfirmationModal) domElements.deleteConfirmationModal.classList.add('hidden'); itemToDelete = null; }
function renderCategoryTasks(categoryId) { const categorySection = document.getElementById(`category-section-${categoryId}`); if (!categorySection) return; const category = currentCategories.find(c => c.id === categoryId); if (!category) return; const categoryContentArea = categorySection.querySelector('.category-content-area'); const taskListUl = categorySection.querySelector('ul.task-list'); const notesFolderWrapper = categorySection.querySelector('.notes-folder-content-wrapper'); const addTaskFormTop = categorySection.querySelector('.add-task-form-top'); const addTaskFormBottom = categorySection.querySelector('.add-task-form-bottom'); const categoryHeader = categorySection.querySelector('.category-header'); const categoryTitleText = categoryHeader.querySelector('.category-title-text'); const categoryHeaderControls = categoryHeader.querySelector('.category-header-controls'); categoryContentArea.innerHTML = ''; taskListUl.innerHTML = ''; taskListUl.classList.add('hidden'); notesFolderWrapper.classList.add('hidden'); notesFolderWrapper.querySelector('.notes-content-display-area').innerHTML = ''; const activeFolder = userFoldersByCategoryId[categoryId]?.find(f => f.id === activeFolderIdForCategory[categoryId]); const isTaskFolderView = categoryViewMode[categoryId] === 'view_folder_content' && activeFolder?.type === 'task'; const isNotesFolderView = categoryViewMode[categoryId] === 'view_folder_content' && activeFolder?.type === 'notes'; [addTaskFormTop, addTaskFormBottom].forEach(form => form.style.display = (isTaskFolderView && editModes[categoryId]) ? 'block' : 'none'); if (categoryHeaderControls) { const editButton = categoryHeaderControls.querySelector('.edit-mode-toggle-button'); const undoButton = categoryHeaderControls.querySelector('.undo-category-button'); const saveNotesButton = notesFolderWrapper.querySelector('#save-notes-folder-button'); if (isTaskFolderView) { if(editButton) editButton.style.display = 'flex'; if(undoButton) undoButton.style.display = 'flex'; if(saveNotesButton) saveNotesButton.style.display = 'none'; } else if (isNotesFolderView) { if(editButton) editButton.style.display = 'none'; if(undoButton) undoButton.style.display = 'none'; } else { if(editButton) editButton.style.display = 'none'; if(undoButton) undoButton.style.display = 'none'; if(saveNotesButton) saveNotesButton.style.display = 'none'; } } let backButton = categoryHeader.querySelector('.back-to-folders-button'); if (categoryViewMode[categoryId] === 'view_folder_content') { if (!backButton) { const buttonTemplate = domElements.backToFoldersButtonTemplate.content.cloneNode(true); backButton = buttonTemplate.querySelector('.back-to-folders-button'); backButton.onclick = () => { categoryViewMode[categoryId] = 'list_folders'; activeFolderIdForCategory[categoryId] = null; if (activeAddTaskForm?.categoryId === categoryId) hideTempAddTaskForm(categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position); renderCategoryTasks(categoryId); }; categoryHeader.prepend(backButton); } backButton.style.display = 'flex'; categoryTitleText.textContent = activeFolder ? activeFolder.name : category.name; categoryHeader.classList.add('has-back-button');} else { if (backButton) backButton.style.display = 'none'; categoryTitleText.textContent = category.name; categoryHeader.classList.remove('has-back-button'); } const editModeButton = categoryHeader.querySelector('.edit-mode-toggle-button'); if (editModeButton) { editModeButton.classList.toggle('active-glow', !!editModes[categoryId]); editModeButton.setAttribute('aria-pressed', !!editModes[categoryId]); } if (categoryViewMode[categoryId] === 'list_folders') { const folders = (userFoldersByCategoryId[categoryId] || []).sort((a,b) => a.order - b.order); const folderDisplayContainer = document.createElement('div'); folderDisplayContainer.className = 'task-folders-grid'; if (folders.length > 0) folders.forEach(folder => folderDisplayContainer.appendChild(renderFolderBox(folder, categoryId))); const addNewFolderPlusButton = document.createElement('button'); addNewFolderPlusButton.className = 'add-new-folder-plus-button'; addNewFolderPlusButton.title = "Add a new folder to this category"; addNewFolderPlusButton.setAttribute('aria-label', "Add new folder"); addNewFolderPlusButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`; addNewFolderPlusButton.onclick = () => openAddFolderModal(categoryId); folderDisplayContainer.appendChild(addNewFolderPlusButton); categoryContentArea.appendChild(folderDisplayContainer); if (folders.length === 0) { const emptyMessage = document.createElement('p'); emptyMessage.className = 'empty-tasks-message'; emptyMessage.textContent = 'No folders yet. Click the "+" button to add one.'; categoryContentArea.appendChild(emptyMessage); } } else if (isTaskFolderView) { taskListUl.classList.remove('hidden'); if (activeFolder && activeFolder.tasks.length > 0) activeFolder.tasks.forEach(taskDef => taskListUl.appendChild(renderTaskItem(taskDef, categoryId, activeFolder.id))); else { const emptyMessage = document.createElement('p'); emptyMessage.className = 'empty-tasks-message'; emptyMessage.textContent = editModes[categoryId] ? 'This folder is empty. Click "Add Item" to create tasks.' : 'This folder is empty.'; if (editModes[categoryId]) emptyMessage.classList.add('edit-mode-empty'); taskListUl.appendChild(emptyMessage); } categoryContentArea.appendChild(taskListUl); } else if (isNotesFolderView) { notesFolderWrapper.classList.remove('hidden'); renderNotesFolderContent(activeFolder, categoryId, notesFolderWrapper); categoryContentArea.appendChild(notesFolderWrapper); } }
function renderFolderBox(folder, categoryId) { const wrapper = document.createElement('div'); wrapper.className = 'task-folder-box-wrapper'; wrapper.dataset.folderId = folder.id; wrapper.setAttribute('role', 'button'); wrapper.setAttribute('tabindex', '0'); wrapper.setAttribute('aria-label', `Open folder: ${folder.name}`); const squareBox = document.createElement('div'); squareBox.className = 'task-folder-square-box'; const symbolSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); symbolSvg.setAttribute('class', 'task-folder-symbol'); symbolSvg.setAttribute('viewBox', '0 0 24 24'); if (folder.type === 'notes') { squareBox.classList.add('notes-folder-icon-box'); wrapper.classList.add('notes-folder-label'); symbolSvg.innerHTML = `<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z"></path>`; } else symbolSvg.innerHTML = `<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/><path d="M7.035 14.854l-1.889-1.889-1.061 1.061 2.95 2.95 5.869-5.869-1.061-1.061z"/>`; squareBox.appendChild(symbolSvg); wrapper.appendChild(squareBox); const label = document.createElement('span'); label.className = 'task-folder-label-text'; label.textContent = folder.name; wrapper.appendChild(label); const optionsIcon = document.createElement('div'); optionsIcon.className = 'folder-options-icon entity-options-icon'; optionsIcon.innerHTML = `<span></span><span></span><span></span>`; optionsIcon.setAttribute('aria-label', `Options for folder ${folder.name}`); optionsIcon.setAttribute('role', 'button'); optionsIcon.tabIndex = 0; optionsIcon.onclick = (e) => { e.stopPropagation(); showFolderContextMenu(folder.id, categoryId, optionsIcon); }; optionsIcon.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showFolderContextMenu(folder.id, categoryId, optionsIcon); }}; wrapper.appendChild(optionsIcon); let folderLongPressTimer; wrapper.addEventListener('touchstart', (e) => { if (e.target === optionsIcon || optionsIcon.contains(e.target)) return; clearTimeout(folderLongPressTimer); optionsIcon.classList.remove('visible'); const touchMoveHandler = () => clearTimeout(folderLongPressTimer); wrapper.addEventListener('touchmove', touchMoveHandler, { once: true }); folderLongPressTimer = setTimeout(() => { optionsIcon.classList.add('visible'); wrapper.removeEventListener('touchmove', touchMoveHandler); }, LONG_PRESS_DURATION); }, {passive: true}); wrapper.addEventListener('touchend', () => clearTimeout(folderLongPressTimer)); wrapper.addEventListener('touchcancel', () => clearTimeout(folderLongPressTimer)); wrapper.onclick = (e) => { if (e.target === optionsIcon || optionsIcon.contains(e.target) || wrapper.querySelector('.folder-inline-rename-input')) return; categoryViewMode[categoryId] = 'view_folder_content'; activeFolderIdForCategory[categoryId] = folder.id; renderCategoryTasks(categoryId); }; wrapper.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && (e.target !== optionsIcon && !optionsIcon.contains(e.target)) && !wrapper.querySelector('.folder-inline-rename-input')) { e.preventDefault(); categoryViewMode[categoryId] = 'view_folder_content'; activeFolderIdForCategory[categoryId] = folder.id; renderCategoryTasks(categoryId); } }; return wrapper; }
function renderNotesFolderContent(folder, categoryId, notesFolderWrapperElement) { const displayArea = notesFolderWrapperElement.querySelector('.notes-content-display-area'); const controls = notesFolderWrapperElement.querySelector('.notes-editor-controls'); displayArea.innerHTML = ''; if (!folder.content || folder.content.length === 0) { const emptyMsg = document.createElement('p'); emptyMsg.className = 'empty-tasks-message'; emptyMsg.textContent = 'This notes folder is empty. Use the controls above to add content.'; displayArea.appendChild(emptyMsg); } else folder.content.forEach(item => displayArea.appendChild(renderNoteItem(item, folder.id, categoryId))); controls.querySelector('[data-action="add-text"]').onclick = () => addNoteItem(folder.id, categoryId, 'text'); controls.querySelector('[data-action="add-link"]').onclick = () => addNoteItem(folder.id, categoryId, 'link'); controls.querySelector('[data-action="add-image"]').onclick = () => addNoteItem(folder.id, categoryId, 'image'); controls.querySelector('#save-notes-folder-button').onclick = () => saveAllNotesInFolder(folder.id, categoryId); }
function renderNoteItem(item, folderId, categoryId, isEditing = false) { const template = domElements.noteItemTemplate.content.cloneNode(true); const noteItemElement = template.querySelector('.note-item'); noteItemElement.dataset.itemId = item.id; const contentDiv = noteItemElement.querySelector('.note-item-content'); if (isEditing) contentDiv.appendChild(createNoteItemEditForm(item, folderId, categoryId)); else { switch (item.type) { case 'text': const p = document.createElement('p'); p.textContent = item.value || ""; contentDiv.appendChild(p); break; case 'link': const a = document.createElement('a'); a.href = item.value.url; a.textContent = item.value.text || item.value.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; contentDiv.appendChild(a); break; case 'image': const img = document.createElement('img'); img.src = item.value.dataUrl; img.alt = item.value.alt || 'User image'; contentDiv.appendChild(img); break; } } noteItemElement.querySelector('.edit-note-item').onclick = (e) => { e.stopPropagation(); startNoteItemEdit(item.id, folderId, categoryId, noteItemElement); }; noteItemElement.querySelector('.delete-note-item').onclick = (e) => { e.stopPropagation(); showDeleteConfirmation('noteItem', item.id, `Delete this ${item.type} item?`, '', categoryId, folderId); }; noteItemElement.draggable = true; noteItemElement.addEventListener('dragstart', (e) => { if (noteItemElement.classList.contains('editing')) { e.preventDefault(); return; } draggedItemElement = noteItemElement; setTimeout(() => noteItemElement.classList.add('dragging'), 0); e.dataTransfer.effectAllowed = 'move'; }); noteItemElement.addEventListener('dragend', () => { const displayArea = noteItemElement.closest('.notes-content-display-area'); if (!displayArea) return; noteItemElement.classList.remove('dragging'); draggedItemElement = null; document.querySelectorAll('.drag-over-indicator-note, .drag-over-indicator-note-bottom').forEach(el => { el.classList.remove('drag-over-indicator-note', 'drag-over-indicator-note-bottom'); }); const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder && folder.type === 'notes') { const newOrderItemIds = Array.from(displayArea.querySelectorAll('.note-item')).map(el => el.dataset.itemId); folder.content = newOrderItemIds.map(id => folder.content.find(contentItem => contentItem.id === id)).filter(Boolean); saveUserFolders(userFoldersByCategoryId); } }); return noteItemElement; }
function addNoteItem(folderId, categoryId, type) { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (!folder || folder.type !== 'notes') return; let newItem; switch (type) { case 'text': newItem = { id: createUniqueId('noteitem'), type: 'text', value: "" }; break; case 'link': newItem = { id: createUniqueId('noteitem'), type: 'link', value: { url: "", text: "" } }; break; case 'image': newItem = { id: createUniqueId('noteitem'), type: 'image', value: { dataUrl: "", alt: "" } }; break; default: return; } folder.content.push(newItem); const displayArea = document.querySelector(`#category-section-${categoryId} .notes-content-display-area`); if (displayArea) { const newItemElement = renderNoteItem(newItem, folderId, categoryId, true); displayArea.appendChild(newItemElement); const inputToFocus = newItemElement.querySelector('textarea, input[type="url"], input[type="file"]'); if (inputToFocus) inputToFocus.focus(); } }
function startNoteItemEdit(itemId, folderId, categoryId, itemElement) { if (currentEditingNoteItem && currentEditingNoteItem.itemId !== itemId) { const prevFolder = userFoldersByCategoryId[currentEditingNoteItem.categoryId]?.find(f => f.id === currentEditingNoteItem.folderId); const prevItem = prevFolder?.content.find(it => it.id === currentEditingNoteItem.itemId); if (prevFolder && prevItem && currentEditingNoteItem.itemElement) { const newPrevItemElement = renderNoteItem(prevItem, currentEditingNoteItem.folderId, currentEditingNoteItem.categoryId, false); currentEditingNoteItem.itemElement.replaceWith(newPrevItemElement); } } currentEditingNoteItem = { itemId, folderId, categoryId, itemElement }; itemElement.classList.add('editing'); const contentDiv = itemElement.querySelector('.note-item-content'); const originalContent = contentDiv.innerHTML; contentDiv.innerHTML = ''; const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); const item = folder?.content.find(it => it.id === itemId); if (!item) return; contentDiv.appendChild(createNoteItemEditForm(item, folderId, categoryId, originalContent)); }
function createNoteItemEditForm(item, folderId, categoryId, originalDisplayHTML) { const formContainer = document.createElement('div'); formContainer.className = 'note-item-editing-form'; let templateId = ''; switch (item.type) { case 'text': templateId = 'note-item-edit-form-template-text'; break; case 'link': templateId = 'note-item-edit-form-template-link'; break; case 'image': templateId = 'note-item-edit-form-template-image'; break; } const formTemplate = document.getElementById(templateId).content.cloneNode(true); formContainer.appendChild(formTemplate); if (item.type === 'text') formContainer.querySelector('.note-edit-textarea').value = item.value || ""; else if (item.type === 'link') { formContainer.querySelector('.note-edit-link-url').value = item.value.url || ""; formContainer.querySelector('.note-edit-link-text').value = item.value.text || ""; } else if (item.type === 'image') { formContainer.querySelector('.note-edit-image-alt').value = item.value.alt || ""; const preview = formContainer.querySelector('.note-edit-image-preview'); if (item.value.dataUrl) { preview.src = item.value.dataUrl; preview.style.display = 'block'; } formContainer.querySelector('.note-edit-image-file').onchange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => { preview.src = re.target.result; preview.style.display = 'block'; }; reader.readAsDataURL(file); } }; } const actionsDiv = document.createElement('div'); actionsDiv.className = 'form-actions'; const saveBtn = document.createElement('button'); saveBtn.textContent = 'Save'; saveBtn.className = 'new-task-temp-save'; saveBtn.onclick = () => saveNoteItemEdit(item.id, folderId, categoryId, formContainer); const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel'; cancelBtn.className = 'new-task-temp-cancel'; cancelBtn.onclick = () => cancelNoteItemEdit(item, folderId, categoryId, originalDisplayHTML); actionsDiv.appendChild(saveBtn); actionsDiv.appendChild(cancelBtn); formContainer.appendChild(actionsDiv); return formContainer; }
function saveNoteItemEdit(itemId, folderId, categoryId, formContainerElement) { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); const item = folder?.content.find(it => it.id === itemId); if (!item) return; if (item.type === 'text') item.value = formContainerElement.querySelector('.note-edit-textarea').value; else if (item.type === 'link') { item.value.url = formContainerElement.querySelector('.note-edit-link-url').value; item.value.text = formContainerElement.querySelector('.note-edit-link-text').value; } else if (item.type === 'image') { item.value.alt = formContainerElement.querySelector('.note-edit-image-alt').value; const fileInput = formContainerElement.querySelector('.note-edit-image-file'); const previewSrc = formContainerElement.querySelector('.note-edit-image-preview').src; if (previewSrc && previewSrc !== '#' && (!fileInput.files[0] || previewSrc.startsWith('data:image'))) item.value.dataUrl = previewSrc; } const itemElement = currentEditingNoteItem?.itemElement; if (itemElement) { const newItemElement = renderNoteItem(item, folderId, categoryId, false); itemElement.replaceWith(newItemElement); itemElement.classList.remove('editing'); } currentEditingNoteItem = null; }
function cancelNoteItemEdit(item, folderId, categoryId, originalDisplayHTML) { const itemElement = currentEditingNoteItem?.itemElement; if (itemElement) { const isNewAndEmpty = (!originalDisplayHTML && !item.value && (item.type !== 'link' || (!item.value.url && !item.value.text)) && (item.type !== 'image' || (!item.value.dataUrl))); if (isNewAndEmpty) { const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if (folder) folder.content = folder.content.filter(i => i.id !== item.id); itemElement.remove(); } else { const newItemElement = renderNoteItem(item, folderId, categoryId, false); itemElement.replaceWith(newItemElement); itemElement.classList.remove('editing'); } } currentEditingNoteItem = null; }
function saveAllNotesInFolder(folderId, categoryId) { saveUserFolders(userFoldersByCategoryId); const saveButton = document.querySelector(`#category-section-${categoryId} #save-notes-folder-button`); if (saveButton) { const originalText = saveButton.innerHTML; saveButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg> Notes Saved!`; setTimeout(() => { saveButton.innerHTML = originalText; }, 2000); } const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId); if(folder) renderNotesFolderContent(folder, categoryId, document.querySelector(`#category-section-${categoryId} .notes-folder-content-wrapper`));}
function renderAllCategorySections() { if (!domElements.tabContentsContainer || !domElements.categorySectionTemplate) return; domElements.tabContentsContainer.querySelectorAll('.category-section:not(#dashboard-content)').forEach(sec => sec.remove()); currentCategories.forEach(category => { if (category.id === 'dashboard') return; const sectionClone = domElements.categorySectionTemplate.content.cloneNode(true); const sectionElement = sectionClone.querySelector('.category-section'); sectionElement.id = `category-section-${category.id}`; sectionElement.setAttribute('aria-labelledby', `tab-button-${category.id}`); if (activeTabId !== category.id) sectionElement.classList.add('hidden'); sectionElement.querySelector('.category-title-text').textContent = category.name; const editModeButton = sectionElement.querySelector('.edit-mode-toggle-button'); editModeButton.onclick = () => toggleCategoryEditMode(category.id); sectionElement.querySelector('.undo-category-button').onclick = () => { const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); const currentFolderId = activeFolderIdForCategory[category.id]; const folder = userFoldersByCategoryId[category.id]?.find(f => f.id === currentFolderId); if (folder && folder.type === 'task') { folder.tasks.forEach(taskDef => setTaskCompletionStatus(taskDef.id, today, false)); renderCategoryTasks(category.id); updateAllProgress(); } }; ['top', 'bottom'].forEach(position => { const formContainer = sectionElement.querySelector(position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom'); if (formContainer) { formContainer.querySelector('.add-item-trigger-button').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') showTempAddTaskForm(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-save').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') handleSaveTempTask(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-cancel').onclick = () => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (currentFolder && currentFolder.type === 'task') hideTempAddTaskForm(category.id, activeFolderIdForCategory[category.id], position); }; formContainer.querySelector('.new-task-temp-input').addEventListener('keypress', (e) => { const currentFolder = userFoldersByCategoryId[category.id]?.find(f => f.id === activeFolderIdForCategory[category.id]); if (e.key === 'Enter' && currentFolder && currentFolder.type === 'task') { e.preventDefault(); handleSaveTempTask(category.id, activeFolderIdForCategory[category.id], position); } }); } }); domElements.tabContentsContainer.appendChild(sectionElement); renderCategoryTasks(category.id); }); }
function clearLongPressTimer(tabButton) { if (longPressTimer) clearTimeout(longPressTimer); longPressTimer = null; if (tabButton) { tabButton.removeEventListener('touchmove', preventScrollDuringLongPress); tabButton.removeEventListener('touchend', () => clearLongPressTimer(tabButton)); tabButton.removeEventListener('touchcancel', () => clearLongPressTimer(tabButton)); } }
function preventScrollDuringLongPress(e) { clearTimeout(longPressTimer); }
function renderTabs() { if (!domElements.tabsContainer) return; domElements.tabsContainer.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove()); const addCatButton = domElements.addCategoryButton; currentCategories.sort((a, b) => a.order - b.order).forEach(category => { const tabButton = document.createElement('button'); tabButton.className = 'tab-button'; tabButton.id = `tab-button-${category.id}`; tabButton.dataset.categoryId = category.id; tabButton.textContent = category.name; tabButton.setAttribute('role', 'tab'); tabButton.setAttribute('aria-selected', activeTabId === category.id ? 'true' : 'false'); if (activeTabId === category.id) tabButton.classList.add('active'); const optionsIcon = document.createElement('div'); optionsIcon.className = 'tab-options-icon entity-options-icon'; optionsIcon.innerHTML = `<span></span><span></span><span></span>`; optionsIcon.setAttribute('aria-label', `Options for ${category.name}`); optionsIcon.setAttribute('role', 'button'); optionsIcon.tabIndex = 0; tabButton.appendChild(optionsIcon); optionsIcon.addEventListener('click', (e) => { e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); }); optionsIcon.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') {e.preventDefault();e.stopPropagation();showCategoryContextMenu(category.id,tabButton);}}); tabButton.addEventListener('touchstart', (e) => { clearLongPressTimer(tabButton); tabButton.addEventListener('touchmove', preventScrollDuringLongPress); longPressTimer = setTimeout(() => { e.preventDefault(); optionsIcon.classList.add('visible'); showCategoryContextMenu(category.id, tabButton); clearLongPressTimer(tabButton); }, LONG_PRESS_DURATION); tabButton.addEventListener('touchend', () => clearLongPressTimer(tabButton)); tabButton.addEventListener('touchcancel', () => clearLongPressTimer(tabButton)); }); tabButton.addEventListener('click', (e) => { if (e.target === tabButton && !optionsIcon.contains(e.target)) { tabButton.classList.add('show-badge-highlight'); setTimeout(() => tabButton.classList.remove('show-badge-highlight'), 300); } switchTab(category.id) }); domElements.tabsContainer.insertBefore(tabButton, addCatButton); }); updateCategoryTabIndicators(); }
function switchTab(categoryIdToActivate) { activeTabId = categoryIdToActivate; hideCategoryContextMenu(); hideFolderContextMenu(); domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => { const isCurrent = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button'); button.classList.toggle('active', isCurrent); button.setAttribute('aria-selected', isCurrent.toString()); }); if (domElements.tabContentsContainer) domElements.tabContentsContainer.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard'); domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => { const isCurrent = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content'); section.classList.toggle('hidden', !isCurrent); }); if (activeTabId !== 'dashboard') renderCategoryTasks(activeTabId); if (activeAddTaskForm) hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position); currentEditingNoteItem = null; }
function calculateProgress() { let completedCount = 0; let totalTasks = 0; const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { const foldersInCat = userFoldersByCategoryId[category.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { totalTasks++; if (getTaskCompletionStatus(taskDef.id, today)) completedCount++; }); } }); }); const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0; const pointsPerTask = totalTasks > 0 ? DAILY_TARGET_POINTS / totalTasks : 0; const pointsEarned = Math.round(completedCount * pointsPerTask); return { percentage, pointsEarned, completedCount, totalTasks }; }
function updateDashboardSummaries() { if (!domElements.dashboardSummariesContainer) return; domElements.dashboardSummariesContainer.innerHTML = ''; const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { if (category.id === 'dashboard') return; let categoryTotalTasks = 0; let categoryCompletedTasks = 0; const foldersInCat = userFoldersByCategoryId[category.id] || []; foldersInCat.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { categoryTotalTasks++; if (getTaskCompletionStatus(taskDef.id, today)) categoryCompletedTasks++; }); } }); if (foldersInCat.some(f => f.type === 'task')) { const summaryDiv = document.createElement('div'); summaryDiv.className = 'dashboard-category-summary'; summaryDiv.innerHTML = `<h3>${category.name}</h3> <p class="category-stats">${categoryCompletedTasks} / ${categoryTotalTasks}</p>`; const statsP = summaryDiv.querySelector('.category-stats'); if (categoryTotalTasks > 0 && categoryCompletedTasks === categoryTotalTasks) statsP.classList.add('fully-completed'); else statsP.classList.remove('fully-completed'); domElements.dashboardSummariesContainer.appendChild(summaryDiv); } }); }
function updateTodaysProgress() { const progress = calculateProgress(); if (domElements.todayProgressFill) { domElements.todayProgressFill.style.width = `${progress.percentage}%`; domElements.todayProgressFill.style.backgroundColor = getProgressFillColor(progress.percentage); domElements.todayProgressFill.textContent = `${progress.percentage}%`; domElements.todayProgressFill.setAttribute('aria-valuenow', progress.percentage.toString()); } if (domElements.todayPointsStat) domElements.todayPointsStat.textContent = `${progress.pointsEarned} / ${DAILY_TARGET_POINTS} points`; }

function updateCurrentWeekProgress() {
    let targetWeeklyPoints = TARGET_POINTS_FOR_WEEKLY_VIEW;
    let weekStartDate;
    const todayNorm = getNormalizedDate(new Date());

    if (currentProgressPlan) {
        targetWeeklyPoints = currentProgressPlan.targetWeeklyPoints || TARGET_POINTS_FOR_WEEKLY_VIEW;
        const planStartDateNorm = getNormalizedDate(new Date(currentProgressPlan.startDate + 'T00:00:00')); // Ensure time is zeroed
        const planStartDay = parseInt(currentProgressPlan.startDayOfWeek, 10);

        let currentPotentialWeekStart = new Date(todayNorm);
        while (currentPotentialWeekStart.getDay() !== planStartDay) {
            currentPotentialWeekStart.setDate(currentPotentialWeekStart.getDate() - 1);
        }
        weekStartDate = getNormalizedDate(currentPotentialWeekStart);
        
        // If the calculated week's start is before the plan's absolute start, adjust.
        if (weekStartDate < planStartDateNorm) {
            weekStartDate = planStartDateNorm;
        }

    } else {
        // Default behavior if no plan: use localStorage or calculate based on today (Monday start).
        let storedWeekStartDateString = localStorage.getItem(STORAGE_KEY_CURRENT_WEEK_START_DATE);
        weekStartDate = new Date(todayNorm); // Start with today
        // Default to Monday as start of week if no plan
        const dayOfWeek = todayNorm.getDay(); // Sunday is 0, Monday is 1
        const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStartDate.setDate(todayNorm.getDate() - offsetToMonday);
        weekStartDate = getNormalizedDate(weekStartDate);

        if (storedWeekStartDateString) {
            const storedDate = getNormalizedDate(new Date(storedWeekStartDateString));
            // If today is within the week of the stored start date, use it. Otherwise, recalculate.
            const diffDays = (todayNorm.getTime() - storedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays < 7) {
                 weekStartDate = storedDate;
            } else {
                 localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, weekStartDate.toISOString().split('T')[0]);
            }
        } else {
             localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, weekStartDate.toISOString().split('T')[0]);
        }
    }
    
    let totalPointsThisWeekCycle = 0;
    let currentDateIter = new Date(weekStartDate);
    const todayDateString = getTodayDateString();

    while (getNormalizedDate(currentDateIter) <= todayNorm) {
        const dateStringForIter = `${currentDateIter.getFullYear()}-${(currentDateIter.getMonth() + 1).toString().padStart(2, '0')}-${currentDateIter.getDate().toString().padStart(2, '0')}`;
        let pointsForDay = 0;
        if (dateStringForIter === todayDateString) {
            pointsForDay = calculateProgress().pointsEarned;
        } else {
            const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter);
            if (historyDataString) {
                try { pointsForDay = JSON.parse(historyDataString).pointsEarned || 0; } catch (e) { console.warn("Error parsing history for weekly progress:", e); }
            }
        }
        totalPointsThisWeekCycle += pointsForDay;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }
    const weeklyCyclePercentage = targetWeeklyPoints > 0 ? Math.min(100, Math.round((totalPointsThisWeekCycle / targetWeeklyPoints) * 100)) : 0;

    if (domElements.currentWeekProgressFill) {
        domElements.currentWeekProgressFill.style.width = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.style.backgroundColor = getProgressFillColor(weeklyCyclePercentage);
        domElements.currentWeekProgressFill.textContent = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.setAttribute('aria-valuenow', weeklyCyclePercentage.toString());
    }
    if (domElements.currentWeekPointsStat) domElements.currentWeekPointsStat.textContent = `${totalPointsThisWeekCycle} / ${targetWeeklyPoints} points`;
    displayCurrentPlanNameOnDashboard();
}


function displayCurrentPlanNameOnDashboard() {
    if (domElements.currentWeeklyPlanNameDisplay) {
        if (currentProgressPlan && currentProgressPlan.name) {
            domElements.currentWeeklyPlanNameDisplay.textContent = `${currentProgressPlan.name} (Weekly)`;
        } else {
            domElements.currentWeeklyPlanNameDisplay.textContent = "Weekly Progress";
        }
    }
}

function renderCalendar() { if (!domElements.calendarGrid || !domElements.calendarMonthYear) return; domElements.calendarGrid.innerHTML = ''; domElements.calendarMonthYear.textContent = `${calendarDisplayDate.toLocaleString('default', { month: 'long' })} ${calendarDisplayDate.getFullYear()}`; const month = calendarDisplayDate.getMonth(), year = calendarDisplayDate.getFullYear(); const firstDayOfMonth = new Date(year, month, 1), daysInMonth = new Date(year, month + 1, 0).getDate(); const startingDayOfWeek = firstDayOfMonth.getDay(); const todayNorm = getNormalizedDate(new Date()), todayDateString = getTodayDateString(); ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dayName => { const dayHeader = document.createElement('div'); dayHeader.className = 'calendar-day-header'; dayHeader.textContent = dayName; domElements.calendarGrid.appendChild(dayHeader); }); for (let i = 0; i < startingDayOfWeek; i++) { const emptyCell = document.createElement('div'); emptyCell.className = 'calendar-day-cell empty'; domElements.calendarGrid.appendChild(emptyCell); } for (let day = 1; day <= daysInMonth; day++) { const cellDate = getNormalizedDate(new Date(year, month, day)); const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; const cell = document.createElement('div'); cell.className = 'calendar-day-cell'; cell.dataset.date = dateString; const dayNumber = document.createElement('span'); dayNumber.className = 'calendar-day-number'; dayNumber.textContent = day.toString(); cell.appendChild(dayNumber); const fillDiv = document.createElement('div'); fillDiv.className = 'calendar-day-fill'; cell.appendChild(fillDiv); let percentageCompleted = 0, hasHistoryData = false; fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.1)'; if (dateString === todayDateString) { cell.classList.add('current-day'); percentageCompleted = calculateProgress().percentage; fillDiv.style.backgroundColor = 'hsl(185, 100%, 45%)'; if (percentageCompleted > 40) cell.classList.add('high-fill'); hasHistoryData = (calculateProgress().completedCount > 0) || !!localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString); } else { const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString); if (historyDataString) try { const historyEntry = JSON.parse(historyDataString); percentageCompleted = historyEntry.percentageCompleted || 0; if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.7)'; hasHistoryData = (historyEntry.completedTasks && Object.values(historyEntry.completedTasks).some(arr=>arr.length>0)) || !!historyEntry.userNote; } catch(e) { if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; } else if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)'; if (cellDate < todayNorm) cell.classList.add('calendar-day-past'); } if (hasHistoryData) cell.classList.add('has-history'); fillDiv.style.height = `${percentageCompleted}%`; cell.addEventListener('click', () => showHistoryModal(dateString)); domElements.calendarGrid.appendChild(cell); } }
function showHistoryModal(dateString) { currentModalDate = dateString; if (!domElements.historyModal) return; const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString); let historyEntry = null; const isToday = dateString === getTodayDateString(); const isPastDay = new Date(dateString + 'T23:59:59') < getNormalizedDate(new Date()) && !isToday; if (isToday) { const progress = calculateProgress(); const completedTasksTodayFlat = []; currentCategories.forEach(cat => { const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, dateString)) completedTasksTodayFlat.push(taskDef.text); }); }); }); const completedTasksTodayGrouped = {}; currentCategories.forEach(cat => { completedTasksTodayGrouped[cat.id] = []; const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, dateString)) completedTasksTodayGrouped[cat.id].push(taskDef.text); }); }); }); const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) || (domElements.dailyNoteInput ? domElements.dailyNoteInput.value : ""); historyEntry = { date: dateString, completedTasks: completedTasksTodayGrouped, userNote: note, pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentage, totalTasksOnDate: progress.totalTasks, dailyTargetPoints: DAILY_TARGET_POINTS }; } else if (historyDataString) try { historyEntry = JSON.parse(historyDataString); } catch (e) {} domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); if (historyEntry) { const targetPoints = historyEntry.dailyTargetPoints || DAILY_TARGET_POINTS; domElements.historyModalPointsValue.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A'; domElements.historyModalPointsTotal.textContent = targetPoints.toString(); const completionPercentage = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted : 0; domElements.historyPercentageProgressFill.style.width = `${completionPercentage}%`; domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(completionPercentage); domElements.historyPercentageProgressFill.textContent = `${completionPercentage}%`; domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', completionPercentage); domElements.historyTasksList.innerHTML = ''; let hasCompletedTasks = false; if (historyEntry.completedTasks) { Object.keys(historyEntry.completedTasks).forEach(catId => { const tasksInCategory = historyEntry.completedTasks[catId]; if (tasksInCategory && tasksInCategory.length > 0) { hasCompletedTasks = true; const catGroup = document.createElement('div'); catGroup.className = 'history-category-group'; const catTitle = document.createElement('h5'); catTitle.className = 'history-category-title'; catTitle.textContent = getCategoryNameById(catId); catGroup.appendChild(catTitle); const ul = document.createElement('ul'); tasksInCategory.forEach(taskText => { const li = document.createElement('li'); const span = document.createElement('span'); span.textContent = taskText; li.appendChild(span); ul.appendChild(li); }); catGroup.appendChild(ul); domElements.historyTasksList.appendChild(catGroup); } }); } if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>'; domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks); domElements.historyUserNoteDisplay.textContent = historyEntry.userNote || "No reflection recorded for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.value = historyEntry.userNote || ""; domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = ''; domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote); if (isPastDay || isToday) domElements.historyUserNoteDisplay.ondblclick = () => { domElements.historyUserNoteDisplay.classList.add('hidden'); domElements.historyUserNoteEdit.classList.remove('hidden'); domElements.historicalNoteControls.classList.remove('hidden'); domElements.historyUserNoteEdit.focus(); }; else domElements.historyUserNoteDisplay.ondblclick = null; } else { domElements.historyModalPointsValue.textContent = 'N/A'; domElements.historyModalPointsTotal.textContent = DAILY_TARGET_POINTS.toString(); domElements.historyPercentageProgressFill.style.width = `0%`; domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(0); domElements.historyPercentageProgressFill.textContent = `0%`; domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', 0); domElements.historyTasksList.innerHTML = '<p>No data available for this day.</p>'; domElements.historyUserNoteDisplay.textContent = "No data available for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = ''; domElements.expandTasksButton.classList.add('hidden'); domElements.expandReflectionButton.classList.add('hidden'); domElements.historyUserNoteDisplay.ondblclick = null; } domElements.historyModal.classList.remove('hidden'); }
function closeHistoryModal() { if (domElements.historyModal) domElements.historyModal.classList.add('hidden'); currentModalDate = null; }
function saveHistoricalNote() { if (!currentModalDate || !domElements.historyUserNoteEdit) return; const noteContent = domElements.historyUserNoteEdit.value; const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate; let historyEntry; const isToday = currentModalDate === getTodayDateString(); const existingHistoryStr = localStorage.getItem(historyKey); if (existingHistoryStr) historyEntry = JSON.parse(existingHistoryStr); else { const progress = isToday ? calculateProgress() : { pointsEarned: 0, percentageCompleted: 0, totalTasks: 0 }; const completedTasksForEntry = {}; if(isToday) currentCategories.forEach(cat => { completedTasksForEntry[cat.id] = []; const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, currentModalDate)) completedTasksForEntry[cat.id].push(taskDef.text); }); }); }); else currentCategories.forEach(cat => completedTasksForEntry[cat.id] = []); historyEntry = { date: currentModalDate, completedTasks: completedTasksForEntry, userNote: "", pointsEarned: progress.pointsEarned, percentageCompleted: progress.percentageCompleted, totalTasksOnDate: progress.totalTasks, dailyTargetPoints: DAILY_TARGET_POINTS }; } historyEntry.userNote = noteContent; localStorage.setItem(historyKey, JSON.stringify(historyEntry)); if (isToday && domElements.dailyNoteInput) { domElements.dailyNoteInput.value = noteContent; localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent); } domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day."; domElements.historyUserNoteDisplay.classList.remove('hidden'); domElements.historyUserNoteEdit.classList.add('hidden'); domElements.historicalNoteControls.classList.add('hidden'); domElements.historicalNoteStatus.textContent = 'Reflection saved!'; setTimeout(() => { domElements.historicalNoteStatus.textContent = ''; }, 2000); domElements.expandReflectionButton.classList.toggle('hidden', !noteContent); renderCalendar(); }
function clearHistoricalNote() { if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.value = "";}
function populateMonthYearPicker() { if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return; domElements.pickerMonthsGrid.innerHTML = ''; ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].forEach((month, index) => { const btn = document.createElement('button'); btn.className = 'month-option'; btn.textContent = month; btn.dataset.month = index.toString(); if (index === pickerSelectedMonth) btn.classList.add('selected'); btn.onclick = () => { pickerSelectedMonth = index; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); }; domElements.pickerMonthsGrid.appendChild(btn); }); domElements.pickerYearsList.innerHTML = ''; let yearToScrollTo = null; for (let year = 2000; year <= 2100; year++) { const btn = document.createElement('button'); btn.className = 'year-option'; btn.textContent = year.toString(); btn.dataset.year = year.toString(); if (year === pickerSelectedYear) { btn.classList.add('selected'); yearToScrollTo = btn; } btn.onclick = () => { pickerSelectedYear = year; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); }; domElements.pickerYearsList.appendChild(btn); } if (yearToScrollTo) yearToScrollTo.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
function toggleMonthYearPicker() { isMonthYearPickerOpen = !isMonthYearPickerOpen; if (isMonthYearPickerOpen) { pickerSelectedMonth = calendarDisplayDate.getMonth(); pickerSelectedYear = calendarDisplayDate.getFullYear(); populateMonthYearPicker(); domElements.monthYearPickerModal.classList.remove('hidden'); } else domElements.monthYearPickerModal.classList.add('hidden'); }
function closeMonthYearPicker() { isMonthYearPickerOpen = false; domElements.monthYearPickerModal.classList.add('hidden');}
function updateCategoryTabIndicators() { const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString(); currentCategories.forEach(category => { const tabButton = document.getElementById(`tab-button-${category.id}`); if (!tabButton) return; const existingBadge = tabButton.querySelector('.notification-badge'); if (existingBadge) existingBadge.remove(); tabButton.classList.remove('category-complete-indicator'); let totalTasksInCat = 0, completedTasksInCat = 0; const folders = userFoldersByCategoryId[category.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) { folder.tasks.forEach(taskDef => { totalTasksInCat++; if (getTaskCompletionStatus(taskDef.id, today)) completedTasksInCat++; }); } }); if (totalTasksInCat === 0) return; if (completedTasksInCat === totalTasksInCat) tabButton.classList.add('category-complete-indicator'); else if (totalTasksInCat - completedTasksInCat > 0) { const badge = document.createElement('span'); badge.className = 'notification-badge'; badge.textContent = (totalTasksInCat - completedTasksInCat).toString(); tabButton.appendChild(badge); } }); }
function updateAllProgress() { updateDashboardSummaries(); updateTodaysProgress(); updateCurrentWeekProgress(); updateCategoryTabIndicators(); renderCalendar(); displayCurrentPlanNameOnDashboard();}
function openFullscreenContentModal(type, date) { if (!domElements.fullscreenContentModal) return; const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + date); let historyEntry = null; const isToday = date === getTodayDateString(); if (isToday) { const progress = calculateProgress(); const completedTasksTodayGrouped = {}; currentCategories.forEach(cat => { completedTasksTodayGrouped[cat.id] = []; const folders = userFoldersByCategoryId[cat.id] || []; folders.forEach(folder => { if (folder.type === 'task' && folder.tasks) folder.tasks.forEach(taskDef => { if(getTaskCompletionStatus(taskDef.id, date)) completedTasksTodayGrouped[cat.id].push(taskDef.text); }); }); }); const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + date) || (domElements.dailyNoteInput ? domElements.dailyNoteInput.value : ""); historyEntry = { completedTasks: completedTasksTodayGrouped, userNote: note }; } else if (historyDataString) try { historyEntry = JSON.parse(historyDataString); } catch (e) {} if (!historyEntry) { domElements.fullscreenModalArea.innerHTML = '<p>No content available.</p>'; domElements.fullscreenContentModal.classList.remove('hidden'); return; } const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); domElements.fullscreenModalArea.innerHTML = ''; if (type === 'tasks') { domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`; let hasContent = false; if (historyEntry.completedTasks) Object.keys(historyEntry.completedTasks).forEach(catId => { const tasksInCategory = historyEntry.completedTasks[catId]; if (tasksInCategory && tasksInCategory.length > 0) { hasContent = true; const catGroup = document.createElement('div'); catGroup.className = 'history-category-group'; const catTitle = document.createElement('h4'); catTitle.className = 'history-category-title'; catTitle.textContent = getCategoryNameById(catId); catGroup.appendChild(catTitle); const ul = document.createElement('ul'); tasksInCategory.forEach(taskText => { const li = document.createElement('li'); const span = document.createElement('span'); span.textContent = taskText; li.appendChild(span); ul.appendChild(li); }); catGroup.appendChild(ul); domElements.fullscreenModalArea.appendChild(catGroup); } }); if (!hasContent) domElements.fullscreenModalArea.innerHTML = '<p>No tasks were completed.</p>'; } else if (type === 'reflection') { domElements.fullscreenModalTitle.textContent = `Reflection for ${formattedDate}`; if (historyEntry.userNote) { const pre = document.createElement('pre'); pre.textContent = historyEntry.userNote; domElements.fullscreenModalArea.appendChild(pre); } else domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded.</p>'; } currentFullscreenContent = { type, date }; domElements.fullscreenContentModal.classList.remove('hidden'); }
function closeFullscreenContentModal() {
    if (domElements.fullscreenContentModal) domElements.fullscreenContentModal.classList.add('hidden');
    currentFullscreenContent = null;
}

function showCategoryContextMenu(categoryId, tabButton) {
    hideFolderContextMenu(); // Hide folder menu if open
    currentContextMenuTargetTab = tabButton;
    const rect = tabButton.getBoundingClientRect();
    const appRect = domElements.appContainer.getBoundingClientRect();
    domElements.categoryTabContextMenu.style.top = `${rect.bottom - appRect.top}px`;
    domElements.categoryTabContextMenu.style.left = `${rect.left - appRect.left}px`;
    domElements.categoryTabContextMenu.classList.remove('hidden');
    domElements.ctxRenameCategoryButton.focus();
    // Disable delete for default categories
    const category = currentCategories.find(c => c.id === categoryId);
    domElements.ctxDeleteCategoryButton.disabled = (category && category.deletable === false);

    // Make options icon visible while menu is open
    const optionsIcon = tabButton.querySelector('.entity-options-icon');
    if (optionsIcon) optionsIcon.classList.add('visible');
}
function hideCategoryContextMenu() {
    if (currentContextMenuTargetTab) {
        const optionsIcon = currentContextMenuTargetTab.querySelector('.entity-options-icon');
        if (optionsIcon) optionsIcon.classList.remove('visible');
    }
    currentContextMenuTargetTab = null;
    if (domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.classList.add('hidden');
}
function renameCategory(categoryId) {
    const category = currentCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    const newName = prompt(`Rename category "${category.name}":`, category.name);
    if (newName && newName.trim() !== "" && newName.trim() !== category.name) {
        category.name = newName.trim();
        saveUserCategories(currentCategories);
        renderTabs();
        renderAllCategorySections(); // To update titles in sections if displayed
        if (activeTabId === categoryId) { // If renaming active tab, update its section title directly if it's visible
            const sectionTitle = document.querySelector(`#category-section-${categoryId} .category-title-text`);
            if (sectionTitle) sectionTitle.textContent = category.name;
        }
    }
}
function showFolderContextMenu(folderId, categoryId, iconElement) {
    hideCategoryContextMenu(); // Hide category menu if open
    currentFolderOptionsMenu.element = iconElement;
    currentFolderOptionsMenu.folderId = folderId;
    currentFolderOptionsMenu.categoryId = categoryId;

    const rect = iconElement.getBoundingClientRect();
    const appRect = domElements.appContainer.getBoundingClientRect();
    domElements.folderOptionsContextMenu.style.top = `${rect.bottom - appRect.top + 5}px`; // Add small offset
    domElements.folderOptionsContextMenu.style.left = `${rect.left - appRect.left - domElements.folderOptionsContextMenu.offsetWidth + rect.width}px`; // Align to right of icon
    domElements.folderOptionsContextMenu.classList.remove('hidden');
    domElements.ctxRenameFolderButton.focus();

    iconElement.classList.add('visible'); // Keep icon visible
}
function hideFolderContextMenu() {
    if (currentFolderOptionsMenu.element) {
        currentFolderOptionsMenu.element.classList.remove('visible');
    }
    currentFolderOptionsMenu = { element: null, folderId: null, categoryId: null };
    if (domElements.folderOptionsContextMenu) domElements.folderOptionsContextMenu.classList.add('hidden');
}
function startFolderRename(folderId, categoryId, wrapperElement) {
    const label = wrapperElement.querySelector('.task-folder-label-text');
    const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId);
    if (!label || !folder) return;

    label.style.display = 'none';
    let input = wrapperElement.querySelector('.folder-inline-rename-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'folder-inline-rename-input';
        wrapperElement.appendChild(input); // Append directly to wrapper, after label if label was visible
    }
    input.value = folder.name;
    input.style.display = 'block';
    input.focus();
    input.select();

    const finishRenameHandler = (event) => {
        if (event.type === 'keypress' && event.key !== 'Enter') return;
        if (event.type === 'blur' && wrapperElement.contains(document.activeElement) && document.activeElement !== input) return;
        finishFolderRename(folderId, categoryId, wrapperElement, input);
        cleanup();
    };
    const cancelRenameHandler = (event) => {
        if (event.key === 'Escape') {
            cancelFolderRename(folderId, categoryId, wrapperElement, input);
            cleanup();
        }
    };
    const cleanup = () => {
        input.removeEventListener('blur', finishRenameHandler);
        input.removeEventListener('keypress', finishRenameHandler);
        document.removeEventListener('keydown', cancelRenameHandler, true);
    };

    input.addEventListener('blur', finishRenameHandler);
    input.addEventListener('keypress', finishRenameHandler);
    document.addEventListener('keydown', cancelRenameHandler, true); // Use capture to catch Escape early
}
function finishFolderRename(folderId, categoryId, wrapperElement, inputElement) {
    const newName = inputElement.value.trim();
    const folder = userFoldersByCategoryId[categoryId]?.find(f => f.id === folderId);
    const label = wrapperElement.querySelector('.task-folder-label-text');

    if (folder && newName) {
        folder.name = newName;
        saveUserFolders(userFoldersByCategoryId);
        if (label) label.textContent = newName;
         // If this folder is currently active, update its title in the category header
        if (activeFolderIdForCategory[categoryId] === folderId && categoryViewMode[categoryId] === 'view_folder_content') {
            const categoryHeaderTitle = document.querySelector(`#category-section-${categoryId} .category-header .category-title-text`);
            if (categoryHeaderTitle) categoryHeaderTitle.textContent = newName;
        }
    }
    inputElement.style.display = 'none';
    if (label) label.style.display = 'block';
}
function cancelFolderRename(folderId, categoryId, wrapperElement, inputElement) {
    const label = wrapperElement.querySelector('.task-folder-label-text');
    inputElement.style.display = 'none';
    if(label) label.style.display = 'block';
}

function openAddFolderModal(categoryId) {
    resetAddFolderModal();
    domElements.addFolderModal.dataset.categoryId = categoryId;
    domElements.addFolderModal.classList.remove('hidden');
    domElements.selectTaskFolderTypeButton.focus();
}
function closeAddFolderModal() {
    domElements.addFolderModal.classList.add('hidden');
    delete domElements.addFolderModal.dataset.categoryId;
}
function resetAddFolderModal() {
    domElements.addFolderStep1.classList.remove('hidden');
    domElements.addFolderStep2.classList.add('hidden');
    domElements.newFolderNameInput.value = '';
    [domElements.selectTaskFolderTypeButton, domElements.selectNotesFolderTypeButton].forEach(btn => btn.classList.remove('selected-type'));
}
function handleFolderTypeSelection(type, categoryId) {
    domElements.addFolderStep1.classList.add('hidden');
    domElements.addFolderStep2.classList.remove('hidden');
    domElements.selectedFolderTypeNameSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    domElements.addFolderModal.dataset.selectedType = type;
    domElements.newFolderNameInput.focus();
}
function handleCreateFolder(categoryId) {
    const folderName = domElements.newFolderNameInput.value.trim();
    const folderType = domElements.addFolderModal.dataset.selectedType;
    if (!folderName) { alert("Please enter a folder name."); return; }
    if (!folderType) { alert("Folder type not selected. Please go back."); return; }

    const newFolder = {
        id: createUniqueId('folder'),
        name: folderName,
        type: folderType,
        order: (userFoldersByCategoryId[categoryId] || []).length,
    };
    if (folderType === 'task') newFolder.tasks = [];
    else if (folderType === 'notes') newFolder.content = [];

    if (!userFoldersByCategoryId[categoryId]) userFoldersByCategoryId[categoryId] = [];
    userFoldersByCategoryId[categoryId].push(newFolder);
    saveUserFolders(userFoldersByCategoryId);
    renderCategoryTasks(categoryId); // Re-render the current category to show the new folder
    closeAddFolderModal();
}

// Progress System UI Functions
function switchProgressSystemTab(tabToActivate) {
    if (tabToActivate === 'setup') {
        domElements.progressTabSetup.classList.add('active');
        domElements.progressTabSetup.setAttribute('aria-selected', 'true');
        domElements.progressTabHistory.classList.remove('active');
        domElements.progressTabHistory.setAttribute('aria-selected', 'false');
        domElements.progressSetupContent.classList.remove('hidden');
        domElements.progressHistoryContent.classList.add('hidden');
        renderProgressSetupForm();
    } else { // history
        domElements.progressTabHistory.classList.add('active');
        domElements.progressTabHistory.setAttribute('aria-selected', 'true');
        domElements.progressTabSetup.classList.remove('active');
        domElements.progressTabSetup.setAttribute('aria-selected', 'false');
        domElements.progressHistoryContent.classList.remove('hidden');
        domElements.progressSetupContent.classList.add('hidden');
        renderProgressHistory();
    }
}

function renderProgressSetupForm() {
    if (currentProgressPlan) {
        domElements.progressPlanNameInput.value = currentProgressPlan.name || '';
        domElements.progressStartDateInput.value = currentProgressPlan.startDate || '';
        domElements.progressStartDaySelect.value = currentProgressPlan.startDayOfWeek !== undefined ? currentProgressPlan.startDayOfWeek.toString() : '1'; // Default Monday
        domElements.progressTargetWeeklyPointsInput.value = currentProgressPlan.targetWeeklyPoints || '';
        domElements.endCurrentPlanButton.classList.remove('hidden');
        renderActivePlanSummary();
        domElements.activePlanSummary.classList.remove('hidden');
        domElements.saveProgressPlanButton.textContent = 'Update Plan';
    } else {
        domElements.progressPlanNameInput.value = '';
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const todayLocal = new Date(today.getTime() - (offset*60*1000));
        domElements.progressStartDateInput.value = todayLocal.toISOString().split('T')[0];
        domElements.progressStartDaySelect.value = '1'; // Default Monday
        domElements.progressTargetWeeklyPointsInput.value = TARGET_POINTS_FOR_WEEKLY_VIEW.toString();
        domElements.endCurrentPlanButton.classList.add('hidden');
        domElements.activePlanSummary.classList.add('hidden');
        domElements.saveProgressPlanButton.textContent = 'Start New Plan';
    }
}

function renderActivePlanSummary() {
    if (currentProgressPlan) {
        domElements.activePlanNameDisplay.textContent = currentProgressPlan.name || 'N/A';
        domElements.activePlanStartDateDisplay.textContent = currentProgressPlan.startDate ? new Date(currentProgressPlan.startDate + 'T00:00:00').toLocaleDateString() : 'N/A';
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        domElements.activePlanStartDayDisplay.textContent = currentProgressPlan.startDayOfWeek !== undefined ? dayNames[currentProgressPlan.startDayOfWeek] : 'N/A';
        domElements.activePlanTargetPointsDisplay.textContent = currentProgressPlan.targetWeeklyPoints ? `${currentProgressPlan.targetWeeklyPoints} points` : 'N/A';
    }
}

function handleSaveProgressPlan(event) {
    event.preventDefault();
    const planName = domElements.progressPlanNameInput.value.trim();
    const startDate = domElements.progressStartDateInput.value;
    const startDayOfWeek = parseInt(domElements.progressStartDaySelect.value, 10);
    const targetWeeklyPoints = parseInt(domElements.progressTargetWeeklyPointsInput.value, 10);

    if (!planName) { alert('Please enter a plan name.'); return; }
    if (!startDate) { alert('Please select a start date.'); return; }
    if (isNaN(targetWeeklyPoints) || targetWeeklyPoints <= 0) { alert('Please enter a valid target weekly points value (greater than 0).'); return; }

    currentProgressPlan = {
        name: planName,
        startDate: startDate,
        startDayOfWeek: startDayOfWeek,
        targetWeeklyPoints: targetWeeklyPoints,
    };
    TARGET_POINTS_FOR_WEEKLY_VIEW = targetWeeklyPoints; // Update global for weekly view
    saveProgressData();
    renderProgressSetupForm(); // Re-render to show summary and update button text
    updateCurrentWeekProgress(); // Recalculate weekly progress based on new plan
    displayCurrentPlanNameOnDashboard(); // Update dashboard display
    alert('Progress plan saved!');
}

function handleEndCurrentPlan() {
    if (!currentProgressPlan) {
        alert('No active plan to end.');
        return;
    }

    if (!confirm(`Are you sure you want to end the current plan "${currentProgressPlan.name}"? This will move it to history.`)) {
        return;
    }
    
    const today = getTodayDateString();
    const planDetailsForHistory = {
        name: currentProgressPlan.name,
        startDate: currentProgressPlan.startDate,
        endDate: today, 
        originalTargetWeeklyPoints: currentProgressPlan.targetWeeklyPoints,
        // More detailed stats would be calculated here by iterating through the plan's duration.
        // For simplicity, we'll store basic info.
    };

    progressHistory.push(planDetailsForHistory);
    currentProgressPlan = null;
    TARGET_POINTS_FOR_WEEKLY_VIEW = 20000; // Reset to default target
    
    saveProgressData();
    renderProgressSetupForm(); 
    updateCurrentWeekProgress(); 
    displayCurrentPlanNameOnDashboard();
    alert('Current plan ended and moved to history.');
    if (currentView === 'progress') { 
        switchProgressSystemTab('history');
    }
}

function renderProgressHistory() {
    domElements.progressHistoryList.innerHTML = '';
    if (progressHistory.length === 0) {
        domElements.noProgressHistoryMessage.classList.remove('hidden');
        return;
    }
    domElements.noProgressHistoryMessage.classList.add('hidden');

    progressHistory.slice().reverse().forEach(plan => { // Show newest first
        const li = document.createElement('li');
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'history-item-name';
        nameDiv.textContent = plan.name;
        li.appendChild(nameDiv);

        const datesDiv = document.createElement('div');
        datesDiv.className = 'history-item-dates';
        const startDateFormatted = plan.startDate ? new Date(plan.startDate + 'T00:00:00').toLocaleDateString() : 'N/A';
        const endDateFormatted = plan.endDate ? new Date(plan.endDate + 'T00:00:00').toLocaleDateString() : 'N/A';
        datesDiv.textContent = `Duration: ${startDateFormatted} - ${endDateFormatted}`;
        li.appendChild(datesDiv);

        const statsDiv = document.createElement('div');
        statsDiv.className = 'history-item-stats';
        statsDiv.innerHTML = `<strong>Target:</strong> ${plan.originalTargetWeeklyPoints || 'N/A'} points/week`;
        // Future: Could display achieved points/percentage if calculated and stored.
        li.appendChild(statsDiv);

        domElements.progressHistoryList.appendChild(li);
    });
}

function showView(viewName) {
    currentView = viewName;
    if (viewName === 'dashboard') {
        domElements.mainContentWrapper.classList.remove('view-hidden');
        domElements.progressSystemView.classList.add('hidden');
        domElements.sideMenuDashboardLink.classList.add('active-view');
        domElements.sideMenuProgressLink.classList.remove('active-view');
        domElements.appContainer.style.paddingTop = ''; 
    } else if (viewName === 'progress') {
        domElements.mainContentWrapper.classList.add('view-hidden');
        domElements.progressSystemView.classList.remove('hidden');
        domElements.sideMenuProgressLink.classList.add('active-view');
        domElements.sideMenuDashboardLink.classList.remove('active-view');
        domElements.appContainer.style.paddingTop = '0'; 
        switchProgressSystemTab('setup'); 
    }
}


function initDOM() {
    domElements.appContainer = document.getElementById('app-container');
    domElements.hamburgerMenuButton = document.getElementById('hamburger-menu-button');
    domElements.sideMenu = document.getElementById('side-menu');
    domElements.sideMenuDashboardLink = document.getElementById('side-menu-dashboard-link');
    domElements.sideMenuProgressLink = document.getElementById('side-menu-progress-link');
    domElements.mainContentWrapper = document.getElementById('main-content-wrapper');
    domElements.progressSystemView = document.getElementById('progress-system-view');
    domElements.progressSystemHeader = document.getElementById('progress-system-header');
    domElements.progressSystemBackButton = document.getElementById('progress-system-back-button');
    domElements.progressTabSetup = document.getElementById('progress-tab-setup');
    domElements.progressTabHistory = document.getElementById('progress-tab-history');
    domElements.progressSetupContent = document.getElementById('progress-setup-content');
    domElements.progressHistoryContent = document.getElementById('progress-history-content');
    domElements.progressSetupForm = document.getElementById('progress-setup-form');
    domElements.progressPlanNameInput = document.getElementById('progress-plan-name');
    domElements.progressStartDateInput = document.getElementById('progress-start-date');
    domElements.progressStartDaySelect = document.getElementById('progress-start-day');
    domElements.progressTargetWeeklyPointsInput = document.getElementById('progress-target-weekly-points');
    domElements.saveProgressPlanButton = document.getElementById('save-progress-plan-button');
    domElements.endCurrentPlanButton = document.getElementById('end-current-plan-button');
    domElements.activePlanSummary = document.getElementById('active-plan-summary');
    domElements.activePlanNameDisplay = document.getElementById('active-plan-name-display');
    domElements.activePlanStartDateDisplay = document.getElementById('active-plan-start-date-display');
    domElements.activePlanStartDayDisplay = document.getElementById('active-plan-start-day-display');
    domElements.activePlanTargetPointsDisplay = document.getElementById('active-plan-target-points-display');
    domElements.progressHistoryList = document.getElementById('progress-history-list');
    domElements.noProgressHistoryMessage = document.getElementById('no-progress-history');

    domElements.tabsContainer = document.getElementById('tabs');
    domElements.tabContentsContainer = document.getElementById('tab-content');
    domElements.addCategoryButton = document.getElementById('add-category-button');
    domElements.categorySectionTemplate = document.getElementById('category-section-template');
    domElements.backToFoldersButtonTemplate = document.getElementById('back-to-folders-button-template');
    domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
    domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
    domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
    domElements.folderOptionsContextMenu = document.getElementById('folder-options-context-menu');
    domElements.ctxRenameFolderButton = document.getElementById('ctx-rename-folder');
    domElements.ctxDeleteFolderButton = document.getElementById('ctx-delete-folder');

    domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
    domElements.todayProgressFill = document.getElementById('today-progress-fill');
    domElements.todayPointsStat = document.getElementById('today-points-stat');
    domElements.currentWeeklyPlanNameDisplay = document.getElementById('current-weekly-plan-name-display');
    domElements.currentWeekProgressFill = document.getElementById('current-week-progress-fill');
    domElements.currentWeekPointsStat = document.getElementById('current-week-points-stat');

    domElements.calendarMonthYearButton = document.getElementById('calendar-month-year-button');
    domElements.calendarMonthYear = document.getElementById('calendar-month-year');
    domElements.calendarGrid = document.getElementById('calendar-grid');
    domElements.calendarPrevMonthButton = document.getElementById('calendar-prev-month');
    domElements.calendarNextMonthButton = document.getElementById('calendar-next-month');

    domElements.monthYearPickerModal = document.getElementById('month-year-picker-modal');
    domElements.monthYearPickerContent = document.getElementById('month-year-picker-content');
    domElements.monthYearPickerCloseButton = document.getElementById('month-year-picker-close-button');
    domElements.pickerMonthsGrid = document.getElementById('picker-months-grid');
    domElements.pickerYearsList = document.getElementById('picker-years-list');

    domElements.dailyNoteInput = document.getElementById('daily-note-input');
    domElements.saveNoteButton = document.getElementById('save-note-button');

    domElements.historyModal = document.getElementById('history-modal');
    domElements.historyModalCloseButton = document.getElementById('history-modal-close-button');
    domElements.historyModalDate = document.getElementById('history-modal-date');
    domElements.historyModalPointsValue = document.getElementById('history-modal-points-value');
    domElements.historyModalPointsTotal = document.getElementById('history-modal-points-total');
    domElements.historyPercentageProgressFill = document.getElementById('history-percentage-progress-fill');
    domElements.historyTasksList = document.getElementById('history-tasks-list');
    domElements.expandTasksButton = document.getElementById('expand-tasks-button');
    domElements.historicalReflectionWrapper = document.getElementById('historical-reflection-wrapper');
    domElements.expandReflectionButton = document.getElementById('expand-reflection-button');
    domElements.historyUserNoteDisplay = document.getElementById('history-user-note-display');
    domElements.historyUserNoteEdit = document.getElementById('history-user-note-edit');
    domElements.historicalNoteControls = document.getElementById('historical-note-controls');
    domElements.saveHistoricalNoteButton = document.getElementById('save-historical-note-button');
    domElements.clearHistoricalNoteButton = document.getElementById('clear-historical-note-button');
    domElements.historicalNoteStatus = document.getElementById('historical-note-status');

    domElements.taskEditControlsTemplate = document.getElementById('task-edit-controls-template');
    
    domElements.deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    domElements.deleteConfirmationTitle = document.getElementById('delete-confirmation-title');
    domElements.deleteConfirmationMessage = document.getElementById('delete-confirmation-message');
    domElements.deleteConfirmationCloseButton = document.getElementById('delete-confirmation-close-button');
    domElements.confirmDeleteButton = document.getElementById('confirm-delete-button');
    domElements.cancelDeleteButton = document.getElementById('cancel-delete-button');

    domElements.fullscreenContentModal = document.getElementById('fullscreen-content-modal');
    domElements.fullscreenModalTitle = document.getElementById('fullscreen-modal-title');
    domElements.fullscreenModalArea = document.getElementById('fullscreen-modal-area');
    domElements.fullscreenModalCloseButton = document.getElementById('fullscreen-modal-close-button');

    domElements.addFolderModal = document.getElementById('add-folder-modal');
    domElements.addFolderModalCloseButton = document.getElementById('add-folder-modal-close-button');
    domElements.addFolderStep1 = document.getElementById('add-folder-step-1');
    domElements.addFolderStep2 = document.getElementById('add-folder-step-2');
    domElements.selectTaskFolderTypeButton = document.getElementById('select-task-folder-type');
    domElements.selectNotesFolderTypeButton = document.getElementById('select-notes-folder-type');
    domElements.addFolderBackButton = document.getElementById('add-folder-back-button');
    domElements.selectedFolderTypeNameSpan = document.getElementById('selected-folder-type-name');
    domElements.newFolderNameInput = document.getElementById('new-folder-name-input');
    domElements.createFolderButton = document.getElementById('create-folder-button');
    domElements.cancelAddFolderButton = document.getElementById('cancel-add-folder-button');
    
    domElements.noteItemTemplate = document.getElementById('note-item-template');
    domElements.noteItemEditTextareaTemplate = document.getElementById('note-item-edit-form-template-text');
    domElements.noteItemEditLinkTemplate = document.getElementById('note-item-edit-form-template-link');
    domElements.noteItemEditImageTemplate = document.getElementById('note-item-edit-form-template-image');

    // Hamburger Menu
    domElements.hamburgerMenuButton.addEventListener('click', () => {
        const isExpanded = domElements.hamburgerMenuButton.getAttribute('aria-expanded') === 'true';
        domElements.hamburgerMenuButton.setAttribute('aria-expanded', !isExpanded);
        domElements.sideMenu.classList.toggle('open');
        domElements.sideMenu.classList.toggle('hidden', isExpanded); // Toggle hidden based on NEW state
        domElements.sideMenu.setAttribute('aria-hidden', isExpanded.toString()); // aria-hidden should reflect if it IS hidden
    });

    // Side Menu Navigation
    domElements.sideMenuDashboardLink.addEventListener('click', () => {
        showView('dashboard');
        domElements.hamburgerMenuButton.click(); // Close menu
    });
    domElements.sideMenuProgressLink.addEventListener('click', () => {
        showView('progress');
        renderProgressSetupForm(); // Populate form with current plan
        renderProgressHistory();   // Load and display history
        domElements.hamburgerMenuButton.click(); // Close menu
    });

    // Progress System
    domElements.progressSystemBackButton.addEventListener('click', () => showView('dashboard'));
    domElements.progressTabSetup.addEventListener('click', () => switchProgressSystemTab('setup'));
    domElements.progressTabHistory.addEventListener('click', () => switchProgressSystemTab('history'));
    domElements.progressSetupForm.addEventListener('submit', handleSaveProgressPlan);
    domElements.endCurrentPlanButton.addEventListener('click', handleEndCurrentPlan);

    // Existing event listeners
    domElements.addCategoryButton.addEventListener('click', () => {
        const newCategoryName = prompt("Enter new category name:");
        if (newCategoryName && newCategoryName.trim() !== "") {
            const newCategory = {
                id: createUniqueId('cat'),
                name: newCategoryName.trim(),
                order: currentCategories.length,
                deletable: true
            };
            currentCategories.push(newCategory);
            userFoldersByCategoryId[newCategory.id] = [];
            saveUserCategories(currentCategories);
            saveUserFolders(userFoldersByCategoryId);
            renderTabs();
            renderAllCategorySections();
            switchTab(newCategory.id);
        }
    });

    domElements.calendarPrevMonthButton.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
        renderCalendar();
    });
    domElements.calendarNextMonthButton.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
        renderCalendar();
    });
    domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
    domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
    
    domElements.saveNoteButton.addEventListener('click', saveDailyNote);
    
    domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
    domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
    domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
    domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
    domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));
    
    domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);
    
    domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
    domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
    domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);

    domElements.addFolderModalCloseButton.addEventListener('click', closeAddFolderModal);
    domElements.addFolderBackButton.addEventListener('click', () => {
        domElements.addFolderStep2.classList.add('hidden');
        domElements.addFolderStep1.classList.remove('hidden');
    });
    domElements.selectTaskFolderTypeButton.addEventListener('click', () => handleFolderTypeSelection('task', domElements.addFolderModal.dataset.categoryId));
    domElements.selectNotesFolderTypeButton.addEventListener('click', () => handleFolderTypeSelection('notes', domElements.addFolderModal.dataset.categoryId));
    domElements.createFolderButton.addEventListener('click', () => handleCreateFolder(domElements.addFolderModal.dataset.categoryId));
    domElements.cancelAddFolderButton.addEventListener('click', closeAddFolderModal);

    domElements.ctxRenameCategoryButton.addEventListener('click', () => {
        if (currentContextMenuTargetTab) {
            renameCategory(currentContextMenuTargetTab.dataset.categoryId);
        }
        hideCategoryContextMenu();
    });
    domElements.ctxDeleteCategoryButton.addEventListener('click', () => {
        if (currentContextMenuTargetTab) {
            const categoryId = currentContextMenuTargetTab.dataset.categoryId;
            const category = currentCategories.find(c => c.id === categoryId);
            showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}" and all its contents? This action cannot be undone.`);
        }
        hideCategoryContextMenu();
    });
    domElements.ctxRenameFolderButton.addEventListener('click', () => {
        if (currentFolderOptionsMenu && currentFolderOptionsMenu.folderId) {
            const wrapper = document.querySelector(`.task-folder-box-wrapper[data-folder-id="${currentFolderOptionsMenu.folderId}"]`);
            if(wrapper) startFolderRename(currentFolderOptionsMenu.folderId, currentFolderOptionsMenu.categoryId, wrapper);
        }
        hideFolderContextMenu();
    });
    domElements.ctxDeleteFolderButton.addEventListener('click', () => {
         if (currentFolderOptionsMenu && currentFolderOptionsMenu.folderId) {
            const folder = userFoldersByCategoryId[currentFolderOptionsMenu.categoryId]?.find(f => f.id === currentFolderOptionsMenu.folderId);
            if(folder) showDeleteConfirmation('folder', folder.id, `Are you sure you want to delete the folder "${folder.name}" and all its contents? This action cannot be undone.`, '', currentFolderOptionsMenu.categoryId);
        }
        hideFolderContextMenu();
    });

    domElements.tabsContainer.addEventListener('dragover', (e) => {
        if (draggedItemElement && draggedItemElement.classList.contains('tab-button')) {
            e.preventDefault();
            const afterElement = getDragAfterElement(domElements.tabsContainer, e.clientX, '.tab-button:not(#add-category-button)');
            if (afterElement == null) {
                domElements.tabsContainer.insertBefore(draggedItemElement, domElements.addCategoryButton);
            } else {
                domElements.tabsContainer.insertBefore(draggedItemElement, afterElement);
            }
        }
    });
    domElements.tabsContainer.addEventListener('drop', (e) => {
        if (draggedItemElement && draggedItemElement.classList.contains('tab-button')) {
            e.preventDefault();
            const newOrder = Array.from(domElements.tabsContainer.querySelectorAll('.tab-button[data-category-id]'))
                .map((tab, index) => ({ id: tab.dataset.categoryId, order: index }));
            currentCategories.forEach(cat => {
                const newOrderItem = newOrder.find(item => item.id === cat.id);
                if (newOrderItem) cat.order = newOrderItem.order;
            });
            currentCategories.sort((a,b) => a.order - b.order);
            saveUserCategories(currentCategories);
            // renderTabs(); // Not strictly needed here as drop reorders visually. Save is key.
        }
    });

    domElements.tabContentsContainer.addEventListener('dragover', (e) => {
        const taskList = e.target.closest('ul.task-list');
        if (taskList && draggedItemElement && draggedItemElement.classList.contains('task-item')) {
            e.preventDefault();
            document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
                el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
            });
            const afterElement = getDragAfterElement(taskList, e.clientY, '.task-item');
            if (afterElement) {
                const rect = afterElement.getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) {
                    afterElement.classList.add('drag-over-indicator-task');
                } else {
                    afterElement.classList.add('drag-over-indicator-task-bottom');
                }
                // taskList.insertBefore(draggedItemElement, afterElement); // visual move handled by dragend save
            } else {
                // taskList.appendChild(draggedItemElement); // visual move handled by dragend save
            }
        }
        const notesArea = e.target.closest('.notes-content-display-area');
        if (notesArea && draggedItemElement && draggedItemElement.classList.contains('note-item')) {
            e.preventDefault();
            document.querySelectorAll('.drag-over-indicator-note, .drag-over-indicator-note-bottom').forEach(el => {
                el.classList.remove('drag-over-indicator-note', 'drag-over-indicator-note-bottom');
            });
            const afterElement = getDragAfterElement(notesArea, e.clientY, '.note-item');
            if (afterElement) {
                 const rect = afterElement.getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) {
                    afterElement.classList.add('drag-over-indicator-note');
                } else {
                    afterElement.classList.add('drag-over-indicator-note-bottom');
                }
                // notesArea.insertBefore(draggedItemElement, afterElement); // visual move handled by dragend save
            } else {
                // notesArea.appendChild(draggedItemElement); // visual move handled by dragend save
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.classList.contains('hidden') && !domElements.categoryTabContextMenu.contains(e.target) && !e.target.closest('.tab-options-icon')) {
            hideCategoryContextMenu();
        }
        if (domElements.folderOptionsContextMenu && !domElements.folderOptionsContextMenu.classList.contains('hidden') && !domElements.folderOptionsContextMenu.contains(e.target) && !e.target.closest('.folder-options-icon')) {
            hideFolderContextMenu();
        }
        if (domElements.monthYearPickerModal && !domElements.monthYearPickerModal.classList.contains('hidden') && !domElements.monthYearPickerContent.contains(e.target) && e.target !== domElements.calendarMonthYearButton && !domElements.calendarMonthYearButton.contains(e.target)) {
            closeMonthYearPicker();
        }
        if (domElements.sideMenu.classList.contains('open') && !domElements.sideMenu.contains(e.target) && e.target !== domElements.hamburgerMenuButton && !domElements.hamburgerMenuButton.contains(e.target)) {
            domElements.hamburgerMenuButton.click(); 
        }
    });
} 

// Helper: Get Category Name by ID
function getCategoryNameById(categoryId) {
    const category = currentCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
}

// Entry Point
document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    loadAppData();
    renderTabs();
    renderAllCategorySections();
    updateAllProgress();
    switchTab(activeTabId); 
    showView('dashboard'); 
});
