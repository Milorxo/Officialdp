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

const STORAGE_KEY_TASK_PREFIX = 'lifeTrackerTask_';
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX = 'lifeTrackerDailyEarnedPoints_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_';
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LOCKED_TASKS_PREFIX = 'lifeTrackerLockedTasks_';
const STORAGE_KEY_CURRENT_WEEK_START_DATE = 'lifeTrackerCurrentWeekStartDate'; 

const USER_DEFINED_TASKS_KEY = 'lifeTrackerUserDefinedTasks_v2'; 
const USER_CATEGORIES_KEY = 'lifeTrackerUserCategories_v2'; 


let currentCategories = []; 
let currentTasks = []; 

let activeTabId = 'dashboard'; 
let currentModalDate = null; 
let lockedTaskIdsToday = [];
let draggedTaskElement = null;
let itemToDelete = null; // { type: 'task' | 'category', id: string, nameForConfirmation?: string }
let editModes = {}; // { categoryId: boolean }
let activeAddTaskForm = null; // { categoryId, position }
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;
let longPressTimer = null;
const LONG_PRESS_DURATION = 700; // ms
let currentContextMenuTargetTab = null;


// DOM Elements
const domElements = {
  tabsContainer: null,
  tabContentsContainer: null, 
  addCategoryButton: null,
  categorySectionTemplate: null, 
  categoryTabContextMenu: null,
  ctxRenameCategoryButton: null,
  ctxDeleteCategoryButton: null,
  
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
  dailyNoteInput: null,
  saveNoteButton: null,
  historyModal: null,
  historyModalCloseButton: null,
  historyModalDate: null,
  historyModalPoints: null,
  historyModalPercentage: null,
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
  saveProgressButtonContainer: null,
  saveProgressButton: null,
  saveProgressModal: null,
  saveProgressModalContent: null,
  saveProgressMessage: null,
  confirmSaveProgressButton: null,
  cancelSaveProgressButton: null,
  saveProgressCloseButton: null,
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
};

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

function getTaskStorageKey(taskId, date) {
  return `${STORAGE_KEY_TASK_PREFIX}${taskId}_${date}`;
}

// Category and Task Data Management
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

function loadUserTasks() {
    const storedTasks = localStorage.getItem(USER_DEFINED_TASKS_KEY);
    if (storedTasks) {
        try {
            return JSON.parse(storedTasks); 
        } catch (e) {
            console.error("Error parsing stored tasks:", e);
        }
    }
    const initialTasks = {};
    DEFAULT_CATEGORIES_CONFIG.forEach(catConfig => {
        initialTasks[catConfig.id] = catConfig.tasks.map(taskText => ({
            id: createUniqueId('task'),
            text: taskText,
            categoryId: catConfig.id, 
        }));
    });
    return initialTasks;
}

function saveUserTasks(tasksByCategoryId) {
    localStorage.setItem(USER_DEFINED_TASKS_KEY, JSON.stringify(tasksByCategoryId));
}


function seedInitialDataIfNeeded() {
    let categories = loadUserCategories();
    let tasksByCatId = loadUserTasks();
    let categoriesUpdated = false;
    let tasksUpdated = false;

    if (!categories || categories.length === 0) {
        categories = DEFAULT_CATEGORIES_CONFIG.map(cat => ({
            id: cat.id, name: cat.name, order: cat.order, deletable: cat.deletable !== undefined ? cat.deletable : true,
        }));
        categoriesUpdated = true;
    }

    categories.forEach(cat => {
        if (!tasksByCatId[cat.id]) {
            const defaultConfigCat = DEFAULT_CATEGORIES_CONFIG.find(dc => dc.id === cat.id);
            tasksByCatId[cat.id] = defaultConfigCat ? defaultConfigCat.tasks.map(text => ({
                id: createUniqueId('task'), text: text, categoryId: cat.id
            })) : [];
            tasksUpdated = true;
        } else {
            tasksByCatId[cat.id].forEach(task => {
                if (!task.categoryId) {
                    task.categoryId = cat.id;
                    tasksUpdated = true;
                }
                 if (!task.id) { 
                    task.id = createUniqueId('task');
                    tasksUpdated = true;
                }
            });
        }
    });


    if (categoriesUpdated) saveUserCategories(categories);
    if (tasksUpdated) saveUserTasks(tasksByCatId);

    currentCategories = categories;
    currentCategories.forEach(cat => {
        if (editModes[cat.id] === undefined) {
            editModes[cat.id] = false;
        }
    });
}


function loadTasksForDate(date) {
    const tasksByCategoryId = loadUserTasks(); 
    const loadedTasks = [];

    currentCategories.forEach(category => {
        const categoryTasks = tasksByCategoryId[category.id] || [];
        categoryTasks.forEach(userTaskDef => {
            const storedCompleted = localStorage.getItem(getTaskStorageKey(userTaskDef.id, date));
            loadedTasks.push({
                id: userTaskDef.id,
                text: userTaskDef.text,
                categoryId: category.id, 
                completed: storedCompleted === 'true',
            });
        });
    });
    return loadedTasks;
}


function saveTaskStatus(task) {
  const today = getTodayDateString();
  localStorage.setItem(getTaskStorageKey(task.id, today), task.completed.toString());
}

function getCategoryNameById(categoryId) {
    const category = currentCategories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
}

function saveDailyNote() {
    if (!domElements.dailyNoteInput) return;
    const today = getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;

    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today, noteContent);

    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry;

    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    } else {
        const completedTasksToday = {};
        currentCategories.forEach(cat => completedTasksToday[cat.id] = []);

        let tasksCompletedCount = 0;
        
        currentTasks.forEach(task => {
            if (task.completed) {
                if (!completedTasksToday[task.categoryId]) completedTasksToday[task.categoryId] = [];
                completedTasksToday[task.categoryId].push(task.text);
                tasksCompletedCount++;
            }
        });
        const totalTasksForToday = currentTasks.length;
        const pointsPerTask = totalTasksForToday > 0 ? DAILY_TARGET_POINTS / totalTasksForToday : 0;
        const pointsEarnedToday = Math.round(tasksCompletedCount * pointsPerTask);
        const percentageToday = totalTasksForToday > 0 ? Math.round((tasksCompletedCount / totalTasksForToday) * 100) : 0;

        historyEntry = {
            date: today,
            completedTasks: completedTasksToday,
            userNote: "", 
            pointsEarned: pointsEarnedToday,
            percentageCompleted: percentageToday,
            totalTasksOnDate: totalTasksForToday
        };
    }
    historyEntry.userNote = noteContent; 
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    if (domElements.saveNoteButton) {
        domElements.saveNoteButton.textContent = 'Note Saved!';
        setTimeout(() => {
            if (domElements.saveNoteButton) domElements.saveNoteButton.textContent = 'Save Note';
        }, 1500);
    }
}


function loadCurrentDayNote() {
    if (!domElements.dailyNoteInput) return;
    const today = getTodayDateString();
    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today);
    if (note) {
        domElements.dailyNoteInput.value = note;
    } else {
        domElements.dailyNoteInput.value = '';
    }
}

