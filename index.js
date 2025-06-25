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
let longPressTimer = null; // Specifically for category tab long press
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null; // For category tabs
let currentContextMenuTargetFolderBox = null; // For folder boxes (the visual square)
let midnightTimer = null;
let tempFolderCreationData = null; // { type: 'task' | 'note', categoryId: string }
// No liveClockInterval needed anymore


// DOM Elements
const domElements = {
  // Removed Menu System Elements
  appViewWrapper: null, // Still used for main view
  mainContentWrapper: null, // Still used
  dashboardColumnView: null, // This is the Activity Dashboard, now part of main flow

  // Progress Location (was mobile, now permanent)
  mobileProgressLocation: null,

  // Existing elements (mostly unchanged, some might be referenced slightly differently if they were inside removed menu)
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
  todayProgressContainer: null, 
  currentWeekProgressContainer: null, 
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
                });

                const oldTaskStatusKey = `${OLD_STORAGE_KEY_TASK_PREFIX}${newTaskId}_${today}`;
                const oldStatus = localStorage.getItem(oldTaskStatusKey);
                if (oldStatus === 'true') {
                    localStorage.setItem(getTaskStateStorageKey(today, defaultFolderId, newTaskId), 'true');
                }
                localStorage.removeItem(oldTaskStatusKey); 
            });
            
            newFoldersByCatId[category.id] = [newFolder];
        });

        foldersByCategoryId = newFoldersByCatId;
        saveFoldersByCategoryId(foldersByCategoryId);
        localStorage.removeItem(OLD_USER_DEFINED_TASKS_KEY); 
        console.log("Migration complete.");
        return true; 
    } catch (e) {
        console.error("Error migrating old task structure:", e);
        return false;
    }
}


function seedInitialDataIfNeeded() {
    currentCategories = loadUserCategories();
    
    if (!localStorage.getItem(APP_FOLDERS_KEY) && localStorage.getItem(OLD_USER_DEFINED_TASKS_KEY)) {
        migrateOldTaskStructure(); 
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
    
    currentCategories.forEach(category => {
        if (!foldersByCategoryId[category.id] || foldersByCategoryId[category.id].length === 0) {
            const defaultFolderId = createUniqueId(`folder-${category.id}-default`);
            const defaultFolder = {
                id: defaultFolderId,
                name: "Tasks",
                type: "task",
                categoryId: category.id,
                order: 0,
                content: [] 
            };

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
        (foldersByCategoryId[category.id] || []).forEach(folder => {
            if (folder.type === 'task' && currentFolderEditModes[folder.id] === undefined) {
                currentFolderEditModes[folder.id] = false;
            }
        });
    });

    if (categoriesUpdated) saveUserCategories(currentCategories);
    if (foldersUpdated) saveFoldersByCategoryId(foldersByCategoryId);
}


function getTaskDefinitionsForFolder(folderId) {
    for (const catId in foldersByCategoryId) {
        const folder = (foldersByCategoryId[catId] || []).find(f => f.id === folderId);
        if (folder && folder.type === 'task') {
            return folder.content || [];
        }
    }
    return [];
}
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
                historyEntry.userNote = noteContent; 
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
    
    const completedTasksHistory = {}; 
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
          if(completedTasksHistory[cat.id][folder.id].tasks.length === 0) {
            delete completedTasksHistory[cat.id][folder.id];
          }
        }
      });
      if(Object.keys(completedTasksHistory[cat.id]).length === 0) {
        delete completedTasksHistory[cat.id];
      }
    });

    const mainReflection = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateToSave) || "";
    
    const historyEntry = {
        date: dateToSave,
        completedTaskStructure: completedTasksHistory, 
        userNote: mainReflection, 
        pointsEarned: pointsEarned,
        percentageCompleted: percentageCompleted,
        totalTasksOnDate: totalTasks,
        dailyTargetPoints: DAILY_TARGET_POINTS
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    currentCategories.forEach(cat => {
        (foldersByCategoryId[cat.id] || []).forEach(folder => {
            if (folder.type === 'task') {
                (folder.content || []).forEach(taskDef => {
                    localStorage.removeItem(getTaskStateStorageKey(dateToSave, folder.id, taskDef.id));
                });
            }
        });
    });
    
    console.log(`History finalized and saved for ${dateToSave}:`, historyEntry);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TASK_STATE_STORAGE_KEY_PREFIX)) {
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
  seedInitialDataIfNeeded(); 

  let lastVisitDateStr = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const currentDateStr = getTodayDateString();

  if (lastVisitDateStr && lastVisitDateStr !== currentDateStr) {
    console.log(`Date changed from ${lastVisitDateStr} to ${currentDateStr}. Processing previous day.`);
    saveDayToHistory(lastVisitDateStr);
  } else if (!lastVisitDateStr) {
    console.log("First visit or no last visit date found. Initializing for today.");
  }
  
  localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, currentDateStr);
  
  checkAndClearOldMonthlyData();
  loadCurrentDayNote(); 
  
  calendarDisplayDate = new Date(); 
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
            renderTaskFolderContents(categoryId, folderId); 
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

