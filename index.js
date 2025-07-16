/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default categories and tasks if nothing in localStorage
const DEFAULT_CATEGORIES_CONFIG = [
  { id: 'routine', name: 'Routine', order: 0, deletable: false, type: 'standard', tasks: [
    "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
    "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
    "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
  ]},
  { id: 'health', name: 'Health', order: 1, deletable: false, type: 'standard', tasks: [
    "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
    "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
    "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
    "Shower consistently", "Social media < 1 hour"
  ]},
  { id: 'god', name: 'God', order: 2, deletable: false, type: 'standard', tasks: [
    "Self-Bible Study", "Thursday congregation", "Sunday congregation",
    "Be the person God expects"
  ]},
  { id: 'personal', name: 'Personal', order: 3, deletable: false, type: 'standard', tasks: ["Content creation"] },
];


// Keys
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_'; 
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; 
const APP_CONTENT_KEY = 'lifeTrackerAppContent_v1'; // Hierarchical content structure
const CHECKLIST_ITEM_STATE_KEY_PREFIX = 'lifeTrackerChecklistState_';
const SCHEDULED_TASK_COMPLETION_KEY_PREFIX = 'lifeTrackerScheduledTaskCompletion_';
const STORAGE_KEY_VIEW_MODE = 'lifeTrackerViewMode';
const STORAGE_KEY_THEME = 'lifeTrackerTheme';
const STORAGE_KEY_PROGRESS_TRACKERS = 'lifeTrackerProgressTrackers_v1';
const STORAGE_KEY_SCHEDULED_TASKS = 'lifeTrackerScheduledTasks_v1';

const SCHEDULED_TASK_COLORS = [
    { id: 'default', 'value': 'var(--text-primary)' },
    { id: 'red', 'value': '#E57373' },
    { id: 'green', 'value': '#81C784' },
    { id: 'blue', 'value': '#64B5F6' },
    { id: 'purple', 'value': '#BA68C8' },
    { id: 'yellow', 'value': '#FFD54F' }
];

let currentCategories = []; 
let appContent = {}; // Main data structure for all items (folders, notes, tasks)
let progressTrackers = [];
let scheduledTasks = [];

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let itemToDelete = null; 
let currentPath = []; // Breadcrumb path: [{ id, name, type }, ...]
let currentViewMode = 'medium'; // 'large', 'medium', 'detail'
let currentTheme = 'original'; // 'original', 'flip-clock', 'power-safe'
let isAddActionMenuOpen = false;
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;
let longPressTimer = null; 
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null;
let itemContextMenu = { element: null, target: null };
let midnightTimer = null;
let tempItemCreationData = null;
let currentActiveViewId = 'main'; // 'main', 'activity-dashboard', 'progress-management', 'scheduled-tasks'
let currentlyEditingNote = null; // { id, name, content }
let currentlyEditingTaskList = null; // The task list being managed in the modal
let isTaskListEditMode = false;
let draggedItemId = null; // ID of the item being dragged
let currentlyEditingProgressTrackerId = null;
let activeProgressDetailTracker = null;
let currentlyEditingScheduledTaskId = null;
let timeProgressInterval = null;

// DOM Elements
const domElements = {
  // Main Views
  appViewWrapper: null,
  progressManagementView: null,
  scheduledTasksView: null,
  
  // Hamburger Menu & Side Panel
  hamburgerButton: null,
  sidePanelMenu: null,
  sidePanelOverlay: null,
  menuMainView: null, 
  menuActivityDashboard: null,
  menuProgressManagement: null,
  menuScheduledTasks: null,
  menuAppearance: null,
  appearanceMenuItemContainer: null,
  themeDropdownContainer: null,
  
  mainContentWrapper: null, 
  dashboardColumn: null, 
  dashboardTabButton: null,

  mobileProgressLocation: null,

  tabs: null,
  tabContent: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategory: null,
  ctxDeleteCategory: null,
  
  dashboardSummaries: null,
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
  
  // Category Type Choice Modal
  chooseCategoryTypeModal: null,
  chooseCategoryTypeCloseButton: null,
  selectStandardCategoryButton: null,
  selectSpecialCategoryButton: null,
  
  // Name Entry Modal
  nameEntryModal: null,
  nameEntryTitle: null,
  nameEntryInput: null,
  nameEntryCloseButton: null,
  confirmNameEntryButton: null,
  cancelNameEntryButton: null,
  nameEntryActions: null,

  // Note Editor Modal
  noteEditorModal: null,
  noteEditorTitle: null,
  noteEditorArea: null,
  noteEditorCloseButton: null,
  noteAddImageButton: null,

  // Task List Modal
  taskListModal: null,
  taskListTitle: null,
  taskListCloseButton: null,
  taskListEditButton: null,
  taskListResetButton: null,
  checklistItemsList: null,
  addChecklistItemForm: null,
  addChecklistItemInput: null,

  // Progress Management
  progressManagementList: null,
  activeProgressList: null,
  archivedProgressList: null,
  addNewProgressButton: null,
  progressEditorModal: null,
  progressEditorCloseButton: null,
  progressEditorTitle: null,
  progressNameInput: null,
  progressTargetInput: null,
  progressTypeSelect: null,
  progressCustomDatesContainer: null,
  progressStartDate: null,
  progressEndDate: null,
  saveProgressButton: null,
  progressHistoryDetailModal: null,
  progressHistoryDetailCloseButton: null,
  progressHistoryDetailTitle: null,
  progressHistoryCalendarView: null,
  progressHistoryDailySummary: null,

  // Scheduled Tasks
  scheduledTasksListContainer: null,
  addNewScheduledTaskButton: null,
  scheduledTasksTodayContainer: null,
  scheduledTasksTodayList: null,
  scheduledTaskEditorModal: null,
  scheduledTaskEditorCloseButton: null,
  scheduledTaskEditorTitle: null,
  scheduledTaskEditorInput: null,
  scheduledTaskEditorDateInput: null,
  scheduledTaskRecurrenceSelect: null,
  scheduledTaskColorPicker: null,
  saveScheduledTaskButton: null,

  imageUploadInput: null,

  // Time vs Progress
  timeProgressButton: null,
  timeProgressModal: null,
  timeProgressCloseButton: null,
  timeProgressBar: null,
  timeProgressPercentage: null,
  timeProgressRemaining: null,
  modalTaskProgressBar: null,
  modalTaskProgressStats: null,
};

function getProgressFillColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const hue = (p / 100) * 120; // 0 = red, 120 = green
    return `hsl(${hue}, 100%, 50%)`;
}

function getProgressGradient(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    const midPoint = Math.max(5, Math.min(95, p));
    const color = getProgressFillColor(p);
    return `linear-gradient(90deg, #ff6b6b 0%, #ffd700 ${midPoint}%, ${color} 100%)`;
}

/**
 * A helper function to consistently apply progress bar styling based on the current theme.
 * @param {HTMLElement} element The fill element of the progress bar.
 * @param {number} percentage The completion percentage (0-100).
 */
function applyProgressStyles(element, percentage) {
    if (!element) return;
    
    if (currentTheme === 'original') {
        element.style.backgroundImage = getProgressGradient(percentage);
        element.style.backgroundColor = ''; // Clear solid color fallback
    } else { // 'power-safe' and 'flip-clock' themes
        element.style.backgroundColor = getProgressFillColor(percentage);
        element.style.backgroundImage = 'none'; // Clear gradient
    }
}


function formatDateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return formatDateToString(new Date());
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

function getChecklistItemStateStorageKey(date, checklistItemId) {
  return `${CHECKLIST_ITEM_STATE_KEY_PREFIX}${date}_${checklistItemId}`;
}

function getScheduledTaskCompletionKey(date, taskId) {
    return `${SCHEDULED_TASK_COMPLETION_KEY_PREFIX}${date}_${taskId}`;
}

function getScheduledTasksForDate(dateStringToMatch) {
    const targetDate = getNormalizedDate(new Date(dateStringToMatch + 'T00:00:00'));
    const matchingTasks = [];

    scheduledTasks.forEach(task => {
        const startDate = getNormalizedDate(new Date(task.date + 'T00:00:00'));

        if (startDate > targetDate) {
            return; // Task recurrence hasn't started yet.
        }

        if (task.recurrence === 'none' || !task.recurrence) {
            if (task.date === dateStringToMatch) {
                matchingTasks.push(task);
            }
        } else if (task.recurrence === 'weekly') {
            if (startDate.getDay() === targetDate.getDay()) {
                matchingTasks.push(task);
            }
        } else if (task.recurrence === 'monthly') {
            if (startDate.getDate() === targetDate.getDate()) {
                 matchingTasks.push(task);
            }
        }
    });
    return matchingTasks;
}


function getAllTaskListFiles(items) {
    let taskListFiles = [];
    for (const item of items) {
        if (item.type === 'tasklist') {
            taskListFiles.push(item);
        } else if (item.type === 'folder' && item.content) {
            taskListFiles = taskListFiles.concat(getAllTaskListFiles(item.content));
        }
    }
    return taskListFiles;
}

function updateTodaysHistoryEntry() {
    const today = getTodayDateString();
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;

    const progressStandardOnly = calculateProgressForDate(today, true, dailyTarget);
    
    const completedTasksTodayStruct = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id]) return; // Just check if content exists
      
      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      const completedTasksForCat = [];
      taskLists.forEach(taskList => {
          const completedInList = (taskList.content || []).filter(checklistItem => localStorage.getItem(getChecklistItemStateStorageKey(today, checklistItem.id)) === 'true');
          if (completedInList.length > 0) {
              completedTasksForCat.push(...completedInList.map(ci => ci.text));
          }
      });

      if (completedTasksForCat.length > 0) {
        completedTasksTodayStruct[cat.id] = { 
            name: cat.name, 
            tasks: completedTasksForCat, 
            type: cat.type // Pass type to history object
        };
      }
    });

    const todaysScheduledTasks = getScheduledTasksForDate(today);
    const completedScheduledTasks = todaysScheduledTasks
        .filter(t => localStorage.getItem(getScheduledTaskCompletionKey(today, t.id)) === 'true')
        .map(t => t.text);

    if (completedScheduledTasks.length > 0) {
        completedTasksTodayStruct.scheduled = {
            name: "Scheduled Tasks",
            tasks: completedScheduledTasks,
            type: 'special' // So it doesn't get a standard category color in history
        };
    }

    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today) || "";

    const historyEntry = {
        date: today,
        completedTaskStructure: completedTasksTodayStruct,
        userNote: note,
        pointsEarned: progressStandardOnly.pointsEarned,
        percentageCompleted: progressStandardOnly.percentage,
        totalTasksOnDate: progressStandardOnly.totalStandardTasks,
        dailyTargetPoints: dailyTarget
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
}

function loadUserCategories() {
    const storedCategories = localStorage.getItem(USER_CATEGORIES_KEY);
    let categories;
    if (storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
        } catch (e) {
            console.error("Error parsing stored categories:", e);
            categories = [];
        }
    } else {
        categories = [];
    }
    
    const defaultCats = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
        ...cat,
        deletable: cat.deletable !== undefined ? cat.deletable : true,
        type: cat.type || 'standard' 
    }));

    if (!categories || categories.length === 0) {
        return defaultCats;
    }

    return categories.map(cat => ({
        ...cat,
        deletable: cat.deletable !== undefined ? cat.deletable : true,
        type: cat.type || 'standard'
    }));
}

function saveUserCategories(categories) {
    localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order)));
}

function loadAppContent() {
    const storedContent = localStorage.getItem(APP_CONTENT_KEY);
    if (storedContent) {
        try {
            return JSON.parse(storedContent);
        } catch (e) {
            console.error("Error parsing stored app content:", e);
        }
    }
    return {};
}

function saveAppContent() {
    localStorage.setItem(APP_CONTENT_KEY, JSON.stringify(appContent));
}

function loadProgressTrackers() {
    const storedTrackers = localStorage.getItem(STORAGE_KEY_PROGRESS_TRACKERS);
    if (storedTrackers) {
        try {
            progressTrackers = JSON.parse(storedTrackers);
             // Migration: remove isDefault property
            let needsSave = false;
            progressTrackers.forEach(t => {
                if (t.isDefault !== undefined) {
                    delete t.isDefault;
                    needsSave = true;
                }
            });
            if (needsSave) saveProgressTrackers();
            return;
        } catch (e) {
            console.error("Error parsing progress trackers:", e);
        }
    }
    
    // If no trackers, create defaults
    progressTrackers = [
        { id: 'progress-daily', name: "Today's Progress", type: 'daily', targetPoints: 2700, order: 0 },
        { id: 'progress-weekly', name: "Weekly Progress", type: 'weekly', targetPoints: 20000, order: 1 }
    ];
    saveProgressTrackers();
}