function savePreviousDayHistory(previousDayDate, tasksForPreviousDay) {
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + previousDayDate;
    let historyEntry;

    const completedTasksHistory = {};
    currentCategories.forEach(cat => completedTasksHistory[cat.id] = []);
    
    let tasksCompletedCount = 0;
    
    tasksForPreviousDay.forEach(task => {
        if (task.completed) {
            if (!completedTasksHistory[task.categoryId]) completedTasksHistory[task.categoryId] = [];
            completedTasksHistory[task.categoryId].push(task.text);
            tasksCompletedCount++;
        }
    });

    const totalTasksForPreviousDay = tasksForPreviousDay.length;
    const pointsPerTaskCalculation = totalTasksForPreviousDay > 0 ? DAILY_TARGET_POINTS / totalTasksForPreviousDay : 0;
    const finalPointsEarned = Math.round(tasksCompletedCount * pointsPerTaskCalculation);
    const finalPercentageCompleted = totalTasksForPreviousDay > 0 ? Math.round((tasksCompletedCount / totalTasksForPreviousDay) * 100) : 0;

    const existingHistoryStr = localStorage.getItem(historyKey);
    let userNoteFromExisting = "";
    if (existingHistoryStr) {
        try {
            const existingEntry = JSON.parse(existingHistoryStr);
            userNoteFromExisting = existingEntry.userNote || "";
        } catch (e) { console.warn("Could not parse existing history to retain note", e); }
    }
    const noteFromDailyStore = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + previousDayDate);
    if (noteFromDailyStore) { 
        userNoteFromExisting = noteFromDailyStore;
    }


    historyEntry = {
        date: previousDayDate,
        completedTasks: completedTasksHistory,
        userNote: userNoteFromExisting,
        pointsEarned: finalPointsEarned,
        percentageCompleted: finalPercentageCompleted,
        totalTasksOnDate: totalTasksForPreviousDay
    };

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + previousDayDate); 
    localStorage.removeItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + previousDayDate);
    localStorage.removeItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + previousDayDate);
    
    console.log(`History finalized and saved for ${previousDayDate}:`, historyEntry);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX) || key.startsWith(STORAGE_KEY_TASK_PREFIX))) {
        const datePart = key.substring(key.indexOf('_') + 1); 
         if (datePart.length >= 7) { 
          const monthYearOfKey = datePart.substring(0, 7); 
          if (monthYearOfKey === lastProcessedMonthYear) { 
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
  localStorage.setItem(STORAGE_KEY_LAST_MONTH_PROCESSED, currentMonthYear);
}


function loadAppData() {
  seedInitialDataIfNeeded(); 

  const storedDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const todayDate = getTodayDateString();

  if (storedDate && storedDate !== todayDate) {
    const previousDayTasks = loadTasksForDate(storedDate); 
    savePreviousDayHistory(storedDate, previousDayTasks);
    localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, todayDate);
    lockedTaskIdsToday = []; 
  } else if (!storedDate) {
    localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, todayDate);
    lockedTaskIdsToday = [];
  }
  
  const lockedTasksStorageKey = STORAGE_KEY_LOCKED_TASKS_PREFIX + todayDate;
  const storedLockedTasks = localStorage.getItem(lockedTasksStorageKey);
  if (storedLockedTasks) {
      try {
          lockedTaskIdsToday = JSON.parse(storedLockedTasks);
      } catch (e) {
          console.error("Error parsing locked tasks for today:", e);
          lockedTaskIdsToday = [];
          localStorage.removeItem(lockedTasksStorageKey);
      }
  } else {
      lockedTaskIdsToday = [];
  }

  currentTasks = loadTasksForDate(todayDate);
  checkAndClearOldMonthlyData();
  loadCurrentDayNote();
  updateSaveProgressButtonState();
  
  calendarDisplayDate = new Date();
  calendarDisplayDate.setDate(1); 
  calendarDisplayDate.setHours(0,0,0,0); 
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
}

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

function toggleCategoryEditMode(categoryId) {
    editModes[categoryId] = !editModes[categoryId];
    const categorySection = document.getElementById(`category-section-${categoryId}`);
    const toggleButton = categorySection?.querySelector('.edit-mode-toggle-button');

    if (categorySection && toggleButton) {
        if (editModes[categoryId]) {
            categorySection.classList.add('edit-mode-active');
            toggleButton.classList.add('active-glow');
            toggleButton.setAttribute('aria-pressed', 'true');
        } else {
            categorySection.classList.remove('edit-mode-active');
            toggleButton.classList.remove('active-glow');
            toggleButton.setAttribute('aria-pressed', 'false');
            if (activeAddTaskForm && activeAddTaskForm.categoryId === categoryId) {
                hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.position);
            }
        }
    }
    renderCategoryTasks(categoryId); 
}


function showTempAddTaskForm(categoryId, position) {
    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.position, false);
    }

    activeAddTaskForm = { categoryId, position };
    const categorySection = document.getElementById(`category-section-${categoryId}`);
    if (!categorySection) return;

    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = categorySection.querySelector(formContainerClass);
    if (!formContainer) return;
    
    const triggerButton = formContainer.querySelector('.add-item-trigger-button');
    const form = formContainer.querySelector('.new-temp-task-form');
    const input = formContainer.querySelector('.new-task-temp-input');

    if (triggerButton) triggerButton.classList.add('hidden');
    if (form) form.classList.remove('hidden');
    if (input) input.focus();
}

function hideTempAddTaskForm(categoryId, position, resetActiveForm = true) {
    const categorySection = document.getElementById(`category-section-${categoryId}`);
    if (!categorySection) return;

    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const formContainer = categorySection.querySelector(formContainerClass);
    if (!formContainer) return;

    const triggerButton = formContainer.querySelector('.add-item-trigger-button');
    const form = formContainer.querySelector('.new-temp-task-form');
    const input = formContainer.querySelector('.new-task-temp-input');

    if (triggerButton) triggerButton.classList.remove('hidden');
    if (form) form.classList.add('hidden');
    if (input) input.value = '';

    if (resetActiveForm) {
        activeAddTaskForm = null;
    }
}


function handleSaveTempTask(categoryId, position) {
    const categorySection = document.getElementById(`category-section-${categoryId}`);
    if (!categorySection) return;
    const formContainerClass = position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom';
    const input = categorySection.querySelector(`${formContainerClass} .new-task-temp-input`);
    const taskText = input.value.trim();

    if (taskText) {
        const newTaskDefinition = {
            id: createUniqueId('task'),
            text: taskText,
            categoryId: categoryId,
        };
        
        let tasksByCatId = loadUserTasks();
        if (!tasksByCatId[categoryId]) {
            tasksByCatId[categoryId] = [];
        }

        if (position === 'top') {
            tasksByCatId[categoryId].unshift(newTaskDefinition);
        } else {
            tasksByCatId[categoryId].push(newTaskDefinition);
        }
        saveUserTasks(tasksByCatId);
        
        const newTaskForToday = { ...newTaskDefinition, completed: false };
        if (position === 'top') {
             const firstIndexOfCategory = currentTasks.findIndex(t => t.categoryId === categoryId);
             if (firstIndexOfCategory !== -1) {
                currentTasks.splice(firstIndexOfCategory, 0, newTaskForToday);
             } else {
                currentTasks.push(newTaskForToday); 
             }
        } else {
            currentTasks.push(newTaskForToday);
        }
        
        renderCategoryTasks(categoryId);
        updateAllProgress();
        hideTempAddTaskForm(categoryId, position);
    } else {
        alert('Task text cannot be empty.');
    }
}

function getTaskById(taskId) {
    return currentTasks.find(task => task.id === taskId);
}