function renderTaskItem(task, folderId, categoryId) { 
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.dataset.folderId = folderId; 
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
            const newTaskOrderIds = Array.from(taskListElement.querySelectorAll('.task-item')).map(el => el.dataset.taskId);
            
            const folder = findFolderById(fId);
            if (folder && folder.type === 'task') {
                folder.content = newTaskOrderIds.map(id => folder.content.find(t => t.id === id)).filter(Boolean);
                saveFoldersByCategoryId(foldersByCategoryId);
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
        if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.focus();
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
            localStorage.removeItem(getTaskStateStorageKey(today, folderId, taskId)); 
            renderTaskFolderContents(categoryId, folderId);
        }
    } else if (itemToDelete.type === 'folder') {
        const { id: folderId, categoryId } = itemToDelete;
        if (foldersByCategoryId[categoryId]) {
            foldersByCategoryId[categoryId] = foldersByCategoryId[categoryId].filter(f => f.id !== folderId);
            saveFoldersByCategoryId(foldersByCategoryId);
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
            delete foldersByCategoryId[categoryId]; 
            saveFoldersByCategoryId(foldersByCategoryId);
            
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

function renderCategorySectionContent(categoryId) {
    const sectionElement = document.getElementById(`category-section-${categoryId}`);
    if (!sectionElement) return;

    let contentArea = sectionElement.querySelector('.category-content-area');
    if (!contentArea) { 
        contentArea = document.createElement('div');
        contentArea.className = 'category-content-area';
        sectionElement.querySelectorAll('.task-list, .add-task-form-container').forEach(el => el.remove());
        sectionElement.appendChild(contentArea);
    }
    contentArea.innerHTML = ''; 

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

function renderFolderSystemForCategory(categoryId, container) {
    container.innerHTML = ''; 
    
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

function renderFolderBox(folder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'folder-item-container';
    wrapper.dataset.folderId = folder.id;
    wrapper.dataset.categoryId = folder.categoryId;
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-label', `Open folder: ${folder.name}`);

    const box = document.createElement('div'); 
    box.className = 'folder-box';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'folder-box-icon';
    if (folder.type === 'task') {
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-10V7h14v2H7z"></path></svg>`;
    } else { 
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>`;
    }
    box.appendChild(iconDiv);

    const optionsTrigger = document.createElement('div');
    optionsTrigger.className = 'folder-options-trigger';
    optionsTrigger.innerHTML = `<span></span><span></span><span></span>`;
    optionsTrigger.setAttribute('aria-label', `Options for folder ${folder.name}`);
    optionsTrigger.setAttribute('role', 'button');
    optionsTrigger.tabIndex = 0; 
    optionsTrigger.onclick = (e) => { e.stopPropagation(); showFolderContextMenu(folder, box); }; 
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


function renderTaskFolderContents(categoryId, folderId, container) {
    if (!container) { 
        const sectionElement = document.getElementById(`category-section-${categoryId}`);
        if (!sectionElement) return;
        container = sectionElement.querySelector('.category-content-area');
        if (!container) return;
    }
    container.innerHTML = ''; 
    const folder = findFolderById(folderId);
    if (!folder) return;

    const header = document.createElement('div');
    header.className = 'folder-view-header';
    
    const backButton = document.createElement('button');
    backButton.className = 'folder-back-button icon-button'; 
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; 
    backButton.setAttribute('aria-label', 'Back to folders');
    backButton.title = 'Back to Folders';
    backButton.onclick = () => {
        currentCategoryView = { mode: 'folders', categoryId: categoryId, folderId: null };
        currentFolderEditModes[folderId] = false; 
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
        renderTaskFolderContents(categoryId, folderId, container); 
        updateAllProgress();
    };
    controlsDiv.appendChild(undoButton);
    header.appendChild(controlsDiv);
    container.appendChild(header);

    const taskFolderContentDiv = document.createElement('div');
    taskFolderContentDiv.id = `task-folder-content-${folderId}`;
    taskFolderContentDiv.className = 'task-folder-content';
    if(currentFolderEditModes[folderId]) taskFolderContentDiv.classList.add('edit-mode-active');


    const addTaskFormTop = createAddTaskForm(categoryId, folderId, 'top');
    taskFolderContentDiv.appendChild(addTaskFormTop);

    const taskListElement = document.createElement('ul');
    taskListElement.className = 'task-list';
    taskListElement.setAttribute('aria-live', 'polite');
    taskListElement.dataset.folderId = folderId; 
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
    backButton.className = 'folder-back-button icon-button'; 
    backButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>`; 
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
    controlsDiv.className = 'folder-view-header-controls note-folder-controls'; 

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
    noteEditor.className = 'note-editor'; 
    noteEditor.setAttribute('contenteditable', 'true');
    noteEditor.setAttribute('aria-label', `Note content for ${folder.name}`);
    noteEditor.innerHTML = folder.content || ''; 
    autoLinkText(noteEditor); 

    addImageButton.onclick = () => {
        if (domElements.imageUploadInput) {
            domElements.imageUploadInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (readEvent) => {
                        const img = document.createElement('img');
                        img.src = readEvent.target.result;
                        img.alt = "Uploaded Image";

                        noteEditor.focus(); 
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
                        noteEditor.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    };
                    reader.readAsDataURL(file);
                    domElements.imageUploadInput.value = ''; 
                }
            };
            domElements.imageUploadInput.click();
        }
    };


    noteEditor.addEventListener('input', () => {
        folder.content = noteEditor.innerHTML;
        saveFoldersByCategoryId(foldersByCategoryId);
    });

    noteEditor.addEventListener('blur', () => {
        autoLinkText(noteEditor); 
        folder.content = noteEditor.innerHTML; 
        saveFoldersByCategoryId(foldersByCategoryId);
    });
    
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
                            
                            noteEditor.focus(); 
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
        event.preventDefault(); 
    });


    noteContentWrapper.appendChild(noteEditor);
    container.appendChild(noteContentWrapper);
}

function autoLinkText(element) {
    const urlPattern = /(?<!href="|href='|">)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(?<!href="|href='|">)(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?!.*?<\/a>)/ig;
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
    
    let madeChangesOverall = false;
    for (const node of textNodes) {
        const text = node.nodeValue;
        let newContentHTML = "";
        let lastIndex = 0;
        let matchFoundInNode = false;
        
        urlPattern.lastIndex = 0; 
        let match;
        while ((match = urlPattern.exec(text)) !== null) {
            matchFoundInNode = true;
            madeChangesOverall = true;
            newContentHTML += text.substring(lastIndex, match.index);
            let url = match[0];
            if (!url.startsWith('http') && !url.startsWith('ftp') && !url.startsWith('file')) {
                url = 'http://' + url;
            }
            newContentHTML += `<a href="${url}" target="_blank" rel="noopener noreferrer">${match[0]}</a>`;
            lastIndex = match.index + match[0].length;
        }
        newContentHTML += text.substring(lastIndex);

        if (matchFoundInNode) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContentHTML;
            const parent = node.parentNode;
            while (tempDiv.firstChild) {
                parent.insertBefore(tempDiv.firstChild, node);
            }
            parent.removeChild(node);
        }
    }
    return madeChangesOverall;
}


