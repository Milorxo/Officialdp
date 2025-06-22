

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default categories and tasks if nothing in localStorage
const DEFAULT_CATEGORIES_CONFIG = [
  { id: 'routine', name: 'Routine', order: 0, deletable: false, tasks: [
    "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
    "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
    "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
  ]},
  { id: 'health', name: 'Health', order: 1, deletable: false, tasks: [
    "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
    "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
    "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
    "Shower consistently", "Social media < 1 hour"
  ]},
  { id: 'god', name: 'God', order: 2, deletable: false, tasks: [
    "Self-Bible Study", "Thursday congregation", "Sunday congregation",
    "Be the person God expects"
  ]},
  { id: 'personal', name: 'Personal', order: 3, deletable: false, tasks: ["Content creation"] },
];


const DAILY_TARGET_POINTS = 2700;
const TARGET_POINTS_FOR_WEEKLY_VIEW = 20000;

// Old keys (for migration)
const OLD_STORAGE_KEY_TASK_PREFIX = 'lifeTrackerTask_';
const OLD_USER_DEFINED_TASKS_KEY = 'lifeTrackerUserDefinedTasks_v2'; 

// New and existing keys
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_'; // For main daily reflection
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; 
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; // Stays same for category definitions
const APP_FOLDERS_KEY = 'lifeTrackerAppFolders_v1'; // New key for folder structures and their task definitions/note content
const TASK_STATE_STORAGE_KEY_PREFIX = 'lifeTrackerTaskState_'; // For daily completion status: taskState_{date}_{folderId}_{taskId}


let currentCategories = []; 
let foldersByCategoryId = {}; // Main data structure for folders and their content definitions

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let draggedTaskElement = null; // For tasks within a folder
let itemToDelete = null; // { type: 'task' | 'folder' | 'category', id: string, nameForConfirmation?: string, categoryId?: string, folderId?: string }
let currentCategoryView = { mode: 'folders', categoryId: null, folderId: null }; // Tracks if showing folders, task folder content, or note folder content
let currentFolderEditModes = {}; // { folderId: boolean } for task reordering/editing within a task folder
let activeAddTaskForm = null; // { categoryId, folderId, position }
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;
let longPressTimer = null;
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null; // For category tabs
let currentContextMenuTargetFolderBox = null; // For folder boxes (the visual square)
let midnightTimer = null;
let tempFolderCreationData = null; // { type: 'task' | 'note', categoryId: string }


// DOM Elements
const domElements = {
  tabsContainer: null,
  tabContentsContainer: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  folderOptionsContextMenu: null,
  ctxRenameFolderButton: null,
  ctxDeleteFolderButton: null,
  
  dashboardSummariesContainer: null,
  todayProgressFill: null,
  todayPointsStat: null,
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
  dailyNoteInput: null, // Main daily reflection
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
  chooseFolderTypeModal: null,
  chooseFolderTypeCloseButton: null,
  selectTaskFolderButton: null,
  selectNoteFolderButton: null,
  enterFolderNameModal: null,
  enterFolderNameCloseButton: null,
  enterFolderNameTitle: null,
  folderNameInput: null,
  createFolderButton: null,
  cancelCreateFolderButton: null,
  imageUploadInput: null,
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

// Generates storage key for a task's daily completion status
function getTaskStateStorageKey(date, folderId, taskId) {
  return `${TASK_STATE_STORAGE_KEY_PREFIX}${date}_${folderId}_${taskId}`;
}

// Category and Folder/Task Data Management
function loadUserCategories() {
    const storedCategories = localStorage.getItem(USER_CATEGORIES_KEY);
    if (storedCategories) {
        try {
            return JSON.parse(storedCategories);
        } catch (e) {
            console.error("Error parsing stored categories:", e);
        }
    }
    return DEFAULT_CATEGORIES_CONFIG.map(cat => ({
        id: cat.id,
        name: cat.name,
        order: cat.order,
        deletable: cat.deletable !== undefined ? cat.deletable : true, 
    }));
}

function saveUserCategories(categories) {
    localStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(categories.sort((a,b) => a.order - b.order)));
}

function loadFoldersByCategoryId() {
    const storedFolders = localStorage.getItem(APP_FOLDERS_KEY);
    if (storedFolders) {
        try {
            return JSON.parse(storedFolders);
        } catch (e) {
            console.error("Error parsing stored folders:", e);
        }
    }
    return {}; // Initialize as empty if not found
}

function saveFoldersByCategoryId(folders) {
    localStorage.setItem(APP_FOLDERS_KEY, JSON.stringify(folders));
}

function migrateOldTaskStructure() {
    const oldTasksData = localStorage.getItem(OLD_USER_DEFINED_TASKS_KEY);
    if (!oldTasksData) return false; // No old data to migrate

    console.log("Old task structure found. Migrating to new folder system...");
    try {
        const oldTasksByCatId = JSON.parse(oldTasksData);
        const newFoldersByCatId = {};
        const today = getTodayDateString(); // For migrating task states for today

        currentCategories.forEach(category => {
            const defaultFolderId = createUniqueId(`folder-${category.id}-default`);
            const newFolder = {
                id: defaultFolderId,
                name: "Tasks", // Default folder name
                type: "task",
                categoryId: category.id,
                order: 0,
                content: [] // Task definitions
            };

            const categoryOldTasks = oldTasksByCatId[category.id] || [];
            categoryOldTasks.forEach(oldTaskDef => {
                const newTaskId = oldTaskDef.id || createUniqueId('task'); // Ensure ID exists
                newFolder.content.push({
                    id: newTaskId,
                    text: oldTaskDef.text,
                    // categoryId is implicit via parent folder
                });

                // Migrate completion status for today if exists
                const oldTaskStatusKey = `${OLD_STORAGE_KEY_TASK_PREFIX}${newTaskId}_${today}`;
                const oldStatus = localStorage.getItem(oldTaskStatusKey);
                if (oldStatus === 'true') {
                    localStorage.setItem(getTaskStateStorageKey(today, defaultFolderId, newTaskId), 'true');
                }
                localStorage.removeItem(oldTaskStatusKey); // Clean up old status key
            });
            
            newFoldersByCatId[category.id] = [newFolder];
        });

        foldersByCategoryId = newFoldersByCatId;
        saveFoldersByCategoryId(foldersByCategoryId);
        localStorage.removeItem(OLD_USER_DEFINED_TASKS_KEY); // Remove old data structure
        // Also clean up all OLD_STORAGE_KEY_TASK_PREFIX for other dates (might be extensive, or rely on monthly cleanup)
        // For simplicity, we only migrated today's states. Other historical data in old format would be lost unless a more complex migration is done.
        // The prompt implies preserving user tasks, which this does for their definitions.
        console.log("Migration complete.");
        return true; // Migration occurred
    } catch (e) {
        console.error("Error migrating old task structure:", e);
        return false;
    }
}


function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    
    // Attempt migration first if new folder key doesn't exist but old task key does
    if (!localStorage.getItem(APP_FOLDERS_KEY) && localStorage.getItem(OLD_USER_DEFINED_TASKS_KEY)) {
        migrateOldTaskStructure(); // This will populate foldersByCategoryId
    } else {
        foldersByCategoryId = loadFoldersByCategoryId();
    }

    let categoriesUpdated = false;
    let foldersUpdated = false;

    if (!currentCategories || currentCategories.length === 0) {
        currentCategories = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
            id: cat.id, name: cat.name, order: cat.order, deletable: cat.deletable !== undefined ? cat.deletable : true,
        }));
        categoriesUpdated = true;
    }
    
    // Ensure every category has at least a default "Tasks" folder if no folders exist for it.
    // This also handles the case where APP_FOLDERS_KEY was empty or new categories were added.
    currentCategories.forEach(category => {
        if (!foldersByCategoryId[category.id] || foldersByCategoryId[category.id].length === 0) {
            const defaultFolderId = createUniqueId(`folder-${category.id}-default`);
            const defaultFolder = {
                id: defaultFolderId,
                name: "Tasks",
                type: "task",
                categoryId: category.id,
                order: 0,
                content: [] // Task definitions
            };

            // If it's a default category from initial config, populate its tasks
            const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === category.id);
            if (defaultConfigCat && defaultConfigCat.tasks) {
                defaultFolder.content = defaultConfigCat.tasks.map(taskText => ({
                    id: createUniqueId('task'),
                    text: taskText,
                }));
            }
            foldersByCategoryId[category.id] = [defaultFolder];
            foldersUpdated = true;
        }
        // Initialize edit mode for task folders (if any)
        (foldersByCategoryId[category.id] || []).forEach(folder => {
            if (folder.type === 'task' && currentFolderEditModes[folder.id] === undefined) {
                currentFolderEditModes[folder.id] = false;
            }
        });
    });

    if (categoriesUpdated) saveUserCategories(currentCategories);
    if (foldersUpdated) saveFoldersByCategoryId(foldersByCategoryId);
}


// Gets all task definitions for a specific folder
function getTaskDefinitionsForFolder(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder && folder.type === 'task') {
            return folder.content || [];
        }
    }
    return [];
}
// Gets all tasks with their current day completion status for a folder
function getTasksForFolderForDay(folderId, dateString) {
    const taskDefinitions = getTaskDefinitionsForFolder(folderId);
    return taskDefinitions.map(taskDef => ({
        ...taskDef,
        completed: localStorage.getItem(getTaskStateStorageKey(dateString, folderId, taskDef.id)) === 'true'
    }));
}

function saveTaskStatus(folderId, taskId, completed, dateString) {
  localStorage.setItem(getTaskStateStorageKey(dateString, folderId, taskId), completed.toString());
}

function getCategoryNameById(categoryId) {
    const category = currentCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
}
function getFolderNameById(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder) return folder.name;
    }
    return "Unknown Folder";
}