function startTaskEdit(taskItemElement, task) {
    if (task.locked || taskItemElement.classList.contains('editing')) return;

    taskItemElement.classList.add('editing');
    
    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if (taskTextSpan) taskTextSpan.style.display = 'none';

    const editControlsTemplate = domElements.taskEditControlsTemplate;
    if (!editControlsTemplate) {
        console.error("Edit controls template not found!");
        return;
    }
    const editControls = editControlsTemplate.cloneNode(true);
    editControls.removeAttribute('id'); 
    editControls.style.display = 'flex'; 

    const input = editControls.querySelector('.task-edit-input');
    const saveButton = editControls.querySelector('.task-edit-save');
    const cancelButton = editControls.querySelector('.task-edit-cancel');

    input.value = task.text;

    saveButton.onclick = () => saveTaskEdit(task.id, input.value, taskItemElement, editControls);
    cancelButton.onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan);
    
    const deleteButton = taskItemElement.querySelector('.task-delete-button-editmode');
    if (deleteButton) {
        taskItemElement.insertBefore(editControls, deleteButton);
    } else {
        taskItemElement.appendChild(editControls);
    }
    input.focus();
    input.select();
}

function saveTaskEdit(taskId, newText, taskItemElement, editControls) {
    newText = newText.trim();
    if (!newText) {
        alert("Task text cannot be empty.");
        return;
    }

    const task = getTaskById(taskId);
    if (task) {
        task.text = newText;
        
        let tasksByCatId = loadUserTasks();
        const taskCategoryArray = tasksByCatId[task.categoryId];
        if (taskCategoryArray) {
            const taskIndex = taskCategoryArray.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                taskCategoryArray[taskIndex].text = newText;
                saveUserTasks(tasksByCatId);
            }
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


function renderTaskItem(task) {
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.setAttribute('role', 'listitem');
  item.setAttribute('tabindex', '0'); 
  item.setAttribute('aria-label', `${task.text}, ${task.completed ? 'completed' : 'not completed'}`);


  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.textContent = task.text;
  item.appendChild(textSpan);

  if (task.completed) {
    item.classList.add('completed');
  }
  if (lockedTaskIdsToday.includes(task.id)) {
    item.classList.add('locked');
    item.setAttribute('aria-disabled', 'true');
  }

  if (editModes[task.categoryId]) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button-editmode icon-button';
      deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
      deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteButton.title = "Delete Task";
      deleteButton.onclick = (e) => {
          e.stopPropagation(); 
          showDeleteConfirmation('task', task.id, `Are you sure you want to delete the task "${task.text}"?`);
      };
      item.appendChild(deleteButton);
  }

  item.addEventListener('click', (e) => {
    if (item.classList.contains('locked') || item.classList.contains('editing')) return;
    
    if (editModes[task.categoryId] && e.target === textSpan) {
        startTaskEdit(item, task);
        return;
    }
    if (!editModes[task.categoryId]) {
        task.completed = !task.completed;
        saveTaskStatus(task);
        item.classList.toggle('completed');
        item.setAttribute('aria-label', `${task.text}, ${task.completed ? 'completed' : 'not completed'}`);
        item.classList.remove('animate-task-complete', 'animate-task-uncomplete');
        void item.offsetWidth; 
        item.classList.add(task.completed ? 'animate-task-complete' : 'animate-task-uncomplete');
        updateAllProgress();
        updateSaveProgressButtonState();
    }
  });

   item.addEventListener('keydown', (e) => {
        if (item.classList.contains('locked') || item.classList.contains('editing')) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!editModes[task.categoryId]) { 
                item.click(); 
            } else if (editModes[task.categoryId] && document.activeElement === item) {
                 startTaskEdit(item, task);
            }
        }
    });

    if (editModes[task.categoryId] && !task.locked && !item.classList.contains('editing')) {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            if (!editModes[task.categoryId] || task.locked || item.classList.contains('editing')) {
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
                const categoryId = taskListElement.dataset.categoryId;
                const newTaskOrderIds = Array.from(taskListElement.querySelectorAll('.task-item')).map(el => el.dataset.taskId);
                
                let tasksByCatId = loadUserTasks();
                tasksByCatId[categoryId] = newTaskOrderIds.map(id => tasksByCatId[categoryId].find(t => t.id === id)).filter(Boolean);
                saveUserTasks(tasksByCatId);

                const otherCategoryTasks = currentTasks.filter(t => t.categoryId !== categoryId);
                const reorderedCategoryTasks = newTaskOrderIds.map(id => currentTasks.find(t => t.id === id)).filter(Boolean);
                currentTasks = [...otherCategoryTasks, ...reorderedCategoryTasks].sort((a,b) => {
                    const catAOrder = currentCategories.find(c => c.id === a.categoryId).order;
                    const catBOrder = currentCategories.find(c => c.id === b.categoryId).order;
                    if(catAOrder !== catBOrder) return catAOrder - catBOrder;
                    const tasksInCat = tasksByCatId[a.categoryId];
                    return tasksInCat.findIndex(t => t.id === a.id) - tasksInCat.findIndex(t => t.id === b.id);
                });
            }
        });
    } else {
        item.draggable = false;
    }
  return item;
}

function showDeleteConfirmation(type, id, message, nameForConfirmation = '') {
    itemToDelete = { type, id, nameForConfirmation };
    if (domElements.deleteConfirmationModal) {
        if(domElements.deleteConfirmationMessage) domElements.deleteConfirmationMessage.textContent = message;
        domElements.deleteConfirmationModal.classList.remove('hidden');
        domElements.confirmDeleteButton.focus();
    }
}

function confirmDeletion() {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'task') {
        const task = getTaskById(itemToDelete.id); 
        if (!task) return;

        currentTasks = currentTasks.filter(t => t.id !== itemToDelete.id);

        let tasksByCatId = loadUserTasks();
        if (tasksByCatId[task.categoryId]) {
            tasksByCatId[task.categoryId] = tasksByCatId[task.categoryId].filter(t => t.id !== itemToDelete.id);
            saveUserTasks(tasksByCatId);
        }
        localStorage.removeItem(getTaskStorageKey(itemToDelete.id, getTodayDateString()));
        lockedTaskIdsToday = lockedTaskIdsToday.filter(id => id !== itemToDelete.id);
        saveLockedTasksForToday();
        renderCategoryTasks(task.categoryId);

    } else if (itemToDelete.type === 'category') {
        const categoryId = itemToDelete.id;
        
        const category = currentCategories.find(c => c.id === categoryId);
        if (category && category.deletable === false) {
            alert(`Category "${category.name}" is a default category and cannot be deleted.`);
            hideDeleteConfirmation();
            return;
        }

        currentCategories = currentCategories.filter(cat => cat.id !== categoryId);
        saveUserCategories(currentCategories);

        let tasksByCatId = loadUserTasks();
        delete tasksByCatId[categoryId];
        saveUserTasks(tasksByCatId);

        currentTasks = currentTasks.filter(t => t.categoryId !== categoryId);
        
        const tabButton = document.getElementById(`tab-button-${categoryId}`);
        if (tabButton) tabButton.remove();
        const categorySection = document.getElementById(`category-section-${categoryId}`);
        if (categorySection) categorySection.remove();

        if (activeTabId === categoryId) {
            const dashboardTabButton = document.getElementById('dashboard-tab-button');
            if (dashboardTabButton) dashboardTabButton.click(); else activeTabId = null;
        }
    }

    updateAllProgress();
    updateSaveProgressButtonState();
    hideDeleteConfirmation();
}

function hideDeleteConfirmation() {
    if (domElements.deleteConfirmationModal) {
        domElements.deleteConfirmationModal.classList.add('hidden');
    }
    itemToDelete = null;
}

