/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const INITIAL_TASKS_CONFIG = {
  health: [
    "Ice facing", "Run 30 mins", "100 jumping jacks", "Stretch 5 mins",
    "100 push-ups", "20 sit-ups", "Dumbbell: 10 reps × 2 sets",
    "Sunlight: 15–20 mins", "Drink 4.5L water", "Self-reprogram",
    "Shower consistently", "Social media < 1 hour"
  ],
  god: [
    "Self-Bible Study", "Thursday congregation", "Sunday congregation",
    "Be the person God expects"
  ],
  personal: ["Content creation"],
  routine: [
    "Wake up at 5:30 AM", "Pray", "Shower", "Read Daily Text", "Clean bed",
    "Prepare solar", "Put back solar", "Take 5-min break every 25 mins",
    "Pray again", "Erase temptation", "Read 1 Bible chapter", "Sleep at 9:10–9:30 PM"
  ],
};

const CATEGORY_DISPLAY_NAMES = {
  health: "Health",
  god: "God",
  personal: "Personal Growth",
  routine: "Daily Routine",
};

const WEEKLY_TARGET_POINTS = 2700;
const MONTHLY_TARGET_POINTS = 20000;

const STORAGE_KEY_TASK_PREFIX = 'lifeTrackerTask_';
const STORAGE_KEY_LAST_VISIT_DATE = 'lifeTrackerLastVisitDate';
const STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX = 'lifeTrackerDailyEarnedPoints_';
const STORAGE_KEY_LAST_MONTH_PROCESSED = 'lifeTrackerLastMonthProcessed';
const STORAGE_KEY_DAILY_NOTE_PREFIX = 'lifeTrackerDailyNote_';
const STORAGE_KEY_DAILY_HISTORY_PREFIX = 'lifeTrackerHistory_';
const STORAGE_KEY_LOCKED_TASKS_PREFIX = 'lifeTrackerLockedTasks_';
const USER_TASKS_STORAGE_KEY = 'lifeTrackerUserDefinedTasks';


let currentTasks = [];
let activeTab = 'dashboard';
let currentModalDate = null; 
let lockedTaskIdsToday = [];
let draggedTaskElement = null;
let draggedTabElement = null;
let taskToDeleteId = null;
let editModes = {
    health: false,
    god: false,
    personal: false,
    routine: false,
};
let activeAddTaskForm = null;
let calendarDisplayDate = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth = new Date().getMonth();
let pickerSelectedYear = new Date().getFullYear();
let currentFullscreenContent = null;