function saveDailyNote() { 
    if (!domElements.dailyNoteInput) return;
    const currentActiveDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;
    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentActiveDate, noteContent);

    if (currentActiveDate === getTodayDateString() && currentModalDate === currentActiveDate) {
        const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentActiveDate;
        const historyDataString = localStorage.getItem(historyKey);
        if (historyDataString) {
            try {
                let historyEntry = JSON.parse(historyDataString);
                historyEntry.userNote = noteContent; // Main reflection
                localStorage.setItem(historyKey, JSON.stringify(historyEntry));
            } catch (e) { console.warn("Could not live update history main reflection", e); }
        }
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
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateToSave;
    const { pointsEarned, percentageCompleted, totalTasks } = calculateProgressForDate(dateToSave);
    
    const completedTasksHistory = {}; // By category, then by folder
    currentCategories.forEach(cat => {
      completedTasksHistory[cat.id] = {};
      (foldersByCategoryId[cat.id] || []).forEach(folder => {
        if (folder.type === 'task') {
          completedTasksHistory[cat.id][folder.id] = { name: folder.name, tasks: [] };
          const tasksInFolder = getTasksForFolderForDay(folder.id, dateToSave);
          tasksInFolder.forEach(task => {
            if (task.completed) {
              completedTasksHistory[cat.id][folder.id].tasks.push(task.text);
            }
          });
          // Remove folder from history if it had no completed tasks
          if(completedTasksHistory[cat.id][folder.id].tasks.length === 0) {
            delete completedTasksHistory[cat.id][folder.id];
          }
        }
      });
      // Remove category from history if it had no folders with completed tasks
      if(Object.keys(completedTasksHistory[cat.id]).length === 0) {
        delete completedTasksHistory[cat.id];
      }
    });

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    // Note: Individual note folder contents are already persisted via saveFoldersByCategoryId.
    // History could snapshot them, but for now, history focuses on tasks and main reflection.

    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory, // New structure
        userNote: mainReflection, // Main daily reflection
        pointsEarned: pointsEarned,
        percentageCompleted: percentageCompleted,
        totalTasksOnDate: totalTasks,
        dailyTargetPoints: DAILY_TARGET_POINTS
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    // Clean up daily task states for the saved day
    currentCategories.forEach(cat => {
        (foldersByCategoryId[cat.id] || []).forEach(folder => {
            if (folder.type === 'task') {
                (folder.content || []).forEach(taskDef => {
                    localStorage.removeItem(getTaskStateStorageKey(dateToSave, folder.id, taskDef.id));
                });
            }
        });
    });
    // Don't remove main daily note, it's part of history now
    // localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave); 
    
    console.log(`History finalized and saved for ${dateToSave}:`, historyEntry);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TASK_STATE_STORAGE_KEY_PREFIX)) {
        // taskState_{date}_{folderId}_{taskId} -> date is YYYY-MM-DD
        const parts = key.split('_');
        if (parts.length > 1) {
            const datePart = parts[1];
            if (datePart && datePart.length >= 7) { 
                const monthYearOfKey = datePart.substring(0, 7); 
                if (monthYearOfKey === lastProcessedMonthYear) { 
                    localStorage.removeItem(key);
                }
            }
        }
      }
    }
  }
  localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear);
}


function loadAppData() {
  seedInitialDataIfNeeded(); // This now handles migration and default folder creation

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`);
    saveDayToHistory(lastVisitDateStr);
    // Task states for new day are inherently "not completed" as keys won't exist yet
  } else if (!lastVisitDateStr) {
    console.log("First visit or no last visit date found. Initializing for today.");
    // No specific task initialization needed as they default to incomplete
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  checkAndClearOldMonthlyData();
  loadCurrentDayNote(); // Main reflection
  
  calendarDisplayDate = new Date(); // Current month for calendar
  calendarDisplayDate.setDate(1); 
  calendarDisplayDate.setHours(0,0,0,0); 
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
  scheduleMidnightTask();
}

function handleMidnightReset() {
    console.log("Midnight reset triggered.");
    const dateThatJustEnded = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE); 
    
    if (!dateThatJustEnded) {
        console.error("Cannot perform midnight reset: last visit date unknown.");
        scheduleMidnightTask(); 
        return;
    }

    saveDayToHistory(dateThatJustEnded);

    const newCurrentDate = getTodayDateString();
    localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, newCurrentDate);
    
    if (domElements.dailyNoteInput) domElements.dailyNoteInput.value = ''; 
    loadCurrentDayNote();

    if (domElements.todayPointsStat) domElements.todayPointsStat.classList.add('progress-value-resetting');
    if (domElements.todayProgressFill) domElements.todayProgressFill.classList.add('progress-value-resetting');
    
    updateAllProgress(); 

    setTimeout(() => {
        if (domElements.todayPointsStat) domElements.todayPointsStat.classList.remove('progress-value-resetting');
        if (domElements.todayProgressFill) domElements.todayProgressFill.classList.remove('progress-value-resetting');
    }, 500); 
    
    scheduleMidnightTask(); 
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

// Drag & Drop for tasks within a folder
function getDragAfterElement(container, y) {
    const draggableElements = Array.from(container.querySelectorAll('.task-item:not(.dragging):not(.editing)'));
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

// Toggle edit mode for tasks within a specific task folder
function toggleTaskFolderEditMode(folderId) {
    currentFolderEditModes[folderId] = !currentFolderEditModes[folderId];
    // Re-render the task folder content to reflect edit mode changes (show/hide delete buttons, make draggable etc.)
    const folder = findFolderById(folderId);
    if (folder) {
        renderTaskFolderContents(folder.categoryId, folderId);
    }
}

// Add Task form within a Task Folder
function showTempAddTaskForm(categoryId, folderId, position) {
    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position, false);
    }
    activeAddTaskForm = { categoryId, folderId, position };
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;

    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = taskFolderContentEl.querySelector(formContainerClass);
    if (!formContainer) return;
    
    formContainer.querySelector('.add-item-trigger-button')?.classList.add('hidden');
    formContainer.querySelector('.new-temp-task-form')?.classList.remove('hidden');
    formContainer.querySelector('.new-task-temp-input')?.focus();
}

function hideTempAddTaskForm(categoryId, folderId, position, resetActiveForm = true) {
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;
    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = taskFolderContentEl.querySelector(formContainerClass);
    if (!formContainer) return;

    formContainer.querySelector('.add-item-trigger-button')?.classList.remove('hidden');
    const form = formContainer.querySelector('.new-temp-task-form');
    form?.classList.add('hidden');
    const input = form.querySelector('.new-task-temp-input');
    if (input) input.value = '';
    if (resetActiveForm) activeAddTaskForm = null;
}

function handleSaveTempTask(categoryId, folderId, position) {
    const taskFolderContentEl = document.getElementById(`task-folder-content-${folderId}`);
    if (!taskFolderContentEl) return;
    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const input = taskFolderContentEl.querySelector(`${formContainerClass} .new-task-temp-input`);
    const taskText = input.value.trim();

    if (taskText) {
        const newTaskDefinition = { id: createUniqueId('task'), text: taskText };
        const categoryFolders = foldersByCategoryId[categoryId] || [];
        const folder = categoryFolders.find(f => f.id === folderId);

        if (folder && folder.type === 'task') {
            if (!folder.content) folder.content = [];
            if (position === 'top') {
                folder.content.unshift(newTaskDefinition);
            } else {
                folder.content.push(newTaskDefinition);
            }
            saveFoldersByCategoryId(foldersByCategoryId);
            renderTaskFolderContents(categoryId, folderId); // Re-render tasks for this folder
            updateAllProgress();
            hideTempAddTaskForm(categoryId, folderId, position);
        }
    } else {
        alert('Task text cannot be empty.');
    }
}

function findFolderById(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder) return folder;
    }
    return null;
}
function getTaskDefinitionById(folderId, taskId) {
    const folder = findFolderById(folderId);
    if (folder && folder.type === 'task' && folder.content) {
        return folder.content.find(taskDef => taskDef.id === taskId);
    }
    return null;
}


function startTaskEdit(taskItemElement, folderId, taskDef) {
    if (taskItemElement.classList.contains('editing')) return;
    taskItemElement.classList.add('editing');
    
    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if (taskTextSpan) taskTextSpan.style.display = 'none';

    const editControls = domElements.taskEditControlsTemplate.cloneNode(true);
    editControls.removeAttribute('id'); 
    editControls.style.display = 'flex'; 

    const input = editControls.querySelector('.task-edit-input');
    input.value = taskDef.text;

    editControls.querySelector('.task-edit-save').onclick = () => saveTaskEdit(folderId, taskDef.id, input.value, taskItemElement, editControls);
    editControls.querySelector('.task-edit-cancel').onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan);
    
    const deleteButton = taskItemElement.querySelector('.task-delete-button-editmode');
    if (deleteButton) taskItemElement.insertBefore(editControls, deleteButton);
    else taskItemElement.appendChild(editControls);
    
    input.focus();
    input.select();
}

function saveTaskEdit(folderId, taskId, newText, taskItemElement, editControls) {
    newText = newText.trim();
    if (!newText) {
        alert("Task text cannot be empty.");
        return;
    }
    const folder = findFolderById(folderId);
    if (folder && folder.type === 'task' && folder.content) {
        const taskIndex = folder.content.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            folder.content[taskIndex].text = newText;
            saveFoldersByCategoryId(foldersByCategoryId);
        }
    }
    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if(taskTextSpan) {
        taskTextSpan.textContent = newText; 
        taskTextSpan.style.display = ''; 
    }
    taskItemElement.classList.remove('editing');
    editControls.remove();
}

function cancelTaskEdit(taskItemElement, editControls, taskTextSpan) {
    if (taskTextSpan) taskTextSpan.style.display = ''; 
    taskItemElement.classList.remove('editing');
    editControls.remove();
}

// Renders a single task item within a task folder view
function renderTaskItem(task, folderId, categoryId) { // task here includes .completed status for the day
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.dataset.folderId = folderId; // For drag/drop context
  item.setAttribute('role', 'listitem');
  item.setAttribute('tabindex', '0'); 

  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  item.appendChild(textSpan);

  const updateAriaLabel = () => {
    item.setAttribute('aria-label', `${task.text}, ${item.classList.contains('completed') ? 'completed' : 'not completed'}`);
  };

  if (task.completed) item.classList.add('completed');
  updateAriaLabel();

  if (currentFolderEditModes[folderId]) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button-editmode icon-button';
      deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
      deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteButton.title = "Delete Task";
      deleteButton.onclick = (e) => {
          e.stopPropagation(); 
          showDeleteConfirmation('task', task.id, `Are you sure you want to delete the task "${task.text}"? This will remove it permanently.`, task.text, categoryId, folderId);
      };
      item.appendChild(deleteButton);
  }

  item.addEventListener('click', (e) => {
    if (item.classList.contains('editing')) return;
    const taskDef = getTaskDefinitionById(folderId, task.id);
    if (!taskDef) return;

    if (currentFolderEditModes[folderId] && e.target === textSpan) {
        startTaskEdit(item, folderId, taskDef);
    } else if (!currentFolderEditModes[folderId]) {
        task.completed = !task.completed;
        saveTaskStatus(folderId, task.id, task.completed, localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString());
        item.classList.toggle('completed');
        updateAriaLabel();
        item.classList.remove('animate-task-complete', 'animate-task-uncomplete');
        void item.offsetWidth; 
        item.classList.add(task.completed ? 'animate-task-complete' : 'animate-task-uncomplete');
        updateAllProgress();
    }
  });

  item.addEventListener('keydown', (e) => {
    if (item.classList.contains('editing')) return;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const taskDef = getTaskDefinitionById(folderId, task.id);
        if (!taskDef) return;
        if (!currentFolderEditModes[folderId]) { 
            item.click(); 
        } else if (currentFolderEditModes[folderId] && document.activeElement === item) {
             startTaskEdit(item, folderId, taskDef);
        }
    }
  });

  if (currentFolderEditModes[folderId] && !item.classList.contains('editing')) {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
        if (!currentFolderEditModes[folderId] || item.classList.contains('editing')) {
            e.preventDefault();
            return;
        }
        draggedTaskElement = item;
        setTimeout(() => item.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedTaskElement = null;
        document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
            el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
        });
        
        const taskListElement = item.closest('.task-list');
        if (taskListElement) {
            const fId = taskListElement.dataset.folderId;
            const cId = taskListElement.dataset.categoryId;
            const newTaskOrderIds = Array.from(taskListElement.querySelectorAll('.task-item')).map(el => el.dataset.taskId);
            
            const folder = findFolderById(fId);
            if (folder && folder.type === 'task') {
                folder.content = newTaskOrderIds.map(id => folder.content.find(t => t.id === id)).filter(Boolean);
                saveFoldersByCategoryId(foldersByCategoryId);
                // No need to reorder currentTasks as it's not global in the same way now
            }
        }
    });
  } else {
    item.draggable = false;
  }
  return item;
}


function showDeleteConfirmation(type, id, message, nameForConfirmation = '', categoryId = null, folderId = null) {
    itemToDelete = { type, id, nameForConfirmation, categoryId, folderId };
    if (domElements.deleteConfirmationModal) {
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message;
        if(domElements.deleteConfirmationTitle) domElements.deleteConfirmationTitle.textContent = `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)} Deletion`;
        domElements.deleteConfirmationModal.classList.remove('hidden');
        domElements.confirmDeleteButton.focus();
    }
}

function confirmDeletion() {
    if (!itemToDelete) return;
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

    if (itemToDelete.type === 'task') {
        const { id: taskId, categoryId, folderId } = itemToDelete;
        const folder = findFolderById(folderId);
        if (folder && folder.type === 'task' && folder.content) {
            folder.content = folder.content.filter(t => t.id !== taskId);
            saveFoldersByCategoryId(foldersByCategoryId);
            // Clean up task state for all dates (complex, for now just today) - or rely on monthly cleanup
            localStorage.removeItem(getTaskStateStorageKey(today, folderId, taskId)); 
            renderTaskFolderContents(categoryId, folderId);
        }
    } else if (itemToDelete.type === 'folder') {
        const { id: folderId, categoryId } = itemToDelete;
        if (foldersByCategoryId[categoryId]) {
            foldersByCategoryId[categoryId] = foldersByCategoryId[categoryId].filter(f => f.id !== folderId);
            saveFoldersByCategoryId(foldersByCategoryId);
            // Clean up all task states for this folder (complex, rely on monthly cleanup or iterate history)
            // Clean up note content if it was a note folder and stored separately (not current plan)
            renderFolderSystemForCategory(categoryId, document.querySelector(`#category-section-${categoryId} .category-content-area`));
        }
    } else if (itemToDelete.type === 'category') {
        const categoryId = itemToDelete.id;
        const category = currentCategories.find(c => c.id === categoryId);
        if (category && category.deletable === false) {
            alert(`Category "${category.name}" is a default category and cannot be deleted.`);
        } else {
            currentCategories = currentCategories.filter(cat => cat.id !== categoryId);
            saveUserCategories(currentCategories);
            delete foldersByCategoryId[categoryId]; // Remove all its folders
            saveFoldersByCategoryId(foldersByCategoryId);
            // Clean up related task states and note contents (very complex without iterating all storage)

            document.getElementById(`tab-button-${categoryId}`)?.remove();
            document.getElementById(`category-section-${categoryId}`)?.remove();
            if (activeTabId === categoryId) switchTab('dashboard');
        }
    }

    updateAllProgress();
    hideDeleteConfirmation();
}

