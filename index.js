/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type TaskCategoryName = 'health' | 'god' | 'personal' | 'routine';
type TabId = 'dashboard' | TaskCategoryName;
type AddTaskFormPosition = 'top' | 'bottom';
type FullscreenContentType = 'tasks' | 'reflection';


interface Task {
  id: string; // e.g., "health-1678886400000-abcd1"
  text: string;
  completed: boolean;
  category: TaskCategoryName;
  // isDefault?: boolean; // Could be used to differentiate, not essential for current CRUD
}

interface UserDefinedTask {
  id: string;
  text: string;
  category: TaskCategoryName;
}

interface DailyHistoryEntry {
  date: string; // YYYY-MM-DD
  completedTasks: Record<TaskCategoryName, string[]>;
  userNote: string;
  pointsEarned: number;
  percentageCompleted: number;
  totalTasksOnDate?: number; // Store total tasks for accurate historical percentage
}


const INITIAL_TASKS_CONFIG: Record<TaskCategoryName, string[]> = {
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

const CATEGORY_DISPLAY_NAMES: Record<TaskCategoryName, string> = {
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


let currentTasks: Task[] = [];
let activeTab: TabId = 'dashboard';
let currentModalDate: string | null = null; // Used by history modal and fullscreen modal
let lockedTaskIdsToday: string[] = [];
let draggedTaskElement: HTMLElement | null = null;
let draggedTabElement: HTMLElement | null = null;
let taskToDeleteId: string | null = null;
let editModes: Record<TaskCategoryName, boolean> = {
    health: false,
    god: false,
    personal: false,
    routine: false,
};
let activeAddTaskForm: { category: TaskCategoryName, position: AddTaskFormPosition } | null = null;
let calendarDisplayDate: Date = new Date();
let isMonthYearPickerOpen = false;
let pickerSelectedMonth: number = new Date().getMonth();
let pickerSelectedYear: number = new Date().getFullYear();
let currentFullscreenContent: { type: FullscreenContentType, data: any, dateString: string } | null = null;


// DOM Elements
const domElements = {
  tabsContainer: null as HTMLElement | null,
  tabButtons: {} as Record<TabId, HTMLButtonElement | null>,
  tabContents: {} as Record<TabId, HTMLElement | null>,
  categorySections: {} as Record<TaskCategoryName, HTMLElement | null>,
  categoryTaskLists: {} as Record<TaskCategoryName, HTMLUListElement | null>,
  
  addItemTriggerButtonsTop: {} as Record<TaskCategoryName, HTMLButtonElement | null>,
  addItemTriggerButtonsBottom: {} as Record<TaskCategoryName, HTMLButtonElement | null>,

  newTempTaskFormsTop: {} as Record<TaskCategoryName, HTMLElement | null>,
  newTempTaskInputsTop: {} as Record<TaskCategoryName, HTMLInputElement | null>,
  newTempTaskSaveButtonsTop: {} as Record<TaskCategoryName, HTMLButtonElement | null>,
  newTempTaskCancelButtonsTop: {} as Record<TaskCategoryName, HTMLButtonElement | null>,
  
  newTempTaskFormsBottom: {} as Record<TaskCategoryName, HTMLElement | null>,
  newTempTaskInputsBottom: {} as Record<TaskCategoryName, HTMLInputElement | null>,
  newTempTaskSaveButtonsBottom: {} as Record<TaskCategoryName, HTMLButtonElement | null>,
  newTempTaskCancelButtonsBottom: {} as Record<TaskCategoryName, HTMLButtonElement | null>,

  editModeToggleButtons: {} as Record<TaskCategoryName, HTMLButtonElement | null>,
  undoCategoryButtons: {} as Record<TaskCategoryName, HTMLButtonElement | null>,

  dashboardSummariesContainer: null as HTMLElement | null,
  weeklyProgressFill: null as HTMLElement | null,
  weeklyPointsStat: null as HTMLElement |null,
  monthlyProgressFill: null as HTMLElement | null,
  monthlyPointsStat: null as HTMLElement | null,
  calendarMonthYearButton: null as HTMLButtonElement | null,
  calendarMonthYear: null as HTMLElement | null,
  calendarGrid: null as HTMLElement | null,
  calendarPrevMonthButton: null as HTMLButtonElement | null,
  calendarNextMonthButton: null as HTMLButtonElement | null,
  monthYearPickerModal: null as HTMLElement | null,
  monthYearPickerContent: null as HTMLElement | null,
  monthYearPickerCloseButton: null as HTMLButtonElement | null,
  pickerMonthsGrid: null as HTMLElement | null,
  pickerYearsList: null as HTMLElement | null,
  dailyNoteInput: null as HTMLTextAreaElement | null,
  saveNoteButton: null as HTMLButtonElement | null,
  historyModal: null as HTMLElement | null,
  historyModalCloseButton: null as HTMLButtonElement | null,
  historyModalDate: null as HTMLElement | null,
  historyModalPoints: null as HTMLElement | null,
  historyModalPercentage: null as HTMLElement | null,
  historyTasksList: null as HTMLElement | null,
  expandTasksButton: null as HTMLButtonElement | null,
  historicalReflectionWrapper: null as HTMLElement | null,
  expandReflectionButton: null as HTMLButtonElement | null,
  historyUserNoteDisplay: null as HTMLParagraphElement | null,
  historyUserNoteEdit: null as HTMLTextAreaElement | null,
  historicalNoteControls: null as HTMLElement | null,
  saveHistoricalNoteButton: null as HTMLButtonElement | null,
  clearHistoricalNoteButton: null as HTMLButtonElement | null,
  historicalNoteStatus: null as HTMLSpanElement | null,
  saveProgressButtonContainer: null as HTMLElement | null,
  saveProgressButton: null as HTMLButtonElement | null,
  saveProgressModal: null as HTMLElement | null,
  saveProgressModalContent: null as HTMLElement | null,
  saveProgressMessage: null as HTMLParagraphElement | null,
  confirmSaveProgressButton: null as HTMLButtonElement | null,
  cancelSaveProgressButton: null as HTMLButtonElement | null,
  saveProgressCloseButton: null as HTMLButtonElement | null,
  taskEditControlsTemplate: null as HTMLElement | null,
  deleteTaskConfirmationModal: null as HTMLElement | null,
  deleteTaskModalCloseButton: null as HTMLButtonElement | null,
  confirmDeleteTaskButton: null as HTMLButtonElement | null,
  cancelDeleteTaskButton: null as HTMLButtonElement | null,
  fullscreenContentModal: null as HTMLElement | null,
  fullscreenModalTitle: null as HTMLElement | null,
  fullscreenModalArea: null as HTMLElement | null,
  fullscreenModalCloseButton: null as HTMLButtonElement | null,
};

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNormalizedDate(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}


function getCurrentMonthYearString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function createUniqueTaskId(category: TaskCategoryName): string {
  return `${category}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getTaskStorageKey(taskId: string, date: string): string {
  return `${STORAGE_KEY_TASK_PREFIX}${taskId}_${date}`;
}

// User-defined tasks management
function loadUserDefinedTasks(): Record<TaskCategoryName, UserDefinedTask[]> {
  const stored = localStorage.getItem(USER_TASKS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing user-defined tasks:", e);
    }
  }
  // Initialize if not present or error
  const initialUserTasks: Record<TaskCategoryName, UserDefinedTask[]> = {
    health: [], god: [], personal: [], routine: []
  };
  (Object.keys(INITIAL_TASKS_CONFIG) as TaskCategoryName[]).forEach(category => {
    initialUserTasks[category] = INITIAL_TASKS_CONFIG[category].map(text => ({
      id: createUniqueTaskId(category),
      text: text,
      category: category,
    }));
  });
  localStorage.setItem(USER_TASKS_STORAGE_KEY, JSON.stringify(initialUserTasks));
  return initialUserTasks;
}

function saveUserDefinedTasks(tasks: Record<TaskCategoryName, UserDefinedTask[]>): void {
  localStorage.setItem(USER_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function seedInitialTasksFromConfigIfNeeded(): void {
  let userTasks = loadUserDefinedTasks(); // Load existing or default seeded ones
  let updated = false;

  (Object.keys(INITIAL_TASKS_CONFIG) as TaskCategoryName[]).forEach(category => {
    if (!userTasks[category] || userTasks[category].length === 0) { // Only seed if truly empty for a category
      userTasks[category] = INITIAL_TASKS_CONFIG[category].map(text => ({
        id: createUniqueTaskId(category),
        text: text,
        category: category,
      }));
      updated = true;
    } else { // Ensure existing tasks have stable IDs and category (migration for older data if any)
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


function loadTasksForDate(date: string): Task[] {
  const userDefinedTaskMap = loadUserDefinedTasks();
  const loadedTasks: Task[] = [];
  (Object.keys(userDefinedTaskMap) as TaskCategoryName[]).forEach(category => {
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


function saveTaskStatus(task: Task): void {
  const today = getTodayDateString();
  localStorage.setItem(getTaskStorageKey(task.id, today), task.completed.toString());
}

function saveDailyNote(): void {
    if (!domElements.dailyNoteInput) return;
    const today = getTodayDateString();
    const noteContent = domElements.dailyNoteInput.value;

    localStorage.setItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today, noteContent);

    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry: DailyHistoryEntry;

    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    } else {
        const completedTasksToday: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
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


function loadCurrentDayNote(): void {
    if (!domElements.dailyNoteInput) return;
    const today = getTodayDateString();
    const note = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + today);
    if (note) {
        domElements.dailyNoteInput.value = note;
    } else {
        domElements.dailyNoteInput.value = '';
    }
}

function savePreviousDayHistory(previousDayDate: string, tasksForPreviousDay: Task[]): void {
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + previousDayDate;
    let historyEntry: DailyHistoryEntry;

    const completedTasksHistory: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
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
            const existingEntry = JSON.parse(existingHistoryStr) as DailyHistoryEntry;
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


function checkAndClearOldMonthlyData(): void {
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


function loadAppData(): void {
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
  
  // Initialize calendar display date
  calendarDisplayDate = new Date();
  calendarDisplayDate.setDate(1); // Start with the first day of the current month
  calendarDisplayDate.setHours(0,0,0,0); // Normalize time
  pickerSelectedMonth = calendarDisplayDate.getMonth();
  pickerSelectedYear = calendarDisplayDate.getFullYear();
}

function getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
    const draggableElements = Array.from(container.querySelectorAll('.task-item:not(.dragging):not(.editing)')) as HTMLElement[];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null }).element;
}

function toggleCategoryEditMode(category: TaskCategoryName): void {
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
            // If an add task form was active for this category, hide it
            if (activeAddTaskForm && activeAddTaskForm.category === category) {
                hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position);
            }
        }
    }
    renderCategoryTasks(category);
}

function showTempAddTaskForm(category: TaskCategoryName, position: AddTaskFormPosition): void {
    // Hide any other active add task form first
    if (activeAddTaskForm) {
        hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position, false);
    }

    activeAddTaskForm = { category, position };
    const triggerButton = position === 'top' ? domElements.addItemTriggerButtonsTop[category] : domElements.addItemTriggerButtonsBottom[category];
    const tempFormContainer = position === 'top' ? domElements.newTempTaskFormsTop[category] : domElements.newTempTaskFormsBottom[category];
    const tempInput = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];

    if (triggerButton) triggerButton.classList.add('hidden');
    if (tempFormContainer) tempFormContainer.classList.remove('hidden');
    if (tempInput) {
        tempInput.value = '';
        tempInput.focus();
    }
}

function hideTempAddTaskForm(category: TaskCategoryName, position: AddTaskFormPosition, clearInput: boolean = true): void {
    if (!activeAddTaskForm || activeAddTaskForm.category !== category || activeAddTaskForm.position !== position) {
        if (activeAddTaskForm === null) return; 
    }
    
    const triggerButton = position === 'top' ? domElements.addItemTriggerButtonsTop[category] : domElements.addItemTriggerButtonsBottom[category];
    const tempFormContainer = position === 'top' ? domElements.newTempTaskFormsTop[category] : domElements.newTempTaskFormsBottom[category];
    const tempInput = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];

    if (triggerButton) triggerButton.classList.remove('hidden');
    if (tempFormContainer) tempFormContainer.classList.add('hidden');
    if (tempInput && clearInput) tempInput.value = '';
    
    if (activeAddTaskForm && activeAddTaskForm.category === category && activeAddTaskForm.position === position) {
      activeAddTaskForm = null;
    }
}


function renderCategoryTasks(category: TaskCategoryName, animatedTaskId?: string, animationType?: 'complete' | 'uncomplete'): void {
  const taskListElement = domElements.categoryTaskLists[category];
  if (!taskListElement) return;

  const tasksForCategory = currentTasks.filter(task => task.category === category);
  const isInEditMode = editModes[category];
  
  const scrollPosition = (activeTab === category && taskListElement.closest('#left-column')) ? (taskListElement.closest('#left-column') as HTMLElement).scrollTop : 0;

  taskListElement.innerHTML = ''; 

  if (tasksForCategory.length === 0 && !isInEditMode) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = `No tasks for ${CATEGORY_DISPLAY_NAMES[category]} today. Click the pencil icon to add some!`;
    emptyMessage.className = 'empty-tasks-message';
    taskListElement.appendChild(emptyMessage);
  } else if (tasksForCategory.length === 0 && isInEditMode) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = `Add your first task for ${CATEGORY_DISPLAY_NAMES[category]}!`;
    emptyMessage.className = 'empty-tasks-message edit-mode-empty'; 
    taskListElement.appendChild(emptyMessage);
  }
  else {
    tasksForCategory.forEach(task => {
      const listItem = document.createElement('li');
      listItem.className = 'task-item';
      listItem.setAttribute('data-task-id', task.id);
      
      const isLocked = lockedTaskIdsToday.includes(task.id);
      listItem.draggable = isInEditMode && !isLocked;


      if (task.completed) listItem.classList.add('completed');
      if (isLocked) {
          listItem.classList.add('locked');
          listItem.setAttribute('aria-disabled', 'true');
          if (!task.completed) { 
              task.completed = true; 
              listItem.classList.add('completed');
          }
          listItem.setAttribute('aria-pressed', 'true'); 
      }

      const taskTextSpan = document.createElement('span');
      taskTextSpan.className = 'task-text';
      taskTextSpan.textContent = task.text;
      listItem.appendChild(taskTextSpan);

      if (isInEditMode && !isLocked) {
          const deleteButton = document.createElement('button');
          deleteButton.className = 'task-delete-button-editmode icon-button'; 
          deleteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>'; 
          deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
          deleteButton.title = "Delete task";
          deleteButton.addEventListener('click', (e) => {
              e.stopPropagation(); 
              showDeleteTaskConfirmation(task.id);
          });
          listItem.appendChild(deleteButton);
      }


      if (!isLocked) {
          listItem.setAttribute('role', 'button');
          listItem.setAttribute('tabindex', '0');
          listItem.setAttribute('aria-pressed', task.completed.toString());
          
          listItem.addEventListener('click', (e) => {
            if (listItem.classList.contains('editing')) return;
            if ((e.target as HTMLElement).closest('.task-delete-button-editmode')) return;

            if (isInEditMode) { 
                enterEditMode(listItem, task);
            } else { 
                toggleTask(task.id);
            }
          });
          
          taskTextSpan.addEventListener('click', (e) => {
            if (isLocked || listItem.classList.contains('editing')) return;
            if (isInEditMode) {
                e.stopPropagation(); 
                enterEditMode(listItem, task);
            }
          });


          listItem.addEventListener('keydown', (event) => {
            if (listItem.classList.contains('editing')) return;
            if (event.key === 'Enter' || event.key === ' ') {
              if (isInEditMode && !isLocked) { 
                  enterEditMode(listItem, task);
              } else if (!isLocked) {
                  toggleTask(task.id);
              }
            }
          });

          if (isInEditMode) { 
            listItem.addEventListener('dragstart', (e) => {
                if (isLocked || listItem.classList.contains('editing')) {
                    e.preventDefault();
                    return;
                }
                draggedTaskElement = listItem;
                setTimeout(() => listItem.classList.add('dragging'), 0);
                 if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', task.id);
                }
            });

            listItem.addEventListener('dragend', () => {
                listItem.classList.remove('dragging');
                draggedTaskElement = null;
                document.querySelectorAll('.drag-over-indicator-task, .drag-over-indicator-task-bottom').forEach(el => el.className = el.className.replace(/drag-over-indicator-\w+/g, '').trim());
            });
          }
      }

      if (task.id === animatedTaskId && animationType) {
        const animationClassName = animationType === 'complete' ? 'animate-task-complete' : 'animate-task-uncomplete';
        listItem.classList.add(animationClassName);
        setTimeout(() => listItem.classList.remove(animationClassName), 350);
      }
      taskListElement.appendChild(listItem);
    });
  }

  if (isInEditMode) {
    taskListElement.ondragover = (e) => { 
        e.preventDefault();
        if (!draggedTaskElement || !taskListElement.contains(draggedTaskElement) || !editModes[category]) return;
        if (draggedTaskElement.classList.contains('editing')) return;

        const afterElement = getDragAfterElement(taskListElement, e.clientY);
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over-indicator-task', 'drag-over-indicator-task-bottom');
        });

        if (afterElement == null) {
            const lastChild = taskListElement.lastElementChild as HTMLElement;
            if (lastChild && lastChild !== draggedTaskElement && lastChild.classList.contains('task-item')) {
                 lastChild.classList.add('drag-over-indicator-task-bottom');
            }
        } else {
            if (afterElement !== draggedTaskElement) {
                afterElement.classList.add('drag-over-indicator-task');
            }
        }
    };

    taskListElement.ondrop = (e) => {
        e.preventDefault();
        if (!draggedTaskElement || !taskListElement.contains(draggedTaskElement) || draggedTaskElement.classList.contains('editing') || !editModes[category]) return;

        const draggedTaskId = draggedTaskElement.dataset.taskId;
        if (!draggedTaskId) return;

        const categoryOfDraggedTask = currentTasks.find(t => t.id === draggedTaskId)?.category;
        if (categoryOfDraggedTask !== category) return;

        let userDefinedTasks = loadUserDefinedTasks();
        const categoryTasks = userDefinedTasks[category];
        
        const draggedTaskDefIndex = categoryTasks.findIndex(t => t.id === draggedTaskId);
        if (draggedTaskDefIndex === -1) return;
        const taskDefToMove = categoryTasks.splice(draggedTaskDefIndex, 1)[0];

        const afterElement = getDragAfterElement(taskListElement, e.clientY);
        const targetTaskId = afterElement ? afterElement.dataset.taskId : null;

        if (targetTaskId) {
            const targetTaskDefIndex = categoryTasks.findIndex(t => t.id === targetTaskId);
            if (targetTaskDefIndex !== -1) {
                categoryTasks.splice(targetTaskDefIndex, 0, taskDefToMove);
            } else {
                categoryTasks.push(taskDefToMove); // Fallback
            }
        } else {
            categoryTasks.push(taskDefToMove); // Dropped at the end
        }
        
        saveUserDefinedTasks(userDefinedTasks);
        currentTasks = loadTasksForDate(getTodayDateString()); 
        renderCategoryTasks(category); 
        renderDashboard(); 
    };
  } else {
      taskListElement.ondragover = null;
      taskListElement.ondrop = null;
  }
  
  if (activeTab === category && taskListElement.closest('#left-column')) {
    (taskListElement.closest('#left-column') as HTMLElement).scrollTop = scrollPosition;
  }
}

function enterEditMode(listItem: HTMLElement, task: Task): void {
    if (!editModes[task.category] || listItem.classList.contains('editing') || lockedTaskIdsToday.includes(task.id)) return;
    
    listItem.classList.add('editing');
    listItem.draggable = false; 

    const taskTextSpan = listItem.querySelector('.task-text') as HTMLElement;
    const existingDeleteButton = listItem.querySelector('.task-delete-button-editmode') as HTMLElement | null;
    if(existingDeleteButton) existingDeleteButton.style.display = 'none';


    if (!taskTextSpan || !domElements.taskEditControlsTemplate) return;

    const originalText = task.text;
    taskTextSpan.style.display = 'none';
    
    const editControls = domElements.taskEditControlsTemplate.cloneNode(true) as HTMLElement;
    editControls.removeAttribute('id'); 
    editControls.style.display = 'flex'; 
    
    const inputField = editControls.querySelector('.task-edit-input') as HTMLInputElement;
    const saveButton = editControls.querySelector('.task-edit-save') as HTMLButtonElement;
    const cancelButton = editControls.querySelector('.task-edit-cancel') as HTMLButtonElement;

    inputField.value = originalText;
    listItem.appendChild(editControls); 
    inputField.focus();
    inputField.select();

    const cleanUpEditMode = () => {
        document.removeEventListener('click', handleClickOutside, true);
        if (listItem.contains(editControls)) {
           listItem.removeChild(editControls);
        }
        taskTextSpan.style.display = '';
        if(existingDeleteButton) existingDeleteButton.style.display = ''; 
        listItem.classList.remove('editing');
        listItem.draggable = editModes[task.category] && !lockedTaskIdsToday.includes(task.id);
    };

    const saveChanges = () => {
        const newText = inputField.value.trim();
        cleanUpEditMode();
        if (newText && newText !== originalText) {
            updateTaskText(task.id, newText); 
        } else { 
            taskTextSpan.textContent = originalText; 
             if (activeTab === task.category) renderCategoryTasks(task.category); 
        }
    };

    const cancelChanges = () => {
        cleanUpEditMode();
        taskTextSpan.textContent = originalText; 
         if (activeTab === task.category) renderCategoryTasks(task.category); 
    };
    
    saveButton.onclick = (e) => { e.stopPropagation(); saveChanges(); };
    cancelButton.onclick = (e) => { e.stopPropagation(); cancelChanges(); };
    inputField.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveChanges(); }
        if (e.key === 'Escape') { e.preventDefault(); cancelChanges(); }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
        if (!editControls.contains(event.target as Node)) {
            cancelChanges(); 
        }
    };
    setTimeout(() => document.addEventListener('click', handleClickOutside, true), 0);
}

function exitEditMode(listItem: HTMLElement, taskTextSpan: HTMLElement, taskActionsDivOrDeleteBtn: HTMLElement | null, editControls: HTMLElement, originalText: string): void {
    listItem.classList.remove('editing');
    const task = currentTasks.find(t => t.id === listItem.dataset.taskId);
    if (task) {
      listItem.draggable = editModes[task.category] && !lockedTaskIdsToday.includes(task.id);
    }
    taskTextSpan.textContent = originalText; 
    taskTextSpan.style.display = '';
    if (taskActionsDivOrDeleteBtn) taskActionsDivOrDeleteBtn.style.display = ''; 
    if (listItem.contains(editControls)) {
        listItem.removeChild(editControls);
    }
}


function updateTodayCalendarCellFill(percentage: number): void {
    const todayCell = document.getElementById('today-calendar-cell'); // This ID should only be on the *actual* today's cell
    if (todayCell) { // This check ensures we only modify the actual current day
        const fillElement = todayCell.querySelector('.calendar-day-fill') as HTMLElement;
        const numberElement = todayCell.querySelector('.calendar-day-number') as HTMLElement;

        if (fillElement) {
            fillElement.style.height = `${Math.min(percentage, 100)}%`;
            // The bright cyan color for current day fill is now handled by .current-day .calendar-day-fill in CSS
        }
        if (numberElement) {
            numberElement.style.color = percentage > 50 ? '#12101A' : '#00E5FF';
        }
        todayCell.title = `${Math.min(percentage, 100)}% tasks completed today. Click to reflect.`;
        todayCell.classList.remove('calendar-day-past'); // Ensure today is not styled as past
        // Shadow removal for current day is handled by lack of .calendar-day-past and specific .current-day styles
    }
}

function renderWeeklyProgress(): void {
  if (!domElements.weeklyProgressFill || !domElements.weeklyPointsStat) return;

  const totalTasksPossibleToday = currentTasks.length;
  const totalTasksDoneToday = currentTasks.filter(task => task.completed).length;

  let pointsPerTask = 0;
  if (totalTasksPossibleToday > 0) {
     pointsPerTask = WEEKLY_TARGET_POINTS / totalTasksPossibleToday;
  }

  const currentPointsToday = Math.round(totalTasksDoneToday * pointsPerTask);
  localStorage.setItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + getTodayDateString(), currentPointsToday.toString());

  const progressPercent = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;

  domElements.weeklyProgressFill.style.width = `${Math.min(progressPercent, 100)}%`;
  domElements.weeklyProgressFill.textContent = `${Math.min(progressPercent, 100)}%`;
  domElements.weeklyProgressFill.setAttribute('aria-valuenow', Math.min(progressPercent, 100).toString());
  domElements.weeklyPointsStat.textContent = `${currentPointsToday} / ${WEEKLY_TARGET_POINTS} points`;

  updateTodayCalendarCellFill(progressPercent);
}

function renderMonthlyProgress(): void {
  if (!domElements.monthlyProgressFill || !domElements.monthlyPointsStat) return;

  let currentMonthlyAccumulatedPoints = 0;
  const currentMonthYearForStorage = getCurrentMonthYearString(); // YYYY-MM for storage key matching

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_DAILY_HISTORY_PREFIX)) {
        const datePart = key.substring(STORAGE_KEY_DAILY_HISTORY_PREFIX.length); // YYYY-MM-DD
        if (datePart.startsWith(currentMonthYearForStorage)) { // Match YYYY-MM part
            try {
                const historyEntry: DailyHistoryEntry = JSON.parse(localStorage.getItem(key) || '{}');
                currentMonthlyAccumulatedPoints += historyEntry.pointsEarned || 0;
            } catch (e) {
                console.warn("Could not parse history entry for monthly progress:", key, e);
            }
        }
    }
  }
  
  const progressPercent = MONTHLY_TARGET_POINTS > 0 ? Math.round((currentMonthlyAccumulatedPoints / MONTHLY_TARGET_POINTS) * 100) : 0;

  domElements.monthlyProgressFill.style.width = `${Math.min(progressPercent,100)}%`;
  domElements.monthlyProgressFill.textContent = `${Math.min(progressPercent,100)}%`;
  domElements.monthlyProgressFill.setAttribute('aria-valuenow', Math.min(progressPercent,100).toString());
  domElements.monthlyPointsStat.textContent = `${currentMonthlyAccumulatedPoints} / ${MONTHLY_TARGET_POINTS} points`;
}


function renderDashboard(): void {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';

  (Object.keys(CATEGORY_DISPLAY_NAMES) as TaskCategoryName[]).forEach(category => {
    const categoryTasks = currentTasks.filter(task => task.category === category);
    const completedCount = categoryTasks.filter(task => task.completed).length;
    const totalCount = categoryTasks.length;

    const summaryItem = document.createElement('div');
    summaryItem.className = 'dashboard-category-summary';

    const title = document.createElement('h3');
    title.textContent = CATEGORY_DISPLAY_NAMES[category];
    summaryItem.appendChild(title);

    const statsPara = document.createElement('p');
    statsPara.className = 'category-stats';
    statsPara.id = `${category}-stats`;
    statsPara.textContent = `${completedCount} / ${totalCount} tasks done`;
    summaryItem.appendChild(statsPara);

    domElements.dashboardSummariesContainer!.appendChild(summaryItem);
  });
  renderWeeklyProgress();
  renderMonthlyProgress();
}

function renderCalendar(): void {
    if (!domElements.calendarMonthYear || !domElements.calendarGrid) return;

    const currentRenderMonth = calendarDisplayDate.getMonth();
    const currentRenderYear = calendarDisplayDate.getFullYear();
    const todayActualDateString = getTodayDateString();
    const todayNormalized = getNormalizedDate(new Date());


    domElements.calendarMonthYear.textContent = calendarDisplayDate.toLocaleDateString('en-US', {
        month: 'long', year: 'numeric'
    });
    domElements.calendarGrid.innerHTML = '';

    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(header => {
        const dayHeaderCell = document.createElement('div');
        dayHeaderCell.className = 'calendar-day-header';
        dayHeaderCell.textContent = header;
        domElements.calendarGrid!.appendChild(dayHeaderCell);
    });

    const firstDayOfMonth = new Date(currentRenderYear, currentRenderMonth, 1).getDay();
    const daysInMonth = new Date(currentRenderYear, currentRenderMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        domElements.calendarGrid!.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        
        const dayNumberEl = document.createElement('div');
        dayNumberEl.className = 'calendar-day-number';
        dayNumberEl.textContent = day.toString();
        
        const dayFillEl = document.createElement('div');
        dayFillEl.className = 'calendar-day-fill';

        dayCell.appendChild(dayFillEl);
        dayCell.appendChild(dayNumberEl);
        
        const cellDateObj = new Date(currentRenderYear, currentRenderMonth, day);
        const cellNormalized = getNormalizedDate(cellDateObj);
        const cellDateString = `${currentRenderYear}-${(currentRenderMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        let percentageCompleted = 0;
        let tooltipText = "Click to view or add reflection.";
        dayCell.id = ''; // Clear ID from previous renders

        if (cellNormalized.getTime() === todayNormalized.getTime()) {
            dayCell.classList.add('current-day');
            dayCell.id = 'today-calendar-cell'; // Critical for live updates
            const totalTasksPossibleToday = currentTasks.length;
            const totalTasksDoneToday = currentTasks.filter(task => task.completed).length;
            percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
            
            tooltipText = `${percentageCompleted}% tasks completed today. Click to reflect.`;
            dayNumberEl.style.color = percentageCompleted > 50 ? '#12101A' : '#00E5FF';
            // Specific fill color for current-day is handled by CSS
        } else if (cellNormalized < todayNormalized) {
            dayCell.classList.add('calendar-day-past');
            const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + cellDateString);
            if (historyDataString) {
                try {
                    const historyEntry: DailyHistoryEntry = JSON.parse(historyDataString);
                    percentageCompleted = historyEntry.percentageCompleted;
                    tooltipText = `${percentageCompleted}% tasks completed. Click to view history & reflection.`;
                    if (historyEntry.userNote) dayCell.classList.add('has-history');
                } catch (e) {
                    console.error("Error parsing history for calendar cell:", cellDateString, e);
                    tooltipText = "Error loading data. Click to view.";
                }
            }
             dayNumberEl.style.color = percentageCompleted > 50 ? '#12101A' : '#A09CB8';// default or contrast with past fill
        } else { // Future date
             dayNumberEl.style.color = '#A09CB8'; // Default color for future dates
             tooltipText = "Future date. Click to add reflection if available.";
        }
        
        dayFillEl.style.height = `${Math.min(percentageCompleted, 100)}%`;
        dayCell.title = tooltipText;
        dayCell.addEventListener('click', () => showHistoryModal(cellDateString));
        const displayDateForLabel = new Date(currentRenderYear, currentRenderMonth, day);
        dayCell.setAttribute('aria-label', `View details and reflection for ${displayDateForLabel.toLocaleDateString()}`);
        dayCell.setAttribute('role', 'button');
        dayCell.setAttribute('tabindex', '0');
        
        domElements.calendarGrid!.appendChild(dayCell);
    }
}

function navigateToPreviousMonth(): void {
    closeMonthYearPicker(); // Close picker if open
    calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
    pickerSelectedMonth = calendarDisplayDate.getMonth();
    pickerSelectedYear = calendarDisplayDate.getFullYear();
    renderCalendar();
}

function navigateToNextMonth(): void {
    closeMonthYearPicker(); // Close picker if open
    calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
    pickerSelectedMonth = calendarDisplayDate.getMonth();
    pickerSelectedYear = calendarDisplayDate.getFullYear();
    renderCalendar();
}

function populateMonthYearPicker(): void {
    if (!domElements.pickerMonthsGrid || !domElements.pickerYearsList) return;

    domElements.pickerMonthsGrid.innerHTML = '';
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthNames.forEach((name, index) => {
        const monthButton = document.createElement('button');
        monthButton.className = 'month-option';
        monthButton.textContent = name;
        monthButton.dataset.month = index.toString();
        if (index === pickerSelectedMonth) {
            monthButton.classList.add('selected');
        }
        monthButton.addEventListener('click', () => {
            pickerSelectedMonth = index;
            calendarDisplayDate.setFullYear(pickerSelectedYear, pickerSelectedMonth, 1);
            renderCalendar();
            populateMonthYearPicker(); // Re-populate to update selection, picker remains open
        });
        domElements.pickerMonthsGrid!.appendChild(monthButton);
    });

    domElements.pickerYearsList.innerHTML = '';
    const minYear = 2000;
    const maxYear = 2100;
    let selectedYearElement: HTMLButtonElement | null = null;
    for (let year = minYear; year <= maxYear; year++) {
        const yearButton = document.createElement('button');
        yearButton.className = 'year-option';
        yearButton.textContent = year.toString();
        yearButton.dataset.year = year.toString();
        if (year === pickerSelectedYear) {
            yearButton.classList.add('selected');
            selectedYearElement = yearButton;
        }
        yearButton.addEventListener('click', () => {
            pickerSelectedYear = year;
            calendarDisplayDate.setFullYear(pickerSelectedYear, pickerSelectedMonth, 1);
            renderCalendar();
            populateMonthYearPicker(); // Re-populate to update selection, picker remains open
        });
        domElements.pickerYearsList!.appendChild(yearButton);
    }
    if (selectedYearElement && domElements.pickerYearsList) {
       setTimeout(() => { // Ensure element is in DOM and sized
            const list = domElements.pickerYearsList!;
            const offsetTop = selectedYearElement!.offsetTop;
            const elementHeight = selectedYearElement!.offsetHeight;
            const listHeight = list.clientHeight;
            list.scrollTop = offsetTop - (listHeight / 2) + (elementHeight / 2);
       },0);
    }
}

function toggleMonthYearPicker(): void {
    if (!domElements.monthYearPickerModal || !domElements.monthYearPickerCloseButton) return;
    isMonthYearPickerOpen = !isMonthYearPickerOpen;
    if (isMonthYearPickerOpen) {
        pickerSelectedMonth = calendarDisplayDate.getMonth();
        pickerSelectedYear = calendarDisplayDate.getFullYear();
        populateMonthYearPicker();
        domElements.monthYearPickerModal.classList.remove('hidden');
        domElements.monthYearPickerModal.setAttribute('aria-hidden', 'false');
        domElements.monthYearPickerCloseButton.focus();
        document.addEventListener('keydown', handleEscapeKeyPicker);
    } else {
        closeMonthYearPicker();
    }
}

function closeMonthYearPicker(): void {
    if (!domElements.monthYearPickerModal) return;
    isMonthYearPickerOpen = false;
    domElements.monthYearPickerModal.classList.add('hidden');
    domElements.monthYearPickerModal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleEscapeKeyPicker);
}

function handleClickOutsidePicker(event: MouseEvent): void {
    // If the month-year picker modal itself (the overlay) is clicked, close it.
    if (event.target === domElements.monthYearPickerModal) {
        closeMonthYearPicker();
    }
}

function handleEscapeKeyPicker(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        closeMonthYearPicker();
    }
}