function saveProgressTrackers() {
    localStorage.setItem(STORAGE_KEY_PROGRESS_TRACKERS, JSON.stringify(progressTrackers));
}

function loadScheduledTasks() {
    const storedTasks = localStorage.getItem(STORAGE_KEY_SCHEDULED_TASKS);
    if (storedTasks) {
        try {
            scheduledTasks = JSON.parse(storedTasks);
            // Migration: Ensure old tasks have a color property
            let needsSave = false;
            scheduledTasks.forEach(t => {
                if (!t.color) {
                    t.color = SCHEDULED_TASK_COLORS.find(c => c.id === 'default').value;
                    needsSave = true;
                }
            });
            if (needsSave) saveScheduledTasks();
            return;
        } catch (e) {
            console.error("Error parsing scheduled tasks:", e);
        }
    }
    scheduledTasks = [];
}

function saveScheduledTasks() {
    localStorage.setItem(STORAGE_KEY_SCHEDULED_TASKS, JSON.stringify(scheduledTasks));
}

function migrateTaskFilesToTaskList() {
    const MIGRATION_KEY = 'migration_tasklist_v1_complete';
    if (localStorage.getItem(MIGRATION_KEY)) {
        return;
    }

    let contentWasUpdated = false;
    console.log("Running migration: Consolidating Task Files into Task Lists...");

    function collectChecklistItems(items) {
        let collectedTasks = [];
        let remainingItems = [];

        for (const item of items) {
            if (item.type === 'task') { // This is the old, incorrect "Task File"
                if (item.content && item.content.length > 0) {
                     item.content.forEach(subTask => {
                        collectedTasks.push({ id: subTask.id || createUniqueId('checkitem'), text: subTask.text });
                     });
                } else {
                    collectedTasks.push({ id: item.id, text: item.name });
                }
                contentWasUpdated = true;
            } else if (item.type === 'folder' && item.content) {
                const nestedResult = collectChecklistItems(item.content);
                item.content = nestedResult.remainingItems;
                collectedTasks = [...collectedTasks, ...nestedResult.collectedTasks];
                remainingItems.push(item);
            } else {
                remainingItems.push(item);
            }
        }
        return { collectedTasks, remainingItems };
    }

    for (const categoryId in appContent) {
        if (!appContent.hasOwnProperty(categoryId) || !Array.isArray(appContent[categoryId])) continue;
        
        const { collectedTasks, remainingItems } = collectChecklistItems(appContent[categoryId]);

        if (collectedTasks.length > 0) {
            const newTaskList = {
                id: createUniqueId('tasklist'),
                type: 'tasklist',
                name: 'General Tasks',
                content: collectedTasks,
                order: 0,
            };
            appContent[categoryId] = [newTaskList, ...remainingItems];
            appContent[categoryId].forEach((item, index) => item.order = index);
        }
    }
    
    if (contentWasUpdated) {
        console.log("Migration complete. App content has been updated.");
        saveAppContent();
    }
    localStorage.setItem(MIGRATION_KEY, 'true');
}


function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    appContent = loadAppContent();
    loadProgressTrackers();
    loadScheduledTasks();

    let categoriesUpdated = false;
    let contentUpdated = false;

    if (!currentCategories || currentCategories.length === 0) {
        currentCategories = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
            id: cat.id, name: cat.name, order: cat.order, 
            deletable: cat.deletable !== undefined ? cat.deletable : true,
            type: cat.type || 'standard'
        }));
        categoriesUpdated = true;
    } else {
        currentCategories.forEach(cat => {
            if (!cat.type) { cat.type = 'standard'; categoriesUpdated = true; }
            if (cat.deletable === undefined) {
                const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === cat.id);
                cat.deletable = defaultConfigCat ? (defaultConfigCat.deletable !== undefined ? defaultConfigCat.deletable : true) : true;
                categoriesUpdated = true;
            }
        });
    }
    
    currentCategories.forEach(category => {
        if (!appContent[category.id]) {
            const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === category.id);
            if (defaultConfigCat && defaultConfigCat.tasks) {
                const newChecklistItems = defaultConfigCat.tasks.map((taskText, index) => ({
                    id: createUniqueId(`checkitem-${index}`),
                    text: taskText
                }));
                appContent[category.id] = [{
                    id: createUniqueId('tasklist'),
                    name: 'General Tasks',
                    type: 'tasklist',
                    order: 0,
                    content: newChecklistItems
                }];
            } else {
                appContent[category.id] = [];
            }
            contentUpdated = true;
        }
    });

    if (categoriesUpdated) saveUserCategories(currentCategories);
    if (contentUpdated) saveAppContent();
    
    migrateTaskFilesToTaskList();
}


function findItemAndParent(itemId, container = appContent) {
    for (const key in container) {
        const items = Array.isArray(container[key]) ? container[key] : (container[key].content || []);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.id === itemId) {
                const parent = container[key].content ? container[key] : { id: key, content: items };
                return { item, parent: parent, parentList: items };
            }
            if (item.type === 'folder' && item.content) {
                const found = findItemAndParent(itemId, { [item.id]: item });
                if (found) return found;
            }
        }
    }
    return null;
}

function getItemsForPath(path) {
    if (!path || path.length === 0) return [];
    let currentLevel = appContent[path[0].id] || [];
    if (path.length === 1) return currentLevel;

    for (let i = 1; i < path.length; i++) {
        const nextId = path[i].id;
        const parentFolder = currentLevel.find(item => item.id === nextId);
        if (parentFolder && parentFolder.type === 'folder') {
            currentLevel = parentFolder.content || [];
        } else {
            return []; // Path is invalid
        }
    }
    return currentLevel;
}


function saveChecklistItemStatus(checklistItemId, completed, dateString) {
  localStorage.setItem(getChecklistItemStateStorageKey(dateString, checklistItemId), completed.toString());
  if (dateString === getTodayDateString()) {
      updateTodaysHistoryEntry();
      updateAllProgress();
  }
}

function getCategoryById(categoryId) {
    return currentCategories.find(cat => cat.id === categoryId);
}
function getCategoryNameById(categoryId) {
    const category = getCategoryById(categoryId);
    return category ? category.name : "Unknown Category";
}

function archiveExpiredTrackers() {
    const today = getNormalizedDate(new Date());
    let wasChanged = false;

    progressTrackers.forEach(tracker => {
        if (tracker.type === 'custom' && tracker.endDate && !tracker.isArchived) {
            const endDate = getNormalizedDate(new Date(tracker.endDate));
            if (endDate < today) {
                console.log(`Archiving tracker "${tracker.name}" as its end date (${tracker.endDate}) has passed.`);
                tracker.isArchived = true;
                wasChanged = true;
            }
        }
    });

    if (wasChanged) {
        saveProgressTrackers();
    }
}

function saveDailyNote() {
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;
    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent);

    if (currentActiveDate === getTodayDateString()) {
        updateTodaysHistoryEntry();
    }

    if (domElements.saveNoteButton) {
        domElements.saveNoteButton.textContent = 'Note Saved!';
        setTimeout(() => {
            if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note';
        }, 1500);
    }
}

function loadCurrentDayNote() {
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate);
    domElements.dailyNoteInput.value = note || '';
}

function saveDayToHistory(dateToSave) {
    console.log(`[History] Saving full history for date: ${dateToSave}`);
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateToSave;
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
    
    const { pointsEarned, percentage, totalStandardTasks } = calculateProgressForDate(dateToSave, true, dailyTarget);
    
    const completedTasksHistory = {}; 
    currentCategories.forEach(cat => {
      if (!appContent[cat.id]) return; // Only check for content existence

      const taskLists = getAllTaskListFiles(appContent[cat.id]);
      const completedTasksForCat = [];
      taskLists.forEach(taskList => {
        const completedChecklistItems = (taskList.content || []).filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateToSave, ci.id)) === 'true');
        if(completedChecklistItems.length > 0) {
            completedTasksForCat.push(...completedChecklistItems.map(ci => ci.text));
        }
      });
      if(completedTasksForCat.length > 0) {
          completedTasksHistory[cat.id] = { name: cat.name, tasks: completedTasksForCat, type: cat.type };
      }
    });

    const scheduledTasksForDate = getScheduledTasksForDate(dateToSave);
    const completedScheduledTasks = scheduledTasksForDate
        .filter(t => localStorage.getItem(getScheduledTaskCompletionKey(dateToSave, t.id)) === 'true')
        .map(t => t.text);

    if (completedScheduledTasks.length > 0) {
        completedTasksHistory.scheduled = {
            name: "Scheduled Tasks",
            tasks: completedScheduledTasks,
            type: 'special'
        };
    }

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    
    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory,
        userNote: mainReflection, 
        pointsEarned: pointsEarned,
        percentageCompleted: percentage,
        totalTasksOnDate: totalStandardTasks,
        dailyTargetPoints: dailyTarget
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Clear the individual task states for the day that has been archived.
    console.log(`[History] Clearing individual task states for ${dateToSave}.`);
    currentCategories.forEach(cat => {
        if (!appContent[cat.id]) return;
        getAllTaskListFiles(appContent[cat.id]).forEach(taskList => {
            (taskList.content || []).forEach(checklistItem => {
                localStorage.removeItem(getChecklistItemStateStorageKey(dateToSave, checklistItemId));
            });
        });
    });
    // Clear scheduled task completion for the day
    scheduledTasks.forEach(t => {
        localStorage.removeItem(getScheduledTaskCompletionKey(dateToSave, t.id));
    });
    
    console.log(`[History] Finalized and states cleared for ${dateToSave}.`);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    console.log(`Clearing task states for previous month: ${lastProcessedMonthYear}`);
  }
  localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear);
}

function loadAppData() {
  seedInitialDataIfNeeded(); 
  loadScheduledTasks();
  
  const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
  if (savedViewMode && ['large', 'medium', 'detail'].includes(savedViewMode)) {
      currentViewMode = savedViewMode;
  }

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();
  console.log(`[App Load] Last visit: ${lastVisitDateStr}, Current date: ${currentDateStr}`);

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`[App Load] New day detected. Archiving data for ${lastVisitDateStr}.`);
    try {
        saveDayToHistory(lastVisitDateStr);
    } catch (e) {
        console.error(`[Critical Error] Failed to save history for ${lastVisitDateStr}.`, e);
        // We continue, as failing to save yesterday shouldn't block today.
    }
  } else if (!lastVisitDateStr) {
    console.log("[App Load] First visit or no last visit date found. Initializing for today.");
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  // Ensure today has a history entry if it's a new day or the entry is missing
  if ((lastVisitDateStr && lastVisitDateStr !== currentDateStr) || !localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + currentDateStr)) {
    console.log("[App Load] Creating or updating today's history entry.");
    updateTodaysHistoryEntry();
  }

  checkAndClearOldMonthlyData();
  archiveExpiredTrackers();
  loadCurrentDayNote(); 
  renderTodaysScheduledTasks();
  
  calendarDisplayDate = new Date(); 
  calendarDisplayDate.setDate(1); 
  calendarDisplayDate.setHours(0,0,0,0); 
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
  scheduleMidnightTask();
}

function handleMidnightReset() {
    console.log("Midnight reset triggered. Saving previous day's state and reloading for a fresh start.");
    const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); 
    
    if (dateThatJustEnded) {
        try {
            saveDayToHistory(dateThatJustEnded);
        } catch (e) {
            console.error('[Midnight Reset] Failed to save history on reset.', e);
        }
    }

    // Force a full reload to ensure the app initializes cleanly for the new day.
    // This is the most robust way to prevent state corruption from a background task.
    window.location.reload();
}

function scheduleMidnightTask() {
    if (midnightTimer) clearTimeout(midnightTimer);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0); 
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    console.log(`Next midnight reset scheduled in ${msUntilMidnight / 1000 / 60} minutes.`);
    midnightTimer = setTimeout(handleMidnightReset, msUntilMidnight);
}