function hideDeleteConfirmation() {
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('hidden');
    }
    itemToDelete = null;
}

// Renders the content of a specific category section
// This will either be folder boxes or the content of a selected folder.
function renderCategorySectionContent(categoryId) {
    const sectionElement = document.getElementById(`category-section-${categoryId}`);
    if (!sectionElement) return;

    let contentArea = sectionElement.querySelector('.category-content-area');
    if (!contentArea) { // Create if not exists (e.g. from template)
        contentArea = document.createElement('div');
        contentArea.className = 'category-content-area';
        // Clear old direct task lists/add forms if they exist from old structure
        sectionElement.querySelectorAll('.task-list, .add-task-form-container').forEach(el => el.remove());
        sectionElement.appendChild(contentArea);
    }
    contentArea.innerHTML = ''; // Clear previous content

    // Hide category-level edit/undo buttons, they are folder-specific now
    sectionElement.querySelector('.category-header-controls')?.classList.add('hidden');


    if (currentCategoryView.categoryId === categoryId) {
        if (currentCategoryView.mode === 'folders') {
            renderFolderSystemForCategory(categoryId, contentArea);
        } else if (currentCategoryView.mode === 'task_folder') {
            renderTaskFolderContents(categoryId, currentCategoryView.folderId, contentArea);
        } else if (currentCategoryView.mode === 'note_folder') {
            renderNoteFolderContents(categoryId, currentCategoryView.folderId, contentArea);
        }
    }
}

// Renders the grid of folder boxes for a category
function renderFolderSystemForCategory(categoryId, container) {
    container.innerHTML = ''; // Clear existing content (e.g., if switching from folder view)
    
    const foldersGrid = document.createElement('div');
    foldersGrid.className = 'folders-grid';
    
    const folders = (foldersByCategoryId[categoryId] || []).sort((a,b) => a.order - b.order);
    folders.forEach(folder => {
        foldersGrid.appendChild(renderFolderBox(folder));
    });

    const addFolderBtn = document.createElement('button');
    addFolderBtn.className = 'add-folder-button';
    addFolderBtn.setAttribute('aria-label', 'Add new folder');
    addFolderBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>`;
    addFolderBtn.onclick = () => openChooseFolderTypeModal(categoryId);
    foldersGrid.appendChild(addFolderBtn);

    container.appendChild(foldersGrid);
}

// Renders a single folder box item (wrapper, box, name)
function renderFolderBox(folder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'folder-item-container';
    wrapper.dataset.folderId = folder.id;
    wrapper.dataset.categoryId = folder.categoryId;
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', `Open folder: ${folder.name}`);

    const box = document.createElement('div'); // The visual square
    box.className = 'folder-box';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'folder-box-icon';
    if (folder.type === 'task') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-10V7h14v2H7z"></path></svg>`;
    } else { // note
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`;
    }
    box.appendChild(iconDiv);

    const optionsTrigger = document.createElement('div');
    optionsTrigger.className = 'folder-options-trigger';
    optionsTrigger.innerHTML = `<span></span><span></span><span></span>`;
    optionsTrigger.setAttribute('aria-label', `Options for folder ${folder.name}`);
    optionsTrigger.setAttribute('role', 'button');
    optionsTrigger.tabIndex = 0; // Make focusable for keyboard
    optionsTrigger.onclick = (e) => { e.stopPropagation(); showFolderContextMenu(folder, box); }; // Pass `box` as target element
    optionsTrigger.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); showFolderContextMenu(folder, box); }};
    box.appendChild(optionsTrigger);
    
    wrapper.appendChild(box);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'folder-box-name';
    nameSpan.textContent = folder.name;
    wrapper.appendChild(nameSpan);
    
    wrapper.onclick = () => {
        currentCategoryView = {
            mode: folder.type === 'task' ? 'task_folder' : 'note_folder',
            categoryId: folder.categoryId,
            folderId: folder.id
        };
        renderCategorySectionContent(folder.categoryId);
    };
    wrapper.onkeydown = (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrapper.click(); }};

    return wrapper;
}


// Renders the content of a task folder (task list, add forms, controls)
function renderTaskFolderContents(categoryId, folderId, container) {
    if (!container) { // If container not passed, find it (e.g., initial render or direct call)
        const sectionElement = document.getElementById(`category-section-${categoryId}`);
        if (!sectionElement) return;
        container = sectionElement.querySelector('.category-content-area');
        if (!container) return;
    }
    container.innerHTML = ''; // Clear folder grid
    const folder = findFolderById(folderId);
    if (!folder) return;

    const header = document.createElement('div');
    header.className = 'folder-view-header';
    
    const backButton = document.createElement('button');
    backButton.className = 'folder-back-button icon-button'; // Added icon-button
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; // Arrow icon
    backButton.setAttribute('aria-label', 'Back to folders');
    backButton.title = 'Back to Folders';
    backButton.onclick = () => {
        currentCategoryView = { mode: 'folders', categoryId: categoryId, folderId: null };
        currentFolderEditModes[folderId] = false; // Reset edit mode when leaving
        renderCategorySectionContent(categoryId);
    };
    header.appendChild(backButton);

    const title = document.createElement('h3');
    title.className = 'folder-view-title';
    title.textContent = folder.name;
    header.appendChild(title);

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'folder-view-header-controls';

    const editModeButton = document.createElement('button');
    editModeButton.className = 'edit-mode-toggle-button icon-button';
    editModeButton.title = 'Toggle Edit Mode for Tasks';
    editModeButton.setAttribute('aria-pressed', currentFolderEditModes[folderId] ? 'true' : 'false');
    editModeButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>`;
    editModeButton.onclick = () => toggleTaskFolderEditMode(folderId);
    if (currentFolderEditModes[folderId]) editModeButton.classList.add('active-glow');
    controlsDiv.appendChild(editModeButton);

    const undoButton = document.createElement('button');
    undoButton.className = 'undo-folder-button icon-button'; 
    undoButton.title = 'Uncheck All Tasks in this Folder';
    undoButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2c-5.621 0-10.211 4.44-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.95 3.589-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.875-2.875l-1.751 2.334c1.889 2.299 4.811 3.541 7.626 3.541 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z"></path></svg>`;
    undoButton.onclick = () => {
        const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
        (folder.content || []).forEach(taskDef => {
            saveTaskStatus(folderId, taskDef.id, false, today);
        });
        renderTaskFolderContents(categoryId, folderId, container); // Re-render tasks
        updateAllProgress();
    };
    controlsDiv.appendChild(undoButton);
    header.appendChild(controlsDiv);
    container.appendChild(header);

    const taskFolderContentDiv = document.createElement('div');
    taskFolderContentDiv.id = `task-folder-content-${folderId}`;
    taskFolderContentDiv.className = 'task-folder-content';
    if(currentFolderEditModes[folderId]) taskFolderContentDiv.classList.add('edit-mode-active');


    // Add Task Form (Top)
    const addTaskFormTop = createAddTaskForm(categoryId, folderId, 'top');
    taskFolderContentDiv.appendChild(addTaskFormTop);

    const taskListElement = document.createElement('ul');
    taskListElement.className = 'task-list';
    taskListElement.setAttribute('aria-live', 'polite');
    taskListElement.dataset.folderId = folderId; // For drop target check
    taskListElement.dataset.categoryId = categoryId;


    const tasksForDay = getTasksForFolderForDay(folderId, localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString());
    if (tasksForDay.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = currentFolderEditModes[folderId] ? 'No tasks defined. Click "Add Item" to create new tasks.' : 'No tasks for today in this folder.';
        emptyMessage.className = 'empty-tasks-message';
        if (currentFolderEditModes[folderId]) emptyMessage.classList.add('edit-mode-empty');
        taskListElement.appendChild(emptyMessage);
    } else {
        tasksForDay.forEach(task => {
            taskListElement.appendChild(renderTaskItem(task, folderId, categoryId));
        });
    }
    taskFolderContentDiv.appendChild(taskListElement);

    // Add Task Form (Bottom)
    const addTaskFormBottom = createAddTaskForm(categoryId, folderId, 'bottom');
    taskFolderContentDiv.appendChild(addTaskFormBottom);
    
    container.appendChild(taskFolderContentDiv);
}