function toggleTask(taskId: string): void {
  const task = currentTasks.find(t => t.id === taskId);
  if (task) {
    if (lockedTaskIdsToday.includes(task.id)) {
        console.log(`Task ${task.text} is locked and cannot be changed.`);
        return; 
    }

    const wasCompleted = task.completed;
    task.completed = !task.completed;
    saveTaskStatus(task); 

    const totalTasksPossibleToday = currentTasks.length;
    const totalTasksDoneToday = currentTasks.filter(t => t.completed).length;
    
    let pointsPerTask = totalTasksPossibleToday > 0 ? (WEEKLY_TARGET_POINTS / totalTasksPossibleToday) : 0;
    const dailyEarnedPoints = Math.round(totalTasksDoneToday * pointsPerTask);
    
    localStorage.setItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + getTodayDateString(), dailyEarnedPoints.toString());

    const todayHistoryKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + getTodayDateString();
    const todayHistoryStr = localStorage.getItem(todayHistoryKey);
    let todayHistoryEntry: DailyHistoryEntry | null = null;
    if (todayHistoryStr) {
        try { todayHistoryEntry = JSON.parse(todayHistoryStr); } catch (e) {}
    }

    if (todayHistoryEntry) {
        todayHistoryEntry.pointsEarned = dailyEarnedPoints;
        todayHistoryEntry.percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
        const completedTasksToday: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
         currentTasks.forEach(t => {
            if (t.completed) completedTasksToday[t.category].push(t.text);
        });
        todayHistoryEntry.completedTasks = completedTasksToday;
        todayHistoryEntry.totalTasksOnDate = totalTasksPossibleToday;
        localStorage.setItem(todayHistoryKey, JSON.stringify(todayHistoryEntry));
    }


    const animationType = task.completed ? 'complete' : (wasCompleted ? 'uncomplete' : undefined);

    if (activeTab === task.category) {
      renderCategoryTasks(task.category, taskId, animationType);
    }
    renderDashboard(); 
    updateSaveProgressButtonState();
  }
}