function renderAllCategorySections() {
    if (!domElements.tabContentsContainer || !domElements.categorySectionTemplate) return;
    
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
        
        if(activeTabId === category.id) { 
             currentCategoryView = { mode: 'folders', categoryId: category.id, folderId: null };
             renderCategorySectionContent(category.id);
        }

        domElements.tabContentsContainer.appendChild(sectionElement);
    });
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
        
        optionsIcon.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showCategoryContextMenu(category.id, tabButton); 
        });
        optionsIcon.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault(); 
                e.stopPropagation(); 
                showCategoryContextMenu(category.id, tabButton); 
            }
        });

        let touchStartEvent = null; 

        const clearTabLongPressState = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            tabButton.removeEventListener('touchmove', handleTabTouchMove);
            tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            touchStartEvent = null;
        };

        const handleTabTouchMove = () => {
            clearTabLongPressState(); 
        };

        const handleTabTouchEndOrCancel = () => {
            clearTabLongPressState();
        };
        
        tabButton.addEventListener('touchstart', (e) => {
            clearTabLongPressState(); 
            touchStartEvent = e; 

            tabButton.addEventListener('touchmove', handleTabTouchMove);
            tabButton.addEventListener('touchend', handleTabTouchEndOrCancel);
            tabButton.addEventListener('touchcancel', handleTabTouchEndOrCancel);

            longPressTimer = setTimeout(() => {
                if (touchStartEvent) { 
                    touchStartEvent.preventDefault(); 
                }
                optionsIcon.classList.add('visible');
                showCategoryContextMenu(category.id, tabButton);
                longPressTimer = null; 
                tabButton.removeEventListener('touchmove', handleTabTouchMove);
                tabButton.removeEventListener('touchend', handleTabTouchEndOrCancel);
                tabButton.removeEventListener('touchcancel', handleTabTouchEndOrCancel);
            }, LONG_PRESS_DURATION);
        });


        tabButton.addEventListener('click', (e) => {
            if (e.target === tabButton && !optionsIcon.contains(e.target)) { 
                tabButton.classList.add('show-badge-highlight');
                setTimeout(() => tabButton.classList.remove('show-badge-highlight'), 300);
            }
            switchTab(category.id);
        });
        if (addCatButton) {
            domElements.tabsContainer.insertBefore(tabButton, addCatButton);
        } else {
            domElements.tabsContainer.appendChild(tabButton);
        }
    });
    updateCategoryTabIndicators();
}