function createAddTaskForm(categoryId, folderId, position) {
    const formContainer = document.createElement('div');
    formContainer.className = `add-task-form-container add-task-form-${position}`;

    const triggerButton = document.createElement('button');
    triggerButton.className = 'add-item-trigger-button icon-button';
    triggerButton.dataset.position = position;
    triggerButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg> Add Item`;
    triggerButton.onclick = () => showTempAddTaskForm(categoryId, folderId, position);
    formContainer.appendChild(triggerButton);

    const formDiv = document.createElement('div');
    formDiv.className = 'new-temp-task-form hidden';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'new-task-temp-input';
    input.placeholder = 'Enter task text...';
    input.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTempTask(categoryId, folderId, position); }};
    formDiv.appendChild(input);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'new-task-temp-save';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => handleSaveTempTask(categoryId, folderId, position);
    formDiv.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'new-task-temp-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => hideTempAddTaskForm(categoryId, folderId, position);
    formDiv.appendChild(cancelBtn);
    
    formContainer.appendChild(formDiv);
    return formContainer;
}

// Renders the content of a note folder (editor/viewer)
function renderNoteFolderContents(categoryId, folderId, container) {
     if (!container) { 
        const sectionElement = document.getElementById(`category-section-${categoryId}`);
        if (!sectionElement) return;
        container = sectionElement.querySelector('.category-content-area');
        if (!container) return;
    }
    container.innerHTML = ''; 
    const folder = findFolderById(folderId);
    if (!folder || folder.type !== 'note') return;

    const header = document.createElement('div');
    header.className = 'folder-view-header';
    
    const backButton = document.createElement('button');
    backButton.className = 'folder-back-button icon-button'; // Added icon-button
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; // Arrow icon
    backButton.setAttribute('aria-label', 'Back to folders');
    backButton.title = 'Back to Folders';
    backButton.onclick = () => {
        currentCategoryView = { mode: 'folders', categoryId: categoryId, folderId: null };
        renderCategorySectionContent(categoryId);
    };
    header.appendChild(backButton);

    const title = document.createElement('h3');
    title.className = 'folder-view-title';
    title.textContent = folder.name;
    header.appendChild(title);
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'folder-view-header-controls note-folder-controls'; // Use specific class for styling if needed

    const addImageButton = document.createElement('button');
    addImageButton.className = 'add-image-button icon-button';
    addImageButton.title = 'Add Image';
    addImageButton.setAttribute('aria-label', 'Add image to note');
    addImageButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>`;
    
    controlsDiv.appendChild(addImageButton);
    header.appendChild(controlsDiv);
    container.appendChild(header);

    const noteContentWrapper = document.createElement('div');
    noteContentWrapper.className = 'note-folder-content-wrapper';

    const noteEditor = document.createElement('div');
    noteEditor.className = 'note-editor'; // Editable by default
    noteEditor.setAttribute('contenteditable', 'true');
    noteEditor.setAttribute('aria-label', `Note content for ${folder.name}`);
    noteEditor.innerHTML = folder.content || ''; // Load existing content
    autoLinkText(noteEditor); // Format links on initial load

    addImageButton.onclick = () => {
        domElements.imageUploadInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (readEvent) => {
                    // Create an image element. Styles are applied via CSS .note-editor img
                    const img = document.createElement('img');
                    img.src = readEvent.target.result;
                    img.alt = "Uploaded Image";

                    noteEditor.focus(); // Ensure editor is focused for selection
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                        // Move cursor after inserted image
                        range.setStartAfter(img);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        noteEditor.appendChild(img); // Fallback: append to end
                    }
                    // Trigger input to save
                    noteEditor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                };
                reader.readAsDataURL(file);
                domElements.imageUploadInput.value = ''; // Reset file input
            }
        };
        domElements.imageUploadInput.click();
    };


    noteEditor.addEventListener('input', () => {
        folder.content = noteEditor.innerHTML;
        saveFoldersByCategoryId(foldersByCategoryId);
    });

    noteEditor.addEventListener('blur', () => {
        autoLinkText(noteEditor); // Format links when editor loses focus
        folder.content = noteEditor.innerHTML; // Save potentially re-formatted content
        saveFoldersByCategoryId(foldersByCategoryId);
    });
    
    // Paste/drop/dragover listeners (already exist, verify they work with new structure)
    ['paste', 'drop'].forEach(eventType => {
        noteEditor.addEventListener(eventType, (event) => {
            if (eventType === 'drop') event.preventDefault();
            const items = (eventType === 'paste' ? event.clipboardData : event.dataTransfer)?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (e_reader) => {
                            const img = document.createElement('img');
                            img.src = e_reader.target.result;
                            // Styles are applied by .note-editor img CSS

                            noteEditor.focus(); // Ensure focus
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(img);
                                range.setStartAfter(img);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);

                            } else {
                                noteEditor.appendChild(img);
                            }
                            // Trigger input to save
                            noteEditor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        };
                        reader.readAsDataURL(blob);
                    }
                    if (eventType === 'paste') event.preventDefault(); 
                }
            }
        });
    });
    noteEditor.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary for drop to work
    });


    noteContentWrapper.appendChild(noteEditor);
    container.appendChild(noteContentWrapper);
}

function autoLinkText(element) {
    // This regex tries to avoid matching URLs already inside <a> tags by checking what's NOT preceding.
    // It's not foolproof for all complex HTML but better than a naive replace.
    const urlPattern = /(?<!href="|href='|">)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(?<!href="|href='|">)(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?!.*?<\/a>)/ig;

    // We need to iterate over text nodes to avoid breaking existing HTML structure or re-linking.
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const nodesToReplace = [];

    while (node = walker.nextNode()) {
        if (node.parentElement.tagName === 'A') continue; // Skip text already in a link

        const matches = [];
        let match;
        // Reset lastIndex for global regex on new string
        urlPattern.lastIndex = 0; 
        while ((match = urlPattern.exec(node.nodeValue)) !== null) {
            matches.push({
                index: match.index,
                text: match[0]
            });
        }
        
        if (matches.length > 0) {
            nodesToReplace.push({textNode: node, matches: matches.reverse()}); // Reverse to process from end of string
        }
    }

    let linksMade = false;
    nodesToReplace.forEach(item => {
        let currentNode = item.textNode;
        item.matches.forEach(matchInfo => {
            const matchText = matchInfo.text;
            let url = matchText;
            if (!matchText.startsWith('http') && !matchText.startsWith('ftp') && !matchText.startsWith('file')) {
                url = 'http://' + matchText;
            }
            
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = matchText;

            const textAfter = currentNode.splitText(matchInfo.index + matchText.length);
            const textToLink = currentNode.splitText(matchInfo.index); // This is the matched text node
            
            currentNode.parentNode.replaceChild(link, textToLink);
            currentNode = textAfter.previousSibling.previousSibling; // Move to text node before the link we just inserted, or parent if it was first
            if (!currentNode || currentNode.nodeType !== Node.TEXT_NODE) { // If we're at the start of original text node
                 currentNode = link.previousSibling && link.previousSibling.nodeType === Node.TEXT_NODE ? link.previousSibling : element; // A bit of a guess to find a valid node
            }
            linksMade = true;
        });
    });
    // The TreeWalker method is more robust but also more complex.
    // The original simpler regex method is kept if the TreeWalker version is too disruptive during testing.
    // For now, let's use a slightly improved regex that attempts to avoid re-linking:
    // This is a simplified version of the above. A full DOM traversal is more robust.
    // The previous simple replace on innerHTML is problematic for contenteditable.
    // This version tries to be a bit smarter.

    // Using a non-destructive regex approach:
    // Find all text nodes not already in an <a> tag.
    const textNodes = [];
    const collectTextNodes = (el) => {
        for (const child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                if (child.parentNode.nodeName.toUpperCase() !== 'A') {
                    textNodes.push(child);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName.toUpperCase() !== 'A') {
                collectTextNodes(child);
            }
        }
    };
    
    collectTextNodes(element);
    
    let madeChanges = false;
    for (const node of textNodes) {
        const text = node.nodeValue;
        let newContent = text;
        newContent = newContent.replace(urlPattern, (match) => {
            let url = match;
            if (!match.startsWith('http') && !match.startsWith('ftp') && !match.startsWith('file')) {
                url = 'http://' + match;
            }
            madeChanges = true;
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });

        if (madeChanges && newContent !== text) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContent;
            const parent = node.parentNode;
            while (tempDiv.firstChild) {
                parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
        }
    }
    // No change to element.innerHTML directly if no links were actually made this call
}


function renderAllCategorySections() {
    if (!domElements.tabContentsContainer || !domElements.categorySectionTemplate) return;
    
    // Remove only non-dashboard sections
    domElements.tabContentsContainer.querySelectorAll('.category-section:not(#dashboard-content)').forEach(sec => sec.remove());

    currentCategories.forEach(category => {
        if (category.id === 'dashboard') return; 

        const sectionClone = domElements.categorySectionTemplate.content.cloneNode(true);
        const sectionElement = sectionClone.querySelector('.category-section');
        
        sectionElement.id = `category-section-${category.id}`;
        sectionElement.setAttribute('aria-labelledby', `tab-button-${category.id}`);
        if (activeTabId !== category.id) {
            sectionElement.classList.add('hidden');
        }

        sectionElement.querySelector('.category-title-text').textContent = category.name;
        
        // Initial rendering for the category will be its folder system
        if(activeTabId === category.id) { // Only render content if it's the active tab to save perf
             currentCategoryView = { mode: 'folders', categoryId: category.id, folderId: null };
             renderCategorySectionContent(category.id);
        }

        domElements.tabContentsContainer.appendChild(sectionElement);
    });
}