function renderCategoryTasks(categoryId) {
  const taskListElement = document.querySelector(`#category-section-${categoryId} .task-list`);
  if (!taskListElement) return;

  taskListElement.innerHTML = '';
  taskListElement.dataset.categoryId = categoryId; 

  const categoryTasks = currentTasks.filter(task => task.categoryId === categoryId);
  const userDefinedOrder = (loadUserTasks()[categoryId] || []).map(t => t.id);

  categoryTasks.sort((a, b) => {
    const indexA = userDefinedOrder.indexOf(a.id);
    const indexB = userDefinedOrder.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0; 
    if (indexA === -1) return 1; 
    if (indexB === -1) return -1; 
    return indexA - indexB;
  });


  if (categoryTasks.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = editModes[categoryId] ? 'No tasks defined. Click "Add Item" to create new tasks.' : 'No tasks for today in this category.';
    emptyMessage.className = 'empty-tasks-message';
    if (editModes[categoryId]) {
        emptyMessage.classList.add('edit-mode-empty');
    }
    taskListElement.appendChild(emptyMessage);
  } else {
    categoryTasks.forEach(task => {
      const taskItem = renderTaskItem(task);
      taskListElement.appendChild(taskItem);
    });
  }
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
        
        const editModeButton = sectionElement.querySelector('.edit-mode-toggle-button');
        editModeButton.onclick = () => toggleCategoryEditMode(category.id);
        if (editModes[category.id]) {
            sectionElement.classList.add('edit-mode-active');
            editModeButton.classList.add('active-glow');
            editModeButton.setAttribute('aria-pressed', 'true');
        }


        sectionElement.querySelector('.undo-category-button').onclick = () => {
            currentTasks.forEach(task => {
                if (task.categoryId === category.id && !lockedTaskIdsToday.includes(task.id)) {
                    task.completed = false;
                    saveTaskStatus(task);
                }
            });
            renderCategoryTasks(category.id);
            updateAllProgress();
            updateSaveProgressButtonState();
        };

        ['top', 'bottom'].forEach(position => {
            const formContainer = sectionElement.querySelector(position === 'top' ? '.add-task-form-top' : '.add-task-form-bottom');
            if (formContainer) {
                formContainer.querySelector('.add-item-trigger-button').onclick = () => showTempAddTaskForm(category.id, position);
                formContainer.querySelector('.new-task-temp-save').onclick = () => handleSaveTempTask(category.id, position);
                formContainer.querySelector('.new-task-temp-cancel').onclick = () => hideTempAddTaskForm(category.id, position);
                formContainer.querySelector('.new-task-temp-input').addEventListener('keypress', (e) => {
                     if (e.key === 'Enter') { e.preventDefault(); handleSaveTempTask(category.id, position); }
                });
            }
        });

        domElements.tabContentsContainer.appendChild(sectionElement);
        renderCategoryTasks(category.id); 
    });
}

function clearLongPressTimer(tabButton) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    if (tabButton) { // Ensure tabButton is passed to remove specific listener
      tabButton.removeEventListener('touchmove', preventScrollDuringLongPress);
      tabButton.removeEventListener('touchend', () => clearLongPressTimer(tabButton));
      tabButton.removeEventListener('touchcancel', () => clearLongPressTimer(tabButton));
    }
}
function preventScrollDuringLongPress(e) {
    // This function can be used to prevent default scroll if long press is active
    // For now, just clearing timer is enough, but could be expanded.
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
        if (activeTabId === category.id) {
            tabButton.classList.add('active');
        }

        const optionsIcon = document.createElement('div');
        optionsIcon.className = 'tab-options-icon';
        optionsIcon.innerHTML = `<span></span><span></span><span></span>`;
        optionsIcon.setAttribute('aria-label', `Options for ${category.name}`);
        optionsIcon.setAttribute('role', 'button');
        optionsIcon.setAttribute('tabindex', '0'); 
        
        tabButton.appendChild(optionsIcon);
        
        optionsIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent tab switch
            showCategoryContextMenu(category.id, tabButton);
        });
         optionsIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                showCategoryContextMenu(category.id, tabButton);
            }
        });


        // Long press for touch devices
        tabButton.addEventListener('touchstart', (e) => {
            clearLongPressTimer(tabButton); // Clear any existing timer
            // Attach move listener to cancel long press if user scrolls
            tabButton.addEventListener('touchmove', preventScrollDuringLongPress);

            longPressTimer = setTimeout(() => {
                e.preventDefault(); // Prevent click/other events after long press
                optionsIcon.classList.add('visible'); // Make dots visible for context
                showCategoryContextMenu(category.id, tabButton);
                clearLongPressTimer(tabButton); 
            }, LONG_PRESS_DURATION);
            
            // Listen for touchend and touchcancel on this specific tabButton instance
            tabButton.addEventListener('touchend', () => clearLongPressTimer(tabButton));
            tabButton.addEventListener('touchcancel', () => clearLongPressTimer(tabButton));
        });


        tabButton.addEventListener('click', (e) => {
            // Highlight badge on tap (for mobile)
            if (e.target === tabButton && !optionsIcon.contains(e.target)) { // Ensure click is not on options icon itself
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

    domElements.tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        if (button.id === `tab-button-${activeTabId}` || (activeTabId === 'dashboard' && button.id === 'dashboard-tab-button')) {
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
        } else {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        }
    });
    
    // Manage scrollbar visibility for main#tab-content (domElements.tabContentsContainer)
    if (domElements.tabContentsContainer) {
        if (categoryIdToActivate === 'dashboard') {
            domElements.tabContentsContainer.classList.add('main-area-scroll-hidden');
        } else {
            domElements.tabContentsContainer.classList.remove('main-area-scroll-hidden');
        }
    }

    domElements.tabContentsContainer.querySelectorAll('section[role="tabpanel"]').forEach(section => {
        if (section.id === `category-section-${activeTabId}` || (activeTabId === 'dashboard' && section.id === 'dashboard-content')) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
    
    if (activeTabId !== 'dashboard') {
        renderCategoryTasks(activeTabId); 
    }

    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.position);
    }
}


function calculateProgress() {
  let completedCount = 0;
  currentTasks.forEach(task => {
    if (task.completed && !lockedTaskIdsToday.includes(task.id)) { 
      completedCount++;
    }
  });

  const unlockedTasksCount = currentTasks.filter(task => !lockedTaskIdsToday.includes(task.id)).length;
  
  const percentage = unlockedTasksCount > 0 ? Math.round((completedCount / unlockedTasksCount) * 100) : 0;
  const pointsPerTask = unlockedTasksCount > 0 ? DAILY_TARGET_POINTS / unlockedTasksCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);

  return { percentage, pointsEarned, completedCount, totalTasks: unlockedTasksCount };
}


function updateDashboardSummaries() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';

  currentCategories.forEach(category => {
    if (category.id === 'dashboard') return; 

    const categoryTasks = currentTasks.filter(task => task.categoryId === category.id);
    const unlockedTasksInCategory = categoryTasks.filter(task => !lockedTaskIdsToday.includes(task.id));
    const completedTasksInUnlocked = unlockedTasksInCategory.filter(task => task.completed);

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'dashboard-category-summary';
    summaryDiv.innerHTML = `
      <h3>${category.name}</h3>
      <p class="category-stats">${completedTasksInUnlocked.length} / ${unlockedTasksInCategory.length}</p>
    `;
    
    const statsP = summaryDiv.querySelector('.category-stats');
    if (unlockedTasksInCategory.length > 0 && completedTasksInUnlocked.length === unlockedTasksInCategory.length) {
        statsP.classList.add('fully-completed');
    } else {
        statsP.classList.remove('fully-completed');
    }

    domElements.dashboardSummariesContainer.appendChild(summaryDiv);
  });
}