// DOM Elements
const domElements = {
  tabsContainer: null,
  tabButtons: {},
  tabContents: {},
  categorySections: {},
  categoryTaskLists: {},
  
  addItemTriggerButtonsTop: {},
  addItemTriggerButtonsBottom: {},

  newTempTaskFormsTop: {},
  newTempTaskInputsTop: {},
  newTempTaskSaveButtonsTop: {},
  newTempTaskCancelButtonsTop: {},
  
  newTempTaskFormsBottom: {},
  newTempTaskInputsBottom: {},
  newTempTaskSaveButtonsBottom: {},
  newTempTaskCancelButtonsBottom: {},

  editModeToggleButtons: {},
  undoCategoryButtons: {},

  dashboardSummariesContainer: null,
  weeklyProgressFill: null,
  weeklyPointsStat: null,
  monthlyProgressFill: null,
  monthlyPointsStat: null,
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
  deleteTaskConfirmationModal: null,
  deleteTaskModalCloseButton: null,
  confirmDeleteTaskButton: null,
  cancelDeleteTaskButton: null,
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

function createUniqueTaskId(category) {
  return `${category}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getTaskStorageKey(taskId, date) {
  return `${STORAGE_KEY_TASK_PREFIX}${taskId}_${date}`;
}

// User-defined tasks management
function loadUserDefinedTasks() {
  const stored = localStorage.getItem(USER_TASKS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing user-defined tasks:", e);
    }
  }
  // Initialize if not present or error
  const initialUserTasks = {
    health: [], god: [], personal: [], routine: []
  };
  Object.keys(INITIAL_TASKS_CONFIG).forEach(category => {
    initialUserTasks[category] = INITIAL_TASKS_CONFIG[category].map(text => ({
      id: createUniqueTaskId(category),
      text: text,
      category: category,
    }));
  });
  localStorage.setItem(USER_TASKS_STORAGE_KEY, JSON.stringify(initialUserTasks));
  return initialUserTasks;
}

function saveUserDefinedTasks(tasks) {
  localStorage.setItem(USER_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function seedInitialTasksFromConfigIfNeeded() {
  let userTasks = loadUserDefinedTasks(); 
  let updated = false;

  Object.keys(INITIAL_TASKS_CONFIG).forEach(category => {
    if (!userTasks[category] || userTasks[category].length === 0) { 
      userTasks[category] = INITIAL_TASKS_CONFIG[category].map(text => ({
        id: createUniqueTaskId(category),
        text: text,
        category: category,
      }));
      updated = true;
    } else { 
        userTasks[category].forEach(task => {
            if (!task.id) task.id = createUniqueTaskId(category);
            if (!task.category) task.category = category;
        });
    }
  });

  if (updated) {
    saveUserDefinedTasks(userTasks);
  }
}


function loadTasksForDate(date) {
  const userDefinedTaskMap = loadUserDefinedTasks();
  const loadedTasks = [];
  Object.keys(userDefinedTaskMap).forEach(category => {
    userDefinedTaskMap[category].forEach(userTask => {
      const storedCompleted = localStorage.getItem(getTaskStorageKey(userTask.id, date));
      loadedTasks.push({
        id: userTask.id,
        text: userTask.text,
        category: userTask.category,
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
        const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
        let tasksCompletedCount = 0;
        
        currentTasks.forEach(task => {
            if (task.completed) {
                completedTasksToday[task.category].push(task.text);
                tasksCompletedCount++;
            }
        });
        const totalTasksForToday = currentTasks.length;
        const pointsPerTask = totalTasksForToday > 0 ? WEEKLY_TARGET_POINTS / totalTasksForToday : 0;
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

    const completedTasksHistory = { health: [], god: [], personal: [], routine: [] };
    let tasksCompletedCount = 0;
    
    tasksForPreviousDay.forEach(task => {
        if (task.completed) {
            completedTasksHistory[task.category].push(task.text);
            tasksCompletedCount++;
        }
    });

    const totalTasksForPreviousDay = tasksForPreviousDay.length;
    const pointsPerTaskCalculation = totalTasksForPreviousDay > 0 ? WEEKLY_TARGET_POINTS / totalTasksForPreviousDay : 0;
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
  seedInitialTasksFromConfigIfNeeded();

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

function toggleCategoryEditMode(category) {
    editModes[category] = !editModes[category];
    const categorySection = domElements.categorySections[category];
    const toggleButton = domElements.editModeToggleButtons[category];

    if (categorySection && toggleButton) {
        if (editModes[category]) {
            categorySection.classList.add('edit-mode-active');
            toggleButton.classList.add('active-glow');
            toggleButton.setAttribute('aria-pressed', 'true');
        } else {
            categorySection.classList.remove('edit-mode-active');
            toggleButton.classList.remove('active-glow');
            toggleButton.setAttribute('aria-pressed', 'false');
            if (activeAddTaskForm && activeAddTaskForm.category === category) {
                hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position);
            }
        }
    }
    renderCategoryTasks(category);
}

function showTempAddTaskForm(category, position) {
    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position, false);
    }

    activeAddTaskForm = { category, position };
    const triggerButton = position === 'top' ? domElements.addItemTriggerButtonsTop[category] : domElements.addItemTriggerButtonsBottom[category];
    const form = position === 'top' ? domElements.newTempTaskFormsTop[category] : domElements.newTempTaskFormsBottom[category];
    const input = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];

    if (triggerButton) triggerButton.classList.add('hidden');
    if (form) form.classList.remove('hidden');
    if (input) input.focus();
}

function hideTempAddTaskForm(category, position, resetActiveForm = true) {
    const triggerButton = position === 'top' ? domElements.addItemTriggerButtonsTop[category] : domElements.addItemTriggerButtonsBottom[category];
    const form = position === 'top' ? domElements.newTempTaskFormsTop[category] : domElements.newTempTaskFormsBottom[category];
    const input = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];

    if (triggerButton) triggerButton.classList.remove('hidden');
    if (form) form.classList.add('hidden');
    if (input) input.value = '';

    if (resetActiveForm) {
        activeAddTaskForm = null;
    }
}

function handleSaveTempTask(category, position) {
    const input = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];
    const taskText = input.value.trim();

    if (taskText) {
        const newTask = {
            id: createUniqueTaskId(category),
            text: taskText,
            category: category,
            completed: false,
        };
        
        let userTasks = loadUserDefinedTasks();
        if (!userTasks[category]) {
            userTasks[category] = [];
        }

        if (position === 'top') {
            userTasks[category].unshift(newTask); // Add to the beginning for 'top'
        } else {
            userTasks[category].push(newTask); // Add to the end for 'bottom'
        }
        saveUserDefinedTasks(userTasks);
        
        currentTasks = loadTasksForDate(getTodayDateString()); // Reload all tasks
        renderCategoryTasks(category); // Re-render this category
        updateAllProgress();

        hideTempAddTaskForm(category, position);
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
    if (taskTextSpan) taskTextSpan.style.display = 'none'; // Hide original text span

    const editControlsTemplate = domElements.taskEditControlsTemplate;
    if (!editControlsTemplate) {
        console.error("Edit controls template not found!");
        return;
    }
    const editControls = editControlsTemplate.cloneNode(true);
    editControls.removeAttribute('id'); // Remove ID from clone
    editControls.style.display = 'flex'; // Ensure it's visible

    const input = editControls.querySelector('.task-edit-input');
    const saveButton = editControls.querySelector('.task-edit-save');
    const cancelButton = editControls.querySelector('.task-edit-cancel');

    input.value = task.text;

    saveButton.onclick = () => saveTaskEdit(task.id, input.value, taskItemElement, editControls);
    cancelButton.onclick = () => cancelTaskEdit(taskItemElement, editControls, taskTextSpan);
    
    // Insert controls. If task-delete-button exists, insert before it, otherwise append.
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
        
        let userTasks = loadUserDefinedTasks();
        const taskCategory = userTasks[task.category];
        if (taskCategory) {
            const taskIndex = taskCategory.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                taskCategory[taskIndex].text = newText;
                saveUserDefinedTasks(userTasks);
            }
        }
        
        currentTasks = loadTasksForDate(getTodayDateString());
        renderCategoryTasks(task.category); // Re-render the whole category
    }

    const taskTextSpan = taskItemElement.querySelector('.task-text');
    if(taskTextSpan) {
        taskTextSpan.textContent = newText; // Update the span for immediate visual feedback if re-render is slow
        taskTextSpan.style.display = ''; // Show original text span
    }
    taskItemElement.classList.remove('editing');
    editControls.remove();
}

function cancelTaskEdit(taskItemElement, editControls, taskTextSpan) {
    if (taskTextSpan) taskTextSpan.style.display = ''; // Show original text span
    taskItemElement.classList.remove('editing');
    editControls.remove();
}


function renderTaskItem(task) {
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.setAttribute('role', 'listitem');
  item.setAttribute('tabindex', '0'); // Make focusable
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

  // Edit mode specific elements
  if (editModes[task.category]) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'task-delete-button-editmode icon-button';
      deleteButton.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
      deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteButton.title = "Delete Task";
      deleteButton.onclick = (e) => {
          e.stopPropagation(); // Prevent task toggle if item is also clickable
          showDeleteTaskConfirmation(task.id);
      };
      item.appendChild(deleteButton);
  }

  item.addEventListener('click', (e) => {
    if (item.classList.contains('locked') || item.classList.contains('editing')) return;
    
    // If in edit mode, and the click is on the textSpan, initiate edit.
    if (editModes[task.category] && e.target === textSpan) {
        startTaskEdit(item, task);
        return;
    }
    // If not in edit mode, or click is not on textSpan (e.g., checkbox area or general item), toggle completion.
    if (!editModes[task.category]) {
        task.completed = !task.completed;
        saveTaskStatus(task);
        item.classList.toggle('completed');
        item.setAttribute('aria-label', `${task.text}, ${task.completed ? 'completed' : 'not completed'}`);
        item.classList.remove('animate-task-complete', 'animate-task-uncomplete');
        void item.offsetWidth; // Trigger reflow
        item.classList.add(task.completed ? 'animate-task-complete' : 'animate-task-uncomplete');
        updateAllProgress();
        updateSaveProgressButtonState();
    }
  });

   item.addEventListener('keydown', (e) => {
        if (item.classList.contains('locked') || item.classList.contains('editing')) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!editModes[task.category]) { // Only toggle if not in edit mode
                item.click(); // Simulate click to toggle
            } else if (editModes[task.category] && document.activeElement === item) {
                // If in edit mode and the item itself is focused (not an inner button), edit task text.
                 startTaskEdit(item, task);
            }
        }
    });

  // Drag and drop for reordering (only in edit mode, not locked, not editing)
    if (editModes[task.category] && !task.locked && !item.classList.contains('editing')) {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            if (!editModes[task.category] || task.locked || item.classList.contains('editing')) {
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
            // Clear any lingering indicators
            document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => {
                el.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
            });
            // Persist order
            const taskListElement = domElements.categoryTaskLists[task.category];
            if (taskListElement) {
                const newTaskOrderIds = Array.from(taskListElement.querySelectorAll('.task-item')).map(el => el.dataset.taskId);
                let userTasks = loadUserDefinedTasks();
                userTasks[task.category] = newTaskOrderIds.map(id => userTasks[task.category].find(t => t.id === id)).filter(Boolean);
                saveUserDefinedTasks(userTasks);
                currentTasks = loadTasksForDate(getTodayDateString()); // Refresh currentTasks based on new order
            }
        });
    } else {
        item.draggable = false;
    }


  return item;
}

function showDeleteTaskConfirmation(taskId) {
    taskToDeleteId = taskId;
    if (domElements.deleteTaskConfirmationModal) {
        domElements.deleteTaskConfirmationModal.classList.remove('hidden');
    }
}

function confirmDeleteTask() {
    if (!taskToDeleteId) return;

    const task = getTaskById(taskToDeleteId);
    if (!task) return;

    // Remove from currentTasks (local state for today)
    currentTasks = currentTasks.filter(t => t.id !== taskToDeleteId);

    // Remove from userDefinedTasks (persistent storage)
    let userTasks = loadUserDefinedTasks();
    if (userTasks[task.category]) {
        userTasks[task.category] = userTasks[task.category].filter(t => t.id !== taskToDeleteId);
        saveUserDefinedTasks(userTasks);
    }

    // Remove any specific saved status for this task for today (if any)
    localStorage.removeItem(getTaskStorageKey(taskToDeleteId, getTodayDateString()));
    // Remove from locked tasks if present
    lockedTaskIdsToday = lockedTaskIdsToday.filter(id => id !== taskToDeleteId);
    saveLockedTasksForToday();


    renderCategoryTasks(task.category);
    updateAllProgress();
    updateSaveProgressButtonState();
    hideDeleteTaskConfirmation();
}

function hideDeleteTaskConfirmation() {
    if (domElements.deleteTaskConfirmationModal) {
        domElements.deleteTaskConfirmationModal.classList.add('hidden');
    }
    taskToDeleteId = null;
}

function renderCategoryTasks(category) {
  const taskListElement = domElements.categoryTaskLists[category];
  if (!taskListElement) return;

  taskListElement.innerHTML = '';
  const categoryTasks = currentTasks.filter(task => task.category === category);

  if (categoryTasks.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = editModes[category] ? 'No tasks defined. Click "Add Item" to create new tasks.' : 'No tasks for today in this category.';
    emptyMessage.className = 'empty-tasks-message';
    if (editModes[category]) {
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

function renderAllTasks() {
  Object.keys(CATEGORY_DISPLAY_NAMES).forEach(category => {
    renderCategoryTasks(category);
  });
}

function calculateProgress() {
  const today = getTodayDateString();
  let completedCount = 0;
  currentTasks.forEach(task => {
    if (task.completed && !lockedTaskIdsToday.includes(task.id)) { // Only count non-locked completed tasks
      completedCount++;
    }
  });

  const unlockedTasksCount = currentTasks.filter(task => !lockedTaskIdsToday.includes(task.id)).length;
  
  const percentage = unlockedTasksCount > 0 ? Math.round((completedCount / unlockedTasksCount) * 100) : 0;
  const pointsPerTask = unlockedTasksCount > 0 ? WEEKLY_TARGET_POINTS / unlockedTasksCount : 0;
  const pointsEarned = Math.round(completedCount * pointsPerTask);

  localStorage.setItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + today, pointsEarned.toString());

  return { percentage, pointsEarned, completedCount, totalTasks: unlockedTasksCount };
}


function updateDashboardSummaries() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';

  Object.keys(CATEGORY_DISPLAY_NAMES).forEach(category => {
    const categoryTasks = currentTasks.filter(task => task.category === category);
    const completedTasks = categoryTasks.filter(task => task.completed && !lockedTaskIdsToday.includes(task.id));
    const unlockedTasksInCategory = categoryTasks.filter(task => !lockedTaskIdsToday.includes(task.id));

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'dashboard-category-summary';
    summaryDiv.innerHTML = `
      <h3>${CATEGORY_DISPLAY_NAMES[category]}</h3>
      <p class="category-stats">Completed: ${completedTasks.length} / ${unlockedTasksInCategory.length}</p>
    `;
    domElements.dashboardSummariesContainer.appendChild(summaryDiv);
  });
}

function updateWeeklyProgress() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ... Saturday = 6
  let totalPointsThisWeek = 0;

  for (let i = 0; i <= dayOfWeek; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    let pointsForDate = 0;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const historyDataString = localStorage.getItem(historyKey);

    if (dateString === getTodayDateString()) { // For today, calculate from current progress
        const currentProgress = calculateProgress();
        pointsForDate = currentProgress.pointsEarned;
    } else if (historyDataString) { // For past days, use saved history
        try {
            const historyEntry = JSON.parse(historyDataString);
            pointsForDate = historyEntry.pointsEarned || 0;
        } catch (e) {
            console.warn(`Error parsing history for ${dateString}:`, e);
            const storedPoints = localStorage.getItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + dateString);
            if (storedPoints) pointsForDate = parseInt(storedPoints, 10) || 0;
        }
    } else { // Fallback for past days if no history entry (less accurate)
        const storedPoints = localStorage.getItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + dateString);
        if (storedPoints) pointsForDate = parseInt(storedPoints, 10) || 0;
    }
    totalPointsThisWeek += pointsForDate;
  }
  
  const weeklyPercentage = Math.min(100, Math.round((totalPointsThisWeek / WEEKLY_TARGET_POINTS) * 100));

  if (domElements.weeklyProgressFill) {
      domElements.weeklyProgressFill.style.width = `${weeklyPercentage}%`;
      domElements.weeklyProgressFill.textContent = `${weeklyPercentage}%`;
      domElements.weeklyProgressFill.setAttribute('aria-valuenow', weeklyPercentage.toString());
  }
  if (domElements.weeklyPointsStat) {
      domElements.weeklyPointsStat.textContent = `${totalPointsThisWeek} / ${WEEKLY_TARGET_POINTS} points`;
  }
}

function updateMonthlyProgress() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let totalPointsThisMonth = 0;

  for (let day = 1; day <= today.getDate(); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    let pointsForDate = 0;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString;
    const historyDataString = localStorage.getItem(historyKey);

    if (dateString === getTodayDateString()) { // For today
        const currentProgress = calculateProgress();
        pointsForDate = currentProgress.pointsEarned;
    } else if (historyDataString) { // For past days with history
        try {
            const historyEntry = JSON.parse(historyDataString);
            pointsForDate = historyEntry.pointsEarned || 0;
        } catch (e) {
            console.warn(`Error parsing history for ${dateString}:`, e);
            const storedPoints = localStorage.getItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + dateString);
            if (storedPoints) pointsForDate = parseInt(storedPoints, 10) || 0;
        }
    } else { // Fallback for past days
        const storedPoints = localStorage.getItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + dateString);
        if (storedPoints) pointsForDate = parseInt(storedPoints, 10) || 0;
    }
    totalPointsThisMonth += pointsForDate;
  }

  const monthlyPercentage = Math.min(100, Math.round((totalPointsThisMonth / MONTHLY_TARGET_POINTS) * 100));

  if (domElements.monthlyProgressFill) {
      domElements.monthlyProgressFill.style.width = `${monthlyPercentage}%`;
      domElements.monthlyProgressFill.textContent = `${monthlyPercentage}%`;
      domElements.monthlyProgressFill.setAttribute('aria-valuenow', monthlyPercentage.toString());
  }
  if (domElements.monthlyPointsStat) {
      domElements.monthlyPointsStat.textContent = `${totalPointsThisMonth} / ${MONTHLY_TARGET_POINTS} points`;
  }
}


function renderCalendar() {
  if (!domElements.calendarGrid || !domElements.calendarMonthYear) return;

  domElements.calendarGrid.innerHTML = ''; // Clear previous days

  const month = calendarDisplayDate.getMonth();
  const year = calendarDisplayDate.getFullYear();

  domElements.calendarMonthYear.textContent = `${calendarDisplayDate.toLocaleString('default', { month: 'long' })} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

  const today = getNormalizedDate(new Date());

  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(dayName => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dayName;
    domElements.calendarGrid.appendChild(dayHeader);
  });

  // Empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day-cell empty';
    domElements.calendarGrid.appendChild(emptyCell);
  }

  // Populate days of the month
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

    if (cellDate.getTime() === today.getTime()) { // Current actual day
        cell.classList.add('current-day');
        const progress = calculateProgress();
        percentageCompleted = progress.percentage;
        hasHistoryData = progress.completedCount > 0 || (localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) !== null);
    } else { // Past or future day
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
    
    if (percentageCompleted === 0 && !hasHistoryData && cellDate >= today) {
        // No fill if 0% and no other history for current or future dates
    }

    cell.addEventListener('click', () => showHistoryModal(dateString));
    domElements.calendarGrid.appendChild(cell);
  }
}