function saveHistoricalNote(): void { 
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry: DailyHistoryEntry;

    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    } else { 
        // If no history entry exists, create a basic one for the note.
        // This is important for dates that might not have task activity but need a note.
        const tasksForDate = (currentModalDate === getTodayDateString()) ? currentTasks : loadTasksForDate(currentModalDate);
        const completedTasks: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
        let tasksCompletedCount = 0;
        tasksForDate.forEach(task => {
            if (task.completed) { 
                completedTasks[task.category].push(task.text);
                tasksCompletedCount++;
            }
        });
        const totalTasksForDate = tasksForDate.length;
        // Points and percentage might be 0 if no tasks or no completions
        const pointsPerTask = totalTasksForDate > 0 ? WEEKLY_TARGET_POINTS / totalTasksForDate : 0;
        const points = Math.round(tasksCompletedCount * pointsPerTask);
        const percentage = totalTasksForDate > 0 ? Math.round((tasksCompletedCount / totalTasksForDate) * 100) : 0;

        historyEntry = {
            date: currentModalDate, completedTasks, userNote: "",
            pointsEarned: points, percentageCompleted: percentage, totalTasksOnDate: totalTasksForDate
        };
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    domElements.historicalNoteStatus.textContent = 'Reflection Saved!';
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);
    
    // If the modal was for today, also update the main daily note input if it exists
    if (currentModalDate === getTodayDateString() && domElements.dailyNoteInput) {
        domElements.dailyNoteInput.value = noteContent;
    }

    // Update expand button visibility for reflection
    if (domElements.expandReflectionButton) {
        domElements.expandReflectionButton.classList.toggle('hidden', !noteContent.trim());
    }
}