function updateTodaysProgress() {
  const progress = calculateProgress(); 
  
  if (domElements.todayProgressFill) {
      domElements.todayProgressFill.style.width = `${progress.percentage}%`;
      domElements.todayProgressFill.textContent = `${progress.percentage}%`;
      domElements.todayProgressFill.setAttribute('aria-valuenow', progress.percentage.toString());
  }
  if (domElements.todayPointsStat) {
      domElements.todayPointsStat.textContent = `${progress.pointsEarned} / ${DAILY_TARGET_POINTS} points`;
  }
}

function updateCurrentWeekProgress() {
    const today = getNormalizedDate(new Date());
    let currentWeekStartDateString = localStorage.getItem(STORAGE_KEY_CURRENT_WEEK_START_DATE);
    let currentWeekStartDate;

    if (!currentWeekStartDateString) {
        currentWeekStartDate = new Date(today); 
        localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
    } else {
        currentWeekStartDate = getNormalizedDate(new Date(currentWeekStartDateString));
        const daysPassed = (today.getTime() - currentWeekStartDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 7) {
            currentWeekStartDate = new Date(today); 
            let dayOfWeek = today.getDay(); 
            let diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
            currentWeekStartDate.setDate(today.getDate() + diffToMonday);
            currentWeekStartDate = getNormalizedDate(currentWeekStartDate); 

            localStorage.setItem(STORAGE_KEY_CURRENT_WEEK_START_DATE, currentWeekStartDate.toISOString().split('T')[0]);
        }
    }
    
    let totalPointsThisWeekCycle = 0;
    let currentDateIter = new Date(currentWeekStartDate); 

    while (currentDateIter <= today) {
        const dateStringForIter = `${currentDateIter.getFullYear()}-${(currentDateIter.getMonth() + 1).toString().padStart(2, '0')}-${currentDateIter.getDate().toString().padStart(2, '0')}`;
        let pointsForDay = 0;

        if (dateStringForIter === getTodayDateString()) {
            pointsForDay = calculateProgress().pointsEarned;
        } else {
            const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateStringForIter;
            const historyDataString = localStorage.getItem(historyKey);
            if (historyDataString) {
                try {
                    const historyEntry = JSON.parse(historyDataString);
                    pointsForDay = historyEntry.pointsEarned || 0;
                } catch (e) {
                    console.warn(`Error parsing history for ${dateStringForIter} in weekly progress:`, e);
                }
            }
        }
        totalPointsThisWeekCycle += pointsForDay;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    const weeklyCyclePercentage = TARGET_POINTS_FOR_WEEKLY_VIEW > 0 ? Math.min(100, Math.round((totalPointsThisWeekCycle / TARGET_POINTS_FOR_WEEKLY_VIEW) * 100)) : 0;

    if (domElements.currentWeekProgressFill) {
        domElements.currentWeekProgressFill.style.width = `${weeklyCyclePercentage}%`;
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

  const today = getNormalizedDate(new Date());

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(dayName => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dayName;
    domElements.calendarGrid.appendChild(dayHeader);
  });

  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day-cell empty';
    domElements.calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = getNormalizedDate(new Date(year, month, day));
    const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.dataset.date = dateString;

    const dayNumber = document.createElement('span');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day.toString();
    cell.appendChild(dayNumber);

    const fillDiv = document.createElement('div');
    fillDiv.className = 'calendar-day-fill';
    cell.appendChild(fillDiv);
    
    let percentageCompleted = 0;
    let hasHistoryData = false;

    if (cellDate.getTime() === today.getTime()) { 
        cell.classList.add('current-day');
        const progress = calculateProgress();
        percentageCompleted = progress.percentage;
        if (percentageCompleted > 40) { 
            cell.classList.add('high-fill'); 
        }
        hasHistoryData = progress.completedCount > 0 || (localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) !== null);
    } else { 
        const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
        const historyDataString = localStorage.getItem(historyKey);
        if (historyDataString) {
            try {
                const historyEntry = JSON.parse(historyDataString);
                percentageCompleted = historyEntry.percentageCompleted || 0;
                hasHistoryData = (historyEntry.completedTasks && Object.values(historyEntry.completedTasks).some(arr => arr.length > 0)) || !!historyEntry.userNote;
            } catch(e) { console.warn("Error parsing history for calendar cell:", e); }
        }
        if (cellDate < today) {
           cell.classList.add('calendar-day-past');
        }
    }
    
    if (hasHistoryData) {
        cell.classList.add('has-history');
    }
    
    fillDiv.style.height = `${percentageCompleted}%`;
    
    cell.addEventListener('click', () => showHistoryModal(dateString));
    domElements.calendarGrid.appendChild(cell);
  }
}

function showHistoryModal(dateString) {
  currentModalDate = dateString; 
  if (!domElements.historyModal || !domElements.historyModalDate || !domElements.historyModalPoints || 
      !domElements.historyModalPercentage || !domElements.historyTasksList || 
      !domElements.historyUserNoteDisplay || !domElements.historyUserNoteEdit ||
      !domElements.historicalNoteControls || !domElements.saveHistoricalNoteButton ||
      !domElements.clearHistoricalNoteButton || !domElements.historicalNoteStatus ||
      !domElements.expandTasksButton || !domElements.expandReflectionButton) return;

  const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
  const historyDataString = localStorage.getItem(historyKey);
  let historyEntry = null;
  const isToday = dateString === getTodayDateString();
  const isPastDay = new Date(dateString) < getNormalizedDate(new Date()) && !isToday;

  if (isToday) {
    const progress = calculateProgress();
    const completedTasksToday = {};
    currentCategories.forEach(cat => completedTasksToday[cat.id] = []);

    currentTasks.forEach(task => {
        if (task.completed) {
             if (!completedTasksToday[task.categoryId]) completedTasksToday[task.categoryId] = []; 
             completedTasksToday[task.categoryId].push(task.text);
        }
    });
    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) || "";
    historyEntry = {
        date: dateString,
        completedTasks: completedTasksToday,
        userNote: note,
        pointsEarned: progress.pointsEarned,
        percentageCompleted: progress.percentage,
        totalTasksOnDate: progress.totalTasks 
    };
  } else if (historyDataString) {
      try {
          historyEntry = JSON.parse(historyDataString);
      } catch (e) {
          console.error("Error parsing history data for modal:", e);
      }
  }

  if (historyEntry) {
    domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    domElements.historyModalPoints.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A';
    domElements.historyModalPercentage.textContent = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted.toString() : 'N/A';

    domElements.historyTasksList.innerHTML = '';
    let hasCompletedTasks = false;
    if (historyEntry.completedTasks) {
        Object.keys(historyEntry.completedTasks).forEach(categoryId => {
            const tasksInCategory = historyEntry.completedTasks[categoryId];
            if (tasksInCategory && tasksInCategory.length > 0) {
                hasCompletedTasks = true;
                const categoryGroup = document.createElement('div');
                categoryGroup.className = 'history-category-group';
                
                const categoryTitle = document.createElement('h5');
                categoryTitle.className = 'history-category-title';
                categoryTitle.textContent = getCategoryNameById(categoryId);
                categoryGroup.appendChild(categoryTitle);

                const ul = document.createElement('ul');
                tasksInCategory.forEach(taskText => {
                    const li = document.createElement('li');
                    const span = document.createElement('span'); 
                    span.textContent = taskText;
                    li.appendChild(span);
                    ul.appendChild(li);
                });
                categoryGroup.appendChild(ul);
                domElements.historyTasksList.appendChild(categoryGroup);
            }
        });
    }
    if (!hasCompletedTasks) {
        domElements.historyTasksList.innerHTML = '<p>No tasks were completed on this day.</p>';
    }
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
             if (isPastDay || isToday) { 
                domElements.historyUserNoteDisplay.classList.add('hidden');
                domElements.historyUserNoteEdit.classList.remove('hidden');
                domElements.historicalNoteControls.classList.remove('hidden');
                domElements.historyUserNoteEdit.focus();
            }
        };
    } else {
        domElements.historyUserNoteDisplay.ondblclick = null; 
    }
  } else {
    domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    domElements.historyModalPoints.textContent = 'N/A';
    domElements.historyModalPercentage.textContent = 'N/A';
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
  if (domElements.historyModal) {
    domElements.historyModal.classList.add('hidden');
  }
  currentModalDate = null; 
}