function showDeleteConfirmation(type, id, message, nameForConfirmation = '') {
    let finalMessage = message;

    if (type === 'progressTracker') {
         const tracker = progressTrackers.find(t => t.id === id);
         finalMessage = `Are you sure you want to delete the tracker "${tracker.name}"? This action cannot be undone.`
         if (tracker && (tracker.type === 'daily' || tracker.type === 'weekly')) {
            finalMessage = `Are you sure you want to delete the "${tracker.name}" tracker? This may affect historical data and progress calculations. This action cannot be undone.`;
         }
    }
    
    if (type === 'progressTracker' || type === 'scheduledTask') {
         itemToDelete = { type, id };
    } else {
        const found = findItemAndParent(id);
        const parentId = found?.parent?.id;
        itemToDelete = { type, id, nameForConfirmation, parentId };
    }
    
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('opening');
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = finalMessage || `Are you sure you want to delete this? This action cannot be undone.`;
        if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm Deletion`;
        domElements.deleteConfirmationModal.classList.remove('hidden');
        if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.focus();
    }
}

function confirmDeletion() {
    if (!itemToDelete) return;
    
    const animateItemRemoval = (itemId) => {
        const itemEl = document.querySelector(`.item[data-item-id="${itemId}"]`);
        if (itemEl) {
            itemEl.classList.add('leaving');
            itemEl.addEventListener('animationend', () => itemEl.remove());
        } else {
             renderCategorySectionContent(currentPath[0].id);
        }
    };

    if (itemToDelete.type === 'category') {
        const categoryId = itemToDelete.id;
        const category = currentCategories.find(c => c.id === categoryId);
        if (category && category.deletable === false) {
            alert(`Category "${category.name}" is a default category and cannot be deleted.`);
        } else {
            currentCategories = currentCategories.filter(cat => cat.id !== categoryId);
            saveUserCategories(currentCategories);
            delete appContent[categoryId]; 
            saveAppContent();
            
            document.getElementById(`tab-button-${categoryId}`)?.remove();
            document.getElementById(`category-section-${categoryId}`)?.remove();
            if (activeTabId === categoryId) switchTab('dashboard');
        }
    } else if (itemToDelete.type === 'progressTracker') {
        progressTrackers = progressTrackers.filter(t => t.id !== itemToDelete.id);
        saveProgressTrackers();
        renderProgressManagementList();
        renderMainProgressBars();
    } else if (itemToDelete.type === 'scheduledTask') {
        scheduledTasks = scheduledTasks.filter(t => t.id !== itemToDelete.id);
        saveScheduledTasks();
        renderScheduledTasksManagementList();
        renderCalendar();
        renderTodaysScheduledTasks();
    } else { // Item is a folder, note, or tasklist
        const found = findItemAndParent(itemToDelete.id);
        if (found) {
            found.parentList.splice(found.parentList.indexOf(found.item), 1);
            saveAppContent();
            animateItemRemoval(itemToDelete.id);
        }
    }
    
    updateTodaysHistoryEntry();
    updateAllProgress();
    hideDeleteConfirmation();
}

function hideDeleteConfirmation() {
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('hidden');
        domElements.deleteConfirmationModal.classList.remove('opening');
    }
    itemToDelete = null;
}

// --- SCHEDULED TASKS FUNCTIONS ---

function openScheduledTaskEditor(taskId = null) {
    currentlyEditingScheduledTaskId = taskId;
    
    domElements.scheduledTaskColorPicker.innerHTML = '';
    SCHEDULED_TASK_COLORS.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-option';
        button.dataset.color = color.value;
        button.style.backgroundColor = color.value;
        button.setAttribute('aria-label', color.id);
        domElements.scheduledTaskColorPicker.appendChild(button);
    });

    if (taskId) {
        const task = scheduledTasks.find(t => t.id === taskId);
        if (task) {
            domElements.scheduledTaskEditorInput.value = task.text;
            domElements.scheduledTaskEditorDateInput.value = task.date;
            domElements.scheduledTaskRecurrenceSelect.value = task.recurrence || 'none';
            domElements.scheduledTaskEditorTitle.textContent = 'Edit Scheduled Task';
            const selectedColorButton = domElements.scheduledTaskColorPicker.querySelector(`[data-color="${task.color}"]`);
            if(selectedColorButton) selectedColorButton.classList.add('selected');
        }
    } else {
        domElements.scheduledTaskEditorInput.value = '';
        domElements.scheduledTaskEditorDateInput.value = getTodayDateString();
        domElements.scheduledTaskRecurrenceSelect.value = 'none';
        domElements.scheduledTaskEditorTitle.textContent = 'New Scheduled Task';
        domElements.scheduledTaskColorPicker.querySelector('[data-color="var(--text-primary)"]').classList.add('selected');
    }

    domElements.scheduledTaskEditorModal.classList.add('opening');
    domElements.scheduledTaskEditorModal.classList.remove('hidden');
    domElements.scheduledTaskEditorInput.focus();
}

function closeScheduledTaskEditor() {
    domElements.scheduledTaskEditorModal.classList.add('hidden');
    domElements.scheduledTaskEditorModal.classList.remove('opening');
    currentlyEditingScheduledTaskId = null;
}

function saveScheduledTask() {
    const text = domElements.scheduledTaskEditorInput.value.trim();
    if (!text) {
        alert('Task description cannot be empty.');
        return;
    }
    const date = domElements.scheduledTaskEditorDateInput.value;
    const recurrence = domElements.scheduledTaskRecurrenceSelect.value;
    const selectedColorEl = domElements.scheduledTaskColorPicker.querySelector('.selected');
    const color = selectedColorEl ? selectedColorEl.dataset.color : SCHEDULED_TASK_COLORS.find(c => c.id === 'default').value;
    
    if (currentlyEditingScheduledTaskId) {
        const task = scheduledTasks.find(t => t.id === currentlyEditingScheduledTaskId);
        if (task) {
            task.text = text;
            task.date = date;
            task.recurrence = recurrence;
            task.color = color;
        }
    } else {
        const newTask = {
            id: createUniqueId('scheduletask'),
            text,
            date,
            recurrence,
            color
        };
        scheduledTasks.push(newTask);
    }
    saveScheduledTasks();
    
    if (currentActiveViewId === 'scheduled-tasks') {
        renderScheduledTasksManagementList();
    }
    renderCalendar(); 
    renderTodaysScheduledTasks(); 
    updateTodaysHistoryEntry();
    updateAllProgress();

    closeScheduledTaskEditor();
}

function renderTodaysScheduledTasks() {
    if (!domElements.scheduledTasksTodayList || !domElements.scheduledTasksTodayContainer) return;
    
    const today = getTodayDateString();
    const todaysTasks = getScheduledTasksForDate(today);

    if (todaysTasks.length === 0) {
        domElements.scheduledTasksTodayContainer.classList.add('hidden');
        return;
    }

    domElements.scheduledTasksTodayContainer.classList.remove('hidden');
    domElements.scheduledTasksTodayList.innerHTML = '';

    todaysTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.dataset.scheduledTaskId = task.id;
        li.style.borderLeftColor = task.color || 'var(--panel-border)';
        
        const isCompleted = localStorage.getItem(getScheduledTaskCompletionKey(today, task.id)) === 'true';
        if(isCompleted) li.classList.add('completed');

        li.innerHTML = `
            <input type="checkbox" class="checklist-item-checkbox" ${isCompleted ? 'checked' : ''}>
            <span class="checklist-item-text">${task.text}</span>
        `;
        
        li.addEventListener('click', (e) => {
             if (e.target.type === 'checkbox') return;
             const checkbox = li.querySelector('.checklist-item-checkbox');
             checkbox.checked = !checkbox.checked;
             const changeEvent = new Event('change', { bubbles: true });
             checkbox.dispatchEvent(changeEvent);
        });

        li.querySelector('.checklist-item-checkbox').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem(getScheduledTaskCompletionKey(today, task.id), isChecked);

            updateTodaysHistoryEntry();
            updateAllProgress();
            li.classList.toggle('completed', isChecked);
            li.classList.add('animate-task-toggle');
            setTimeout(() => li.classList.remove('animate-task-toggle'), 300);
        });

        domElements.scheduledTasksTodayList.appendChild(li);
    });
}

function renderScheduledTasksManagementList() {
    if (!domElements.scheduledTasksListContainer) return;
    domElements.scheduledTasksListContainer.innerHTML = '';

    if (scheduledTasks.length === 0) {
        domElements.scheduledTasksListContainer.innerHTML = '<p class="empty-tasks-message">No scheduled tasks yet. Add one using the button below.</p>';
        return;
    }

    const tasksByDate = scheduledTasks.reduce((acc, task) => {
        const date = task.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach(date => {
        const dateGroupDiv = document.createElement('div');
        dateGroupDiv.className = 'scheduled-task-date-group';

        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        dateGroupDiv.innerHTML = `<h2 class="scheduled-task-date-header">${formattedDate}</h2>`;

        tasksByDate[date].forEach(task => {
            const itemEl = document.createElement('div');
            itemEl.className = 'scheduled-task-item';
            
            itemEl.innerHTML = `
                <p>${task.text} ${task.recurrence && task.recurrence !== 'none' ? `(Repeats ${task.recurrence})` : ''}</p>
                <div class="scheduled-task-item-actions">
                    <button class="icon-button item-rename" title="Edit"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                    <button class="icon-button item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
                </div>
            `;

            itemEl.querySelector('.item-rename').addEventListener('click', () => openScheduledTaskEditor(task.id));
            itemEl.querySelector('.item-delete').addEventListener('click', () => {
                showDeleteConfirmation('scheduledTask', task.id, `Are you sure you want to delete the scheduled task: "${task.text}"? This will remove all future recurrences as well.`);
            });
            
            dateGroupDiv.appendChild(itemEl);
        });

        domElements.scheduledTasksListContainer.appendChild(dateGroupDiv);
    });
}


function renderCategorySectionContent(categoryId) {
    const sectionElement = document.getElementById(`category-section-${categoryId}`);
    if (!sectionElement) return;

    const contentArea = sectionElement.querySelector('.category-content-area');
    const header = sectionElement.querySelector('.category-header');
    if (!contentArea || !header) return;

    contentArea.innerHTML = ''; 
    header.querySelector('.breadcrumbs-container').innerHTML = '';
    header.querySelector('.category-header-right').innerHTML = '';
    
    const backButton = header.querySelector('.category-back-button');
    backButton.onclick = () => {
        if (currentPath.length > 1) {
            currentPath.pop();
            renderCategorySectionContent(currentPath[0].id);
        } else {
            switchTab('dashboard');
        }
    };

    renderBreadcrumbs(header.querySelector('.breadcrumbs-container'));
    renderCategoryHeaderControls(header.querySelector('.category-header-right'));
    
    const itemsToRender = getItemsForPath(currentPath);
    renderContentGrid(itemsToRender, contentArea);
}

function renderBreadcrumbs(container) {
    container.innerHTML = '';
    const pathToShow = currentPath.slice(1);

    pathToShow.forEach((part, index) => {
        const partEl = document.createElement(index === pathToShow.length - 1 ? 'span' : 'button');
        partEl.className = 'breadcrumb-part';
        partEl.textContent = part.name;
        if (index < pathToShow.length - 1) {
            partEl.onclick = () => {
                currentPath = currentPath.slice(0, index + 2);
                renderCategorySectionContent(currentPath[0].id);
            };
        }
        container.appendChild(partEl);

        if (index < pathToShow.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '>';
            container.appendChild(separator);
        }
    });
}

function renderCategoryHeaderControls(container) {
    container.innerHTML = '';
    
    const viewModeContainer = document.createElement('div');
    viewModeContainer.className = 'view-mode-container';
    
    const viewModeButton = document.createElement('button');
    viewModeButton.className = 'icon-button view-mode-button';
    viewModeButton.title = 'Change View';
    viewModeButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18h17v-6H4v6zM4 5v6h17V5H4z"></path></svg>`;
    viewModeContainer.appendChild(viewModeButton);

    const viewOptions = document.createElement('div');
    viewOptions.className = 'view-mode-options';
    viewOptions.innerHTML = `
        <button class="icon-button ${currentViewMode === 'large' ? 'active' : ''}" data-view="large" title="Large View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 13h8v-8h-8v8z"></path></svg></button>
        <button class="icon-button ${currentViewMode === 'medium' ? 'active' : ''}" data-view="medium" title="Medium View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v7H4V4zm10 0h7v7h-7V4zM4 14h7v7H4v-7zm10 0h7v7h-7v-7z"></path></svg></button>
        <button class="icon-button ${currentViewMode === 'detail' ? 'active' : ''}" data-view="detail" title="Detail View"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"></path></svg></button>
    `;
    viewModeContainer.appendChild(viewOptions);

    viewModeButton.onclick = (e) => {
        e.stopPropagation();
        viewModeContainer.classList.toggle('open');
    };
    viewOptions.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            currentViewMode = btn.dataset.view;
            localStorage.setItem(STORAGE_KEY_VIEW_MODE, currentViewMode);
            renderCategorySectionContent(currentPath[0].id);
        };
    });
    
    container.appendChild(viewModeContainer);

    const addActionContainer = document.createElement('div');
    addActionContainer.className = 'add-action-container';
    
    const addActionButton = document.createElement('button');
    addActionButton.className = 'icon-button add-action-button';
    addActionButton.title = 'Add New Item';
    addActionButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`;
    addActionContainer.appendChild(addActionButton);

    const addOptions = document.createElement('div');
    addOptions.className = 'add-action-options';
    addOptions.innerHTML = `
        <button class="icon-button" data-type="folder" title="Add Folder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002 2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg></button>
        <button class="icon-button" data-type="note" title="Add Note File"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg></button>
        <button class="icon-button" data-type="tasklist" title="Add Task List"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9.17 16.17L6 13l1.41-1.41L9.17 13.34l3.42-3.41L14 11.34l-4.83 4.83z"></path></svg></button>
    `;
    addActionContainer.appendChild(addOptions);
    
    addActionButton.onclick = (e) => {
        e.stopPropagation();
        isAddActionMenuOpen = !isAddActionMenuOpen;
        addActionContainer.classList.toggle('open', isAddActionMenuOpen);
    };
    addOptions.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            isAddActionMenuOpen = false;
            addActionContainer.classList.remove('open');
            const type = btn.dataset.type;
            const parentList = getItemsForPath(currentPath);
            const defaultName = generateDefaultName(type, parentList);
            openNameEntryModal('create', type, null, defaultName);
        };
    });
    
    container.appendChild(addActionContainer);
}


function renderContentGrid(items, container) {
    const grid = document.createElement('div');
    grid.className = `items-grid view-mode-${currentViewMode}`;

    if (items.length === 0) {
        grid.innerHTML = `<p class="empty-tasks-message">This space is empty. Add a new item!</p>`;
    } else {
        items.sort((a,b) => a.order - b.order).forEach(item => {
            const itemEl = renderItem(item);
            itemEl.classList.add('entering');
            grid.appendChild(itemEl);
        });
    }
    container.appendChild(grid);
}

function renderItem(item) {
    const itemEl = document.createElement('div');
    itemEl.className = `item type-${item.type}`;
    itemEl.dataset.itemId = item.id;
    itemEl.draggable = true;
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'item-icon';
    if (item.type === 'folder') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002 2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>`;
    } else if (item.type === 'note') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`;
    } else if (item.type === 'tasklist') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9.17 16.17L6 13l1.41-1.41L9.17 13.34l3.42-3.41L14 11.34l-4.83 4.83z"></path></svg>`;
        itemEl.classList.add('type-task'); // Reuse styling for task icon color
    }
    itemEl.appendChild(iconDiv);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = item.name;
    itemEl.appendChild(nameSpan);

    if (currentViewMode === 'detail' || item.type === 'folder' || item.type === 'tasklist') {
        const detailsSpan = document.createElement('span');
        detailsSpan.className = 'item-details';
        if(item.type === 'folder') {
            detailsSpan.textContent = `${(item.content || []).length} items`;
        } else if (item.type === 'tasklist') {
            const today = getTodayDateString();
            const checklistItems = item.content || [];
            const completed = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
            detailsSpan.textContent = `${completed} / ${checklistItems.length} done`;
            if(checklistItems.length > 0 && completed === checklistItems.length) {
                itemEl.classList.add('completed');
            }
        }
        itemEl.appendChild(detailsSpan);
    }
    
    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'item-actions';
    itemEl.appendChild(actionsDiv);
    
    if (currentViewMode === 'detail') {
        const moreButton = document.createElement('button');
        moreButton.className = 'icon-button item-more-options';
        moreButton.title = 'More options';
        moreButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>`;
        moreButton.onclick = (e) => {
            e.stopPropagation();
            showItemContextMenu(e.currentTarget, item);
        };
        actionsDiv.appendChild(moreButton);
    } else {
        actionsDiv.innerHTML = `
            <button class="icon-button item-rename" title="Rename"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
            <button class="icon-button item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
        `;
        actionsDiv.querySelector('.item-rename').onclick = (e) => {
            e.stopPropagation();
            openNameEntryModal('rename', item.type, item);
        };
        actionsDiv.querySelector('.item-delete').onclick = (e) => {
            e.stopPropagation();
            showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}? This action cannot be undone.`);
        };
    }
    
    itemEl.addEventListener('click', () => {
        hideItemContextMenu();
        if (item.type === 'folder') {
            currentPath.push({ id: item.id, name: item.name, type: 'folder' });
            renderCategorySectionContent(currentPath[0].id);
        } else if (item.type === 'tasklist') {
            openTaskListModal(item);
        } else if (item.type === 'note') {
            openNoteEditorModal(item);
        }
    });

    itemEl.addEventListener('dragstart', (e) => handleDragStart(e, item));
    if (item.type === 'folder') {
        itemEl.addEventListener('dragover', handleDragOver);
        itemEl.addEventListener('dragleave', handleDragLeave);
        itemEl.addEventListener('drop', (e) => handleDrop(e, item));
    }
    
    return itemEl;
}