function clearHistoricalNote(): void { 
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    const historyDataString = localStorage.getItem(historyKey);
    
    if (historyDataString) {
        const historyEntry: DailyHistoryEntry = JSON.parse(historyDataString);
        historyEntry.userNote = "";
        localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    }
    domElements.historyUserNoteEdit.value = ""; 
    domElements.historicalNoteStatus.textContent = 'Reflection Cleared!';
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);

    if (currentModalDate === getTodayDateString() && domElements.dailyNoteInput) {
        domElements.dailyNoteInput.value = "";
    }
    // Update expand button visibility for reflection
    if (domElements.expandReflectionButton) {
        domElements.expandReflectionButton.classList.add('hidden');
    }
}


function showHistoryModal(dateString: string): void {
    if (!domElements.historyModal || !domElements.historyModalDate || 
        !domElements.historyModalPoints || !domElements.historyModalPercentage ||
        !domElements.historyTasksList || !domElements.historyUserNoteDisplay || 
        !domElements.historyUserNoteEdit || !domElements.historicalNoteControls ||
        !domElements.historicalNoteStatus || !domElements.expandTasksButton || 
        !domElements.expandReflectionButton ) return;
    
    currentModalDate = dateString; // Set this early for other functions
    domElements.historyUserNoteDisplay.classList.add('hidden'); 
    domElements.historyUserNoteEdit.classList.remove('hidden'); 
    domElements.historicalNoteControls.classList.remove('hidden'); 
    domElements.historyUserNoteEdit.value = ''; 
    domElements.historicalNoteStatus.textContent = ''; 

    let historyEntry: DailyHistoryEntry | null = null;
    const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);

    if (historyDataString) {
        try { historyEntry = JSON.parse(historyDataString); } catch (e) { console.error("Error parsing history:", e); }
    } else if (dateString === getTodayDateString()) { 
        const completedTasksToday: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
        let tasksCompletedCount = 0;
        currentTasks.forEach(task => {
            if (task.completed) {
                completedTasksToday[task.category].push(task.text);
                tasksCompletedCount++;
            }
        });
        const totalTasksToday = currentTasks.length;
        const pointsPerTask = totalTasksToday > 0 ? WEEKLY_TARGET_POINTS / totalTasksToday : 0;
        const noteForToday = localStorage.getItem(STORAGE_KEY_DAILY_NOTE_PREFIX + dateString) || domElements.dailyNoteInput?.value || "";

        historyEntry = { 
            date: dateString, completedTasks: completedTasksToday, userNote: noteForToday,
            pointsEarned: Math.round(tasksCompletedCount * pointsPerTask),
            percentageCompleted: totalTasksToday > 0 ? Math.round((tasksCompletedCount / totalTasksToday) * 100) : 0,
            totalTasksOnDate: totalTasksToday
        };
    }
    
    domElements.historyUserNoteEdit.value = historyEntry?.userNote || ""; 

    let hasCompletedTasks = false;
    if (historyEntry) {
        const [year, month, day] = historyEntry.date.split('-').map(Number);
        const displayDate = new Date(year, month - 1, day);
        domElements.historyModalDate.textContent = displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        domElements.historyModalPoints.textContent = historyEntry.pointsEarned.toString();
        domElements.historyModalPercentage.textContent = historyEntry.percentageCompleted.toString();
        domElements.historyTasksList.innerHTML = ''; 
        
        (Object.keys(historyEntry.completedTasks) as TaskCategoryName[]).forEach(category => {
            const tasksInCategory = historyEntry.completedTasks[category];
            if (tasksInCategory.length > 0) {
                hasCompletedTasks = true;
                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                const catTitle = document.createElement('p');
                catTitle.className = 'history-category-title';
                catTitle.textContent = CATEGORY_DISPLAY_NAMES[category];
                catGroup.appendChild(catTitle);
                const ul = document.createElement('ul');
                tasksInCategory.forEach(text => {
                    const li = document.createElement('li');
                    const span = document.createElement('span'); span.textContent = text; li.appendChild(span);
                    ul.appendChild(li);
                });
                catGroup.appendChild(ul);
                domElements.historyTasksList!.appendChild(catGroup);
            }
        });
        if (!hasCompletedTasks) domElements.historyTasksList.innerHTML = '<p>No tasks were marked as completed.</p>';
    } else { 
        const [year, month, day] = dateString.split('-').map(Number);
        const displayDate = new Date(year, month - 1, day);
        domElements.historyModalDate.textContent = displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        domElements.historyModalPoints.textContent = "N/A";
        domElements.historyModalPercentage.textContent = "N/A";
        domElements.historyTasksList.innerHTML = '<p>No activity recorded for this day. Add a reflection below.</p>';
    }

    // Setup expand buttons
    domElements.expandTasksButton.classList.toggle('hidden', !hasCompletedTasks);
    if (hasCompletedTasks && historyEntry) {
      domElements.expandTasksButton.onclick = () => openFullscreenContentModal('tasks', historyEntry!.completedTasks, dateString);
    } else {
      domElements.expandTasksButton.onclick = null;
    }

    const reflectionText = domElements.historyUserNoteEdit.value.trim();
    domElements.expandReflectionButton.classList.toggle('hidden', !reflectionText);
    if (reflectionText) {
      domElements.expandReflectionButton.onclick = () => openFullscreenContentModal('reflection', reflectionText, dateString);
    } else {
       domElements.expandReflectionButton.onclick = null;
    }


    domElements.historyModal.classList.remove('hidden');
    domElements.historyModal.setAttribute('aria-hidden', 'false');
    if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.focus();
}