function saveHistoricalNote() {
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    let historyEntry;

    const existingHistoryStr = localStorage.getItem(historyKey);
    if (existingHistoryStr) {
        historyEntry = JSON.parse(existingHistoryStr);
    } else { 
        historyEntry = {
            date: currentModalDate,
            completedTasks: {}, 
            userNote: "",
            pointsEarned: 0,
            percentageCompleted: 0,
            totalTasksOnDate: 0 
        };
         currentCategories.forEach(cat => historyEntry.completedTasks[cat.id] = []);
    }
    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    if (currentModalDate === getTodayDateString() && domElements.dailyNoteInput) {
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
        const monthButton = document.createElement('button');
        monthButton.className = 'month-option';
        monthButton.textContent = month;
        monthButton.dataset.month = index.toString();
        if (index === pickerSelectedMonth) {
            monthButton.classList.add('selected');
        }
        monthButton.onclick = () => {
            pickerSelectedMonth = index;
            calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1);
            renderCalendar();
            populateMonthYearPicker(); 
        };
        domElements.pickerMonthsGrid.appendChild(monthButton);
    });

    domElements.pickerYearsList.innerHTML = '';
    const currentYear = new Date().getFullYear();
    let yearToScrollTo = null;
    for (let year = 2000; year <= 2100; year++) {
        const yearButton = document.createElement('button');
        yearButton.className = 'year-option';
        yearButton.textContent = year.toString();
        yearButton.dataset.year = year.toString();
        if (year === pickerSelectedYear) {
            yearButton.classList.add('selected');
            yearToScrollTo = yearButton;
        }
        yearButton.onclick = () => {
            pickerSelectedYear = year;
            calendarDisplayDate = new Date(pickerSelectedYear, pickerSelectedMonth, 1);
            renderCalendar();
            populateMonthYearPicker(); 
        };
        domElements.pickerYearsList.appendChild(yearButton);
    }
    if (yearToScrollTo) { 
        yearToScrollTo.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
}

function toggleMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        populateMonthYearPicker();
        domElements.monthYearPickerModal.classList.remove('hidden');
    } else {
        domElements.monthYearPickerModal.classList.add('hidden');
    }
}

function closeMonthYearPicker() {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
}

function updateCategoryTabIndicators() {
    currentCategories.forEach(category => {
        const tabButton = document.getElementById(`tab-button-${category.id}`);
        if (!tabButton) return;

        const existingBadge = tabButton.querySelector('.notification-badge');
        if (existingBadge) existingBadge.remove();
        tabButton.classList.remove('category-complete-indicator');

        const categoryTasks = currentTasks.filter(task => task.categoryId === category.id);
        const unlockedTasksInCategory = categoryTasks.filter(task => !lockedTaskIdsToday.includes(task.id));
        
        if (unlockedTasksInCategory.length === 0 && categoryTasks.length > 0) { 
            tabButton.classList.add('category-complete-indicator');
            return;
        }
        
        const completedTasksCount = unlockedTasksInCategory.filter(task => task.completed).length;
        const isFullyCompleted = unlockedTasksInCategory.length > 0 && completedTasksCount === unlockedTasksInCategory.length;
        const incompleteTasksCount = unlockedTasksInCategory.length - completedTasksCount;

        if (isFullyCompleted) {
            tabButton.classList.add('category-complete-indicator');
        } else if (incompleteTasksCount > 0) {
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

function saveLockedTasksForToday() {
    const today = getTodayDateString();
    localStorage.setItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + today, JSON.stringify(lockedTaskIdsToday));
}

function handleSaveProgress() {
  const now = new Date();
  
  if (now.getHours() < 20) { 
      if(domElements.saveProgressMessage) domElements.saveProgressMessage.textContent = `You're saving progress at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Are you sure you're done for today?`;
      if(domElements.saveProgressModal) domElements.saveProgressModal.classList.remove('hidden');
  } else {
    finalizeDayProgress();
  }
}

function finalizeDayProgress() {
    const today = getTodayDateString();
    lockedTaskIdsToday = currentTasks.map(task => task.id);
    saveLockedTasksForToday();
    savePreviousDayHistory(today, currentTasks); 

    currentCategories.forEach(cat => {
      if (cat.id !== 'dashboard') renderCategoryTasks(cat.id);
    });
    updateAllProgress(); 
    updateSaveProgressButtonState();
    if(domElements.saveProgressModal) domElements.saveProgressModal.classList.add('hidden');
    alert(`Progress for ${new Date(today+'T00:00:00').toLocaleDateString()} has been saved and tasks are now locked.`);
}

function updateSaveProgressButtonState() {
  if (!domElements.saveProgressButton) return;
  const today = getTodayDateString();
  const lockedTasksStorageKey = STORAGE_KEY_LOCKED_TASKS_PREFIX + today;
  const storedLockedTasks = localStorage.getItem(lockedTasksStorageKey);
  let isLockedForToday = false;
  if (storedLockedTasks) {
      try {
          const lockedIds = JSON.parse(storedLockedTasks);
          if (lockedIds.length > 0 && currentTasks.every(task => lockedIds.includes(task.id))) {
             isLockedForToday = true;
          } else if (lockedIds.length > 0 && lockedIds.length === currentTasks.length && currentTasks.length > 0) { 
             isLockedForToday = true;
          }
      } catch (e) {
          console.error("Error parsing locked tasks for button state:", e);
      }
  }

  if (lockedTaskIdsToday.length > 0 && currentTasks.length > 0 && currentTasks.every(task => lockedTaskIdsToday.includes(task.id))) {
     isLockedForToday = true;
  }


  if (isLockedForToday) {
    domElements.saveProgressButton.disabled = true;
    domElements.saveProgressButton.textContent = 'Progress Saved';
  } else {
    domElements.saveProgressButton.disabled = false;
    domElements.saveProgressButton.textContent = 'Save Progress';
  }
}


function openFullscreenContentModal(type, date) {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea) return;

    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + date;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry = null;

    if (date === getTodayDateString()) { 
        const progress = calculateProgress();
        const completedTasksToday = {};
        currentCategories.forEach(cat => completedTasksToday[cat.id] = []);
        currentTasks.forEach(task => {
            if (task.completed) {
                 if (!completedTasksToday[task.categoryId]) completedTasksToday[task.categoryId] = [];
                 completedTasksToday[task.categoryId].push(task.text);
            }
        });
        const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + date) || "";
        historyEntry = { completedTasks: completedTasksToday, userNote: note };
    } else if (historyDataString) {
        try {
            historyEntry = JSON.parse(historyDataString);
        } catch (e) {
            console.error("Error parsing history for fullscreen modal:", e);
            domElements.fullscreenModalArea.innerHTML = '<p>Error loading content.</p>';
            domElements.fullscreenContentModal.classList.remove('hidden');
            return;
        }
    }

    if (!historyEntry) {
        domElements.fullscreenModalArea.innerHTML = '<p>No content available for this section.</p>';
        domElements.fullscreenContentModal.classList.remove('hidden');
        return;
    }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    domElements.fullscreenModalArea.innerHTML = ''; 

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTasks) {
            Object.keys(historyEntry.completedTasks).forEach(categoryId => {
                const tasksInCategory = historyEntry.completedTasks[categoryId];
                if (tasksInCategory && tasksInCategory.length > 0) {
                    hasContent = true;
                    const categoryGroup = document.createElement('div');
                    categoryGroup.className = 'history-category-group';
                    
                    const categoryTitle = document.createElement('h4'); 
                    categoryTitle.className = 'history-category-title';
                    categoryTitle.textContent = getCategoryNameById(categoryId);
                    categoryGroup.appendChild(categoryTitle);

                    const ul = document.createElement('ul');
                    tasksInCategory.forEach(taskText => {
                        const li = document.createElement('li');
                        const span = document.createElement('span');
                        span.textContent = taskText;
                        li.appendChild(span);
                        ul.appendChild(li);
                    });
                    categoryGroup.appendChild(ul);
                    domElements.fullscreenModalArea.appendChild(categoryGroup);
                }
            });
        }
        if (!hasContent) {
            domElements.fullscreenModalArea.innerHTML = '<p>No tasks were completed on this day.</p>';
        }
    } else if (type === 'reflection') {
        domElements.fullscreenModalTitle.textContent = `Reflection for ${formattedDate}`;
        if (historyEntry.userNote) {
            const pre = document.createElement('pre');
            pre.textContent = historyEntry.userNote;
            domElements.fullscreenModalArea.appendChild(pre);
        } else {
            domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded for this day.</p>';
        }
    }
    currentFullscreenContent = { type, date };
    domElements.fullscreenContentModal.classList.remove('hidden');
}