function clearLongPressTimer(tabButton) {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
    if (tabButton) { 
      tabButton.removeEventListener('touchmove', preventScrollDuringLongPress);
      tabButton.removeEventListener('touchend', () => clearLongPressTimer(tabButton));
      tabButton.removeEventListener('touchcancel', () => clearLongPressTimer(tabButton));
    }
}
function preventScrollDuringLongPress(e) {
    clearLongPressTimer(e.currentTarget);
}

function renderTabs() {
    if (!domElements.tabsContainer) return;
    domElements.tabsContainer.querySelectorAll('.tab-button[data-category-id]').forEach(btn => btn.remove());
    const addCatButton = domElements.addCategoryButton;

    currentCategories.sort((a, b) => a.order - b.order).forEach(category => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.id = `tab-button-${category.id}`;
        tabButton.dataset.categoryId = category.id;
        tabButton.textContent = category.name;
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-selected', activeTabId === category.id ? 'true' : 'false');
        if (activeTabId === category.id) tabButton.classList.add('active');

        const optionsIcon = document.createElement('div');
        optionsIcon.className = 'tab-options-icon';
        optionsIcon.innerHTML = `<span></span><span></span><span></span>`;
        optionsIcon.setAttribute('aria-label', `Options for ${category.name}`);
        optionsIcon.setAttribute('role', 'button');
        optionsIcon.tabIndex = 0; 
        tabButton.appendChild(optionsIcon);
        
        optionsIcon.addEventListener('click', (e) => { e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); });
        optionsIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showCategoryContextMenu(category.id, tabButton); }});
        tabButton.addEventListener('touchstart', (e) => {
            clearLongPressTimer(tabButton); 
            tabButton.addEventListener('touchmove', preventScrollDuringLongPress);
            longPressTimer = setTimeout(() => { e.preventDefault(); optionsIcon.classList.add('visible'); showCategoryContextMenu(category.id, tabButton); clearLongPressTimer(tabButton); }, LONG_PRESS_DURATION);
            tabButton.addEventListener('touchend', () => clearLongPressTimer(tabButton));
            tabButton.addEventListener('touchcancel', () => clearLongPressTimer(tabButton));
        });

        tabButton.addEventListener('click', (e) => {
            if (e.target === tabButton && !optionsIcon.contains(e.target)) { 
                tabButton.classList.add('show-badge-highlight');
                setTimeout(() => tabButton.classList.remove('show-badge-highlight'), 300);
            }
            switchTab(category.id)
        });
        domElements.tabsContainer.insertBefore(tabButton, addCatButton);
    });
    updateCategoryTabIndicators();
}


function switchTab(categoryIdToActivate) {
    activeTabId = categoryIdToActivate;
    hideCategoryContextMenu();
    hideFolderContextMenu();

    domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        const isCurrentActive = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button');
        button.classList.toggle('active', isCurrentActive);
        button.setAttribute('aria-selected', isCurrentActive.toString());
    });
    
    if (domElements.tabContentsContainer) {
        domElements.tabContentsContainer.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard');
    }

    domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => {
        const isCurrentActiveSection = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content');
        section.classList.toggle('hidden', !isCurrentActiveSection);
    });
    
    if (activeTabId !== 'dashboard') {
        // Set the view to default 'folders' mode for the category
        currentCategoryView = { mode: 'folders', categoryId: activeTabId, folderId: null };
        renderCategorySectionContent(activeTabId); 
    } else {
        currentCategoryView = { mode: 'dashboard', categoryId: null, folderId: null };
    }

    if (activeAddTaskForm) { // Hide any open temp add task forms from other folders/categories
         const folder = findFolderById(activeAddTaskForm.folderId);
         if(folder) hideTempAddTaskForm(folder.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position);
    }
}

// Calculates progress for the current day based on all task folders
function calculateProgressForDate(dateString) {
  let completedCount = 0;
  let totalTasks = 0;

  Object.values(foldersByCategoryId).forEach(foldersInCat => {
    (foldersInCat || []).forEach(folder => {
      if (folder.type === 'task' && folder.content) {
        folder.content.forEach(taskDef => {
          totalTasks++;
          if (localStorage.getItem(getTaskStateStorageKey(dateString, folder.id, taskDef.id)) === 'true') {
            completedCount++;
          }
        });
      }
    });
  });

  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const pointsPerTask = totalTasks > 0 ? DAILY_TARGET_POINTS / totalTasks : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);

  return { percentage, pointsEarned, completedCount, totalTasks };
}


function updateDashboardSummaries() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();

  currentCategories.forEach(category => {
    if (category.id === 'dashboard') return; 

    let tasksInCategory = 0;
    let completedInCategory = 0;
    (foldersByCategoryId[category.id] || []).forEach(folder => {
        if (folder.type === 'task' && folder.content) {
            tasksInCategory += folder.content.length;
            folder.content.forEach(taskDef => {
                if (localStorage.getItem(getTaskStateStorageKey(today, folder.id, taskDef.id)) === 'true') {
                    completedInCategory++;
                }
            });
        }
    });

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'dashboard-category-summary';
    summaryDiv.innerHTML = `
      <h3>${category.name}</h3>
      <p class="category-stats">${completedInCategory} / ${tasksInCategory}</p>
    `;
    const statsP = summaryDiv.querySelector('.category-stats');
    if (tasksInCategory > 0 && completedInCategory === tasksInCategory) {
        statsP.classList.add('fully-completed');
    }
    domElements.dashboardSummariesContainer.appendChild(summaryDiv);
  });
}

function updateTodaysProgress() {
  const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
  const progress = calculateProgressForDate(today); 
  
  if (domElements.todayProgressFill) {
      domElements.todayProgressFill.style.width = `${progress.percentage}%`;
      domElements.todayProgressFill.style.backgroundColor = getProgressFillColor(progress.percentage);
      domElements.todayProgressFill.textContent = `${progress.percentage}%`;
      domElements.todayProgressFill.setAttribute('aria-valuenow', progress.percentage.toString());
  }
  if (domElements.todayPointsStat) {
      domElements.todayPointsStat.textContent = `${progress.pointsEarned} / ${DAILY_TARGET_POINTS} points`;
  }
}