function switchTab(categoryIdToActivate) {
    activeTabId = categoryIdToActivate;
    hideCategoryContextMenu();
    hideFolderContextMenu();

    if (domElements.tabsContainer) {
        domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => {
            const isCurrentActive = (button.id === `tab-button-${activeTabId}`) || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button');
            button.classList.toggle('active', isCurrentActive);
            button.setAttribute('aria-selected', isCurrentActive.toString());
        });
    }
    
    if (domElements.tabContentsContainer) {
        domElements.tabContentsContainer.classList.toggle('main-area-scroll-hidden', categoryIdToActivate === 'dashboard');
        domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => {
            const isCurrentActiveSection = (section.id === `category-section-${activeTabId}`) || (activeTabId === 'dashboard' && section.id === 'dashboard-content');
            section.classList.toggle('hidden', !isCurrentActiveSection);
        });
    }
    
    if (activeTabId !== 'dashboard') {
        currentCategoryView = { mode: 'folders', categoryId: activeTabId, folderId: null };
        renderCategorySectionContent(activeTabId); 
    } else {
        currentCategoryView = { mode: 'dashboard', categoryId: null, folderId: null };
        updateDashboardSummaries(); // Update dashboard summaries when switching to main tab
    }

    if (activeAddTaskForm) { 
         const folder = findFolderById(activeAddTaskForm.folderId);
         if(folder) hideTempAddTaskForm(folder.categoryId, activeAddTaskForm.folderId, activeAddTaskForm.position);
    }
}

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
        if (daysPassed >= 7) { 
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

  if (domElements.historyModalDate) domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (historyEntry) {
    if (domElements.historyModalPointsValue) domElements.historyModalPointsValue.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A';
    if (domElements.historyModalPointsTotal) domElements.historyModalPointsTotal.textContent = (historyEntry.dailyTargetPoints || DAILY_TARGET_POINTS).toString();
    const completionPercentage = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted : 0;
    if (domElements.historyPercentageProgressFill) {
        domElements.historyPercentageProgressFill.style.width = `${completionPercentage}%`;
        domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(completionPercentage);
        domElements.historyPercentageProgressFill.textContent = `${completionPercentage}%`;
        domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', completionPercentage);
    }

    if (domElements.historyTasksList) {
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
                
                Object.values(categoryData).forEach(folderData => { 
                    if (folderData.tasks && folderData.tasks.length > 0) {
                        hasCompletedTasks = true;
                        const folderTitle = document.createElement('h6'); 
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
    }
    if (domElements.expandTasksButton) domElements.expandTasksButton.classList.toggle('hidden', !Object.values(historyEntry.completedTaskStructure || {}).some(cat => Object.values(cat).some(folder => folder.tasks && folder.tasks.length > 0)));

    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = historyEntry.userNote || "No reflection recorded for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
    }
    if (domElements.historyUserNoteEdit) {
        domElements.historyUserNoteEdit.value = historyEntry.userNote || "";
        domElements.historyUserNoteEdit.classList.add('hidden'); 
    }
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote);
    
    if (domElements.historyUserNoteDisplay && (isPastDay || isToday)) { 
        domElements.historyUserNoteDisplay.ondblclick = () => {
            if (domElements.historyUserNoteDisplay) domElements.historyUserNoteDisplay.classList.add('hidden');
            if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.remove('hidden');
            if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.remove('hidden');
            if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.focus();
        };
    } else if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.ondblclick = null;
    }
  } else { 
    if (domElements.historyModalPointsValue) domElements.historyModalPointsValue.textContent = 'N/A';
    if (domElements.historyModalPointsTotal) domElements.historyModalPointsTotal.textContent = DAILY_TARGET_POINTS.toString();
    if (domElements.historyPercentageProgressFill) {
        domElements.historyPercentageProgressFill.style.width = `0%`;
        domElements.historyPercentageProgressFill.style.backgroundColor = getProgressFillColor(0);
        domElements.historyPercentageProgressFill.textContent = `0%`;
        domElements.historyPercentageProgressFill.setAttribute('aria-valuenow', 0);
    }
    if (domElements.historyTasksList) domElements.historyTasksList.innerHTML = '<p>No data available for this day.</p>';
    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = "No data available for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
    }
    if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.add('hidden');
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = '';
    if (domElements.expandTasksButton) domElements.expandTasksButton.classList.add('hidden');
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.add('hidden');
    if (domElements.historyUserNoteDisplay) domElements.historyUserNoteDisplay.ondblclick = null;
  }
  domElements.historyModal.classList.remove('hidden');
}