function closeHistoryModal(): void {
    if (domElements.historyModal) {
      domElements.historyModal.classList.add('hidden');
      domElements.historyModal.setAttribute('aria-hidden', 'true');
    }
    currentModalDate = null; 
    renderCalendar(); 
}

function openFullscreenContentModal(type: FullscreenContentType, data: any, dateString: string): void {
    if (!domElements.fullscreenContentModal || !domElements.fullscreenModalTitle || !domElements.fullscreenModalArea || !domElements.fullscreenModalCloseButton) return;

    currentFullscreenContent = { type, data, dateString };
    const [year, month, day] = dateString.split('-').map(Number);
    const displayDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    domElements.fullscreenModalArea.innerHTML = ''; // Clear previous content

    if (type === 'tasks') {
        domElements.fullscreenModalTitle.textContent = `Completed Tasks for ${displayDate}`;
        const completedTasksData = data as Record<TaskCategoryName, string[]>;
        let contentRendered = false;
        (Object.keys(completedTasksData) as TaskCategoryName[]).forEach(category => {
            const tasksInCategory = completedTasksData[category];
            if (tasksInCategory.length > 0) {
                contentRendered = true;
                const catGroup = document.createElement('div');
                catGroup.className = 'history-category-group';
                const catTitle = document.createElement('p');
                catTitle.className = 'history-category-title';
                catTitle.textContent = CATEGORY_DISPLAY_NAMES[category];
                catGroup.appendChild(catTitle);
                const ul = document.createElement('ul');
                tasksInCategory.forEach(text => {
                    const li = document.createElement('li');
                    const span = document.createElement('span'); span.textContent = text; li.appendChild(span);
                    ul.appendChild(li);
                });
                catGroup.appendChild(ul);
                domElements.fullscreenModalArea!.appendChild(catGroup);
            }
        });
        if (!contentRendered) domElements.fullscreenModalArea.innerHTML = '<p>No tasks were marked as completed.</p>';

    } else if (type === 'reflection') {
        domElements.fullscreenModalTitle.textContent = `Reflection for ${displayDate}`;
        const reflectionText = data as string;
        if (reflectionText.trim()) {
            const pre = document.createElement('pre');
            pre.textContent = reflectionText;
            domElements.fullscreenModalArea.appendChild(pre);
        } else {
            domElements.fullscreenModalArea.innerHTML = '<p>No reflection recorded for this day.</p>';
        }
    }

    domElements.fullscreenContentModal.classList.remove('hidden');
    domElements.fullscreenContentModal.setAttribute('aria-hidden', 'false');
    domElements.fullscreenModalCloseButton.focus();
    document.addEventListener('keydown', handleEscapeKeyFullscreenModal);
}