function openNoteEditorModal(noteItem) {
    if (!domElements.noteEditorModal || !domElements.noteEditorTitle || !domElements.noteEditorArea) return;
    currentlyEditingNote = noteItem;
    domElements.noteEditorModal.classList.add('opening');
    domElements.noteEditorTitle.textContent = noteItem.name;
    domElements.noteEditorArea.innerHTML = noteItem.content || '';
    domElements.noteEditorModal.classList.remove('hidden');
    domElements.noteEditorArea.focus();
}

function closeNoteEditorModal() {
    if (!domElements.noteEditorModal || !currentlyEditingNote) return;
    const itemInfo = findItemAndParent(currentlyEditingNote.id);
    if(itemInfo) {
        itemInfo.item.content = domElements.noteEditorArea.innerHTML;
        saveAppContent();
    }
    domElements.noteEditorModal.classList.add('hidden');
    domElements.noteEditorModal.classList.remove('opening');
    currentlyEditingNote = null;
    renderCategorySectionContent(currentPath[0].id); // Re-render to show any changes
}

function handleAddImageToNote() {
    domElements.imageUploadInput.click();
}

function processAndInsertImage(file) {
    if (!file.type.startsWith('image/')) return;

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            const wrapper = document.createElement('div');
            wrapper.className = 'note-image-wrapper';
            wrapper.contentEditable = 'false';

            const imageEl = document.createElement('img');
            imageEl.src = dataUrl;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-image-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => wrapper.remove();

            wrapper.appendChild(imageEl);
            wrapper.appendChild(deleteBtn);

            domElements.noteEditorArea.focus();
            const selection = window.getSelection();
            if (selection.getRangeAt && selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(wrapper);
            } else {
                 domElements.noteEditorArea.appendChild(wrapper);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateTasklistItemView(item) {
    const itemEl = document.querySelector(`.item[data-item-id="${item.id}"]`);
    if (!itemEl) return;

    const detailsSpan = itemEl.querySelector('.item-details');
    if (detailsSpan && item.type === 'tasklist') {
        const today = getTodayDateString();
        const checklistItems = item.content || [];
        const completed = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        detailsSpan.textContent = `${completed} / ${checklistItems.length} done`;
        
        const isCompleted = checklistItems.length > 0 && completed === checklistItems.length;
        itemEl.classList.toggle('completed', isCompleted);
    }
}

function openTaskListModal(taskListFile) {
    if (!domElements.taskListModal) return;
    currentlyEditingTaskList = taskListFile;
    domElements.taskListModal.classList.add('opening');
    domElements.taskListTitle.textContent = taskListFile.name;
    isTaskListEditMode = false;
    renderChecklist();
    domElements.taskListModal.classList.remove('hidden');
    domElements.addChecklistItemInput.focus();
}

function closeTaskListModal() {
    if (!domElements.taskListModal) return;
    saveAppContent();
    domElements.taskListModal.classList.add('hidden');
    domElements.taskListModal.classList.remove('opening');

    if (currentlyEditingTaskList) {
        updateTasklistItemView(currentlyEditingTaskList);
    }

    currentlyEditingTaskList = null;
    isTaskListEditMode = false;
    updateAllProgress();
}

function toggleTaskListEditMode() {
    isTaskListEditMode = !isTaskListEditMode;
    domElements.checklistItemsList.classList.toggle('edit-mode', isTaskListEditMode);
    domElements.addChecklistItemForm.classList.toggle('hidden', !isTaskListEditMode);
    
    const editIcon = domElements.taskListEditButton.querySelector('.edit-icon');
    const doneIcon = domElements.taskListEditButton.querySelector('.done-icon');
    editIcon.classList.toggle('hidden', isTaskListEditMode);
    doneIcon.classList.toggle('hidden', !isTaskListEditMode);

    renderChecklist(); // Re-render to apply disabled state to checkboxes
}

function handleResetTasks() {
    if (!currentlyEditingTaskList) return;
    if (confirm("Are you sure you want to uncheck all completed tasks in this list for today? This action cannot be undone.")) {
        const today = getTodayDateString();
        (currentlyEditingTaskList.content || []).forEach(item => {
            saveChecklistItemStatus(item.id, false, today);
        });
        renderChecklist();
    }
}

function renderChecklist() {
    if (!currentlyEditingTaskList || !domElements.checklistItemsList) return;
    domElements.checklistItemsList.innerHTML = '';
    const today = getTodayDateString();

    (currentlyEditingTaskList.content || []).forEach(checklistItem => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        li.dataset.checklistItemId = checklistItem.id;

        const isCompleted = localStorage.getItem(getChecklistItemStateStorageKey(today, checklistItem.id)) === 'true';
        li.classList.toggle('completed', isCompleted);

        li.innerHTML = `
            <input type="checkbox" class="checklist-item-checkbox" ${isCompleted ? 'checked' : ''} ${isTaskListEditMode ? 'disabled' : ''}>
            <span class="checklist-item-text">${checklistItem.text}</span>
            <div class="checklist-item-actions">
                <button class="icon-button checklist-item-rename" title="Rename"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
                <button class="icon-button checklist-item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
            </div>
        `;
        
        li.addEventListener('click', (e) => {
            if (isTaskListEditMode || e.target.closest('.checklist-item-actions') || e.target.type === 'checkbox') return;
            const checkbox = li.querySelector('.checklist-item-checkbox');
            checkbox.checked = !checkbox.checked;
            const changeEvent = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(changeEvent);
        });

        li.querySelector('.checklist-item-checkbox').addEventListener('change', (e) => {
            saveChecklistItemStatus(checklistItem.id, e.target.checked, today);
            li.classList.toggle('completed', e.target.checked);
            li.classList.add('animate-task-toggle');
            setTimeout(() => li.classList.remove('animate-task-toggle'), 300);
        });

        li.querySelector('.checklist-item-rename').addEventListener('click', () => {
            const newText = prompt('Enter new task text:', checklistItem.text);
            if (newText && newText.trim() !== '' && newText.trim() !== checklistItem.text) {
                checklistItem.text = newText.trim();
                li.querySelector('.checklist-item-text').textContent = checklistItem.text;
                saveAppContent();
            }
        });

        li.querySelector('.checklist-item-delete').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this task?')) {
                currentlyEditingTaskList.content = currentlyEditingTaskList.content.filter(ci => ci.id !== checklistItem.id);
                renderChecklist();
                saveAppContent();
                updateCategoryTabBadges();
            }
        });

        domElements.checklistItemsList.appendChild(li);
    });
    
    domElements.checklistItemsList.classList.toggle('edit-mode', isTaskListEditMode);
}

function handleAddChecklistItem(e) {
    e.preventDefault();
    if (!currentlyEditingTaskList || !domElements.addChecklistItemInput) return;
    const text = domElements.addChecklistItemInput.value.trim();
    if (text) {
        const newItem = {
            id: createUniqueId('checkitem'),
            text: text,
        };
        if (!currentlyEditingTaskList.content) {
            currentlyEditingTaskList.content = [];
        }
        currentlyEditingTaskList.content.push(newItem);
        saveAppContent();
        renderChecklist();
        updateCategoryTabBadges();
        domElements.addChecklistItemInput.value = '';
    }
}