function closeHistoryModal() {
  if (domElements.historyModal) domElements.historyModal.classList.add('hidden');
  currentModalDate = null; 
}

function saveHistoricalNote() { 
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
    historyEntry.userNote = noteContent; 
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    if (isToday && domElements.dailyNoteInput) { 
        domElements.dailyNoteInput.value = noteContent;
        localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent);
    }

    if (domElements.historyUserNoteDisplay) {
        domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day.";
        domElements.historyUserNoteDisplay.classList.remove('hidden');
    }
    if (domElements.historyUserNoteEdit) domElements.historyUserNoteEdit.classList.add('hidden');
    if (domElements.historicalNoteControls) domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = 'Reflection saved!';
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.classList.toggle('hidden', !noteContent);
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
        
        if (totalTasksInCat === 0) return; 
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
  if (domElements.dashboardSummariesContainer && activeTabId === 'dashboard') updateDashboardSummaries();
  updateTodaysProgress();
  updateCurrentWeekProgress();
  updateCategoryTabIndicators();
  renderCalendar(); 
}


function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea) return;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry = null;
    const isToday = date === getTodayDateString();

    if (isToday) {
        const progress = calculateProgressForDate(date);
        const completedTasksTodayStruct = {}; 
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
            pre.textContent = historyEntry.userNote; 
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

function openChooseFolderTypeModal(categoryId) {
    tempFolderCreationData = { categoryId };
    if (domElements.chooseFolderTypeModal) domElements.chooseFolderTypeModal.classList.remove('hidden');
}
function closeChooseFolderTypeModal() {
    if (domElements.chooseFolderTypeModal) domElements.chooseFolderTypeModal.classList.add('hidden');
}
function openEnterFolderNameModal(type) { 
    if (!tempFolderCreationData) return;
    tempFolderCreationData.type = type;
    if (domElements.enterFolderNameTitle) domElements.enterFolderNameTitle.textContent = `Name Your ${type === 'task' ? 'Task' : 'Note'} Folder`;
    if (domElements.folderNameInput) domElements.folderNameInput.value = '';
    if (domElements.enterFolderNameModal) domElements.enterFolderNameModal.classList.remove('hidden');
    if (domElements.folderNameInput) domElements.folderNameInput.focus();
}
function closeEnterFolderNameModal() {
    if (domElements.enterFolderNameModal) domElements.enterFolderNameModal.classList.add('hidden');
    tempFolderCreationData = null;
}

function handleCreateFolder() {
    if (!tempFolderCreationData || !domElements.folderNameInput) return;
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
        content: type === 'task' ? [] : "" 
    };
    foldersByCategoryId[categoryId].push(newFolder);
    if (type === 'task') currentFolderEditModes[newFolder.id] = false; 

    saveFoldersByCategoryId(foldersByCategoryId);
    const categoryContentArea = document.querySelector(`#category-section-${categoryId} .category-content-area`);
    if (categoryContentArea) renderFolderSystemForCategory(categoryId, categoryContentArea);
    closeEnterFolderNameModal();
    updateAllProgress(); 
}

function handleRenameFolder(folder) {
    const newName = prompt(`Enter new name for folder "${folder.name}":`, folder.name);
    if (newName && newName.trim() !== "" && newName.trim() !== folder.name) {
        folder.name = newName.trim();
        saveFoldersByCategoryId(foldersByCategoryId);
        const categoryContentArea = document.querySelector(`#category-section-${folder.categoryId} .category-content-area`);
        if (categoryContentArea) renderFolderSystemForCategory(folder.categoryId, categoryContentArea);
    }
}