function closeFullscreenContentModal(): void {
    if (domElements.fullscreenContentModal) {
        domElements.fullscreenContentModal.classList.add('hidden');
        domElements.fullscreenContentModal.setAttribute('aria-hidden', 'true');
    }
    currentFullscreenContent = null;
    document.removeEventListener('keydown', handleEscapeKeyFullscreenModal);
    // Potentially refocus on the history modal or its trigger if it's still open
    if (domElements.historyModal && !domElements.historyModal.classList.contains('hidden') && domElements.historyModalCloseButton) {
        domElements.historyModalCloseButton.focus();
    }
}

function handleEscapeKeyFullscreenModal(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        closeFullscreenContentModal();
    }
}


function unclickAllTasksInCategory(category: TaskCategoryName): void {
  let tasksWereUnclicked = false;
  currentTasks.forEach(task => {
    if (task.category === category && task.completed && !lockedTaskIdsToday.includes(task.id)) {
      task.completed = false;
      saveTaskStatus(task); 
      tasksWereUnclicked = true;
    }
  });

  if (tasksWereUnclicked) {
    const today = getTodayDateString();
    const totalTasksPossibleToday = currentTasks.length;
    const totalTasksDoneToday = currentTasks.filter(t => t.completed).length;
    const pointsPerTask = totalTasksPossibleToday > 0 ? (WEEKLY_TARGET_POINTS / totalTasksPossibleToday) : 0;
    const dailyEarnedPoints = Math.round(totalTasksDoneToday * pointsPerTask);
    localStorage.setItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + today, dailyEarnedPoints.toString());

    const todayHistoryKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + today;
    const todayHistoryStr = localStorage.getItem(todayHistoryKey);
     let todayHistoryEntry: DailyHistoryEntry | null = null;
    if (todayHistoryStr) {
        try { todayHistoryEntry = JSON.parse(todayHistoryStr); } catch (e) {}
    }
    if (todayHistoryEntry) {
        todayHistoryEntry.pointsEarned = dailyEarnedPoints;
        todayHistoryEntry.percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
        const completedTasksToday: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
        currentTasks.forEach(t => { if (t.completed) completedTasksToday[t.category].push(t.text); });
        todayHistoryEntry.completedTasks = completedTasksToday;
        todayHistoryEntry.totalTasksOnDate = totalTasksPossibleToday;
        localStorage.setItem(todayHistoryKey, JSON.stringify(todayHistoryEntry));
    }
    if (activeTab === category) renderCategoryTasks(category); 
    renderDashboard(); 
    updateSaveProgressButtonState();
  }
}

function updateSaveProgressButtonState(): void {
    if (!domElements.saveProgressButton) return;
    const completedAndNotLockedTasks = currentTasks.filter(task => task.completed && !lockedTaskIdsToday.includes(task.id));
    const allCompletedTasks = currentTasks.filter(task => task.completed);

    if (allCompletedTasks.length === 0) {
        domElements.saveProgressButton.textContent = 'Save Progress';
        domElements.saveProgressButton.disabled = true;
        domElements.saveProgressButton.title = 'Complete some tasks to save progress.';
    } else if (completedAndNotLockedTasks.length === 0 && allCompletedTasks.length > 0) {
        domElements.saveProgressButton.textContent = 'Progress Saved & Locked';
        domElements.saveProgressButton.disabled = true;
        domElements.saveProgressButton.title = 'Your completed tasks for today are locked.';
    } else {
        domElements.saveProgressButton.textContent = 'Save Progress';
        domElements.saveProgressButton.disabled = false;
        domElements.saveProgressButton.title = 'Lock in your completed tasks for today.';
    }
}

function showSaveProgressConfirmationModal(): void {
    if (domElements.saveProgressModal && domElements.confirmSaveProgressButton) {
        domElements.saveProgressModal.classList.remove('hidden');
        domElements.saveProgressModal.setAttribute('aria-hidden', 'false');
        domElements.confirmSaveProgressButton.focus();
    }
}

function closeSaveProgressConfirmationModal(): void {
    if (domElements.saveProgressModal) {
        domElements.saveProgressModal.classList.add('hidden');
        domElements.saveProgressModal.setAttribute('aria-hidden', 'true');
    }
}

function finalizeAndLockTasks(): void {
    let newLocksMade = false;
    currentTasks.forEach(task => {
        if (task.completed && !lockedTaskIdsToday.includes(task.id)) {
            lockedTaskIdsToday.push(task.id);
            newLocksMade = true;
        }
    });

    if (newLocksMade) {
        localStorage.setItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + getTodayDateString(), JSON.stringify(lockedTaskIdsToday));
        if (activeTab !== 'dashboard' && domElements.categorySections[activeTab as TaskCategoryName]) {
             renderCategoryTasks(activeTab as TaskCategoryName);
        } else if (activeTab !== 'dashboard') { 
            (Object.keys(domElements.categoryTaskLists) as TaskCategoryName[]).forEach(cat => renderCategoryTasks(cat));
        }
        renderDashboard(); 
    }
    updateSaveProgressButtonState();
    closeSaveProgressConfirmationModal(); 
}


function handleSaveProgressClick(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const completableAndNotLockedTasks = currentTasks.filter(task => task.completed && !lockedTaskIdsToday.includes(task.id));
    if (completableAndNotLockedTasks.length === 0) return; 
    if (currentHour < 20) showSaveProgressConfirmationModal();
    else finalizeAndLockTasks();
}

// Task CRUD operations
function addTaskToCategory(category: TaskCategoryName, taskText: string, onSuccessCleanup?: () => void): void {
  if (!taskText.trim()) {
    if (onSuccessCleanup) onSuccessCleanup(); 
    return;
  }
  const newTask: Task = {
    id: createUniqueTaskId(category),
    text: taskText.trim(),
    category: category,
    completed: false,
  };
  currentTasks.push(newTask);

  let userTasks = loadUserDefinedTasks();
  if (!userTasks[category]) userTasks[category] = [];
  userTasks[category].push({ id: newTask.id, text: newTask.text, category: newTask.category });
  saveUserDefinedTasks(userTasks);

  if (onSuccessCleanup) onSuccessCleanup();

  if (activeTab === category) renderCategoryTasks(category);
  renderDashboard();
  updateSaveProgressButtonState();
}

function updateTaskText(taskId: string, newText: string): void {
  const task = currentTasks.find(t => t.id === taskId);
  if (task && !lockedTaskIdsToday.includes(taskId)) {
    task.text = newText.trim();
    let userTasks = loadUserDefinedTasks();
    const taskToUpdate = userTasks[task.category]?.find(ut => ut.id === taskId);
    if (taskToUpdate) taskToUpdate.text = newText.trim();
    saveUserDefinedTasks(userTasks);

    if (activeTab === task.category) renderCategoryTasks(task.category);
    renderDashboard();
  }
}