function updateCurrentWeekProgress() {
    const todayNormalized = getNormalizedDate(new Date());
    let currentWeekStartDateString = localStorage.getItem(STORAGE_KEY_CURRENT_WEEK_START_DATE);
    let currentWeekStartDate;

    if (!currentWeekStartDateString) {
        currentWeekStartDate = new Date(todayNormalized); 
        localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
    } else {
        currentWeekStartDate = getNormalizedDate(new Date(currentWeekStartDateString));
        const daysPassed = (todayNormalized.getTime() - currentWeekStartDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 7) { // Start new week cycle
            currentWeekStartDate = new Date(todayNormalized); 
            let dayOfWeek = todayNormalized.getDay(); 
            let diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
            currentWeekStartDate.setDate(todayNormalized.getDate() + diffToMonday);
            currentWeekStartDate = getNormalizedDate(currentWeekStartDate); 
            localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
        }
    }
    
    let totalPointsThisWeekCycle = 0;
    let currentDateIter = new Date(currentWeekStartDate); 
    const todayDateStringForLoop = getTodayDateString();

    while (currentDateIter <= todayNormalized) {
        const dateStringForIter = `${currentDateIter.getFullYear()}-${(currentDateIter.getMonth() + 1).toString().padStart(2, '0')}-${currentDateIter.getDate().toString().padStart(2, '0')}`;
        let pointsForDay = 0;

        if (dateStringForIter === todayDateStringForLoop) {
            pointsForDay = calculateProgressForDate(dateStringForIter).pointsEarned;
        } else { 
            const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter;
            const historyDataString = localStorage.getItem(historyKey);
            if (historyDataString) {
                try {
                    pointsForDay = JSON.parse(historyDataString).pointsEarned || 0;
                } catch (e) { /* ignore */ }
            }
        }
        totalPointsThisWeekCycle += pointsForDay;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    const weeklyCyclePercentage = TARGET_POINTS_FOR_WEEKLY_VIEW > 0 ? Math.min(100, Math.round((totalPointsThisWeekCycle / TARGET_POINTS_FOR_WEEKLY_VIEW) * 100)) : 0;

    if (domElements.currentWeekProgressFill) {
        domElements.currentWeekProgressFill.style.width = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.style.backgroundColor = getProgressFillColor(weeklyCyclePercentage);
        domElements.currentWeekProgressFill.textContent = `${weeklyCyclePercentage}%`;
        domElements.currentWeekProgressFill.setAttribute('aria-valuenow', weeklyCyclePercentage.toString());
    }
    if (domElements.currentWeekPointsStat) {
        domElements.currentWeekPointsStat.textContent = `${totalPointsThisWeekCycle} / ${TARGET_POINTS_FOR_WEEKLY_VIEW} points`;
    }
}


function renderCalendar() {
  if (!domElements.calendarGrid || !domElements.calendarMonthYear) return;
  domElements.calendarGrid.innerHTML = ''; 
  const month = calendarDisplayDate.getMonth();
  const year = calendarDisplayDate.getFullYear();
  domElements.calendarMonthYear.textContent = `${calendarDisplayDate.toLocaleString('default', { month: 'long' })} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); 
  const todayNorm = getNormalizedDate(new Date());
  const todayDateStr = getTodayDateString();

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dayName => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dayName;
    domElements.calendarGrid.appendChild(dayHeader);
  });

  for (let i = 0; i < startingDayOfWeek; i++) {
    domElements.calendarGrid.appendChild(document.createElement('div')).className = 'calendar-day-cell empty';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = getNormalizedDate(new Date(year, month, day));
    const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.dataset.date = dateString;
    cell.innerHTML = `<span class="calendar-day-number">${day}</span><div class="calendar-day-fill"></div>`;
    
    let percentageCompleted = 0;
    let hasHistoryData = false;
    const fillDiv = cell.querySelector('.calendar-day-fill');
    fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.1)';

    if (dateString === todayDateStr) { 
        cell.classList.add('current-day');
        const progress = calculateProgressForDate(dateString);
        percentageCompleted = progress.percentage;
        fillDiv.style.backgroundColor = 'hsl(185, 100%, 45%)'; 
        if (percentageCompleted > 40) cell.classList.add('high-fill'); 
        hasHistoryData = progress.completedCount > 0 || !!localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString);
    } else {
        const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
        if (historyDataString) {
            try {
                const historyEntry = JSON.parse(historyDataString);
                percentageCompleted = historyEntry.percentageCompleted || 0;
                if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.7)';
                hasHistoryData = (historyEntry.completedTaskStructure && Object.values(historyEntry.completedTaskStructure).some(cat => Object.values(cat).some(folder => folder.tasks.length > 0))) || !!historyEntry.userNote;
            } catch(e) { 
                if (cellDate < todayNorm) fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)';
            }
        } else if (cellDate < todayNorm) {
            fillDiv.style.backgroundColor = 'hsla(185, 75%, 50%, 0.3)';
        }
        if (cellDate < todayNorm) cell.classList.add('calendar-day-past');
    }
    if (hasHistoryData) cell.classList.add('has-history');
    fillDiv.style.height = `${percentageCompleted}%`;
    cell.addEventListener('click', () => showHistoryModal(dateString));
    domElements.calendarGrid.appendChild(cell);
  }
}

function showHistoryModal(dateString) {
  currentModalDate = dateString; 
  if (!domElements.historyModal) return;

  const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
  const historyDataString = localStorage.getItem(historyKey);
  let historyEntry = null;
  const isToday = dateString === getTodayDateString();
  const isPastDay = new Date(dateString + 'T23:59:59') < getNormalizedDate(new Date()) && !isToday;

  if (isToday) { 
    const progress = calculateProgressForDate(dateString);
    const completedTasksTodayStruct = {};
    currentCategories.forEach(cat => {
      completedTasksTodayStruct[cat.id] = {};
      (foldersByCategoryId[cat.id] || []).forEach(folder => {
        if (folder.type === 'task') {
          const folderTasks = [];
          (folder.content || []).forEach(taskDef => {
            if (localStorage.getItem(getTaskStateStorageKey(dateString, folder.id, taskDef.id)) === 'true') {
              folderTasks.push(taskDef.text);
            }
          });
          if (folderTasks.length > 0) {
             completedTasksTodayStruct[cat.id][folder.id] = { name: folder.name, tasks: folderTasks };
          }
        }
      });
      if(Object.keys(completedTasksTodayStruct[cat.id]).length === 0) delete completedTasksTodayStruct[cat.id];
    });
    
    historyEntry = {
        date: dateString,
        completedTaskStructure: completedTasksTodayStruct,
        userNote: localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) || "",
        pointsEarned: progress.pointsEarned,
        percentageCompleted: progress.percentage,
        totalTasksOnDate: progress.totalTasks,
        dailyTargetPoints: DAILY_TARGET_POINTS
    };
  } else if (historyDataString) { 
      try { historyEntry = JSON.parse(historyDataString); } catch (e) { console.error("Error parsing history for modal:", e); }
  }

  domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (historyEntry) {
    domElements.historyModalPointsValue.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A';
    domElements.historyModalPointsTotal.textContent = (historyEntry.dailyTargetPoints || DAILY_TARGET_POINTS).toString();
    const completionPercentage = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted : 0;
    domElements.historyPercentageProgressFill.style.width = `${completionPercentage}%`;
    domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(completionPercentage);
    domElements.historyPercentageProgressFill.textContent = `${completionPercentage}%`;
    domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', completionPercentage);

    domElements.historyTasksList.innerHTML = '';
    let hasCompletedTasks = false;
    if (historyEntry.completedTaskStructure) {
        Object.keys(historyEntry.completedTaskStructure).forEach(catId => {
            const categoryData = historyEntry.completedTaskStructure[catId];
            if(Object.keys(categoryData).length === 0) return;

            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'history-category-group';
            const categoryTitle = document.createElement('h5');
            categoryTitle.className = 'history-category-title';
            categoryTitle.textContent = getCategoryNameById(catId);
            categoryGroup.appendChild(categoryTitle);
            
            Object.values(categoryData).forEach(folderData => { // folderData = {name, tasks: []}
                if (folderData.tasks && folderData.tasks.length > 0) {
                    hasCompletedTasks = true;
                    const folderTitle = document.createElement('h6'); // Sub-title for folder
                    folderTitle.className = 'history-folder-title';
                    folderTitle.textContent = folderData.name;
                    categoryGroup.appendChild(folderTitle);

                    const ul = document.createElement('ul');
                    folderData.tasks.forEach(taskText => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${taskText}</span>`;
                        ul.appendChild(li);
                    });
                    categoryGroup.appendChild(ul);
                }
            });
            if(categoryGroup.querySelector('ul')) domElements.historyTasksList.appendChild(categoryGroup);
        });
    }
    if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks);

    domElements.historyUserNoteDisplay.textContent = historyEntry.userNote || "No reflection recorded for this day.";
    domElements.historyUserNoteDisplay.classList.remove('hidden');
    domElements.historyUserNoteEdit.value = historyEntry.userNote || "";
    domElements.historyUserNoteEdit.classList.add('hidden'); 
    domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = '';
    domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote);
    if (isPastDay || isToday) { 
        domElements.historyUserNoteDisplay.ondblclick = () => {
            domElements.historyUserNoteDisplay.classList.add('hidden');
            domElements.historyUserNoteEdit.classList.remove('hidden');
            domElements.historicalNoteControls.classList.remove('hidden');
            domElements.historyUserNoteEdit.focus();
        };
    } else domElements.historyUserNoteDisplay.ondblclick = null; 
  } else { 
    domElements.historyModalPointsValue.textContent = 'N/A';
    domElements.historyModalPointsTotal.textContent = DAILY_TARGET_POINTS.toString();
    domElements.historyPercentageProgressFill.style.width = `0%`;
    domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(0);
    domElements.historyPercentageProgressFill.textContent = `0%`;
    domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', 0);
    domElements.historyTasksList.innerHTML = '<p>No data available for this day.</p>';
    domElements.historyUserNoteDisplay.textContent = "No data available for this day.";
    domElements.historyUserNoteDisplay.classList.remove('hidden');
    domElements.historyUserNoteEdit.classList.add('hidden');
    domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = '';
    domElements.expandTasksButton.classList.add('hidden');
    domElements.expandReflectionButton.classList.add('hidden');
    domElements.historyUserNoteDisplay.ondblclick = null;
  }
  domElements.historyModal.classList.remove('hidden');
}


function closeHistoryModal() {
  if (domElements.historyModal) domElements.historyModal.classList.add('hidden');
  currentModalDate = null; 
}

function saveHistoricalNote() { // For the main daily reflection in history modal
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;
    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    let historyEntry;
    const isToday = currentModalDate === getTodayDateString();

    const existingHistoryStr = localStorage.getItem(historyKey);
    if (existingHistoryStr) {
        historyEntry = JSON.parse(existingHistoryStr);
    } else { 
        const progress = isToday ? calculateProgressForDate(currentModalDate) : { pointsEarned: 0, percentageCompleted: 0, totalTasks: 0, completedTaskStructure: {} };
        historyEntry = {
            date: currentModalDate,
            completedTaskStructure: progress.completedTaskStructure || {}, 
            userNote: "",
            pointsEarned: progress.pointsEarned,
            percentageCompleted: progress.percentageCompleted,
            totalTasksOnDate: progress.totalTasks,
            dailyTargetPoints: DAILY_TARGET_POINTS 
        };
    }
    historyEntry.userNote = noteContent; // This is the main reflection
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    if (isToday && domElements.dailyNoteInput) { // Also update the main input if it's today
        domElements.dailyNoteInput.value = noteContent;
        localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent);
    }

    domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day.";
    domElements.historyUserNoteDisplay.classList.remove('hidden');
    domElements.historyUserNoteEdit.classList.add('hidden');
    domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = 'Reflection saved!';
    setTimeout(() => { domElements.historicalNoteStatus.textContent = ''; }, 2000);
    domElements.expandReflectionButton.classList.toggle('hidden', !noteContent);
    renderCalendar(); 
}

function clearHistoricalNote() {
     if (!domElements.historyUserNoteEdit) return;
    domElements.historyUserNoteEdit.value = "";
}

function populateMonthYearPicker() {
    if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return;
    domElements.pickerMonthsGrid.innerHTML = '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months.forEach((month, index) => {
        const btn = document.createElement('button');
        btn.className = 'month-option';
        btn.textContent = month;
        btn.dataset.month = index.toString();
        if (index === pickerSelectedMonth) btn.classList.add('selected');
        btn.onclick = () => { pickerSelectedMonth = index; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); };
        domElements.pickerMonthsGrid.appendChild(btn);
    });
    domElements.pickerYearsList.innerHTML = '';
    let yearToScrollTo = null;
    for (let year = 2000; year <= 2100; year++) {
        const btn = document.createElement('button');
        btn.className = 'year-option';
        btn.textContent = year.toString();
        btn.dataset.year = year.toString();
        if (year === pickerSelectedYear) { btn.classList.add('selected'); yearToScrollTo = btn; }
        btn.onclick = () => { pickerSelectedYear = year; calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1); renderCalendar(); populateMonthYearPicker(); };
        domElements.pickerYearsList.appendChild(btn);
    }
    if (yearToScrollTo) yearToScrollTo.scrollIntoView({ block: 'nearest' });
}

function toggleMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        populateMonthYearPicker();
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else domElements.monthYearPickerModal.classList.add('hidden');
}

function closeMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
}

function updateCategoryTabIndicators() {
    const today = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE) || getTodayDateString();
    currentCategories.forEach(category => {
        const tabButton = document.getElementById(`tab-button-${category.id}`);
        if (!tabButton) return;

        tabButton.querySelector('.notification-badge')?.remove();
        tabButton.classList.remove('category-complete-indicator');

        let totalTasksInCat = 0;
        let completedTasksInCat = 0;
        (foldersByCategoryId[category.id] || []).forEach(folder => {
            if (folder.type === 'task' && folder.content) {
                totalTasksInCat += folder.content.length;
                folder.content.forEach(taskDef => {
                    if (localStorage.getItem(getTaskStateStorageKey(today, folder.id, taskDef.id)) === 'true') {
                        completedTasksInCat++;
                    }
                });
            }
        });
        
        if (totalTasksInCat === 0) return; // No indicator for empty category
        const isFullyCompleted = completedTasksInCat === totalTasksInCat;
        const incompleteTasksCount = totalTasksInCat - completedTasksInCat;

        if (isFullyCompleted) tabButton.classList.add('category-complete-indicator');
        else if (incompleteTasksCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = incompleteTasksCount.toString();
            tabButton.appendChild(badge);
        }
    });
}


function updateAllProgress() {
  updateDashboardSummaries();
  updateTodaysProgress();
  updateCurrentWeekProgress();
  updateCategoryTabIndicators();
  renderCalendar(); 
}