function closeFullscreenContentModal() {
    if (domElements.fullscreenContentModal) {
        domElements.fullscreenContentModal.classList.add('hidden');
    }
    currentFullscreenContent = null;
}

// Category Management Functions
function handleAddCategory() {
    const categoryName = prompt("Enter name for the new category:");
    if (categoryName && categoryName.trim() !== "") {
        const newCategoryId = createUniqueId('cat');
        const newCategory = {
            id: newCategoryId,
            name: categoryName.trim(),
            order: currentCategories.length, 
            deletable: true,
        };
        currentCategories.push(newCategory);
        saveUserCategories(currentCategories);

        let tasksByCatId = loadUserTasks();
        tasksByCatId[newCategoryId] = []; 
        saveUserTasks(tasksByCatId);

        if (editModes[newCategoryId] === undefined) {
            editModes[newCategoryId] = false; 
        }
        
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

    const tasksInCategory = (loadUserTasks()[categoryId] || []);
    if (tasksInCategory.length > 0) {
        showDeleteConfirmation('category', categoryId, `Category "${category.name}" contains ${tasksInCategory.length} task(s). Are you sure you want to delete this category and all its tasks?`, category.name);
    } else {
         showDeleteConfirmation('category', categoryId, `Are you sure you want to delete the empty category "${category.name}"?`, category.name);
    }
}


function showCategoryContextMenu(categoryId, targetTabElement) {
    hideCategoryContextMenu(); // Hide any existing one
    currentContextMenuTargetTab = targetTabElement; // Store for positioning or style

    const menu = domElements.categoryTabContextMenu;
    if (!menu) return;

    menu.dataset.categoryId = categoryId;
    const rect = targetTabElement.getBoundingClientRect();
    
    // Position menu below and slightly to the right of the tab's dots icon, or default if icon not found
    const optionsIcon = targetTabElement.querySelector('.tab-options-icon');
    let topPosition, leftPosition;

    if (optionsIcon) {
        const iconRect = optionsIcon.getBoundingClientRect();
        topPosition = iconRect.bottom + window.scrollY + 2;
        leftPosition = iconRect.left + window.scrollX - (menu.offsetWidth / 2) + (iconRect.width / 2) ; // Center under icon
    } else { // Fallback if icon not present (e.g., during long press if icon isn't made visible yet)
        topPosition = rect.bottom + window.scrollY + 5;
        leftPosition = rect.left + window.scrollX;
    }
    
    // Adjust if menu goes off-screen
    const menuWidth = menu.offsetWidth || 120; // Use default or actual
    const menuHeight = menu.offsetHeight || 80;
    
    if (leftPosition + menuWidth > window.innerWidth) {
        leftPosition = window.innerWidth - menuWidth - 10;
    }
    if (topPosition + menuHeight > window.innerHeight) {
        topPosition = rect.top + window.scrollY - menuHeight - 5;
    }
    if (leftPosition < 0) leftPosition = 10;
    if (topPosition < 0) topPosition = 10;


    menu.style.top = `${topPosition}px`;
    menu.style.left = `${leftPosition}px`;
    menu.classList.remove('hidden');
    
    // Make dots visible if this was triggered by long press and dots weren't already visible
    if (optionsIcon && !optionsIcon.classList.contains('visible')) {
        optionsIcon.classList.add('visible');
    }
}

function hideCategoryContextMenu() {
    if (domElements.categoryTabContextMenu) {
        domElements.categoryTabContextMenu.classList.add('hidden');
        domElements.categoryTabContextMenu.removeAttribute('data-category-id');
    }
    if (currentContextMenuTargetTab) {
        const optionsIcon = currentContextMenuTargetTab.querySelector('.tab-options-icon');
        if (optionsIcon) {
            optionsIcon.classList.remove('visible'); // Hide dots if they were made visible for the menu
        }
        currentContextMenuTargetTab = null;
    }
}


// initializeApp is called at the end
function initializeApp() {
  // DOM Element Querying
  domElements.tabsContainer = document.getElementById('tabs');
  domElements.tabContentsContainer = document.getElementById('tab-content');
  domElements.addCategoryButton = document.getElementById('add-category-button');
  domElements.categorySectionTemplate = document.getElementById('category-section-template');
  domElements.categoryTabContextMenu = document.getElementById('category-tab-context-menu');
  domElements.ctxRenameCategoryButton = document.getElementById('ctx-rename-category');
  domElements.ctxDeleteCategoryButton = document.getElementById('ctx-delete-category');
  
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
  domElements.monthYearPickerContent = document.getElementById('month-year-picker-content');
  domElements.monthYearPickerCloseButton = document.getElementById('month-year-picker-close-button');
  domElements.pickerMonthsGrid = document.getElementById('picker-months-grid');
  domElements.pickerYearsList = document.getElementById('picker-years-list');
  domElements.dailyNoteInput = document.getElementById('daily-note-input');
  domElements.saveNoteButton = document.getElementById('save-note-button');
  domElements.historyModal = document.getElementById('history-modal');
  domElements.historyModalCloseButton = document.getElementById('history-modal-close-button');
  domElements.historyModalDate = document.getElementById('history-modal-date');
  domElements.historyModalPoints = document.getElementById('history-modal-points');
  domElements.historyModalPercentage = document.getElementById('history-modal-percentage');
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
  domElements.saveProgressButtonContainer = document.getElementById('save-progress-button-container');
  domElements.saveProgressButton = document.getElementById('save-progress-button');
  domElements.saveProgressModal = document.getElementById('save-progress-modal');
  domElements.saveProgressModalContent = document.getElementById('save-progress-modal-content');
  domElements.saveProgressMessage = document.getElementById('save-progress-message');
  domElements.confirmSaveProgressButton = document.getElementById('confirm-save-progress-button');
  domElements.cancelSaveProgressButton = document.getElementById('cancel-save-progress-button');
  domElements.saveProgressCloseButton = document.getElementById('save-progress-close-button');
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


  loadAppData(); 
  renderTabs();
  renderAllCategorySections(); 
  updateAllProgress();

  const dashboardTabButton = document.getElementById('dashboard-tab-button');
  if (dashboardTabButton) {
      dashboardTabButton.addEventListener('click', () => switchTab('dashboard'));
      if (activeTabId === 'dashboard' || !currentCategories.find(c => c.id === activeTabId)) { 
          switchTab('dashboard');
      } else {
          switchTab(activeTabId); 
      }
  }


  if (domElements.addCategoryButton) {
      domElements.addCategoryButton.addEventListener('click', handleAddCategory);
  }

  if (domElements.ctxRenameCategoryButton) {
    domElements.ctxRenameCategoryButton.addEventListener('click', () => {
        const categoryId = domElements.categoryTabContextMenu.dataset.categoryId;
        if (categoryId) handleRenameCategory(categoryId);
        hideCategoryContextMenu();
    });
  }
  if (domElements.ctxDeleteCategoryButton) {
    domElements.ctxDeleteCategoryButton.addEventListener('click', () => {
        const categoryId = domElements.categoryTabContextMenu.dataset.categoryId;
        if (categoryId) handleDeleteCategory(categoryId);
        hideCategoryContextMenu();
    });
  }
  // Close context menu on outside click
  document.addEventListener('click', (event) => {
    if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.classList.contains('hidden')) {
        if (!domElements.categoryTabContextMenu.contains(event.target) && 
            (!currentContextMenuTargetTab || !currentContextMenuTargetTab.contains(event.target))) {
            hideCategoryContextMenu();
        }
    }
  });


  Object.values(editModes).forEach(val => val = false); 

  domElements.tabContentsContainer.addEventListener('dragover', (e) => {
    const taskListElement = e.target.closest('.task-list');
    if (!taskListElement) return;
    const categoryId = taskListElement.dataset.categoryId;
    if (!editModes[categoryId] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
    
    e.preventDefault();
    taskListElement.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
    });
    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    if (afterElement) {
        afterElement.classList.add('drag-over-indicator-task'); 
    } else {
        const lastItem = taskListElement.querySelector('.task-item:last-child:not(.dragging)');
        if (lastItem) lastItem.classList.add('drag-over-indicator-task-bottom');
    }
    e.dataTransfer.dropEffect = 'move';
  });

  domElements.tabContentsContainer.addEventListener('drop', (e) => {
    const taskListElement = e.target.closest('.task-list');
    if (!taskListElement) return;
    const categoryId = taskListElement.dataset.categoryId;
    if (!editModes[categoryId] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
    
    e.preventDefault();
    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    if (afterElement) {
        taskListElement.insertBefore(draggedTaskElement, afterElement);
    } else {
        taskListElement.appendChild(draggedTaskElement);
    }
  });


  if (domElements.saveNoteButton) {
      domElements.saveNoteButton.addEventListener('click', saveDailyNote);
  }
  
  if (domElements.historyModalCloseButton) {
      domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
  }
  if (domElements.saveHistoricalNoteButton) {
      domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
  }
  if (domElements.clearHistoricalNoteButton) {
      domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
  }

  if (domElements.calendarPrevMonthButton) {
      domElements.calendarPrevMonthButton.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
        renderCalendar();
      });
  }
  if (domElements.calendarNextMonthButton) {
      domElements.calendarNextMonthButton.addEventListener('click', () => {
        calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
        renderCalendar();
      });
  }
  if (domElements.calendarMonthYearButton) {
      domElements.calendarMonthYearButton.addEventListener('click', toggleMonthYearPicker);
  }
  if (domElements.monthYearPickerCloseButton) {
      domElements.monthYearPickerCloseButton.addEventListener('click', closeMonthYearPicker);
  }
  if (domElements.monthYearPickerModal) {
    domElements.monthYearPickerModal.addEventListener('click', (e) => {
        if (e.target === domElements.monthYearPickerModal) { 
            closeMonthYearPicker();
        }
    });
  }
  
  if (domElements.saveProgressButton) {
    domElements.saveProgressButton.addEventListener('click', handleSaveProgress);
  }
  if (domElements.confirmSaveProgressButton) {
    domElements.confirmSaveProgressButton.addEventListener('click', finalizeDayProgress);
  }
  if (domElements.cancelSaveProgressButton) {
    domElements.cancelSaveProgressButton.addEventListener('click', () => {
        if(domElements.saveProgressModal) domElements.saveProgressModal.classList.add('hidden');
    });
  }
  if (domElements.saveProgressCloseButton) {
     domElements.saveProgressCloseButton.addEventListener('click', () => {
        if(domElements.saveProgressModal) domElements.saveProgressModal.classList.add('hidden');
    });
  }

  if (domElements.deleteConfirmationCloseButton) {
    domElements.deleteConfirmationCloseButton.addEventListener('click', hideDeleteConfirmation);
  }
  if (domElements.confirmDeleteButton) {
    domElements.confirmDeleteButton.addEventListener('click', confirmDeletion);
  }
  if (domElements.cancelDeleteButton) {
    domElements.cancelDeleteButton.addEventListener('click', hideDeleteConfirmation);
  }

  if (domElements.expandTasksButton) {
      domElements.expandTasksButton.addEventListener('click', () => {
          if (currentModalDate) openFullscreenContentModal('tasks', currentModalDate);
      });
  }
  if (domElements.expandReflectionButton) {
      domElements.expandReflectionButton.addEventListener('click', () => {
          if (currentModalDate) openFullscreenContentModal('reflection', currentModalDate);
      });
  }
  if (domElements.fullscreenModalCloseButton) {
      domElements.fullscreenModalCloseButton.addEventListener('click', closeFullscreenContentModal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (domElements.categoryTabContextMenu && !domElements.categoryTabContextMenu.classList.contains('hidden')) {
            hideCategoryContextMenu();
        } else if (!domElements.historyModal?.classList.contains('hidden')) {
            closeHistoryModal();
        } else if (isMonthYearPickerOpen) {
            closeMonthYearPicker();
        } else if (!domElements.saveProgressModal?.classList.contains('hidden')) {
            if(domElements.saveProgressModal) domElements.saveProgressModal.classList.add('hidden');
        } else if (!domElements.deleteConfirmationModal?.classList.contains('hidden')) {
            hideDeleteConfirmation();
        } else if (!domElements.fullscreenContentModal?.classList.contains('hidden')) {
            closeFullscreenContentModal();
        }
        else if (activeAddTaskForm) {
            hideTempAddTaskForm(activeAddTaskForm.categoryId, activeAddTaskForm.position);
        }
    }
  });


  updateSaveProgressButtonState();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