function deleteTaskFromCategory(taskId: string): void {
  const taskIndex = currentTasks.findIndex(t => t.id === taskId);
  if (taskIndex > -1 && !lockedTaskIdsToday.includes(taskId)) {
    const task = currentTasks[taskIndex];
    currentTasks.splice(taskIndex, 1);

    let userTasks = loadUserDefinedTasks();
    if (userTasks[task.category]) {
      userTasks[task.category] = userTasks[task.category].filter(ut => ut.id !== taskId);
      saveUserDefinedTasks(userTasks);
    }
    
    localStorage.removeItem(getTaskStorageKey(taskId, getTodayDateString())); 
    const todayHistoryKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + getTodayDateString();
    const todayHistoryStr = localStorage.getItem(todayHistoryKey);
    if (todayHistoryStr) {
        try {
            const todayHistoryEntry: DailyHistoryEntry = JSON.parse(todayHistoryStr);
            const completedTasksToday: Record<TaskCategoryName, string[]> = { health: [], god: [], personal: [], routine: [] };
            let tasksCompletedCount = 0;
            currentTasks.forEach(t => {
                if (t.completed) {
                    completedTasksToday[t.category].push(t.text);
                    tasksCompletedCount++;
                }
            });
            todayHistoryEntry.completedTasks = completedTasksToday;
            todayHistoryEntry.totalTasksOnDate = currentTasks.length;
            const pointsPerTask = currentTasks.length > 0 ? WEEKLY_TARGET_POINTS / currentTasks.length : 0;
            todayHistoryEntry.pointsEarned = Math.round(tasksCompletedCount * pointsPerTask);
            todayHistoryEntry.percentageCompleted = currentTasks.length > 0 ? Math.round((tasksCompletedCount / currentTasks.length) * 100) : 0;
            localStorage.setItem(todayHistoryKey, JSON.stringify(todayHistoryEntry));
        } catch(e) { console.error("Error updating today's history after delete", e); }
    }


    if (activeTab === task.category) renderCategoryTasks(task.category);
    renderDashboard();
    updateSaveProgressButtonState();
  }
}

function showDeleteTaskConfirmation(taskId: string): void {
    taskToDeleteId = taskId;
    if (domElements.deleteTaskConfirmationModal) {
        domElements.deleteTaskConfirmationModal.classList.remove('hidden');
        domElements.deleteTaskConfirmationModal.setAttribute('aria-hidden', 'false');
        domElements.confirmDeleteTaskButton?.focus();
    }
}
function closeDeleteTaskConfirmationModal(): void {
    if (domElements.deleteTaskConfirmationModal) {
        domElements.deleteTaskConfirmationModal.classList.add('hidden');
        domElements.deleteTaskConfirmationModal.setAttribute('aria-hidden', 'true');
    }
    taskToDeleteId = null;
}
function confirmDeleteTask(): void {
    if (taskToDeleteId) {
        deleteTaskFromCategory(taskToDeleteId);
    }
    closeDeleteTaskConfirmationModal();
}


function initializeTabDragAndDrop(): void {
    const tabsNav = domElements.tabsContainer;
    if (!tabsNav) return;
    const categoryTabButtons = Array.from(tabsNav.querySelectorAll('.tab-button[data-category-tab]')) as HTMLButtonElement[];
    categoryTabButtons.forEach(button => {
        button.draggable = true;
        button.addEventListener('dragstart', (e) => {
            draggedTabElement = button;
            setTimeout(() => button.classList.add('dragging'), 0);
             if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        });
        button.addEventListener('dragend', () => {
            button.classList.remove('dragging');
            draggedTabElement = null;
        });
    });
    tabsNav.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedTabElement) return;
        const targetButton = (e.target as HTMLElement).closest('.tab-button[data-category-tab]') as HTMLButtonElement | null;
        if (targetButton && targetButton !== draggedTabElement) {
            const rect = targetButton.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            if (offsetX < rect.width / 2) tabsNav.insertBefore(draggedTabElement, targetButton);
            else tabsNav.insertBefore(draggedTabElement, targetButton.nextSibling);
        }
    });
}