function renderTabs() {
    if (!domElements.tabs) return;
    domElements.tabs.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove());
    const addCatButton = domElements.addCategoryButton;

    currentCategories.sort((a, b) => a.order - b.order).forEach(category => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.id = `tab-button-${category.id}`;
        tabButton.dataset.categoryId = category.id;
        
        // Create a text node for the name to avoid issues when appending other elements
        const textNode = document.createTextNode(category.name);
        tabButton.appendChild(textNode);
        
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-selected', activeTabId === category.id ? 'true' : 'false');
        
        if (category.type === 'special') {
            tabButton.classList.add('special-category-tab');
        }
        if (activeTabId === category.id) {
            tabButton.classList.add('active');
        }

        const optionsIcon = document.createElement('div');
        optionsIcon.className = 'tab-options-icon';
        optionsIcon.setAttribute('aria-label', `Options for ${category.name}`);
        optionsIcon.setAttribute('role', 'button');
        optionsIcon.tabIndex = 0; 
        optionsIcon.innerHTML = `<span></span><span></span><span></span>`;
        tabButton.appendChild(optionsIcon);
        
        optionsIcon.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showCategoryContextMenu(category.id, tabButton); 
        });
        optionsIcon.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); }
        });

        let touchStartEvent = null; 

        const clearTabLongPressState = () => {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            tabButton.removeEventListener('touchmove', handleTabTouchMove);
            tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            touchStartEvent = null;
        };

        const handleTabTouchMove = () => { clearTabLongPressState(); };
        const handleTabTouchEndOrCancel = () => { clearTabLongPressState(); };
        
        tabButton.addEventListener('touchstart', (e) => {
            clearTabLongPressState(); touchStartEvent = e; 
            tabButton.addEventListener('touchmove', handleTabTouchMove);
            tabButton.addEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            longPressTimer = setTimeout(() => {
                if (touchStartEvent) { touchStartEvent.preventDefault(); }
                optionsIcon.classList.add('visible');
                showCategoryContextMenu(category.id, tabButton);
                longPressTimer = null; 
                tabButton.removeEventListener('touchmove', handleTabTouchMove);
                tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
                tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            }, LONG_PRESS_DURATION);
        });

        tabButton.addEventListener('click', (e) => {
            switchTab(category.id);
        });
        if (addCatButton) {
            domElements.tabs.insertBefore(tabButton, addCatButton);
        } else {
            domElements.tabs.appendChild(tabButton);
        }
    });
    updateCategoryTabBadges();
}

function updateCategoryTabBadges() {
    if (!domElements.tabs) return;
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    currentCategories.forEach(category => {
        const tabButton = domElements.tabs.querySelector(`#tab-button-${category.id}`);
        if (!tabButton) return;

        // Remove existing badge first
        const existingBadge = tabButton.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        
        let totalTasks = 0;
        let completedTasks = 0;
        allCategoryTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalTasks += checklistItems.length;
            completedTasks += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        });

        const incompleteTasks = totalTasks - completedTasks;

        if (incompleteTasks > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = incompleteTasks;
            tabButton.appendChild(badge);
        }
    });
}

function switchTab(categoryIdToActivate) {
    activeTabId = categoryIdToActivate;
    hideCategoryContextMenu();

    if (domElements.tabs) {
        domElements.tabs.querySelectorAll('.tab-button').forEach(button => {
            const isCurrentActive = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button');
            button.classList.toggle('active', isCurrentActive);
            button.setAttribute('aria-selected', isCurrentActive.toString());
        });
    }

    if (domElements.tabContent) {
        domElements.tabContent.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard');
        domElements.tabContent.querySelectorAll('section[role="tabpanel"]').forEach(section => {
            const isCurrentActiveSection = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content');
            section.classList.toggle('hidden', !isCurrentActiveSection);
        });
    }
    
    if (activeTabId !== 'dashboard') {
        const category = getCategoryById(activeTabId);
        currentPath = [{ id: activeTabId, name: category.name, type: 'category' }];
        renderCategorySectionContent(activeTabId); 
    } else {
        currentPath = [];
    }
}

function switchView(viewId) {
    currentActiveViewId = viewId;
    
    const isMainView = viewId === 'main' || viewId === 'activity-dashboard';
    
    domElements.appViewWrapper.classList.toggle('hidden', !isMainView);
    domElements.progressManagementView.classList.toggle('hidden', viewId !== 'progress-management');
    domElements.scheduledTasksView.classList.toggle('hidden', viewId !== 'scheduled-tasks');
    
    domElements.dashboardColumn.classList.toggle('hidden', viewId !== 'activity-dashboard');

    document.querySelectorAll('.side-panel-item').forEach(item => item.classList.remove('active-menu-item'));
    const activeMenuItem = document.getElementById(`menu-${viewId}`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active-menu-item');
    }

    if (viewId === 'progress-management') {
        renderProgressManagementList();
    } else if (viewId === 'scheduled-tasks') {
        renderScheduledTasksManagementList();
    } else if (viewId === 'activity-dashboard') {
        updateDashboardSummaries();
    }

    closeSidePanel();
}


function calculateProgressForDate(dateString, standardOnlyStats = false, targetPoints) {
  let completedCount = 0;
  let totalTasksForCalc = 0;
  let totalStandardTasksCount = 0;

  currentCategories.forEach(category => {
    const isStandardCategory = category.type === 'standard';
    if (!appContent[category.id]) return;
    const allCategoryTaskLists = getAllTaskListFiles(appContent[category.id]);

    allCategoryTaskLists.forEach(taskList => {
        const checklistItems = taskList.content || [];
        const completedItems = checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(dateString, ci.id)) === 'true').length;

        if (isStandardCategory) {
            totalStandardTasksCount += checklistItems.length;
        }
        
        if (standardOnlyStats) {
            if (isStandardCategory) {
                totalTasksForCalc += checklistItems.length;
                completedCount += completedItems;
            }
        } else {
            totalTasksForCalc += checklistItems.length;
            completedCount += completedItems;
        }
    });
  });

  // Include scheduled tasks in the calculation for standard-only stats
  const scheduledTasksForDate = getScheduledTasksForDate(dateString);
  const completedScheduled = scheduledTasksForDate.filter(t => localStorage.getItem(getScheduledTaskCompletionKey(dateString, t.id)) === 'true').length;
  totalStandardTasksCount += scheduledTasksForDate.length;
  if(standardOnlyStats) {
      totalTasksForCalc += scheduledTasksForDate.length;
      completedCount += completedScheduled;
  }


  const percentage = totalStandardTasksCount > 0 ? Math.round((completedCount / totalStandardTasksCount) * 100) : 0;
  const pointsPerTask = totalStandardTasksCount > 0 ? targetPoints / totalStandardTasksCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);
  
  return { 
    percentage, pointsEarned, completedCount,
    totalTasks: totalTasksForCalc, totalStandardTasks: totalStandardTasksCount
  };
}

function getWeekDates(forDate = new Date()) {
    const date = new Date(forDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const weekDay = new Date(startDate);
        weekDay.setDate(startDate.getDate() + i);
        weekDates.push(formatDateToString(weekDay));
    }
    return weekDates;
}