function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal) return;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry = null;
    const isToday = date === getTodayDateString();

    if (isToday) {
        const progress = calculateProgressForDate(date);
        const completedTasksTodayStruct = {}; 
        // Populate completedTasksTodayStruct similarly to showHistoryModal for today
        currentCategories.forEach(cat => {
          completedTasksTodayStruct[cat.id] = {};
          (foldersByCategoryId[cat.id] || []).forEach(folder => {
            if (folder.type === 'task') {
              const folderTasks = [];
              (folder.content || []).forEach(taskDef => {
                if (localStorage.getItem(getTaskStateStorageKey(date, folder.id, taskDef.id)) === 'true') {
                  folderTasks.push(taskDef.text);
                }
              });
              if (folderTasks.length > 0) completedTasksTodayStruct[cat.id][folder.id] = { name: folder.name, tasks: folderTasks };
            }
          });
          if(Object.keys(completedTasksTodayStruct[cat.id]).length === 0) delete completedTasksTodayStruct[cat.id];
        });
        historyEntry = { completedTaskStructure: completedTasksTodayStruct, userNote: localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + date) || "" };
    } else if (historyDataString) {
        try { historyEntry = JSON.parse(historyDataString); } catch (e) { console.error("Error parsing history for fullscreen:", e); return; }
    }

    if (!historyEntry) { domElements.fullscreenModalArea.innerHTML = '<p>No content.</p>'; domElements.fullscreenContentModal.classList.remove('hidden'); return; }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    domElements.fullscreenModalArea.innerHTML = ''; 

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTaskStructure) {
            Object.keys(historyEntry.completedTaskStructure).forEach(catId => {
                const categoryData = historyEntry.completedTaskStructure[catId];
                if(Object.keys(categoryData).length === 0) return;

                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                catGroup.innerHTML = `<h4 class="history-category-title">${getCategoryNameById(catId)}</h4>`;
                
                Object.values(categoryData).forEach(folderData => {
                    if (folderData.tasks && folderData.tasks.length > 0) {
                        hasContent = true;
                        catGroup.innerHTML += `<h5 class="history-folder-title" style="margin-left:10px; color: #A09CB8;">${folderData.name}</h5>`;
                        const ul = document.createElement('ul');
                        ul.style.paddingLeft = '30px';
                        folderData.tasks.forEach(taskText => {
                            ul.innerHTML += `<li><span>${taskText}</span></li>`;
                        });
                        catGroup.appendChild(ul);
                    }
                });
                 if(catGroup.querySelector('ul')) domElements.fullscreenModalArea.appendChild(catGroup);
            });
        }
        if (!hasContent) domElements.fullscreenModalArea.innerHTML = '<p>No tasks completed.</p>';
    } else if (type === 'reflection') {
        domElements.fullscreenModalTitle.textContent = `Reflection for ${formattedDate}`;
        if (historyEntry.userNote) {
            const pre = document.createElement('pre');
            pre.textContent = historyEntry.userNote; // Use textContent for pre to preserve formatting from userNote
            domElements.fullscreenModalArea.appendChild(pre);
        } else domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded.</p>';
    }
    currentFullscreenContent = { type, date };
    domElements.fullscreenContentModal.classList.remove('hidden');
}


function closeFullscreenContentModal() {
    if (domElements.fullscreenContentModal) domElements.fullscreenContentModal.classList.add('hidden');
    currentFullscreenContent = null;
}

// Folder Management Functions
function openChooseFolderTypeModal(categoryId) {
    tempFolderCreationData = { categoryId };
    domElements.chooseFolderTypeModal?.classList.remove('hidden');
}
function closeChooseFolderTypeModal() {
    domElements.chooseFolderTypeModal?.classList.add('hidden');
}
function openEnterFolderNameModal(type) { // type is 'task' or 'note'
    if (!tempFolderCreationData) return;
    tempFolderCreationData.type = type;
    domElements.enterFolderNameTitle.textContent = `Name Your ${type === 'task' ? 'Task' : 'Note'} Folder`;
    domElements.folderNameInput.value = '';
    domElements.enterFolderNameModal?.classList.remove('hidden');
    domElements.folderNameInput.focus();
}
function closeEnterFolderNameModal() {
    domElements.enterFolderNameModal?.classList.add('hidden');
    tempFolderCreationData = null;
}

function handleCreateFolder() {
    if (!tempFolderCreationData) return;
    const folderName = domElements.folderNameInput.value.trim();
    if (!folderName) { alert("Folder name cannot be empty."); return; }

    const { categoryId, type } = tempFolderCreationData;
    if (!foldersByCategoryId[categoryId]) foldersByCategoryId[categoryId] = [];
    
    const newFolder = {
        id: createUniqueId('folder'),
        name: folderName,
        type: type,
        categoryId: categoryId,
        order: foldersByCategoryId[categoryId].length,
        content: type === 'task' ? [] : "" // Empty tasks array or empty note string
    };
    foldersByCategoryId[categoryId].push(newFolder);
    if (type === 'task') currentFolderEditModes[newFolder.id] = false; // Initialize edit mode for new task folder

    saveFoldersByCategoryId(foldersByCategoryId);
    renderFolderSystemForCategory(categoryId, document.querySelector(`#category-section-${categoryId} .category-content-area`));
    closeEnterFolderNameModal();
    updateAllProgress(); // In case this affects task counts for indicators
}

function handleRenameFolder(folder) {
    const newName = prompt(`Enter new name for folder "${folder.name}":`, folder.name);
    if (newName && newName.trim() !== "" && newName.trim() !== folder.name) {
        folder.name = newName.trim();
        saveFoldersByCategoryId(foldersByCategoryId);
        renderFolderSystemForCategory(folder.categoryId, document.querySelector(`#category-section-${folder.categoryId} .category-content-area`));
    }
}

function handleDeleteFolder(folder) {
    const message = (folder.type === 'task' && folder.content && folder.content.length > 0) || (folder.type === 'note' && folder.content && folder.content.trim() !== "")
        ? `Folder "${folder.name}" contains data. Are you sure you want to delete it and all its contents?`
        : `Are you sure you want to delete the empty folder "${folder.name}"?`;
    showDeleteConfirmation('folder', folder.id, message, folder.name, folder.categoryId);
}

function showFolderContextMenu(folder, targetBoxElement) { // targetBoxElement is the .folder-box
    hideCategoryContextMenu();
    hideFolderContextMenu(); 
    currentContextMenuTargetFolderBox = targetBoxElement; 

    const menu = domElements.folderOptionsContextMenu;
    if (!menu) return;

    menu.dataset.folderId = folder.id;
    menu.dataset.categoryId = folder.categoryId;

    const optionsIcon = targetBoxElement.querySelector('.folder-options-trigger');
    let topPosition, leftPosition;

    if (optionsIcon) { // Position relative to the 3-dot icon if available
        const iconRect = optionsIcon.getBoundingClientRect();
        topPosition = iconRect.bottom + window.scrollY + 2;
        leftPosition = iconRect.left + window.scrollX - (menu.offsetWidth / 2) + (iconRect.width / 2);
    } else { // Fallback if icon isn't found (shouldn't happen with current structure)
        const boxRect = targetBoxElement.getBoundingClientRect();
        topPosition = boxRect.bottom + window.scrollY + 5;
        leftPosition = boxRect.left + window.scrollX;
    }
    
    const menuWidth = menu.offsetWidth || 120; 
    const menuHeight = menu.offsetHeight || 80; // Approximate
    if (leftPosition + menuWidth > window.innerWidth) leftPosition = window.innerWidth - menuWidth - 10;
    if (topPosition + menuHeight > window.innerHeight) { // If menu goes off bottom, position above icon/box
        if (optionsIcon) {
            topPosition = optionsIcon.getBoundingClientRect().top + window.scrollY - menuHeight - 2;
        } else {
            topPosition = targetBoxElement.getBoundingClientRect().top + window.scrollY - menuHeight - 5;
        }
    }
    if (leftPosition < 0) leftPosition = 10;
    if (topPosition < 0) topPosition = 10;

    menu.style.top = `${topPosition}px`;
    menu.style.left = `${leftPosition}px`;
    menu.classList.remove('hidden');
    if (optionsIcon && !optionsIcon.classList.contains('visible')) optionsIcon.classList.add('visible');
}


function hideFolderContextMenu() {
    if (domElements.folderOptionsContextMenu) {
        domElements.folderOptionsContextMenu.classList.add('hidden');
        domElements.folderOptionsContextMenu.removeAttribute('data-folder-id');
        domElements.folderOptionsContextMenu.removeAttribute('data-category-id');
    }
    if (currentContextMenuTargetFolderBox) { // currentContextMenuTargetFolderBox is the .folder-box
        const optionsIcon = currentContextMenuTargetFolderBox.querySelector('.folder-options-trigger');
        if (optionsIcon) optionsIcon.classList.remove('visible'); 
        currentContextMenuTargetFolderBox = null;
    }
}


// Category Management Functions
function handleAddCategory() {
    const categoryName = prompt("Enter name for the new category:");
    if (categoryName && categoryName.trim() !== "") {
        const newCategoryId = createUniqueId('cat');
        const newCategory = {
            id: newCategoryId, name: categoryName.trim(), order: currentCategories.length, deletable: true,
        };
        currentCategories.push(newCategory);
        saveUserCategories(currentCategories);

        // Create a default "Tasks" folder for the new category
        const defaultFolderId = createUniqueId(`folder-${newCategoryId}-default`);
        foldersByCategoryId[newCategoryId] = [{
            id: defaultFolderId, name: "Tasks", type: "task", categoryId: newCategoryId, order: 0, content: []
        }];
        currentFolderEditModes[defaultFolderId] = false; // Init edit mode for the default task folder
        saveFoldersByCategoryId(foldersByCategoryId);
        
        renderTabs();
        renderAllCategorySections(); 
        switchTab(newCategoryId); 
        updateAllProgress();
    }
}

function handleRenameCategory(categoryId) {
    const category = currentCategories.find(cat => cat.id === categoryId);
    if (!category) return;
    const newName = prompt(`Enter new name for category "${category.name}":`, category.name);
    if (newName && newName.trim() !== "" && newName.trim() !== category.name) {
        category.name = newName.trim();
        saveUserCategories(currentCategories);
        renderTabs(); 
        const sectionTitle = document.querySelector(`#category-section-${categoryId} .category-title-text`);
        if (sectionTitle) sectionTitle.textContent = category.name;
        updateDashboardSummaries(); 
    }
}

function handleDeleteCategory(categoryId) {
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category) return;
    if (category.deletable === false) {
        alert(`Category "${category.name}" is a default category and cannot be deleted.`);
        return;
    }
    const foldersInCat = foldersByCategoryId[categoryId] || [];
    const hasContent = foldersInCat.some(f => (f.type === 'task' && f.content && f.content.length > 0) || (f.type === 'note' && f.content && f.content.trim() !== ""));
    const message = hasContent 
        ? `Category "${category.name}" contains folders with data. Are you sure you want to delete this category and all its folders and tasks/notes?`
        : `Are you sure you want to delete the empty category "${category.name}"?`;
    showDeleteConfirmation('category', categoryId, message, category.name);
}