function initializeApp(): void {
  domElements.tabsContainer = document.getElementById('tabs');
  const tabIds: TabId[] = ['dashboard', 'health', 'god', 'personal', 'routine'];
  tabIds.forEach(id => {
    domElements.tabButtons[id] = document.getElementById(`${id}-tab-button`) as HTMLButtonElement;
    domElements.tabContents[id] = document.getElementById(`${id}-content`);
    if (id !== 'dashboard') {
      const category = id as TaskCategoryName;
      domElements.categorySections[category] = document.getElementById(`${id}-content`) as HTMLElement;
      domElements.categoryTaskLists[category] = document.getElementById(`${id}-task-list`) as HTMLUListElement;
      
      domElements.addItemTriggerButtonsTop[category] = document.getElementById(`add-item-trigger-button-top-${category}`) as HTMLButtonElement;
      domElements.newTempTaskFormsTop[category] = document.getElementById(`new-temp-task-form-top-${category}`) as HTMLElement;
      domElements.newTempTaskInputsTop[category] = document.getElementById(`new-temp-task-input-top-${category}`) as HTMLInputElement;
      domElements.newTempTaskSaveButtonsTop[category] = document.getElementById(`new-temp-task-save-button-top-${category}`) as HTMLButtonElement;
      domElements.newTempTaskCancelButtonsTop[category] = document.getElementById(`new-temp-task-cancel-button-top-${category}`) as HTMLButtonElement;
      
      domElements.addItemTriggerButtonsBottom[category] = document.getElementById(`add-item-trigger-button-bottom-${category}`) as HTMLButtonElement;
      domElements.newTempTaskFormsBottom[category] = document.getElementById(`new-temp-task-form-bottom-${category}`) as HTMLElement;
      domElements.newTempTaskInputsBottom[category] = document.getElementById(`new-temp-task-input-bottom-${category}`) as HTMLInputElement;
      domElements.newTempTaskSaveButtonsBottom[category] = document.getElementById(`new-temp-task-save-button-bottom-${category}`) as HTMLButtonElement;
      domElements.newTempTaskCancelButtonsBottom[category] = document.getElementById(`new-temp-task-cancel-button-bottom-${category}`) as HTMLButtonElement;
      
      domElements.editModeToggleButtons[category] = document.getElementById(`edit-mode-toggle-${category}`) as HTMLButtonElement;
      domElements.undoCategoryButtons[category] = document.getElementById(`undo-category-${category}`) as HTMLButtonElement;
    }
  });
  domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
  domElements.weeklyProgressFill = document.getElementById('weekly-progress-fill');
  domElements.weeklyPointsStat = document.getElementById('weekly-points-stat');
  domElements.monthlyProgressFill = document.getElementById('monthly-progress-fill');
  domElements.monthlyPointsStat = document.getElementById('monthly-points-stat');
  domElements.calendarMonthYearButton = document.getElementById('calendar-month-year-button') as HTMLButtonElement;
  domElements.calendarMonthYear = document.getElementById('calendar-month-year');
  domElements.calendarGrid = document.getElementById('calendar-grid');
  domElements.calendarPrevMonthButton = document.getElementById('calendar-prev-month') as HTMLButtonElement;
  domElements.calendarNextMonthButton = document.getElementById('calendar-next-month') as HTMLButtonElement;
  
  domElements.monthYearPickerModal = document.getElementById('month-year-picker-modal');
  domElements.monthYearPickerContent = document.getElementById('month-year-picker-content');
  domElements.monthYearPickerCloseButton = document.getElementById('month-year-picker-close-button') as HTMLButtonElement;

  domElements.pickerMonthsGrid = document.getElementById('picker-months-grid');
  domElements.pickerYearsList = document.getElementById('picker-years-list');
  domElements.dailyNoteInput = document.getElementById('daily-note-input') as HTMLTextAreaElement;
  domElements.saveNoteButton = document.getElementById('save-note-button') as HTMLButtonElement;
  domElements.historyModal = document.getElementById('history-modal');
  domElements.historyModalCloseButton = document.getElementById('history-modal-close-button') as HTMLButtonElement;
  domElements.historyModalDate = document.getElementById('history-modal-date');
  domElements.historyModalPoints = document.getElementById('history-modal-points');
  domElements.historyModalPercentage = document.getElementById('history-modal-percentage');
  domElements.historyTasksList = document.getElementById('history-tasks-list');
  domElements.expandTasksButton = document.getElementById('expand-tasks-button') as HTMLButtonElement;
  domElements.historicalReflectionWrapper = document.getElementById('historical-reflection-wrapper');
  domElements.expandReflectionButton = document.getElementById('expand-reflection-button') as HTMLButtonElement;
  domElements.historyUserNoteDisplay = document.getElementById('history-user-note-display') as HTMLParagraphElement;
  domElements.historyUserNoteEdit = document.getElementById('history-user-note-edit') as HTMLTextAreaElement;
  domElements.historicalNoteControls = document.getElementById('historical-note-controls');
  domElements.saveHistoricalNoteButton = document.getElementById('save-historical-note-button') as HTMLButtonElement;
  domElements.clearHistoricalNoteButton = document.getElementById('clear-historical-note-button') as HTMLButtonElement;
  domElements.historicalNoteStatus = document.getElementById('historical-note-status') as HTMLSpanElement;
  domElements.saveProgressButtonContainer = document.getElementById('save-progress-button-container');
  domElements.saveProgressButton = document.getElementById('save-progress-button') as HTMLButtonElement;
  domElements.saveProgressModal = document.getElementById('save-progress-modal');
  domElements.saveProgressModalContent = document.getElementById('save-progress-modal-content');
  domElements.saveProgressMessage = document.getElementById('save-progress-message') as HTMLParagraphElement;
  domElements.confirmSaveProgressButton = document.getElementById('confirm-save-progress-button') as HTMLButtonElement;
  domElements.cancelSaveProgressButton = document.getElementById('cancel-save-progress-button') as HTMLButtonElement;
  domElements.saveProgressCloseButton = document.getElementById('save-progress-close-button') as HTMLButtonElement;
  domElements.taskEditControlsTemplate = document.getElementById('task-edit-controls-template');
  domElements.deleteTaskConfirmationModal = document.getElementById('delete-task-confirmation-modal');
  domElements.deleteTaskModalCloseButton = document.getElementById('delete-task-modal-close-button') as HTMLButtonElement;
  domElements.confirmDeleteTaskButton = document.getElementById('confirm-delete-task-button') as HTMLButtonElement;
  domElements.cancelDeleteTaskButton = document.getElementById('cancel-delete-task-button') as HTMLButtonElement;

  domElements.fullscreenContentModal = document.getElementById('fullscreen-content-modal');
  domElements.fullscreenModalTitle = document.getElementById('fullscreen-modal-title');
  domElements.fullscreenModalArea = document.getElementById('fullscreen-modal-area');
  domElements.fullscreenModalCloseButton = document.getElementById('fullscreen-modal-close-button') as HTMLButtonElement;


  let criticalElementMissing = false;
  for (const key in domElements) {
    const elementOrRecord = domElements[key as keyof typeof domElements];
    if (elementOrRecord === null) {
      if (key !== 'taskEditControlsTemplate') { 
        console.error(`Missing critical DOM element: ${key}`);
        criticalElementMissing = true;
      }
    } else if (typeof elementOrRecord === 'object' && ! (elementOrRecord instanceof HTMLElement || elementOrRecord instanceof SVGElement ) && key !== 'editModes' && key !== 'activeAddTaskForm') {
      const record = elementOrRecord as Record<string, unknown>;
      for (const subKey in record) {
        if (record[subKey] === null) {
          console.error(`Missing critical DOM sub-element: ${key}.${subKey}`);
          criticalElementMissing = true;
        }
      }
    }
  }
  
  if (criticalElementMissing) {
    console.error('Failed to initialize app: One or more critical DOM elements are missing.');
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">App initialization failed. Critical elements missing. Check console.</p>';
    return;
  }

  (Object.keys(domElements.tabButtons) as TabId[]).forEach(id => {
    domElements.tabButtons[id]?.addEventListener('click', () => switchTab(id));
  });

  (Object.keys(domElements.editModeToggleButtons) as TaskCategoryName[]).forEach(category => {
    domElements.editModeToggleButtons[category]?.addEventListener('click', () => toggleCategoryEditMode(category));
  });
  (Object.keys(domElements.undoCategoryButtons) as TaskCategoryName[]).forEach(category => {
    domElements.undoCategoryButtons[category]?.addEventListener('click', () => unclickAllTasksInCategory(category));
  });

  (['top', 'bottom'] as AddTaskFormPosition[]).forEach(position => {
    (Object.keys(CATEGORY_DISPLAY_NAMES) as TaskCategoryName[]).forEach(category => {
      const triggerButton = position === 'top' ? domElements.addItemTriggerButtonsTop[category] : domElements.addItemTriggerButtonsBottom[category];
      const saveButton = position === 'top' ? domElements.newTempTaskSaveButtonsTop[category] : domElements.newTempTaskSaveButtonsBottom[category];
      const cancelButton = position === 'top' ? domElements.newTempTaskCancelButtonsTop[category] : domElements.newTempTaskCancelButtonsBottom[category];
      const inputField = position === 'top' ? domElements.newTempTaskInputsTop[category] : domElements.newTempTaskInputsBottom[category];

      triggerButton?.addEventListener('click', () => showTempAddTaskForm(category, position));
      
      saveButton?.addEventListener('click', () => {
        if (inputField) {
          addTaskToCategory(category, inputField.value.trim(), () => hideTempAddTaskForm(category, position));
        }
      });
      inputField?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && inputField) {
            addTaskToCategory(category, inputField.value.trim(), () => hideTempAddTaskForm(category, position));
        }
      });
      cancelButton?.addEventListener('click', () => hideTempAddTaskForm(category, position));
    });
  });


  domElements.saveNoteButton?.addEventListener('click', saveDailyNote);
  domElements.historyModalCloseButton?.addEventListener('click', closeHistoryModal);
  domElements.historyModal?.addEventListener('click', (e) => { if (e.target === domElements.historyModal) closeHistoryModal(); });
  domElements.saveHistoricalNoteButton?.addEventListener('click', saveHistoricalNote);
  domElements.clearHistoricalNoteButton?.addEventListener('click', clearHistoricalNote);
  domElements.saveProgressButton?.addEventListener('click', handleSaveProgressClick);
  domElements.confirmSaveProgressButton?.addEventListener('click', () => { finalizeAndLockTasks(); closeSaveProgressConfirmationModal(); });
  domElements.cancelSaveProgressButton?.addEventListener('click', closeSaveProgressConfirmationModal);
  domElements.saveProgressCloseButton?.addEventListener('click', closeSaveProgressConfirmationModal);
  domElements.saveProgressModal?.addEventListener('click', (e) => { if (e.target === domElements.saveProgressModal) closeSaveProgressConfirmationModal(); });

  domElements.deleteTaskModalCloseButton?.addEventListener('click', closeDeleteTaskConfirmationModal);
  domElements.confirmDeleteTaskButton?.addEventListener('click', confirmDeleteTask);
  domElements.cancelDeleteTaskButton?.addEventListener('click', closeDeleteTaskConfirmationModal);
  domElements.deleteTaskConfirmationModal?.addEventListener('click', (e) => { if (e.target === domElements.deleteTaskConfirmationModal) closeDeleteTaskConfirmationModal(); });

  domElements.calendarPrevMonthButton?.addEventListener('click', navigateToPreviousMonth);
  domElements.calendarNextMonthButton?.addEventListener('click', navigateToNextMonth);
  domElements.calendarMonthYearButton?.addEventListener('click', toggleMonthYearPicker);
  domElements.monthYearPickerModal?.addEventListener('click', handleClickOutsidePicker);
  domElements.monthYearPickerCloseButton?.addEventListener('click', closeMonthYearPicker);
  
  domElements.fullscreenModalCloseButton?.addEventListener('click', closeFullscreenContentModal);
  domElements.fullscreenContentModal?.addEventListener('click', (e) => { if(e.target === domElements.fullscreenContentModal) closeFullscreenContentModal(); });


  loadAppData();
  renderCalendar(); 
  switchTab('dashboard'); 
  updateSaveProgressButtonState();
  initializeTabDragAndDrop();

  (Object.keys(CATEGORY_DISPLAY_NAMES) as TaskCategoryName[]).forEach(category => {
     if (domElements.categorySections[category]) { 
        domElements.categorySections[category]?.classList.remove('edit-mode-active');
        domElements.editModeToggleButtons[category]?.classList.remove('active-glow');
        domElements.editModeToggleButtons[category]?.setAttribute('aria-pressed', 'false');
        hideTempAddTaskForm(category, 'top', false); 
        hideTempAddTaskForm(category, 'bottom', false);
     }
  });
}


function switchTab(tabId: TabId): void {
  activeTab = tabId;
  closeMonthYearPicker(); // Close picker when switching tabs
  (Object.keys(domElements.tabButtons) as TabId[]).forEach(id => {
    const button = domElements.tabButtons[id];
    const content = domElements.tabContents[id];
    if (button && content) {
      if (id === activeTab) {
        content.classList.remove('hidden');
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        if (id === 'dashboard') button.classList.add('main-tab-highlight');
      } else {
        content.classList.add('hidden');
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
        if (id === 'dashboard') button.classList.add('main-tab-highlight'); 
      }
    }
  });
  if (domElements.tabButtons['dashboard']) {
      domElements.tabButtons['dashboard'].classList.add('main-tab-highlight');
  }

  if (activeTab === 'dashboard') {
    renderDashboard(); 
    renderCalendar(); 
  } else if (Object.keys(CATEGORY_DISPLAY_NAMES).includes(activeTab)) {
    if (activeAddTaskForm && activeAddTaskForm.category !== activeTab as TaskCategoryName) {
        hideTempAddTaskForm(activeAddTaskForm.category, activeAddTaskForm.position);
    }
    renderCategoryTasks(activeTab as TaskCategoryName);
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