function handleDeleteFolder(folder) {
    const message = (folder.type === 'task' && folder.content && folder.content.length > 0) || (folder.type === 'note' && folder.content && folder.content.trim() !== "")
        ? `Folder "${folder.name}" contains data. Are you sure you want to delete it and all its contents?`
        : `Are you sure you want to delete the folder "${folder.name}"?`;
    showDeleteConfirmation('folder', folder.id, message, folder.name, folder.categoryId);
}

function initializeApp() {
    // Cache DOM elements
    Object.keys(domElements).forEach(key => {
        const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        domElements[key] = document.getElementById(id);
    });

    // Specific overrides for elements not matching the auto-generated ID
    domElements.tabsContainer = document.getElementById('tabs');
    domElements.tabContentsContainer = document.getElementById('tab-content');
    domElements.categorySectionTemplate = document.getElementById('category-section-template');
    domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
    domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
    domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
    domElements.folderOptionsContextMenu = document.getElementById('folder-options-context-menu');
    domElements.ctxRenameFolderButton = document.getElementById('ctx-rename-folder');
    domElements.ctxDeleteFolderButton = document.getElementById('ctx-delete-folder');
    domElements.dashboardColumnView = document.getElementById('dashboard-column'); // Activity Dashboard
    domElements.taskEditControlsTemplate = document.getElementById('task-edit-controls-template');
    domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
    domElements.mobileProgressLocation = document.getElementById('mobile-progress-location');


    loadAppData();
    renderTabs();
    renderAllCategorySections(); 
    switchTab('dashboard'); // Default to dashboard
    updateAllProgress();
    updateLayoutBasedOnScreenSize(); // Initial call

    // Event Listeners with null checks
    if (domElements.addCategoryButton) {
        domElements.addCategoryButton.addEventListener('click', () => {
            const categoryName = prompt('Enter new category name:');
            if (categoryName && categoryName.trim() !== "") {
                const newCategory = {
                    id: createUniqueId('category'),
                    name: categoryName.trim(),
                    order: currentCategories.length,
                    deletable: true
                };
                currentCategories.push(newCategory);
                foldersByCategoryId[newCategory.id] = []; 
                saveUserCategories(currentCategories);
                saveFoldersByCategoryId(foldersByCategoryId);
                renderTabs();
                renderAllCategorySections();
                switchTab(newCategory.id);
                updateCategoryTabIndicators();
            }
        });
    }

    if (domElements.tabsContainer) {
        domElements.tabsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('tab-button') && event.target.dataset.categoryId) {
                switchTab(event.target.dataset.categoryId);
            } else if (event.target.id === 'dashboard-tab-button') {
                switchTab('dashboard');
            }
        });
    }
    
    document.addEventListener('dragover', (e) => {
        if (e.target.classList.contains('task-list') || e.target.closest('.task-list')) {
            e.preventDefault();
            if (!draggedTaskElement) return;

            const taskList = e.target.closest('.task-list');
            if (!taskList) return;

            taskList.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
                el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
            });

            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                const lastTask = taskList.querySelector('.task-item:not(.dragging):last-child');
                if (lastTask && lastTask !== draggedTaskElement) {
                     lastTask.classList.add('drag-over-indicator-task-bottom');
                }
            } else {
                if (afterElement !== draggedTaskElement) {
                     afterElement.classList.add('drag-over-indicator-task');
                }
            }
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('drop', (e) => {
        if (e.target.classList.contains('task-list') || e.target.closest('.task-list')) {
            e.preventDefault();
            if (!draggedTaskElement) return;
            
            const taskList = e.target.closest('.task-list');
            if (!taskList) return;

            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                taskList.appendChild(draggedTaskElement);
            } else {
                taskList.insertBefore(draggedTaskElement, afterElement);
            }
        }
    });

    if (domElements.calendarPrevMonthButton) domElements.calendarPrevMonthButton.addEventListener('click', () => {
      calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
      renderCalendar();
    });
    if (domElements.calendarNextMonthButton) domElements.calendarNextMonthButton.addEventListener('click', () => {
      calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
      renderCalendar();
    });
    if (domElements.calendarMonthYearButton) domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
    if (domElements.monthYearPickerCloseButton) domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
    
    if (domElements.saveNoteButton) domElements.saveNoteButton.addEventListener('click', saveDailyNote);
    if (domElements.dailyNoteInput) domElements.dailyNoteInput.addEventListener('input', () => {
        if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note'; 
    });

    if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
    if (domElements.saveHistoricalNoteButton) domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
    if (domElements.clearHistoricalNoteButton) domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
    if (domElements.expandTasksButton) domElements.expandTasksButton.addEventListener('click', () => openFullscreenContentModal('tasks', currentModalDate));
    if (domElements.expandReflectionButton) domElements.expandReflectionButton.addEventListener('click', () => openFullscreenContentModal('reflection', currentModalDate));

    if (domElements.fullscreenModalCloseButton) domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);

    if (domElements.confirmDeleteButton) domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
    if (domElements.cancelDeleteButton) domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
    if (domElements.deleteConfirmationCloseButton) domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);

    if (domElements.chooseFolderTypeCloseButton) domElements.chooseFolderTypeCloseButton.addEventListener('click', closeChooseFolderTypeModal);
    if (domElements.selectTaskFolderButton) domElements.selectTaskFolderButton.addEventListener('click', () => { openEnterFolderNameModal('task'); closeChooseFolderTypeModal(); });
    if (domElements.selectNoteFolderButton) domElements.selectNoteFolderButton.addEventListener('click', () => { openEnterFolderNameModal('note'); closeChooseFolderTypeModal(); });

    if (domElements.enterFolderNameCloseButton) domElements.enterFolderNameCloseButton.addEventListener('click', closeEnterFolderNameModal);
    if (domElements.createFolderButton) domElements.createFolderButton.addEventListener('click', handleCreateFolder);
    if (domElements.cancelCreateFolderButton) domElements.cancelCreateFolderButton.addEventListener('click', closeEnterFolderNameModal);
    if (domElements.folderNameInput) domElements.folderNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateFolder();
        }
    });

    if (domElements.ctxRenameCategoryButton) domElements.ctxRenameCategoryButton.addEventListener('click', () => {
        if (currentContextMenuTargetTab) {
            const categoryId = currentContextMenuTargetTab.dataset.categoryId;
            const category = currentCategories.find(c => c.id === categoryId);
            if (category) {
                const newName = prompt(`Enter new name for category "${category.name}":`, category.name);
                if (newName && newName.trim() !== "") {
                    category.name = newName.trim();
                    saveUserCategories(currentCategories);
                    renderTabs();
                    const catSectionTitle = document.querySelector(`#category-section-${categoryId} .category-title-text`);
                    if(catSectionTitle) {
                        catSectionTitle.textContent = category.name;
                    }
                }
            }
        }
        hideCategoryContextMenu();
    });

    if (domElements.ctxDeleteCategoryButton) domElements.ctxDeleteCategoryButton.addEventListener('click', () => {
        if (currentContextMenuTargetTab) {
            const categoryId = currentContextMenuTargetTab.dataset.categoryId;
            const category = currentCategories.find(c => c.id === categoryId);
            if (category) {
                if (category.deletable === false) {
                     alert(`Category "${category.name}" is a default category and cannot be deleted.`);
                } else {
                     showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the category "${category.name}" and all its contents? This action cannot be undone.`, category.name);
                }
            }
        }
        hideCategoryContextMenu();
    });
    
    if (domElements.ctxRenameFolderButton) domElements.ctxRenameFolderButton.addEventListener('click', () => {
        if (currentContextMenuTargetFolderBox) {
            const folderItemContainer = currentContextMenuTargetFolderBox.closest('.folder-item-container');
            if (folderItemContainer) {
                const folderId = folderItemContainer.dataset.folderId;
                const folder = findFolderById(folderId);
                if (folder) handleRenameFolder(folder);
            }
        }
        hideFolderContextMenu();
    });

    if (domElements.ctxDeleteFolderButton) domElements.ctxDeleteFolderButton.addEventListener('click', () => {
         if (currentContextMenuTargetFolderBox) {
            const folderItemContainer = currentContextMenuTargetFolderBox.closest('.folder-item-container');
            if (folderItemContainer) {
                const folderId = folderItemContainer.dataset.folderId;
                const folder = findFolderById(folderId);
                if (folder) handleDeleteFolder(folder);
            }
        }
        hideFolderContextMenu();
    });
    
    document.addEventListener('click', (e) => {
        if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.contains(e.target) && (!currentContextMenuTargetTab || !currentContextMenuTargetTab.contains(e.target))) hideCategoryContextMenu();
        if (domElements.folderOptionsContextMenu && !domElements.folderOptionsContextMenu.contains(e.target) && (!currentContextMenuTargetFolderBox || !currentContextMenuTargetFolderBox.contains(e.target))) hideFolderContextMenu();
        if (isMonthYearPickerOpen && domElements.monthYearPickerContent && !domElements.monthYearPickerContent.contains(e.target) && e.target !== domElements.calendarMonthYearButton && !domElements.calendarMonthYearButton?.contains(e.target)) {
            closeMonthYearPicker();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (domElements.historyModal && !domElements.historyModal.classList.contains('hidden')) closeHistoryModal();
            else if (domElements.fullscreenContentModal && !domElements.fullscreenContentModal.classList.contains('hidden')) closeFullscreenContentModal();
            else if (domElements.deleteConfirmationModal && !domElements.deleteConfirmationModal.classList.contains('hidden')) hideDeleteConfirmation();
            else if (domElements.chooseFolderTypeModal && !domElements.chooseFolderTypeModal.classList.contains('hidden')) closeChooseFolderTypeModal();
            else if (domElements.enterFolderNameModal && !domElements.enterFolderNameModal.classList.contains('hidden')) closeEnterFolderNameModal();
            else if (domElements.monthYearPickerModal && !domElements.monthYearPickerModal.classList.contains('hidden')) closeMonthYearPicker();
            // No menu to close with Escape anymore
            else if (currentContextMenuTargetTab) hideCategoryContextMenu();
            else if (currentContextMenuTargetFolderBox) hideFolderContextMenu();
        }
    });
    
    window.addEventListener('resize', updateLayoutBasedOnScreenSize);

    if (domElements.tabsContainer && domElements.tabsContainer.querySelector('.active')) {
        domElements.tabsContainer.querySelector('.active').focus();
    }
}


// Simplified Layout Update (mainly for padding adjustments if needed, no element moving)
function updateLayoutBasedOnScreenSize() {
    // This function is now much simpler. 
    // It no longer moves progress containers or the activity dashboard.
    // It could be used for minor responsive CSS adjustments via JS if needed,
    // but for now, CSS media queries handle most of this.
    // Example: Adjust padding on main-content-wrapper if header size changes drastically
    if (!domElements.mainContentWrapper) return;

    const isMobile = window.innerWidth <= 700;
    if (isMobile) {
        domElements.mainContentWrapper.style.paddingLeft = '15px';
        domElements.mainContentWrapper.style.paddingRight = '15px';
    } else {
        domElements.mainContentWrapper.style.paddingLeft = '45px';
        domElements.mainContentWrapper.style.paddingRight = '45px';
    }
}


function showCategoryContextMenu(categoryId, tabButton) {
    hideFolderContextMenu(); 
    currentContextMenuTargetTab = tabButton;
    const rect = tabButton.getBoundingClientRect();
    if (domElements.categoryTabContextMenu) {
        domElements.categoryTabContextMenu.style.top = `${rect.bottom + window.scrollY}px`;
        domElements.categoryTabContextMenu.style.left = `${rect.left + window.scrollX}px`;
        domElements.categoryTabContextMenu.classList.remove('hidden');
        const firstButtonInCtxMenu = domElements.categoryTabContextMenu.querySelector('button');
        if (firstButtonInCtxMenu) firstButtonInCtxMenu.focus(); 
    }
    
    const optionsIcon = tabButton.querySelector('.tab-options-icon');
    if (optionsIcon) optionsIcon.classList.add('visible');
}

function hideCategoryContextMenu() {
    if (currentContextMenuTargetTab) {
        const optionsIcon = currentContextMenuTargetTab.querySelector('.tab-options-icon');
        if (optionsIcon) optionsIcon.classList.remove('visible');
    }
    if (domElements.categoryTabContextMenu) {
      domElements.categoryTabContextMenu.classList.add('hidden');
    }
    currentContextMenuTargetTab = null;
}

function showFolderContextMenu(folder, folderBoxElement) {
    hideCategoryContextMenu();
    currentContextMenuTargetFolderBox = folderBoxElement;
    const rect = folderBoxElement.getBoundingClientRect();
    
    if (domElements.folderOptionsContextMenu) {
        domElements.folderOptionsContextMenu.style.top = `${rect.bottom + window.scrollY}px`;
        domElements.folderOptionsContextMenu.style.left = `${rect.left + window.scrollX}px`;
        domElements.folderOptionsContextMenu.classList.remove('hidden');
        const firstButtonInCtxMenu = domElements.folderOptionsContextMenu.querySelector('button');
        if (firstButtonInCtxMenu) firstButtonInCtxMenu.focus();
    }

    const optionsTrigger = folderBoxElement.querySelector('.folder-options-trigger');
    if (optionsTrigger) optionsTrigger.classList.add('visible');
}

function hideFolderContextMenu() {
    if (currentContextMenuTargetFolderBox) {
         const optionsTrigger = currentContextMenuTargetFolderBox.querySelector('.folder-options-trigger');
        if (optionsTrigger) optionsTrigger.classList.remove('visible');
    }
    if (domElements.folderOptionsContextMenu) {
      domElements.folderOptionsContextMenu.classList.add('hidden');
    }
    currentContextMenuTargetFolderBox = null;
}


// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);