function calculateProgressForPeriod(tracker) {
    const today = new Date();
    const todayStr = formatDateToString(today);
    let datesInRange = [];
    
    switch(tracker.type) {
        case 'daily':
            datesInRange.push(todayStr);
            break;
        case 'weekly': {
            const weekDates = getWeekDates(today);
            for(const dateStr of weekDates) {
                datesInRange.push(dateStr);
                if (dateStr === todayStr) break;
            }
            break;
        }
        case 'monthly': {
             const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
             const daysInMonth = (new Date(today.getFullYear(), today.getMonth() + 1, 0)).getDate();
             for (let i = 1; i <= daysInMonth; i++) {
                 const date = new Date(today.getFullYear(), today.getMonth(), i);
                 const dateStr = formatDateToString(date);
                 if (getNormalizedDate(date) > today) break;
                 datesInRange.push(dateStr);
             }
             break;
        }
        case 'custom': {
            if (tracker.startDate && tracker.endDate) {
                let currentDate = getNormalizedDate(new Date(tracker.startDate));
                const endDate = getNormalizedDate(new Date(tracker.endDate));
                while(currentDate <= endDate) {
                    if (currentDate > today) break;
                    datesInRange.push(formatDateToString(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            break;
        }
        default:
            return { pointsEarned: 0, percentage: 0, totalPoints: tracker.targetPoints };
    }

    let totalPointsEarned = 0;
    datesInRange.forEach(dateString => {
        const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
        const historyData = localStorage.getItem(historyKey);
        if (historyData) {
            try {
                const entry = JSON.parse(historyData);
                totalPointsEarned += (entry.pointsEarned || 0);
            } catch (e) {
                console.error(`Error parsing history for ${dateString}:`, e);
            }
        }
    });

    const totalPoints = tracker.targetPoints;
    const percentage = totalPoints > 0 ? Math.round((totalPointsEarned / totalPoints) * 100) : 0;

    return { pointsEarned: Math.round(totalPointsEarned), percentage, totalPoints };
}

function renderMainProgressBars() {
    if (!domElements.mobileProgressLocation) return;
    domElements.mobileProgressLocation.innerHTML = '';

    const activeTrackers = progressTrackers.filter(t => !t.isArchived).sort((a,b) => a.order - b.order);

    if (activeTrackers.length === 0) {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.innerHTML = `<p class="empty-tasks-message" style="padding: 20px;">No active progress trackers. You can add one in Progress Management.</p>`;
        domElements.mobileProgressLocation.appendChild(container);
        return;
    }

    activeTrackers.forEach(tracker => {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.dataset.trackerId = tracker.id;
        
        const { pointsEarned, percentage, totalPoints } = calculateProgressForPeriod(tracker);
        
        container.innerHTML = `
            <h3>${tracker.name}</h3>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percentage}%;" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div>
            </div>
            <p class="points-stat progress-value">${pointsEarned} / ${totalPoints} Points</p>
        `;
        
        const fillEl = container.querySelector('.progress-bar-fill');
        applyProgressStyles(fillEl, percentage);
        domElements.mobileProgressLocation.appendChild(container);
    });
}


function updateDashboardSummaries() {
    if (!domElements.dashboardSummaries) return;
    domElements.dashboardSummaries.innerHTML = '';
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    currentCategories.forEach(category => {
        if (category.id === 'dashboard') return;

        const allCategoryTaskLists = appContent[category.id] ? getAllTaskListFiles(appContent[category.id]) : [];
        let totalItems = 0;
        let completedItems = 0;
        allCategoryTaskLists.forEach(tl => {
            const checklistItems = tl.content || [];
            totalItems += checklistItems.length;
            completedItems += checklistItems.filter(ci => localStorage.getItem(getChecklistItemStateStorageKey(today, ci.id)) === 'true').length;
        });

        const incompleteItems = totalItems - completedItems;
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'dashboard-category-summary';

        let notificationHTML = '';
        if (totalItems > 0) {
            if (incompleteItems > 0) {
                notificationHTML = `<div class="category-notification-badge">${incompleteItems}</div>`;
            } else {
                notificationHTML = `<div class="category-completion-checkmark">✅</div>`;
            }
        }

        summaryDiv.innerHTML = `
            ${notificationHTML}
            <h3>${category.name}</h3>
            <p class="category-stats">${completedItems} / ${totalItems}</p>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;

        const fillEl = summaryDiv.querySelector('.progress-bar-fill');
        fillEl.style.width = `${percentage}%`;
        applyProgressStyles(fillEl, percentage);

        if (totalItems > 0 && completedItems === totalItems) {
            summaryDiv.querySelector('.category-stats').classList.add('fully-completed');
        }

        domElements.dashboardSummaries.appendChild(summaryDiv);
    });
}

function updateAllProgress() {
  try {
    if (currentActiveViewId === 'main' || currentActiveViewId === 'activity-dashboard') {
        renderMainProgressBars();
        renderTodaysScheduledTasks();
    }
    if (currentActiveViewId === 'activity-dashboard') {
      updateDashboardSummaries(); 
    }
    updateCategoryTabBadges();
    renderCalendar(); 
  } catch (error) {
    console.error('[Critical Error] Failed during UI update in updateAllProgress(). App state might be inconsistent.', error);
  }
}

// --- CALENDAR & HISTORY FUNCTIONS ---

function renderCalendar() {
    if (!domElements.calendarGrid || !domElements.calendarMonthYear) return;

    domElements.calendarGrid.innerHTML = '';

    const monthName = calendarDisplayDate.toLocaleString('default', { month: 'long' });
    const year = calendarDisplayDate.getFullYear();
    domElements.calendarMonthYear.textContent = `${monthName} ${year}`;
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const headerEl = document.createElement('div');
        headerEl.className = 'calendar-day-header';
        headerEl.textContent = day;
        domElements.calendarGrid.appendChild(headerEl);
    });

    const today = getNormalizedDate(new Date());
    const month = calendarDisplayDate.getMonth();
    
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells for padding
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        domElements.calendarGrid.appendChild(emptyCell);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        
        const cellDate = getNormalizedDate(new Date(year, month, day));
        const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        cell.innerHTML = `<span class="calendar-day-number">${day}</span><div class="calendar-day-fill"></div>`;
        
        if (cellDate.getTime() === today.getTime()) {
            cell.classList.add('current-day');
        }

        if (cellDate > today) {
             cell.classList.add('future-day');
        } else { // Today or in the past
            let percentage = 0;
            if (cellDate.getTime() < today.getTime()) {
                // Past day logic
                const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
                const historyData = localStorage.getItem(historyKey);
                if (historyData) {
                    try {
                        const entry = JSON.parse(historyData);
                        percentage = entry.percentageCompleted || 0;
                    } catch(e) { console.error(`Error parsing history for ${dateString}:`, e); }
                }
            } else { // It's today
                const dailyTracker = progressTrackers.find(t => t.type === 'daily');
                const dailyTarget = dailyTracker ? dailyTracker.targetPoints : 2700;
                const progress = calculateProgressForDate(dateString, true, dailyTarget);
                percentage = progress.percentage || 0;
            }

            const fillEl = cell.querySelector('.calendar-day-fill');
            if (fillEl) {
                fillEl.style.height = `${percentage}%`;
                applyProgressStyles(fillEl, percentage);
            }
            if (percentage > 75) {
                cell.classList.add('high-fill');
            }
        }
        
        if (cellDate <= today) {
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `View history for ${monthName} ${day}`);
            cell.addEventListener('click', () => openHistoryModal(dateString));
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    openHistoryModal(dateString);
                }
            });
        }
        
        // Add scheduled task indicator dots for all applicable days
        const tasksForDay = getScheduledTasksForDate(dateString);
        if (tasksForDay.length > 0) {
            const dotContainer = document.createElement('div');
            dotContainer.className = 'calendar-dot-container';
            tasksForDay.slice(0, 4).forEach(task => {
                const dot = document.createElement('div');
                dot.className = 'calendar-task-dot';
                dot.style.backgroundColor = task.color;
                dotContainer.appendChild(dot);
            });
            cell.appendChild(dotContainer);
        }


        domElements.calendarGrid.appendChild(cell);
    }
}

function openHistoryModal(dateString) {
    if (!domElements.historyModal) return;

    currentModalDate = dateString;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const isToday = dateString === getTodayDateString();
    let historyEntry = null;

    // Ensure today's history is up-to-date before displaying
    if (isToday) {
        updateTodaysHistoryEntry();
    }
    
    const historyDataString = localStorage.getItem(historyKey);
    if (historyDataString) {
        try {
            historyEntry = JSON.parse(historyDataString);
        } catch (e) {
            console.error(`Could not parse history for ${dateString}`, e);
            return;
        }
    }
    
    if (!historyEntry) {
        alert("No history found for this date.");
        return;
    }

    const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    domElements.historyModalDate.textContent = formattedDate;

    // Stats
    const points = historyEntry.pointsEarned || 0;
    const totalPoints = historyEntry.dailyTargetPoints || progressTrackers.find(t=>t.type==='daily')?.targetPoints || 2700;
    const percentage = historyEntry.percentageCompleted || 0;

    domElements.historyModalPointsValue.textContent = points;
    domElements.historyModalPointsTotal.textContent = totalPoints;
    
    const fillEl = domElements.historyPercentageProgressFill;
    fillEl.style.width = `${percentage}%`;
    applyProgressStyles(fillEl, percentage);
    fillEl.textContent = `${percentage}%`;
    fillEl.setAttribute('aria-valuenow', percentage);

    // Completed Tasks
    domElements.historyTasksList.innerHTML = '';
    let hasCompletedTasks = false;
    if (historyEntry.completedTaskStructure) {
        Object.entries(historyEntry.completedTaskStructure).forEach(([key, catData]) => {
            if (catData.tasks && catData.tasks.length > 0) {
                hasCompletedTasks = true;
                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                
                const catTitle = document.createElement('h4');
                catTitle.className = 'history-category-title';
                catTitle.textContent = catData.name;
                if(catData.type === 'special') catTitle.classList.add('special-history-title');
                catGroup.appendChild(catTitle);

                const ul = document.createElement('ul');
                catData.tasks.forEach(taskText => {
                    const li = document.createElement('li');
                    li.textContent = taskText;
                    ul.appendChild(li);
                });
                catGroup.appendChild(ul);
                domElements.historyTasksList.appendChild(catGroup);
            }
        });
    }
    if (!hasCompletedTasks) {
        domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    }
    domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks);

    // Reflection Note
    const userNote = historyEntry.userNote || '';
    domElements.historyUserNoteDisplay.textContent = userNote;
    domElements.historyUserNoteEdit.value = userNote;
    
    domElements.expandReflectionButton.classList.toggle('hidden', !userNote);

    // Only today's note can be edited from this view
    const isEditable = isToday;
    domElements.historyUserNoteDisplay.classList.toggle('hidden', isEditable);
    domElements.historyUserNoteEdit.classList.toggle('hidden', !isEditable);
    domElements.historicalNoteControls.classList.toggle('hidden', !isEditable);
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';


    domElements.historyModal.classList.add('opening');
    domElements.historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
    if (domElements.historyModal) {
        domElements.historyModal.classList.add('hidden');
        domElements.historyModal.classList.remove('opening');
    }
    currentModalDate = null;
}

function saveHistoricalNote() {
    if (!currentModalDate) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry = {};
    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Also update the main note input if we're editing today's note
    if (currentModalDate === getTodayDateString()) {
        domElements.dailyNoteInput.value = noteContent;
    }

    if (domElements.historicalNoteStatus) {
        domElements.historicalNoteStatus.textContent = 'Saved!';
        setTimeout(() => {
            if(domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
        }, 1500);
    }
}

function clearHistoricalNote() {
    if (!currentModalDate || !confirm("Are you sure you want to clear this reflection?")) return;
    domElements.historyUserNoteEdit.value = '';
    saveHistoricalNote();
}


function toggleMonthYearPicker() {
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        renderMonthYearPicker();
        domElements.monthYearPickerModal.classList.add('opening');
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else {
        closeMonthYearPicker();
    }
}

function closeMonthYearPicker() {
    isMonthYearPickerOpen = false;
    if (domElements.monthYearPickerModal) {
        domElements.monthYearPickerModal.classList.add('hidden');
        domElements.monthYearPickerModal.classList.remove('opening');
    }
}

function renderMonthYearPicker() {
    if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return;

    // Render months
    domElements.pickerMonthsGrid.innerHTML = '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((month, index) => {
        const monthEl = document.createElement('button');
        monthEl.className = 'month-option';
        monthEl.textContent = month;
        monthEl.dataset.month = index;
        if (index === pickerSelectedMonth) {
            monthEl.classList.add('selected');
        }
        monthEl.addEventListener('click', () => handleSelectMonthOrYear('month', index));
        domElements.pickerMonthsGrid.appendChild(monthEl);
    });

    // Render years
    domElements.pickerYearsList.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 1; year >= currentYear - 5; year--) {
        const yearEl = document.createElement('button');
        yearEl.className = 'year-option';
        yearEl.textContent = year;
        yearEl.dataset.year = year;
        if (year === pickerSelectedYear) {
            yearEl.classList.add('selected');
        }
        yearEl.addEventListener('click', () => handleSelectMonthOrYear('year', year));
        domElements.pickerYearsList.appendChild(yearEl);
    }
}

function handleSelectMonthOrYear(type, value) {
    if (type === 'month') {
        pickerSelectedMonth = value;
    } else {
        pickerSelectedYear = value;
    }
    
    // Update display immediately for better feedback
    const tempDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1);
    domElements.calendarMonthYear.textContent = `${tempDate.toLocaleString('default', { month: 'long' })} ${pickerSelectedYear}`;
    
    // Mark the new selections in the picker
    renderMonthYearPicker();

    // Set the calendar date and close the picker
    calendarDisplayDate.setFullYear(pickerSelectedYear, pickerSelectedMonth, 1);
    renderCalendar();
    closeMonthYearPicker();
}

function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea) return;
    domElements.fullscreenContentModal.classList.add('opening');
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    let historyEntry = null;
    const isToday = date === getTodayDateString();

    if (isToday) { 
        if (!localStorage.getItem(historyKey)) updateTodaysHistoryEntry();
        historyEntry = JSON.parse(localStorage.getItem(historyKey));
    } else { 
        const historyDataString = localStorage.getItem(historyKey);
        if (historyDataString) {
          try { historyEntry = JSON.parse(historyDataString); } catch (e) { return; }
        }
    }

    if (!historyEntry) { domElements.fullscreenModalArea.innerHTML = '<p>No content available for this day.</p>'; domElements.fullscreenContentModal.classList.remove('hidden'); return; }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    domElements.fullscreenModalArea.innerHTML = ''; 

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTaskStructure) {
            Object.values(historyEntry.completedTaskStructure).forEach(catData => {
                if(catData.tasks && catData.tasks.length > 0) {
                    hasContent = true;
                    const catGroup = document.createElement('div');
                    catGroup.className = 'history-category-group';
                    catGroup.innerHTML = `<h4 class="history-category-title">${catData.name}</h4>`;
                    const ul = document.createElement('ul');
                    catData.tasks.forEach(taskText => { ul.innerHTML += `<li><span>${taskText}</span></li>`; });
                    catGroup.appendChild(ul);
                    domElements.fullscreenModalArea.appendChild(catGroup);
                }
            });
        }
        if (!hasContent) domElements.fullscreenModalArea.innerHTML = '<p>No tasks completed on this day.</p>';
    } else if (type === 'reflection') {
        domElements.fullscreenModalTitle.textContent = `Reflection for ${formattedDate}`;
        if (historyEntry.userNote) {
            const pre = document.createElement('pre');
            pre.textContent = historyEntry.userNote; 
            domElements.fullscreenModalArea.appendChild(pre);
        } else domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded for this day.</p>';
    }
    currentFullscreenContent = { type, date };
    domElements.fullscreenContentModal.classList.remove('hidden');
}


function closeFullscreenContentModal() {
    if (domElements.fullscreenContentModal) {
        domElements.fullscreenContentModal.classList.add('hidden');
        domElements.fullscreenContentModal.classList.remove('opening');
    }
    currentFullscreenContent = null;
}

function openChooseCategoryTypeModal() {
    tempItemCreationData = {};
    if (domElements.chooseCategoryTypeModal) {
        domElements.chooseCategoryTypeModal.classList.add('opening');
        domElements.chooseCategoryTypeModal.classList.remove('hidden');
    }
    if (domElements.selectStandardCategoryButton) domElements.selectStandardCategoryButton.focus();
}
function closeChooseCategoryTypeModal() {
    if (domElements.chooseCategoryTypeModal) {
        domElements.chooseCategoryTypeModal.classList.add('hidden');
        domElements.chooseCategoryTypeModal.classList.remove('opening');
    }
}
function handleSelectCategoryType(type) {
    tempItemCreationData = { itemType: 'category', categoryType: type };
    closeChooseCategoryTypeModal();
    const defaultName = generateDefaultName('category', currentCategories);
    openNameEntryModal('create', 'category', null, defaultName);
}

// Theme Management
const THEMES = [
    { id: 'original', name: 'Original Theme' },
    { id: 'power-safe', name: 'Save Mode' },
    { id: 'flip-clock', name: 'Dark Theme' }
];

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    currentTheme = theme;
}

function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    applyTheme(theme);
    if (domElements.timeProgressModal && !domElements.timeProgressModal.classList.contains('hidden')) {
        updateTimeProgress();
    }
    updateAllProgress(); // Re-render elements with dynamic colors
}

function toggleThemeDropdown() {
    const container = domElements.appearanceMenuItemContainer;
    if (!container) return;
    const isOpen = container.classList.toggle('open');
    if (isOpen) {
        renderThemeDropdown();
    }
}

function renderThemeDropdown() {
    const container = domElements.themeDropdownContainer;
    if (!container) return;

    container.innerHTML = '';
    THEMES.forEach(theme => {
        const optionButton = document.createElement('button');
        optionButton.className = 'theme-option-button';
        optionButton.dataset.themeId = theme.id;
        
        const isActive = theme.id === currentTheme;
        if (isActive) {
            optionButton.classList.add('active');
        }

        optionButton.innerHTML = `
            <span>${theme.name}</span>
            <span class="theme-active-indicator"></span>
        `;
        
        optionButton.addEventListener('click', () => {
            saveTheme(theme.id);
            renderThemeDropdown(); // Re-render to update the active dot
        });
        
        container.appendChild(optionButton);
    });
}


function generateDefaultName(type, existingItems) {
    let baseName = '';
    if (type === 'category') baseName = 'New Category';
    else if (type === 'folder') baseName = 'New Folder';
    else if (type === 'note') baseName = 'New Note';
    else if (type === 'tasklist') baseName = 'New Task List';
    else baseName = 'New Item';

    if (!existingItems.some(item => item.name === baseName)) {
        return baseName;
    }

    let i = 2;
    while (existingItems.some(item => item.name === `${baseName} ${i}`)) {
        i++;
    }
    return `${baseName} ${i}`;
}

function initialize() {
    // Populate domElements object
    for (const key in domElements) {
        const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        domElements[key] = document.getElementById(id);
    }

    // Load data and initial render
    loadAppData();

    // Apply theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'original';
    applyTheme(savedTheme);

    // Initial render of dynamic content
    renderTabs();
    renderAllCategorySections();
    switchTab('dashboard'); // Start on the dashboard
    updateAllProgress();

    // Event listeners
    setupEventListeners();

    console.log("Application initialized.");
}

function renderAllCategorySections() {
    if (!domElements.categorySectionTemplate || !domElements.tabContent) return;
    currentCategories.forEach(category => {
        const categorySectionClone = domElements.categorySectionTemplate.content.cloneNode(true);
        const section = categorySectionClone.querySelector('section');
        section.id = `category-section-${category.id}`;
        section.setAttribute('aria-labelledby', `tab-button-${category.id}`);
        domElements.tabContent.appendChild(section);
    });
}

function setupEventListeners() {
    // Hamburger Menu & Side Panel
    domElements.hamburgerButton.addEventListener('click', toggleSidePanel);
    domElements.sidePanelOverlay.addEventListener('click', closeSidePanel);
    domElements.menuMainView.addEventListener('click', () => switchView('main'));
    domElements.menuActivityDashboard.addEventListener('click', () => switchView('activity-dashboard'));
    domElements.menuProgressManagement.addEventListener('click', () => switchView('progress-management'));
    domElements.menuScheduledTasks.addEventListener('click', () => switchView('scheduled-tasks'));
    domElements.appearanceMenuItemContainer.addEventListener('click', toggleThemeDropdown);


    // Main UI
    domElements.dashboardTabButton.addEventListener('click', () => switchTab('dashboard'));
    domElements.addCategoryButton.addEventListener('click', openChooseCategoryTypeModal);
    domElements.saveNoteButton.addEventListener('click', saveDailyNote);

    // Category Context Menu
    domElements.ctxRenameCategory.addEventListener('click', handleRenameCategoryFromContextMenu);
    domElements.ctxDeleteCategory.addEventListener('click', handleDeleteCategoryFromContextMenu);

    // Calendar
    domElements.calendarPrevMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendar(); });
    domElements.calendarNextMonthButton.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendar(); });
    domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);

    // Month/Year Picker Modal
    domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
    domElements.monthYearPickerModal.addEventListener('click', (e) => {
        if (e.target === domElements.monthYearPickerModal) {
            closeMonthYearPicker();
        }
    });

    // History Modal
    domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
    domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
    domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
    domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
    domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));
    
    // Fullscreen Modal
    domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);

    // Delete Confirmation Modal
    domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
    domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
    domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);

    // Category Type Modal
    domElements.chooseCategoryTypeCloseButton.addEventListener('click', closeChooseCategoryTypeModal);
    domElements.selectStandardCategoryButton.addEventListener('click', () => handleSelectCategoryType('standard'));
    domElements.selectSpecialCategoryButton.addEventListener('click', () => handleSelectCategoryType('special'));

    // Name Entry Modal
    domElements.nameEntryCloseButton.addEventListener('click', closeNameEntryModal);
    domElements.confirmNameEntryButton.addEventListener('click', handleConfirmNameEntry);
    domElements.cancelNameEntryButton.addEventListener('click', closeNameEntryModal);
    domElements.nameEntryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleConfirmNameEntry();
    });

    // Note Editor Modal
    domElements.noteEditorCloseButton.addEventListener('click', closeNoteEditorModal);
    domElements.noteAddImageButton.addEventListener('click', handleAddImageToNote);
    domElements.imageUploadInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            processAndInsertImage(e.target.files[0]);
        }
    });


    // Task List Modal
    domElements.taskListCloseButton.addEventListener('click', closeTaskListModal);
    domElements.taskListEditButton.addEventListener('click', toggleTaskListEditMode);
    domElements.taskListResetButton.addEventListener('click', handleResetTasks);
    domElements.addChecklistItemForm.addEventListener('submit', handleAddChecklistItem);
    
    // Scheduled Tasks
    domElements.addNewScheduledTaskButton.addEventListener('click', () => openScheduledTaskEditor());
    domElements.scheduledTaskEditorCloseButton.addEventListener('click', closeScheduledTaskEditor);
    domElements.saveScheduledTaskButton.addEventListener('click', saveScheduledTask);
    domElements.scheduledTaskColorPicker.addEventListener('click', e => {
        if (e.target.classList.contains('color-option')) {
            domElements.scheduledTaskColorPicker.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });


    // Progress Management
    domElements.addNewProgressButton.addEventListener('click', () => openProgressEditor());
    domElements.progressEditorCloseButton.addEventListener('click', closeProgressEditor);
    domElements.saveProgressButton.addEventListener('click', saveProgressTracker);
    domElements.progressTypeSelect.addEventListener('change', () => {
        domElements.progressCustomDatesContainer.classList.toggle('hidden', domElements.progressTypeSelect.value !== 'custom');
    });
    domElements.progressHistoryDetailCloseButton.addEventListener('click', closeProgressHistoryDetailModal);


    // Time vs Progress Modal
    domElements.timeProgressButton.addEventListener('click', openTimeProgressModal);
    domElements.timeProgressCloseButton.addEventListener('click', closeTimeProgressModal);

    // Global listeners
    document.addEventListener('click', (e) => {
        // Close add action menu if clicking outside
        const addActionContainer = document.querySelector('.add-action-container.open');
        if (addActionContainer && !addActionContainer.contains(e.target)) {
            addActionContainer.classList.remove('open');
            isAddActionMenuOpen = false;
        }

        // Close context menus if clicking outside
        if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.contains(e.target)) {
            hideCategoryContextMenu();
        }
        if (itemContextMenu.element && !itemContextMenu.element.contains(e.target)) {
            hideItemContextMenu();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                const closeButton = openModal.querySelector('.close-button');
                if (closeButton) closeButton.click();
            }
            hideCategoryContextMenu();
            hideItemContextMenu();
        }
    });
}

function handleRenameCategoryFromContextMenu() {
    if (!currentContextMenuTargetTab) return;
    const categoryId = currentContextMenuTargetTab.dataset.categoryId;
    const category = getCategoryById(categoryId);
    openNameEntryModal('rename', 'category', category, category.name);
    hideCategoryContextMenu();
}

function handleDeleteCategoryFromContextMenu() {
    if (!currentContextMenuTargetTab) return;
    const categoryId = currentContextMenuTargetTab.dataset.categoryId;
    const category = getCategoryById(categoryId);
    showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}" and all its contents? This action cannot be undone.`);
    hideCategoryContextMenu();
}

function openNameEntryModal(mode, type, item = null, defaultName = '') {
    // mode: 'create' or 'rename'
    // type: 'category', 'folder', 'note', 'tasklist'
    tempItemCreationData = { mode, type, itemToRename: item };

    domElements.nameEntryTitle.textContent = `${mode === 'create' ? 'Create' : 'Rename'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    domElements.confirmNameEntryButton.textContent = mode === 'create' ? 'Create' : 'Rename';
    domElements.nameEntryInput.value = defaultName;

    domElements.nameEntryModal.classList.add('opening');
    domElements.nameEntryModal.classList.remove('hidden');
    domElements.nameEntryInput.focus();
    domElements.nameEntryInput.select();
}

function closeNameEntryModal() {
    domElements.nameEntryModal.classList.add('hidden');
    domElements.nameEntryModal.classList.remove('opening');
    tempItemCreationData = null;
}

function handleConfirmNameEntry() {
    const name = domElements.nameEntryInput.value.trim();
    if (!name) {
        alert("Name cannot be empty.");
        return;
    }
    
    const { mode, type, itemToRename } = tempItemCreationData;

    if (mode === 'create') {
        const parentList = getItemsForPath(currentPath);
        
        if (type === 'category') {
            const newCategory = {
                id: createUniqueId('cat'),
                name: name,
                order: currentCategories.length,
                deletable: true,
                type: tempItemCreationData.categoryType || 'standard'
            };
            currentCategories.push(newCategory);
            saveUserCategories(currentCategories);
            appContent[newCategory.id] = [];
            saveAppContent();
            renderTabs();
            renderAllCategorySections();
            switchTab(newCategory.id);
        } else { // folder, note, or tasklist
            const newItem = {
                id: createUniqueId(type),
                type: type,
                name: name,
                order: parentList.length,
                content: (type === 'folder' || type === 'tasklist') ? [] : '',
            };
            parentList.push(newItem);
            saveAppContent();
            renderCategorySectionContent(currentPath[0].id);
        }
    } else if (mode === 'rename') {
        if (type === 'category') {
            itemToRename.name = name;
            saveUserCategories(currentCategories);
            renderTabs();
            // Update the title in the section header if it's the current tab
            if (activeTabId === itemToRename.id) {
                const section = document.getElementById(`category-section-${itemToRename.id}`);
                if (section) {
                    section.querySelector('.category-title-text').textContent = name;
                }
            }
        } else { // folder, note, tasklist
             const itemInfo = findItemAndParent(itemToRename.id);
             if (itemInfo) {
                itemInfo.item.name = name;
                saveAppContent();
                renderCategorySectionContent(currentPath[0].id);
             }
        }
    }

    closeNameEntryModal();
}

function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) domElements.categoryTabContextMenu.classList.add('hidden');
    const visibleIcon = document.querySelector('.tab-options-icon.visible');
    if (visibleIcon) visibleIcon.classList.remove('visible');
    currentContextMenuTargetTab = null;
}

function showCategoryContextMenu(categoryId, tabButton) {
    const category = getCategoryById(categoryId);
    if (!category) return;
    hideCategoryContextMenu(); // Hide any other open menus
    
    currentContextMenuTargetTab = tabButton;

    const rect = tabButton.getBoundingClientRect();
    domElements.categoryTabContextMenu.style.top = `${rect.bottom + 5}px`;
    domElements.categoryTabContextMenu.style.left = `${rect.left}px`;
    
    domElements.ctxDeleteCategory.disabled = category.deletable === false;
    domElements.ctxDeleteCategory.title = category.deletable === false ? "Default categories cannot be deleted." : "";

    domElements.categoryTabContextMenu.classList.remove('hidden');
    tabButton.querySelector('.tab-options-icon')?.classList.add('visible');
}

function showItemContextMenu(button, item) {
    hideItemContextMenu(); // Close any other open menu

    const popover = document.createElement('div');
    popover.className = 'context-menu item-options-popover';
    popover.setAttribute('role', 'menu');

    // Create Rename button
    const renameBtn = document.createElement('button');
    renameBtn.setAttribute('role', 'menuitem');
    renameBtn.textContent = 'Rename';
    renameBtn.onclick = (e) => {
        e.stopPropagation();
        openNameEntryModal('rename', item.type, item);
        hideItemContextMenu();
    };

    // Create Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('role', 'menuitem');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        showDeleteConfirmation(item.type, item.id, `Are you sure you want to delete this ${item.type}? This action cannot be undone.`);
        hideItemContextMenu();
    };
    
    popover.appendChild(renameBtn);
    popover.appendChild(deleteBtn);

    document.body.appendChild(popover);

    // Position the popover
    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    
    let top = buttonRect.bottom + 5;
    let left = buttonRect.left;

    // Adjust if it goes off-screen
    if (left + popoverRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popoverRect.width - 10;
    }
    if (top + popoverRect.height > window.innerHeight - 10) {
        top = buttonRect.top - popoverRect.height - 5;
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;

    itemContextMenu.element = popover;
    itemContextMenu.target = item;
}

function hideItemContextMenu() {
    if (itemContextMenu.element) {
        itemContextMenu.element.remove();
        itemContextMenu = { element: null, target: null };
    }
}

function toggleSidePanel() {
    const isOpen = domElements.hamburgerButton.classList.toggle('open');
    domElements.sidePanelMenu.classList.toggle('open');
    domElements.sidePanelOverlay.classList.toggle('hidden');
    domElements.hamburgerButton.setAttribute('aria-expanded', isOpen.toString());
    domElements.sidePanelMenu.setAttribute('aria-hidden', (!isOpen).toString());
}

function closeSidePanel() {
    domElements.hamburgerButton.classList.remove('open');
    domElements.sidePanelMenu.classList.remove('open');
    domElements.sidePanelOverlay.classList.add('hidden');
    domElements.hamburgerButton.setAttribute('aria-expanded', 'false');
    domElements.sidePanelMenu.setAttribute('aria-hidden', 'true');
}


function handleDragStart(e, item) {
    // Prevents dragging if an input/button inside has focus
    if (document.activeElement !== document.body && e.target.contains(document.activeElement)) {
        e.preventDefault();
        return;
    }
    draggedItemId = item.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    setTimeout(() => {
        e.target.style.opacity = '0.5';
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    const targetFolderEl = e.target.closest('.item.type-folder');
    if (targetFolderEl) {
        targetFolderEl.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetFolderEl = e.target.closest('.item.type-folder');
    if (targetFolderEl) {
        targetFolderEl.classList.remove('drag-over');
    }
}

function handleDrop(e, targetFolderItem) {
    e.preventDefault();
    e.stopPropagation();

    const targetFolderEl = e.target.closest('.item.type-folder');
    if (targetFolderEl) {
        targetFolderEl.classList.remove('drag-over');
    }
    
    if (!draggedItemId || draggedItemId === targetFolderItem.id) {
        draggedItemId = null;
        renderCategorySectionContent(currentPath[0].id); // Redraw to reset opacity
        return;
    }

    const { item: draggedItem, parentList: sourceParentList } = findItemAndParent(draggedItemId);

    if (draggedItem && sourceParentList) {
        // Remove from source
        const itemIndex = sourceParentList.findIndex(i => i.id === draggedItemId);
        sourceParentList.splice(itemIndex, 1);

        // Add to destination
        if (!targetFolderItem.content) {
            targetFolderItem.content = [];
        }
        draggedItem.order = targetFolderItem.content.length;
        targetFolderItem.content.push(draggedItem);
        
        saveAppContent();
        renderCategorySectionContent(currentPath[0].id);
    }
    
    draggedItemId = null;
}

function openProgressEditor(trackerId = null) {
    currentlyEditingProgressTrackerId = trackerId;

    if (trackerId) {
        const tracker = progressTrackers.find(t => t.id === trackerId);
        if (tracker) {
            domElements.progressEditorTitle.textContent = 'Edit Progress Tracker';
            domElements.progressNameInput.value = tracker.name;
            domElements.progressTargetInput.value = tracker.targetPoints;
            domElements.progressTypeSelect.value = tracker.type;
            if (tracker.type === 'custom') {
                domElements.progressCustomDatesContainer.classList.remove('hidden');
                domElements.progressStartDate.value = tracker.startDate || '';
                domElements.progressEndDate.value = tracker.endDate || '';
            } else {
                domElements.progressCustomDatesContainer.classList.add('hidden');
            }
        }
    } else {
        domElements.progressEditorTitle.textContent = 'New Progress Tracker';
        domElements.progressNameInput.value = '';
        domElements.progressTargetInput.value = '10000';
        domElements.progressTypeSelect.value = 'weekly';
        domElements.progressCustomDatesContainer.classList.add('hidden');
    }
    
    domElements.progressEditorModal.classList.add('opening');
    domElements.progressEditorModal.classList.remove('hidden');
    domElements.progressNameInput.focus();
}

function closeProgressEditor() {
    domElements.progressEditorModal.classList.add('hidden');
    domElements.progressEditorModal.classList.remove('opening');
    currentlyEditingProgressTrackerId = null;
}

function saveProgressTracker() {
    const name = domElements.progressNameInput.value.trim();
    const targetPoints = parseInt(domElements.progressTargetInput.value, 10);
    const type = domElements.progressTypeSelect.value;
    
    if (!name) {
        alert('Tracker name cannot be empty.');
        return;
    }
    if (isNaN(targetPoints) || targetPoints <= 0) {
        alert('Target points must be a positive number.');
        return;
    }

    if (currentlyEditingProgressTrackerId) {
        const tracker = progressTrackers.find(t => t.id === currentlyEditingProgressTrackerId);
        if (tracker) {
            tracker.name = name;
            tracker.targetPoints = targetPoints;
            tracker.type = type;
            if (type === 'custom') {
                tracker.startDate = domElements.progressStartDate.value;
                tracker.endDate = domElements.progressEndDate.value;
            }
        }
    } else {
        const newTracker = {
            id: createUniqueId('progress'),
            name,
            targetPoints,
            type,
            order: progressTrackers.length,
            isArchived: false,
        };
        if (type === 'custom') {
            newTracker.startDate = domElements.progressStartDate.value;
            newTracker.endDate = domElements.progressEndDate.value;
        }
        progressTrackers.push(newTracker);
    }
    saveProgressTrackers();
    renderProgressManagementList();
    renderMainProgressBars();
    closeProgressEditor();
}

function renderProgressManagementList() {
    if (!domElements.progressManagementList) return;
    
    const activeList = domElements.activeProgressList;
    const archivedList = domElements.archivedProgressList;
    
    activeList.innerHTML = '';
    archivedList.innerHTML = '';

    const activeTrackers = progressTrackers.filter(t => !t.isArchived).sort((a,b) => a.order - b.order);
    const archivedTrackers = progressTrackers.filter(t => t.isArchived);

    if(activeTrackers.length === 0) {
        activeList.innerHTML = '<p class="empty-tasks-message">No active progress trackers.</p>';
    } else {
        activeTrackers.forEach(tracker => {
            const itemEl = createProgressTrackerItemEl(tracker);
            activeList.appendChild(itemEl);
        });
    }

    if(archivedTrackers.length === 0) {
        archivedList.innerHTML = '<p class="empty-tasks-message">No archived progress history.</p>';
    } else {
         archivedTrackers.forEach(tracker => {
            const itemEl = createProgressHistoryItemEl(tracker);
            archivedList.appendChild(itemEl);
        });
    }
}

function createProgressTrackerItemEl(tracker) {
    const itemEl = document.createElement('div');
    itemEl.className = 'progress-tracker-item';
    itemEl.innerHTML = `
        <div class="progress-tracker-info">
            <h4>${tracker.name}</h4>
            <p>Target: ${tracker.targetPoints} points, Duration: ${tracker.type}</p>
        </div>
        <div class="progress-tracker-actions">
            <button class="icon-button item-edit" title="Edit"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg></button>
            <button class="icon-button item-delete" title="Delete"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button>
        </div>
    `;
    itemEl.querySelector('.item-edit').addEventListener('click', () => openProgressEditor(tracker.id));
    itemEl.querySelector('.item-delete').addEventListener('click', () => {
        showDeleteConfirmation('progressTracker', tracker.id);
    });
    return itemEl;
}

function createProgressHistoryItemEl(tracker) {
    const itemEl = document.createElement('div');
    itemEl.className = 'progress-history-item';
    
    // Placeholder logic - real implementation would calculate these values
    const progressStatusClass = 'progress-status-incomplete';
    const progressStatusText = 'Incomplete';
    const pointsText = '0 / ' + tracker.targetPoints;

    itemEl.innerHTML = `
        <div class="progress-history-item-header">
            <h4>${tracker.name}</h4>
            <span class="progress-status ${progressStatusClass}">${progressStatusText}</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: 0%;"></div>
        </div>
        <p class="points-stat">${pointsText} Points</p>
    `;
    itemEl.addEventListener('click', () => openProgressHistoryDetailModal(tracker.id));
    return itemEl;
}

function openProgressHistoryDetailModal(trackerId) {
    const tracker = progressTrackers.find(t => t.id === trackerId);
    if (!tracker) return;
    activeProgressDetailTracker = tracker;

    domElements.progressHistoryDetailTitle.textContent = `${tracker.name} History`;

    renderProgressHistoryCalendar(tracker);
    renderProgressHistoryDailySummary(tracker, null); // Render empty initially
    
    domElements.progressHistoryDetailModal.classList.add('opening');
    domElements.progressHistoryDetailModal.classList.remove('hidden');
}

function closeProgressHistoryDetailModal() {
    domElements.progressHistoryDetailModal.classList.add('hidden');
    domElements.progressHistoryDetailModal.classList.remove('opening');
    activeProgressDetailTracker = null;
}

function renderProgressHistoryCalendar(tracker) {
    // This is a complex feature. For now, it will be a simplified list of dates.
    const calendarView = domElements.progressHistoryCalendarView;
    calendarView.innerHTML = '<p>Calendar view is under development. A list of completed days will appear here.</p>';
}

function renderProgressHistoryDailySummary(tracker, dateString) {
    const summaryView = domElements.progressHistoryDailySummary;
    if (!dateString) {
        summaryView.innerHTML = '<div class="daily-summary-card"><p>Select a day from the calendar to see details.</p></div>';
        return;
    }
    
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const historyDataString = localStorage.getItem(historyKey);
    if (!historyDataString) {
        summaryView.innerHTML = '<div class="daily-summary-card"><p>No data found for this day.</p></div>';
        return;
    }
    // ... rendering logic for summary card
}

function openTimeProgressModal() {
    domElements.timeProgressModal.classList.add('opening');
    domElements.timeProgressModal.classList.remove('hidden');
    updateTimeProgress();
    if (!timeProgressInterval) {
        timeProgressInterval = setInterval(updateTimeProgress, 60000); // Update every minute
    }
}

function closeTimeProgressModal() {
    domElements.timeProgressModal.classList.add('hidden');
    domElements.timeProgressModal.classList.remove('opening');
    if (timeProgressInterval) {
        clearInterval(timeProgressInterval);
        timeProgressInterval = null;
    }
}

function updateTimeProgress() {
    if (domElements.timeProgressModal.classList.contains('hidden')) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 30, 0);  // 5:30 AM
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30, 0); // 9:30 PM

    const totalDuration = endOfDay.getTime() - startOfDay.getTime();
    const elapsedTime = now.getTime() - startOfDay.getTime();

    let percentageUsed = (elapsedTime / totalDuration) * 100;
    percentageUsed = Math.max(0, Math.min(100, percentageUsed));

    const timeBar = domElements.timeProgressBar;
    timeBar.style.width = `${percentageUsed}%`;
    
    // Color goes from green (start of day) to red (end of day).
    // This means we color based on time REMAINING. 100% remaining = green. 0% remaining = red.
    const percentageRemaining = 100 - percentageUsed;
    applyProgressStyles(timeBar, percentageRemaining);

    const remainingTimeMs = Math.max(0, endOfDay.getTime() - now.getTime());
    const remainingHours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    domElements.timeProgressPercentage.textContent = `${Math.round(percentageUsed)}% of time used`;
    domElements.timeProgressRemaining.textContent = `${remainingHours}h ${remainingMinutes}m remaining`;

    // Task progress bar
    const dailyTracker = progressTrackers.find(t => t.type === 'daily');
    if (dailyTracker) {
        const progress = calculateProgressForPeriod(dailyTracker);
        const modalTaskBar = domElements.modalTaskProgressBar;
        modalTaskBar.style.width = `${progress.percentage}%`;
        applyProgressStyles(modalTaskBar, progress.percentage);
        domElements.modalTaskProgressStats.textContent = `${progress.pointsEarned} / ${progress.totalPoints} Points (${progress.percentage}%)`;
    } else {
        const modalTaskBar = domElements.modalTaskProgressBar;
        modalTaskBar.style.width = `0%`;
        applyProgressStyles(modalTaskBar, 0);
        domElements.modalTaskProgressStats.textContent = `No daily tracker found.`;
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', initialize);