function showCategoryContextMenu(categoryId, targetTabElement) {
    hideCategoryContextMenu(); 
    hideFolderContextMenu();
    currentContextMenuTargetTab = targetTabElement; 
    const menu = domElements.categoryTabContextMenu;
    if (!menu) return;
    menu.dataset.categoryId = categoryId;
    const rect = targetTabElement.getBoundingClientRect();
    const optionsIcon = targetTabElement.querySelector('.tab-options-icon');
    let topPosition, leftPosition;

    if (optionsIcon) {
        const iconRect = optionsIcon.getBoundingClientRect();
        topPosition = iconRect.bottom + window.scrollY + 2;
        leftPosition = iconRect.left + window.scrollX - (menu.offsetWidth / 2) + (iconRect.width / 2) ; 
    } else { 
        topPosition = rect.bottom + window.scrollY + 5;
        leftPosition = rect.left + window.scrollX;
    }
    const menuWidth = menu.offsetWidth || 120; 
    const menuHeight = menu.offsetHeight || 80;
    if (leftPosition + menuWidth > window.innerWidth) leftPosition = window.innerWidth - menuWidth - 10;
    if (topPosition + menuHeight > window.innerHeight) topPosition = rect.top + window.scrollY - menuHeight - 5;
    if (leftPosition < 0) leftPosition = 10;
    if (topPosition < 0) topPosition = 10;

    menu.style.top = `${topPosition}px`;
    menu.style.left = `${leftPosition}px`;
    menu.classList.remove('hidden');
    if (optionsIcon && !optionsIcon.classList.contains('visible')) optionsIcon.classList.add('visible');
}

function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) {
        domElements.categoryTabContextMenu.classList.add('hidden');
        domElements.categoryTabContextMenu.removeAttribute('data-category-id');
    }
    if (currentContextMenuTargetTab) {
        currentContextMenuTargetTab.querySelector('.tab-options-icon')?.classList.remove('visible'); 
        currentContextMenuTargetTab = null;
    }
}


// initializeApp is called at the end
function initializeApp() {
  domElements.tabsContainer = document.getElementById('tabs');
  domElements.tabContentsContainer = document.getElementById('tab-content');
  domElements.addCategoryButton = document.getElementById('add-category-button');
  domElements.categorySectionTemplate = document.getElementById('category-section-template');
  domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
  domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
  domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
  domElements.folderOptionsContextMenu = document.getElementById('folder-options-context-menu');
  domElements.ctxRenameFolderButton = document.getElementById('ctx-rename-folder');
  domElements.ctxDeleteFolderButton = document.getElementById('ctx-delete-folder');
  
  domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
  domElements.todayProgressFill = document.getElementById('today-progress-fill');
  domElements.todayPointsStat = document.getElementById('today-points-stat');
  domElements.currentWeekProgressFill = document.getElementById('current-week-progress-fill');
  domElements.currentWeekPointsStat = document.getElementById('current-week-points-stat');
  
  domElements.calendarMonthYearButton = document.getElementById('calendar-month-year-button');
  domElements.calendarMonthYear = document.getElementById('calendar-month-year');
  domElements.calendarGrid = document.getElementById('calendar-grid');
  domElements.calendarPrevMonthButton = document.getElementById('calendar-prev-month');
  domElements.calendarNextMonthButton = document.getElementById('calendar-next-month');
  domElements.monthYearPickerModal = document.getElementById('month-year-picker-modal');
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

  domElements.chooseFolderTypeModal = document.getElementById('choose-folder-type-modal');
  domElements.chooseFolderTypeCloseButton = document.getElementById('choose-folder-type-close-button');
  domElements.selectTaskFolderButton = document.getElementById('select-task-folder-button');
  domElements.selectNoteFolderButton = document.getElementById('select-note-folder-button');
  domElements.enterFolderNameModal = document.getElementById('enter-folder-name-modal');
  domElements.enterFolderNameCloseButton = document.getElementById('enter-folder-name-close-button');
  domElements.enterFolderNameTitle = document.getElementById('enter-folder-name-title');
  domElements.folderNameInput = document.getElementById('folder-name-input');
  domElements.createFolderButton = document.getElementById('create-folder-button');
  domElements.cancelCreateFolderButton = document.getElementById('cancel-create-folder-button');
  domElements.imageUploadInput = document.getElementById('image-upload-input');


  loadAppData(); 
  renderTabs();
  renderAllCategorySections(); 
  updateAllProgress();

  document.getElementById('dashboard-tab-button')?.addEventListener('click', () => switchTab('dashboard'));
  if (activeTabId === 'dashboard' || !currentCategories.find(c => c.id === activeTabId)) switchTab('dashboard');
  else switchTab(activeTabId); 

  domElements.addCategoryButton?.addEventListener('click', handleAddCategory);
  domElements.ctxRenameCategoryButton?.addEventListener('click', () => { const catId = domElements.categoryTabContextMenu.dataset.categoryId; if (catId) handleRenameCategory(catId); hideCategoryContextMenu(); });
  domElements.ctxDeleteCategoryButton?.addEventListener('click', () => { const catId = domElements.categoryTabContextMenu.dataset.categoryId; if (catId) handleDeleteCategory(catId); hideCategoryContextMenu(); });
  
  domElements.ctxRenameFolderButton?.addEventListener('click', () => { const folderId = domElements.folderOptionsContextMenu.dataset.folderId; const folder = findFolderById(folderId); if (folder) handleRenameFolder(folder); hideFolderContextMenu(); });
  domElements.ctxDeleteFolderButton?.addEventListener('click', () => { const folderId = domElements.folderOptionsContextMenu.dataset.folderId; const folder = findFolderById(folderId); if (folder) handleDeleteFolder(folder); hideFolderContextMenu(); });

  document.addEventListener('click', (event) => { // Global click to hide context menus
    if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.classList.contains('hidden') && !domElements.categoryTabContextMenu.contains(event.target) && (!currentContextMenuTargetTab || !currentContextMenuTargetTab.contains(event.target))) hideCategoryContextMenu();
    if (domElements.folderOptionsContextMenu && !domElements.folderOptionsContextMenu.classList.contains('hidden') && !domElements.folderOptionsContextMenu.contains(event.target) && (!currentContextMenuTargetFolderBox || !currentContextMenuTargetFolderBox.parentElement.contains(event.target))) hideFolderContextMenu(); // Check parentElement (the wrapper)
  });


  domElements.tabContentsContainer.addEventListener('dragover', (e) => {
    const taskListElement = e.target.closest('.task-list');
    if (!taskListElement) return;
    const folderId = taskListElement.dataset.folderId;
    if (!currentFolderEditModes[folderId] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
    e.preventDefault();
    taskListElement.querySelectorAll('.task-item').forEach(item => item.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom'));
    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    if (afterElement) afterElement.classList.add('drag-over-indicator-task'); 
    else { const last = taskListElement.querySelector('.task-item:last-child:not(.dragging)'); if (last) last.classList.add('drag-over-indicator-task-bottom'); }
    e.dataTransfer.dropEffect = 'move';
  });
  domElements.tabContentsContainer.addEventListener('drop', (e) => {
    const taskListElement = e.target.closest('.task-list');
    if (!taskListElement) return;
    const folderId = taskListElement.dataset.folderId;
    if (!currentFolderEditModes[folderId] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
    e.preventDefault();
    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    if (afterElement) taskListElement.insertBefore(draggedTaskElement, afterElement);
    else taskListElement.appendChild(draggedTaskElement);
  });

  domElements.saveNoteButton?.addEventListener('click', saveDailyNote);
  domElements.historyModalCloseButton?.addEventListener('click', closeHistoryModal);
  domElements.saveHistoricalNoteButton?.addEventListener('click', saveHistoricalNote);
  domElements.clearHistoricalNoteButton?.addEventListener('click', clearHistoricalNote);
  domElements.calendarPrevMonthButton?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendar(); });
  domElements.calendarNextMonthButton?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendar(); });
  domElements.calendarMonthYearButton?.addEventListener('click', toggleMonthYearPicker);
  domElements.monthYearPickerCloseButton?.addEventListener('click', closeMonthYearPicker);
  domElements.monthYearPickerModal?.addEventListener('click', (e) => { if (e.target === domElements.monthYearPickerModal) closeMonthYearPicker(); });
  
  domElements.deleteConfirmationCloseButton?.addEventListener('click', hideDeleteConfirmation);
  domElements.confirmDeleteButton?.addEventListener('click', confirmDeletion);
  domElements.cancelDeleteButton?.addEventListener('click', hideDeleteConfirmation);

  domElements.expandTasksButton?.addEventListener('click', () => { if (currentModalDate) openFullscreenContentModal('tasks', currentModalDate); });
  domElements.expandReflectionButton?.addEventListener('click', () => { if (currentModalDate) openFullscreenContentModal('reflection', currentModalDate); });
  domElements.fullscreenModalCloseButton?.addEventListener('click', closeFullscreenContentModal);

  // Folder Modals
  domElements.chooseFolderTypeCloseButton?.addEventListener('click', closeChooseFolderTypeModal);
  domElements.selectTaskFolderButton?.addEventListener('click', () => { closeChooseFolderTypeModal(); openEnterFolderNameModal('task'); });
  domElements.selectNoteFolderButton?.addEventListener('click', () => { closeChooseFolderTypeModal(); openEnterFolderNameModal('note'); });
  domElements.enterFolderNameCloseButton?.addEventListener('click', closeEnterFolderNameModal);
  domElements.createFolderButton?.addEventListener('click', handleCreateFolder);
  domElements.cancelCreateFolderButton?.addEventListener('click', closeEnterFolderNameModal);
  domElements.folderNameInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleCreateFolder(); });


  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!domElements.categoryTabContextMenu?.classList.contains('hidden')) hideCategoryContextMenu();
        else if (!domElements.folderOptionsContextMenu?.classList.contains('hidden')) hideFolderContextMenu();
        else if (!domElements.historyModal?.classList.contains('hidden')) closeHistoryModal();
        else if (isMonthYearPickerOpen) closeMonthYearPicker();
        else if (!domElements.deleteConfirmationModal?.classList.contains('hidden')) hideDeleteConfirmation();
        else if (!domElements.fullscreenContentModal?.classList.contains('hidden')) closeFullscreenContentModal();
        else if (!domElements.chooseFolderTypeModal?.classList.contains('hidden')) closeChooseFolderTypeModal();
        else if (!domElements.enterFolderNameModal?.classList.contains('hidden')) closeEnterFolderNameModal();
        else if (activeAddTaskForm) {
            const folder = findFolderById(activeAddTaskForm.folderId);
            if(folder) hideTempAddTaskForm(folder.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position);
        }
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Construct the full URL to sw.js using the current origin
      const swUrl = `${window.location.origin}/sw.js`;
      navigator.serviceWorker.register(swUrl)
        .then(reg => console.log('SW registered with URL:', swUrl, reg))
        .catch(err => console.error('SW registration failed with URL:', swUrl, err));
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