function showHistoryModal(dateString) {
  currentModalDate = dateString; // Store the date for which the modal is shown
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
    // For today, generate "history" on the fly from current state
    const progress = calculateProgress();
    const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
    currentTasks.forEach(task => {
        if (task.completed) {
             if (!completedTasksToday[task.category]) completedTasksToday[task.category] = []; // Ensure array exists
             completedTasksToday[task.category].push(task.text);
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
          // Potentially show an error in the modal or default values
      }
  }

  if (historyEntry) {
    domElements.historyModalDate.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    domElements.historyModalPoints.textContent = historyEntry.pointsEarned !== undefined ? historyEntry.pointsEarned.toString() : 'N/A';
    domElements.historyModalPercentage.textContent = historyEntry.percentageCompleted !== undefined ? historyEntry.percentageCompleted.toString() : 'N/A';

    domElements.historyTasksList.innerHTML = '';
    let hasCompletedTasks = false;
    if (historyEntry.completedTasks) {
        Object.keys(historyEntry.completedTasks).forEach(categoryKey => {
            const tasksInCategory = historyEntry.completedTasks[categoryKey];
            if (tasksInCategory && tasksInCategory.length > 0) {
                hasCompletedTasks = true;
                const categoryGroup = document.createElement('div');
                categoryGroup.className = 'history-category-group';
                
                const categoryTitle = document.createElement('h5');
                categoryTitle.className = 'history-category-title';
                categoryTitle.textContent = CATEGORY_DISPLAY_NAMES[categoryKey] || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                categoryGroup.appendChild(categoryTitle);

                const ul = document.createElement('ul');
                tasksInCategory.forEach(taskText => {
                    const li = document.createElement('li');
                    const span = document.createElement('span'); // To apply line-through
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
    domElements.historyUserNoteEdit.classList.add('hidden'); // Start in display mode
    domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = '';
    
    domElements.expandReflectionButton.classList.toggle('hidden', !historyEntry.userNote);


    // Allow editing only for past days or today (if we allow editing today's note via history for consistency)
    if (isPastDay || isToday) { // Check if this day is editable. For now, assume all historical notes are.
        domElements.historyUserNoteDisplay.ondblclick = () => {
             if (isPastDay || isToday) { // Double check within handler
                domElements.historyUserNoteDisplay.classList.add('hidden');
                domElements.historyUserNoteEdit.classList.remove('hidden');
                domElements.historicalNoteControls.classList.remove('hidden');
                domElements.historyUserNoteEdit.focus();
            }
        };
    } else {
        domElements.historyUserNoteDisplay.ondblclick = null; // Disable editing for future dates
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

function saveHistoricalNote() {
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    let historyEntry;

    const existingHistoryStr = localStorage.getItem(historyKey);
    if (existingHistoryStr) {
        historyEntry = JSON.parse(existingHistoryStr);
    } else { // If no history entry exists, create a basic one
        historyEntry = {
            date: currentModalDate,
            completedTasks: {}, // Assume no task data if creating new
            userNote: "",
            pointsEarned: 0,
            percentageCompleted: 0,
            totalTasksOnDate: 0 // May need to infer this if relevant
        };
    }
    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    // If it's today's note being edited via history, also update the daily note input if visible
    if (currentModalDate === getTodayDateString() && domElements.dailyNoteInput) {
        domElements.dailyNoteInput.value = noteContent;
        // Also update the separate daily note storage for today
        localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + currentModalDate, noteContent);
    }


    domElements.historyUserNoteDisplay.textContent = noteContent || "No reflection recorded for this day.";
    domElements.historyUserNoteDisplay.classList.remove('hidden');
    domElements.historyUserNoteEdit.classList.add('hidden');
    domElements.historicalNoteControls.classList.add('hidden');
    domElements.historicalNoteStatus.textContent = 'Reflection saved!';
    setTimeout(() => { domElements.historicalNoteStatus.textContent = ''; }, 2000);
    
    domElements.expandReflectionButton.classList.toggle('hidden', !noteContent);

    renderCalendar(); // Re-render calendar to update fill/styles if note affects "has-history"
}

function clearHistoricalNote() {
     if (!domElements.historyUserNoteEdit) return;
    domElements.historyUserNoteEdit.value = "";
    // Optionally, could immediately save this cleared state, or wait for explicit save.
    // For now, just clears the textarea, user needs to click "Save Reflection"
}


function closeHistoryModal() {
  if (domElements.historyModal) {
      domElements.historyModal.classList.add('hidden');
  }
  currentModalDate = null;
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
            populateMonthYearPicker(); // Re-populate to update selection
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
            populateMonthYearPicker(); // Re-populate to update selection
        };
        domElements.pickerYearsList.appendChild(yearButton);
    }
    if (yearToScrollTo) { // Scroll the selected year into view
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

function updateAllProgress() {
  updateDashboardSummaries();
  updateWeeklyProgress();
  updateMonthlyProgress();
  renderCalendar(); 
}

function saveLockedTasksForToday() {
    const today = getTodayDateString();
    localStorage.setItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + today, JSON.stringify(lockedTaskIdsToday));
}

function handleSaveProgress() {
  const now = new Date();
  const today = getTodayDateString();
  
  if (now.getHours() < 20) { // Before 8 PM
      if(domElements.saveProgressMessage) domElements.saveProgressMessage.textContent = `You're saving progress at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Are you sure you're done for today?`;
      if(domElements.saveProgressModal) domElements.saveProgressModal.classList.remove('hidden');
  } else {
    finalizeDayProgress();
  }
}

function finalizeDayProgress() {
    const today = getTodayDateString();
    // Lock all current tasks
    lockedTaskIdsToday = currentTasks.map(task => task.id);
    saveLockedTasksForToday();

    // Save final history entry for the day
    savePreviousDayHistory(today, currentTasks); // Using this function as it captures all necessary data

    // Update UI elements to reflect locked state
    renderAllTasks();
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
          // Check if all current tasks are in the locked list.
          // This logic might need refinement if tasks can be added/removed after initial lock.
          // A simpler check: if *any* tasks are locked, consider the day locked for simplicity for now.
          if (lockedIds.length > 0 && currentTasks.every(task => lockedIds.includes(task.id))) {
             isLockedForToday = true;
          } else if (lockedIds.length > 0 && lockedIds.length === currentTasks.length) { // Alternative check
             isLockedForToday = true;
          }
      } catch (e) {
          console.error("Error parsing locked tasks for button state:", e);
      }
  }

  // A more robust check might be if a "day_finalized_flag_YYYY-MM-DD" exists in history or a specific flag.
  // For now, let's assume if the lockedTaskIdsToday array (from loadAppData) covers all tasks, it's locked.
  if (lockedTaskIdsToday.length > 0 && currentTasks.every(task => lockedTaskIdsToday.includes(task.id))) {
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

    if (date === getTodayDateString()) { // For today, generate "history" on the fly
        const progress = calculateProgress();
        const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
        currentTasks.forEach(task => {
            if (task.completed) {
                 if (!completedTasksToday[task.category]) completedTasksToday[task.category] = [];
                 completedTasksToday[task.category].push(task.text);
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
    domElements.fullscreenModalArea.innerHTML = ''; // Clear previous content

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${formattedDate}`;
        let hasContent = false;
        if (historyEntry.completedTasks) {
            Object.keys(historyEntry.completedTasks).forEach(categoryKey => {
                const tasksInCategory = historyEntry.completedTasks[categoryKey];
                if (tasksInCategory && tasksInCategory.length > 0) {
                    hasContent = true;
                    const categoryGroup = document.createElement('div');
                    categoryGroup.className = 'history-category-group';
                    
                    const categoryTitle = document.createElement('h4'); // Use h4 for semantic structure
                    categoryTitle.className = 'history-category-title';
                    categoryTitle.textContent = CATEGORY_DISPLAY_NAMES[categoryKey] || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
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


function initializeApp() {
  // DOM Element Querying
  domElements.tabsContainer = document.getElementById('tabs');
  domElements.tabContents.dashboard = document.getElementById('dashboard-content');
  domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
  domElements.weeklyProgressFill = document.getElementById('weekly-progress-fill');
  domElements.weeklyPointsStat = document.getElementById('weekly-points-stat');
  domElements.monthlyProgressFill = document.getElementById('monthly-progress-fill');
  domElements.monthlyPointsStat = document.getElementById('monthly-points-stat');
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
  domElements.deleteTaskConfirmationModal = document.getElementById('delete-task-confirmation-modal');
  domElements.deleteTaskModalCloseButton = document.getElementById('delete-task-modal-close-button');
  domElements.confirmDeleteTaskButton = document.getElementById('confirm-delete-task-button');
  domElements.cancelDeleteTaskButton = document.getElementById('cancel-delete-task-button');
  domElements.fullscreenContentModal = document.getElementById('fullscreen-content-modal');
  domElements.fullscreenModalTitle = document.getElementById('fullscreen-modal-title');
  domElements.fullscreenModalArea = document.getElementById('fullscreen-modal-area');
  domElements.fullscreenModalCloseButton = document.getElementById('fullscreen-modal-close-button');


  Object.keys(CATEGORY_DISPLAY_NAMES).forEach(category => {
    domElements.tabButtons[category] = document.getElementById(`${category}-tab-button`);
    domElements.tabContents[category] = document.getElementById(`${category}-content`);
    domElements.categoryTaskLists[category] = document.getElementById(`${category}-task-list`);
    domElements.categorySections[category] = document.getElementById(`${category}-content`); // Assuming section ID matches content ID
    domElements.editModeToggleButtons[category] = document.getElementById(`edit-mode-toggle-${category}`);
    domElements.undoCategoryButtons[category] = document.getElementById(`undo-category-${category}`);
    
    // Top Add Task Form
    domElements.addItemTriggerButtonsTop[category] = document.getElementById(`add-item-trigger-button-top-${category}`);
    domElements.newTempTaskFormsTop[category] = document.getElementById(`new-temp-task-form-top-${category}`);
    domElements.newTempTaskInputsTop[category] = document.getElementById(`new-temp-task-input-top-${category}`);
    domElements.newTempTaskSaveButtonsTop[category] = document.getElementById(`new-temp-task-save-button-top-${category}`);
    domElements.newTempTaskCancelButtonsTop[category] = document.getElementById(`new-temp-task-cancel-button-top-${category}`);

    // Bottom Add Task Form
    domElements.addItemTriggerButtonsBottom[category] = document.getElementById(`add-item-trigger-button-bottom-${category}`);
    domElements.newTempTaskFormsBottom[category] = document.getElementById(`new-temp-task-form-bottom-${category}`);
    domElements.newTempTaskInputsBottom[category] = document.getElementById(`new-temp-task-input-bottom-${category}`);
    domElements.newTempTaskSaveButtonsBottom[category] = document.getElementById(`new-temp-task-save-button-bottom-${category}`);
    domElements.newTempTaskCancelButtonsBottom[category] = document.getElementById(`new-temp-task-cancel-button-bottom-${category}`);

  });
  domElements.tabButtons.dashboard = document.getElementById('dashboard-tab-button');


  loadAppData();
  renderAllTasks();
  updateAllProgress();

  // Tab switching logic
  if (domElements.tabsContainer) {
      domElements.tabsContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.tab-button');
        if (!targetButton) return;

        const category = targetButton.id.split('-')[0]; // e.g., 'health' from 'health-tab-button' or 'dashboard'
        activeTab = category;

        // Update button states
        Object.values(domElements.tabButtons).forEach(button => {
          if(button) {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
          }
        });
        targetButton.classList.add('active');
        targetButton.setAttribute('aria-selected', 'true');

        // Update content visibility
        Object.values(domElements.tabContents).forEach(content => {
          if(content) content.classList.add('hidden');
        });
        const activeContent = domElements.tabContents[category];
        if (activeContent) {
          activeContent.classList.remove('hidden');
          // If switching to a category tab, ensure edit mode specific UIs are correctly shown/hidden
          if (category !== 'dashboard') {
            renderCategoryTasks(category); // Re-render to apply edit mode styles/elements
          }
        }
        
        // Hide all add task forms when switching tabs
        if (activeAddTaskForm) {
            hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position);
        }
      });
  }

  // Edit mode toggles and undo buttons
  Object.keys(CATEGORY_DISPLAY_NAMES).forEach(category => {
    if (domElements.editModeToggleButtons[category]) {
        domElements.editModeToggleButtons[category].addEventListener('click', () => toggleCategoryEditMode(category));
    }
    if (domElements.undoCategoryButtons[category]) {
        domElements.undoCategoryButtons[category].addEventListener('click', () => {
            currentTasks.forEach(task => {
                if (task.category === category && !lockedTaskIdsToday.includes(task.id)) {
                    task.completed = false;
                    saveTaskStatus(task);
                }
            });
            renderCategoryTasks(category);
            updateAllProgress();
            updateSaveProgressButtonState();

            // Animate points reset if on dashboard
            if (activeTab === 'dashboard') {
                const pointsElements = [domElements.weeklyPointsStat, domElements.monthlyPointsStat];
                pointsElements.forEach(el => {
                    if (el) {
                        el.classList.add('progress-value-resetting');
                        setTimeout(() => el.classList.remove('progress-value-resetting'), 500);
                    }
                });
            }
        });
    }

    // Add task form triggers and handlers (Top)
    if (domElements.addItemTriggerButtonsTop[category]) {
        domElements.addItemTriggerButtonsTop[category].addEventListener('click', () => showTempAddTaskForm(category, 'top'));
    }
    if (domElements.newTempTaskSaveButtonsTop[category]) {
        domElements.newTempTaskSaveButtonsTop[category].addEventListener('click', () => handleSaveTempTask(category, 'top'));
    }
    if (domElements.newTempTaskCancelButtonsTop[category]) {
        domElements.newTempTaskCancelButtonsTop[category].addEventListener('click', () => hideTempAddTaskForm(category, 'top'));
    }
     if (domElements.newTempTaskInputsTop[category]) {
        domElements.newTempTaskInputsTop[category].addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveTempTask(category, 'top');
            }
        });
    }

    // Add task form triggers and handlers (Bottom)
    if (domElements.addItemTriggerButtonsBottom[category]) {
        domElements.addItemTriggerButtonsBottom[category].addEventListener('click', () => showTempAddTaskForm(category, 'bottom'));
    }
    if (domElements.newTempTaskSaveButtonsBottom[category]) {
        domElements.newTempTaskSaveButtonsBottom[category].addEventListener('click', () => handleSaveTempTask(category, 'bottom'));
    }
    if (domElements.newTempTaskCancelButtonsBottom[category]) {
        domElements.newTempTaskCancelButtonsBottom[category].addEventListener('click', () => hideTempAddTaskForm(category, 'bottom'));
    }
    if (domElements.newTempTaskInputsBottom[category]) {
        domElements.newTempTaskInputsBottom[category].addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveTempTask(category, 'bottom');
            }
        });
    }


    // Drag and Drop for task lists
    const taskListElement = domElements.categoryTaskLists[category];
    if (taskListElement) {
        taskListElement.addEventListener('dragover', (e) => {
            if (!editModes[category] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
            e.preventDefault();
            
            // Clear previous indicators
            taskListElement.querySelectorAll('.task-item').forEach(item => {
                item.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
            });

            const afterElement = getDragAfterElement(taskListElement, e.clientY);
            if (afterElement) {
                afterElement.classList.add('drag-over-indicator-task'); // Default: insert above this element
            } else {
                // If no element to insert before (i.e., dragging to the end), mark the last item for bottom insertion
                const lastItem = taskListElement.querySelector('.task-item:last-child:not(.dragging)');
                if (lastItem) {
                    lastItem.classList.add('drag-over-indicator-task-bottom');
                } else if (!taskListElement.querySelector('.task-item:not(.dragging)')) {
                    // List is empty or only contains the dragging item - no visual indicator needed or special handling
                }
            }
            e.dataTransfer.dropEffect = 'move';
        });
        taskListElement.addEventListener('drop', (e) => {
             if (!editModes[category] || !draggedTaskElement || draggedTaskElement.closest('.task-list') !== taskListElement) return;
            e.preventDefault();
            const afterElement = getDragAfterElement(taskListElement, e.clientY);
            if (afterElement) {
                taskListElement.insertBefore(draggedTaskElement, afterElement);
            } else {
                taskListElement.appendChild(draggedTaskElement);
            }
            // Indicator removal will happen in dragend to cover cases where drop is outside a valid target
        });
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
        if (e.target === domElements.monthYearPickerModal) { // Click on overlay
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

  if (domElements.deleteTaskModalCloseButton) {
    domElements.deleteTaskModalCloseButton.addEventListener('click', hideDeleteTaskConfirmation);
  }
  if (domElements.confirmDeleteTaskButton) {
    domElements.confirmDeleteTaskButton.addEventListener('click', confirmDeleteTask);
  }
  if (domElements.cancelDeleteTaskButton) {
    domElements.cancelDeleteTaskButton.addEventListener('click', hideDeleteTaskConfirmation);
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


  // Global listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!domElements.historyModal?.classList.contains('hidden')) {
            closeHistoryModal();
        } else if (isMonthYearPickerOpen) {
            closeMonthYearPicker();
        } else if (!domElements.saveProgressModal?.classList.contains('hidden')) {
            if(domElements.saveProgressModal) domElements.saveProgressModal.classList.add('hidden');
        } else if (!domElements.deleteTaskConfirmationModal?.classList.contains('hidden')) {
            hideDeleteTaskConfirmation();
        } else if (!domElements.fullscreenContentModal?.classList.contains('hidden')) {
            closeFullscreenContentModal();
        }
        // If an add task form is active, Escape should cancel it
        else if (activeAddTaskForm) {
            hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position);
        }
    }
  });

  // Set initial active tab (dashboard)
  if (domElements.tabButtons.dashboard) {
      domElements.tabButtons.dashboard.click(); 
  }

  // Ensure initial save progress button state is correct
  updateSaveProgressButtonState();
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions if needed for module context, though for simple browser script they are global.
// For type="module", they are scoped to this module. If access from console is needed for debugging,
// explicitly attach to window:
// window.myApp = { toggleTask, renderTasks, ... };
