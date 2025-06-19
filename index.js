
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// TypeScript types (TaskCategoryName, TabId, Task, DailyHistoryEntry) are removed.
// JavaScript will use plain objects and implicit string types.

const TASKS_CONFIG = {
  health: [
    "Ice facing",
    "Run 30 mins",
    "100 jumping jacks",
    "Stretch 5 mins",
    "100 push-ups",
    "20 sit-ups",
    "Dumbbell: 10 reps × 2 sets",
    "Sunlight: 15–20 mins",
    "Drink 4.5L water",
    "Self-reprogram",
    "Shower consistently",
    "Social media < 1 hour"
  ],
  god: [
    "Self-Bible Study",
    "Thursday congregation",
    "Sunday congregation",
    "Be the person God expects"
  ],
  personal: [
    "Content creation"
  ],
  routine: [
    "Wake up at 5:30 AM",
    "Pray",
    "Shower",
    "Read Daily Text",
    "Clean bed",
    "Prepare solar",
    "Put back solar",
    "Take 5-min break every 25 mins",
    "Pray again",
    "Erase temptation",
    "Read 1 Bible chapter",
    "Sleep at 9:10–9:30 PM"
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


let currentTasks = [];
let activeTab = 'dashboard';
let currentModalDate = null;
let lockedTaskIdsToday = [];
let draggedTaskElement = null;
let draggedTabElement = null;


// DOM Elements
const domElements = {
  tabsContainer: null,
  tabButtons: {},
  tabContents: {},
  categoryTaskLists: {},
  unclickAllButtons: {},
  dashboardSummariesContainer: null,
  weeklyProgressFill: null,
  weeklyPointsStat: null,
  monthlyProgressFill: null,
  monthlyPointsStat: null,
  calendarMonthYear: null,
  calendarGrid: null,
  dailyNoteInput: null,
  saveNoteButton: null,
  historyModal: null,
  historyModalCloseButton: null,
  historyModalDate: null,
  historyModalPoints: null,
  historyModalPercentage: null,
  historyTasksList: null,
  historicalReflectionWrapper: null,
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
};

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthYearString() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function generateTaskId(category, taskText) {
  const sanitizedText = taskText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${category}-${sanitizedText}`;
}

function getTaskStorageKey(taskId, date) {
  return `${STORAGE_KEY_TASK_PREFIX}${taskId}_${date}`;
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
        let totalTasksForToday = 0;
        
        currentTasks.forEach(task => {
            totalTasksForToday++;
            if (task.completed) {
                completedTasksToday[task.category].push(task.text);
                tasksCompletedCount++;
            }
        });

        const pointsPerTask = totalTasksForToday > 0 ? WEEKLY_TARGET_POINTS / totalTasksForToday : 0;
        const pointsEarnedToday = Math.round(tasksCompletedCount * pointsPerTask);
        const percentageToday = totalTasksForToday > 0 ? Math.round((tasksCompletedCount / totalTasksForToday) * 100) : 0;

        historyEntry = {
            date: today,
            completedTasks: completedTasksToday,
            userNote: "", 
            pointsEarned: pointsEarnedToday,
            percentageCompleted: percentageToday,
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

function savePreviousDayHistory(previousDayDate) {
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + previousDayDate;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry;

    const completedTasksHistory = { health: [], god: [], personal: [], routine: [] };
    let tasksCompletedCount = 0;
    let totalTasksForPreviousDay = 0;

    Object.keys(TASKS_CONFIG).forEach(category => {
        TASKS_CONFIG[category].forEach(taskText => {
            totalTasksForPreviousDay++;
            const taskId = generateTaskId(category, taskText);
            const taskStorageKey = getTaskStorageKey(taskId, previousDayDate);
            const isCompleted = localStorage.getItem(taskStorageKey) === 'true';
            if (isCompleted) {
                completedTasksHistory[category].push(taskText);
                tasksCompletedCount++;
            }
            localStorage.removeItem(taskStorageKey);
        });
    });

    const pointsPerTaskCalculation = totalTasksForPreviousDay > 0 ? WEEKLY_TARGET_POINTS / totalTasksForPreviousDay : 0;
    const finalPointsEarned = Math.round(tasksCompletedCount * pointsPerTaskCalculation);
    const finalPercentageCompleted = totalTasksForPreviousDay > 0 ? Math.round((tasksCompletedCount / totalTasksForPreviousDay) * 100) : 0;

    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
        historyEntry.completedTasks = completedTasksHistory;
        historyEntry.pointsEarned = finalPointsEarned;
        historyEntry.percentageCompleted = finalPercentageCompleted;
    } else {
        historyEntry = {
            date: previousDayDate,
            completedTasks: completedTasksHistory, 
            userNote: "", 
            pointsEarned: finalPointsEarned, 
            percentageCompleted: finalPercentageCompleted, 
        };
    }

    localStorage.setItem(historyKey, JSON.stringify(historyEntry));
    
    localStorage.removeItem(STORAGE_KEY_DAILY_NOTE_PREFIX + previousDayDate); 
    localStorage.removeItem(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX + previousDayDate);
    localStorage.removeItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + previousDayDate); // Clean up locked tasks for the previous day
    
    console.log(`History finalized and saved for ${previousDayDate}:`, historyEntry);
}


function checkAndClearOldMonthlyData() {
  const currentMonthYear = getCurrentMonthYearString();
  const lastProcessedMonthYear = localStorage.getItem(STORAGE_KEY_LAST_MONTH_PROCESSED);

  if (lastProcessedMonthYear && lastProcessedMonthYear !== currentMonthYear) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX)) {
        const datePart = key.substring(STORAGE_KEY_DAILY_EARNED_POINTS_PREFIX.length);
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
  const storedDate = localStorage.getItem(STORAGE_KEY_LAST_VISIT_DATE);
  const todayDate = getTodayDateString();

  if (storedDate && storedDate !== todayDate) {
    savePreviousDayHistory(storedDate); 
    localStorage.setItem(STORAGE_KEY_LAST_VISIT_DATE, todayDate);
    lockedTaskIdsToday = []; // Reset for the new day
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

  checkAndClearOldMonthlyData();
  loadCurrentDayNote(); 

  currentTasks = [];
  Object.keys(TASKS_CONFIG).forEach(category => {
    TASKS_CONFIG[category].forEach(taskText => {
      const taskId = generateTaskId(category, taskText);
      const storedCompleted = localStorage.getItem(getTaskStorageKey(taskId, todayDate));
      currentTasks.push({
        id: taskId,
        text: taskText,
        category: category,
        completed: storedCompleted === 'true',
      });
    });
  });
  updateSaveProgressButtonState();
}

function getDragAfterElement(container, y) {
    const draggableElements = Array.from(container.querySelectorAll('.task-item:not(.dragging)'));

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


function renderCategoryTasks(category, animatedTaskId, animationType) {
  const taskListElement = domElements.categoryTaskLists[category];
  if (!taskListElement) return;

  taskListElement.innerHTML = ''; // Clear previous tasks
  const tasksForCategory = currentTasks.filter(task => task.category === category);

  if (tasksForCategory.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = `No tasks for ${CATEGORY_DISPLAY_NAMES[category]} today!`;
    emptyMessage.className = 'empty-tasks-message';
    taskListElement.appendChild(emptyMessage);
    return;
  }
  
  tasksForCategory.forEach(task => {
    const listItem = document.createElement('li');
    listItem.className = 'task-item';
    listItem.setAttribute('data-task-id', task.id);
    listItem.draggable = true; // Make tasks draggable

    if (task.completed) listItem.classList.add('completed');

    const isLocked = lockedTaskIdsToday.includes(task.id);
    if (isLocked) {
        listItem.classList.add('locked');
        listItem.setAttribute('aria-disabled', 'true');
        if (!task.completed) { 
            task.completed = true; 
            listItem.classList.add('completed');
        }
        listItem.setAttribute('aria-pressed', 'true');
        listItem.draggable = false; // Locked tasks are not draggable
    }

    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.textContent = task.text;
    listItem.appendChild(taskTextSpan);

    if (!isLocked) {
        listItem.setAttribute('role', 'button');
        listItem.setAttribute('tabindex', '0');
        listItem.setAttribute('aria-pressed', task.completed.toString());
        listItem.addEventListener('click', () => toggleTask(task.id));
        listItem.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            toggleTask(task.id);
          }
        });

        // Drag events for tasks
        listItem.addEventListener('dragstart', (e) => {
            draggedTaskElement = listItem;
            setTimeout(() => listItem.classList.add('dragging'), 0);
             if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', task.id); // For potential cross-browser or future use
            }
        });

        listItem.addEventListener('dragend', () => {
            listItem.classList.remove('dragging');
            draggedTaskElement = null;
            // Remove any lingering indicators
            document.querySelectorAll('.drag-over-indicator-task').forEach(el => el.classList.remove('drag-over-indicator-task'));
            document.querySelectorAll('.drag-over-indicator-task-bottom').forEach(el => el.classList.remove('drag-over-indicator-task-bottom'));
        });
    }

    if (task.id === animatedTaskId && animationType) {
      const animationClassName = animationType === 'complete' ? 'animate-task-complete' : 'animate-task-uncomplete';
      listItem.classList.add(animationClassName);
      setTimeout(() => listItem.classList.remove(animationClassName), 350);
    }
    taskListElement.appendChild(listItem);
  });

  // Add dragover and drop listeners to the list itself for reordering tasks
  taskListElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedTaskElement || !taskListElement.contains(draggedTaskElement)) return;

    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    
    // Clear previous indicators
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over-indicator-task');
        item.classList.remove('drag-over-indicator-task-bottom');
    });

    if (afterElement == null) {
        const lastChild = taskListElement.lastElementChild;
        if (lastChild && lastChild !== draggedTaskElement) {
             lastChild.classList.add('drag-over-indicator-task-bottom');
        }
    } else {
        if (afterElement !== draggedTaskElement) {
            afterElement.classList.add('drag-over-indicator-task');
        }
    }
  });

  taskListElement.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedTaskElement || !taskListElement.contains(draggedTaskElement)) return;

    const draggedTaskId = draggedTaskElement.dataset.taskId;
    if (!draggedTaskId) return;

    const draggedTaskIndex = currentTasks.findIndex(t => t.id === draggedTaskId);
    if (draggedTaskIndex === -1) return;

    const taskToMove = currentTasks[draggedTaskIndex];
    if (taskToMove.category !== category) return; // Should not happen if dragging within same list

    const afterElement = getDragAfterElement(taskListElement, e.clientY);
    const targetTaskId = afterElement ? afterElement.dataset.taskId : null;

    currentTasks.splice(draggedTaskIndex, 1); // Remove from old position

    if (targetTaskId) {
        const targetTaskIndex = currentTasks.findIndex(t => t.id === targetTaskId && t.category === category);
        if (targetTaskIndex !== -1) {
            currentTasks.splice(targetTaskIndex, 0, taskToMove); // Insert before target
        } else {
            currentTasks.push(taskToMove); // Fallback: add to end if target not found (shouldn't happen)
        }
    } else {
        // Find last index for this category and insert
        let lastIndexOfCategory = -1;
        for(let i = currentTasks.length -1; i >=0; i--) {
            if(currentTasks[i].category === category) {
                lastIndexOfCategory = i;
                break;
            }
        }
        if(lastIndexOfCategory !== -1 && draggedTaskIndex <= lastIndexOfCategory) {
             currentTasks.splice(lastIndexOfCategory + (draggedTaskIndex > lastIndexOfCategory ? 0 : 1) , 0, taskToMove);
        } else {
             currentTasks.push(taskToMove); // Add to end if no other tasks of this category or dropped at very end
        }
    }
    
    // Re-render only this category's tasks
    renderCategoryTasks(category);
  });
}


function updateTodayCalendarCellFill(percentage) {
    const todayCell = document.getElementById('today-calendar-cell');
    if (todayCell) {
        const fillElement = todayCell.querySelector('.calendar-day-fill');
        const numberElement = todayCell.querySelector('.calendar-day-number');

        if (fillElement) {
            fillElement.style.height = `${Math.min(percentage, 100)}%`;
        }
        if (numberElement) {
            const textColorThreshold = 50; 
            if (percentage > textColorThreshold) {
                numberElement.style.color = '#12101A'; 
            } else {
                numberElement.style.color = '#00E5FF'; 
            }
        }
        todayCell.title = `${Math.min(percentage, 100)}% tasks completed today. Click to reflect.`;
    }
}

function renderWeeklyProgress() {
  if (!domElements.weeklyProgressFill || !domElements.weeklyPointsStat) return;

  const totalTasksPossibleToday = currentTasks.length;
  const totalTasksDoneToday = currentTasks.filter(task => task.completed).length;

  let pointsPerTask = 0;
  if (totalTasksPossibleToday > 0) {
     pointsPerTask = totalTasksPossibleToday > 0 ? WEEKLY_TARGET_POINTS / totalTasksPossibleToday : 0;
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

function renderMonthlyProgress() {
  if (!domElements.monthlyProgressFill || !domElements.monthlyPointsStat) return;

  let currentMonthlyAccumulatedPoints = 0;
  const currentMonthYear = getCurrentMonthYearString();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_DAILY_HISTORY_PREFIX)) {
        const datePart = key.substring(STORAGE_KEY_DAILY_HISTORY_PREFIX.length);
        if (datePart.startsWith(currentMonthYear)) { 
            try {
                const historyEntry = JSON.parse(localStorage.getItem(key) || '{}');
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


function renderDashboard() {
  if (!domElements.dashboardSummariesContainer) return;
  domElements.dashboardSummariesContainer.innerHTML = '';

  Object.keys(TASKS_CONFIG).forEach(category => {
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

    domElements.dashboardSummariesContainer.appendChild(summaryItem);
  });
  renderWeeklyProgress();
  renderMonthlyProgress();
}

function renderCalendar() {
    if (!domElements.calendarMonthYear || !domElements.calendarGrid) {
        console.error("Calendar DOM elements not found for rendering.");
        return;
    }

    const nowForMonthYear = new Date(); 
    const currentRenderMonth = nowForMonthYear.getMonth(); 
    const currentRenderYear = nowForMonthYear.getFullYear();
    const todayActualDateString = getTodayDateString(); 

    domElements.calendarMonthYear.textContent = new Date(currentRenderYear, currentRenderMonth).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    domElements.calendarGrid.innerHTML = ''; 

    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(header => {
        const dayHeaderCell = document.createElement('div');
        dayHeaderCell.className = 'calendar-day-header';
        dayHeaderCell.textContent = header;
        domElements.calendarGrid.appendChild(dayHeaderCell);
    });

    const firstDayOfMonth = new Date(currentRenderYear, currentRenderMonth, 1).getDay();
    const daysInMonth = new Date(currentRenderYear, currentRenderMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        domElements.calendarGrid.appendChild(emptyCell);
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
        
        const cellDateString = `${currentRenderYear}-${(currentRenderMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const isToday = cellDateString === todayActualDateString;
        
        let percentageCompleted = 0;
        let tooltipText = "Click to view or add reflection.";

        if (isToday) {
            dayCell.classList.add('current-day');
            dayCell.id = 'today-calendar-cell'; 
            const totalTasksPossibleToday = currentTasks.length;
            const totalTasksDoneToday = currentTasks.filter(task => task.completed).length;
            percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
            
            dayFillEl.style.height = `${Math.min(percentageCompleted, 100)}%`;
            tooltipText = `${percentageCompleted}% tasks completed today. Click to reflect.`;

            const numberElement = dayNumberEl; 
            const textColorThreshold = 50; 
            if (percentageCompleted > textColorThreshold) {
                numberElement.style.color = '#12101A'; 
            } else {
                numberElement.style.color = '#00E5FF'; 
            }
        } else {
            const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + cellDateString);
            if (historyDataString) {
                try {
                    const historyEntry = JSON.parse(historyDataString);
                    percentageCompleted = historyEntry.percentageCompleted;
                    tooltipText = `${percentageCompleted}% tasks completed. Click to view history & reflection.`;
                    if (historyEntry.userNote) {
                        dayCell.classList.add('has-history'); 
                    }
                } catch (e) {
                    console.error("Error parsing history for calendar cell:", cellDateString, e);
                    tooltipText = "Error loading data. Click to view.";
                }
            }
            dayFillEl.style.height = `${Math.min(percentageCompleted, 100)}%`;
        }
        
        dayCell.title = tooltipText;

        dayCell.addEventListener('click', () => showHistoryModal(cellDateString));
        const displayDateForLabel = new Date(currentRenderYear, currentRenderMonth, day);
        dayCell.setAttribute('aria-label', `View details and reflection for ${displayDateForLabel.toLocaleDateString()}`);
        dayCell.setAttribute('role', 'button');
        dayCell.setAttribute('tabindex', '0');
        
        domElements.calendarGrid.appendChild(dayCell);
    }
}


function toggleTask(taskId) {
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
    if (todayHistoryStr) {
        try {
            const todayHistoryEntry = JSON.parse(todayHistoryStr);
            todayHistoryEntry.pointsEarned = dailyEarnedPoints;
            todayHistoryEntry.percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
            const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
             currentTasks.forEach(t => {
                if (t.completed) {
                    completedTasksToday[t.category].push(t.text);
                }
            });
            todayHistoryEntry.completedTasks = completedTasksToday;
            localStorage.setItem(todayHistoryKey, JSON.stringify(todayHistoryEntry));
        } catch (e) {
            console.error("Error updating today's history entry on task toggle:", e);
        }
    }


    const animationType = task.completed ? 'complete' : (wasCompleted ? 'uncomplete' : undefined);

    if (activeTab === task.category) {
      renderCategoryTasks(task.category, taskId, animationType);
    }
    renderDashboard(); 
    updateSaveProgressButtonState();
  }
}

function saveHistoricalNote() { 
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;

    const noteContent = domElements.historyUserNoteEdit.value;
    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    const historyDataString = localStorage.getItem(historyKey);
    let historyEntry;

    if (historyDataString) {
        historyEntry = JSON.parse(historyDataString);
    } else {
        const completedTasks = { health: [], god: [], personal: [], routine: [] };
        let points = 0;
        let percentage = 0;

        if (currentModalDate === getTodayDateString()) {
            let tasksCompletedCount = 0;
            let totalTasksForToday = 0;
            currentTasks.forEach(task => {
                totalTasksForToday++;
                if (task.completed) {
                    completedTasks[task.category].push(task.text);
                    tasksCompletedCount++;
                }
            });
            const pointsPerTask = totalTasksForToday > 0 ? WEEKLY_TARGET_POINTS / totalTasksForToday : 0;
            points = Math.round(tasksCompletedCount * pointsPerTask);
            percentage = totalTasksForToday > 0 ? Math.round((tasksCompletedCount / totalTasksForToday) * 100) : 0;
        }

        historyEntry = {
            date: currentModalDate,
            completedTasks: completedTasks,
            userNote: "", 
            pointsEarned: points,
            percentageCompleted: percentage,
        };
    }

    historyEntry.userNote = noteContent;
    localStorage.setItem(historyKey, JSON.stringify(historyEntry));

    domElements.historicalNoteStatus.textContent = 'Reflection Saved!';
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);
}

function clearHistoricalNote() { 
    if (!currentModalDate || !domElements.historyUserNoteEdit || !domElements.historicalNoteStatus) return;

    const historyKey = STORAGE_KEY_DAILY_HISTORY_PREFIX + currentModalDate;
    const historyDataString = localStorage.getItem(historyKey);
    
    if (historyDataString) {
        const historyEntry = JSON.parse(historyDataString);
        historyEntry.userNote = "";
        localStorage.setItem(historyKey, JSON.stringify(historyEntry));
        domElements.historyUserNoteEdit.value = "";
        domElements.historicalNoteStatus.textContent = 'Reflection Cleared!';
    } else {
        domElements.historyUserNoteEdit.value = "";
        domElements.historicalNoteStatus.textContent = 'No stored reflection to clear.';
    }
    setTimeout(() => { if (domElements.historicalNoteStatus) domElements.historicalNoteStatus.textContent = ''; }, 2000);
}


function showHistoryModal(dateString) {
    if (!domElements.historyModal || !domElements.historyModalDate || 
        !domElements.historyModalPoints || !domElements.historyModalPercentage ||
        !domElements.historyTasksList || !domElements.historyUserNoteDisplay || 
        !domElements.historyUserNoteEdit || !domElements.historicalNoteControls ||
        !domElements.historicalNoteStatus) {
        console.error("Modal elements not found for date:", dateString);
        return;
    }
    
    currentModalDate = dateString;
    const today = getTodayDateString();

    domElements.historyUserNoteDisplay.classList.add('hidden'); 
    domElements.historyUserNoteEdit.classList.remove('hidden'); 
    domElements.historicalNoteControls.classList.remove('hidden'); 
    domElements.historyUserNoteEdit.value = ''; 
    domElements.historicalNoteStatus.textContent = ''; 

    let historyEntry = null;
    let noteForModalTextarea = "";

    const historyDataString = localStorage.getItem(STORAGE_KEY_DAILY_HISTORY_PREFIX + dateString);
    if (historyDataString) {
        try {
            historyEntry = JSON.parse(historyDataString);
            noteForModalTextarea = historyEntry.userNote || "";
        } catch (error) {
            console.error("Failed to parse history data for modal:", dateString, error);
            const [year, month, day] = dateString.split('-').map(Number);
            domElements.historyModalDate.textContent = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            domElements.historyModalPoints.textContent = "Error";
            domElements.historyModalPercentage.textContent = "Error";
            domElements.historyTasksList.innerHTML = '<p class="error-message">Error loading task history.</p>';
            domElements.historyUserNoteEdit.value = "Error loading reflection."; 
            domElements.historyModal.classList.remove('hidden');
            if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.focus();
            return;
        }
    } else {
        noteForModalTextarea = ""; 
        if (dateString === today) {
            const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
            let tasksCompletedCount = 0;
            currentTasks.forEach(task => {
                if (task.completed) {
                    completedTasksToday[task.category].push(task.text);
                    tasksCompletedCount++;
                }
            });
            const pointsPerTask = currentTasks.length > 0 ? WEEKLY_TARGET_POINTS / currentTasks.length : 0;
            const currentPointsToday = Math.round(tasksCompletedCount * pointsPerTask);
            const percentageToday = currentTasks.length > 0 ? Math.round((tasksCompletedCount / currentTasks.length) * 100) : 0;
            
            historyEntry = { 
                date: dateString,
                completedTasks: completedTasksToday,
                userNote: noteForModalTextarea, 
                pointsEarned: currentPointsToday,
                percentageCompleted: percentageToday,
            };
        }
    }

    domElements.historyUserNoteEdit.value = noteForModalTextarea; 

    if (historyEntry) {
        const [year, month, day] = historyEntry.date.split('-').map(Number);
        domElements.historyModalDate.textContent = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        domElements.historyModalPoints.textContent = historyEntry.pointsEarned.toString();
        domElements.historyModalPercentage.textContent = historyEntry.percentageCompleted.toString();

        domElements.historyTasksList.innerHTML = ''; 
        let hasCompletedTasks = false;
        Object.keys(historyEntry.completedTasks).forEach(category => {
            const tasksInCategory = historyEntry.completedTasks[category];
            if (tasksInCategory.length > 0) {
                hasCompletedTasks = true;
                const categoryGroup = document.createElement('div');
                categoryGroup.className = 'history-category-group';
                const categoryTitleEl = document.createElement('p');
                categoryTitleEl.className = 'history-category-title';
                categoryTitleEl.textContent = CATEGORY_DISPLAY_NAMES[category];
                categoryGroup.appendChild(categoryTitleEl);
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
        if (!hasCompletedTasks) {
            domElements.historyTasksList.innerHTML = '<p>No tasks were marked as completed on this day.</p>';
        }

    } else { 
        const [year, month, day] = dateString.split('-').map(Number);
        domElements.historyModalDate.textContent = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        domElements.historyModalPoints.textContent = "N/A";
        domElements.historyModalPercentage.textContent = "N/A";
        domElements.historyTasksList.innerHTML = '<p>No activity recorded for this day. Add a reflection below.</p>';
    }

    domElements.historyModal.classList.remove('hidden');
    if (domElements.historyModalCloseButton) domElements.historyModalCloseButton.focus();
}


function closeHistoryModal() {
    if (domElements.historyModal) {
        domElements.historyModal.classList.add('hidden');
    }
    currentModalDate = null; 
    renderCalendar(); 
}

function unclickAllTasksInCategory(category) {
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
    if (todayHistoryStr) {
        try {
            const todayHistoryEntry = JSON.parse(todayHistoryStr);
            todayHistoryEntry.pointsEarned = dailyEarnedPoints;
            todayHistoryEntry.percentageCompleted = totalTasksPossibleToday > 0 ? Math.round((totalTasksDoneToday / totalTasksPossibleToday) * 100) : 0;
            
            const completedTasksToday = { health: [], god: [], personal: [], routine: [] };
            currentTasks.forEach(t => { 
                if (t.completed) {
                    completedTasksToday[t.category].push(t.text);
                }
            });
            todayHistoryEntry.completedTasks = completedTasksToday;
            localStorage.setItem(todayHistoryKey, JSON.stringify(todayHistoryEntry));
        } catch (e) {
            console.error("Error updating today's history entry on unclick all:", e);
        }
    }

    if (activeTab === category) {
      renderCategoryTasks(category); 
    }
    renderDashboard(); 
    updateSaveProgressButtonState();
  }
}

function updateSaveProgressButtonState() {
    if (!domElements.saveProgressButton) return;

    const completedAndNotLockedTasks = currentTasks.filter(task => task.completed && !lockedTaskIdsToday.includes(task.id));
    const allCompletedTasks = currentTasks.filter(task => task.completed);

    if (allCompletedTasks.length === 0) {
        domElements.saveProgressButton.textContent = 'Save Progress';
        domElements.saveProgressButton.disabled = true;
        domElements.saveProgressButton.title = 'Complete some tasks to save progress.';
    } else if (completedAndNotLockedTasks.length === 0 && allCompletedTasks.length > 0) {
        // All completed tasks are already locked
        domElements.saveProgressButton.textContent = 'Progress Saved & Locked';
        domElements.saveProgressButton.disabled = true;
        domElements.saveProgressButton.title = 'Your completed tasks for today are locked.';
    } else {
        domElements.saveProgressButton.textContent = 'Save Progress';
        domElements.saveProgressButton.disabled = false;
        domElements.saveProgressButton.title = 'Lock in your completed tasks for today.';
    }
}

function showSaveProgressConfirmationModal() {
    if (domElements.saveProgressModal && domElements.confirmSaveProgressButton) {
        domElements.saveProgressModal.classList.remove('hidden');
        domElements.confirmSaveProgressButton.focus();
    }
}

function closeSaveProgressConfirmationModal() {
    if (domElements.saveProgressModal) {
        domElements.saveProgressModal.classList.add('hidden');
    }
}

function finalizeAndLockTasks() {
    let newLocksMade = false;
    currentTasks.forEach(task => {
        if (task.completed && !lockedTaskIdsToday.includes(task.id)) {
            lockedTaskIdsToday.push(task.id);
            newLocksMade = true;
        }
    });

    if (newLocksMade) {
        localStorage.setItem(STORAGE_KEY_LOCKED_TASKS_PREFIX + getTodayDateString(), JSON.stringify(lockedTaskIdsToday));
        
        if (activeTab !== 'dashboard') {
            renderCategoryTasks(activeTab);
        }
        renderDashboard(); // Re-renders calendar fill too
    }
    updateSaveProgressButtonState();
    closeSaveProgressConfirmationModal(); // Ensure modal is closed if open
}


function handleSaveProgressClick() {
    const now = new Date();
    const currentHour = now.getHours();

    // Check if there are any tasks that are completed but not yet locked
    const completableAndNotLockedTasks = currentTasks.filter(task => task.completed && !lockedTaskIdsToday.includes(task.id));
    if (completableAndNotLockedTasks.length === 0) {
        // No new tasks to lock, or no tasks completed. Button should be disabled by updateSaveProgressButtonState.
        return; 
    }

    if (currentHour < 20) { // Before 8 PM
        showSaveProgressConfirmationModal();
    } else {
        finalizeAndLockTasks();
    }
}

// Function to handle tab drag and drop
function initializeTabDragAndDrop() {
    const tabsNav = domElements.tabsContainer;
    if (!tabsNav) return;

    const categoryTabButtons = Array.from(tabsNav.querySelectorAll('.tab-button[data-category-tab]'));

    categoryTabButtons.forEach(button => {
        button.draggable = true;

        button.addEventListener('dragstart', (e) => {
            draggedTabElement = button;
            setTimeout(() => button.classList.add('dragging'), 0);
             if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        button.addEventListener('dragend', () => {
            button.classList.remove('dragging');
            draggedTabElement = null;
        });
    });

    tabsNav.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedTabElement) return;
        
        const targetButton = e.target.closest('.tab-button[data-category-tab]');
        if (targetButton && targetButton !== draggedTabElement) {
            const rect = targetButton.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            if (offsetX < rect.width / 2) {
                tabsNav.insertBefore(draggedTabElement, targetButton);
            } else {
                tabsNav.insertBefore(draggedTabElement, targetButton.nextSibling);
            }
        }
    });
}


function initializeApp() {
  domElements.tabsContainer = document.getElementById('tabs');
  const tabIds = ['dashboard', 'health', 'god', 'personal', 'routine'];
  tabIds.forEach(id => {
    domElements.tabButtons[id] = document.getElementById(`${id}-tab-button`);
    domElements.tabContents[id] = document.getElementById(`${id}-content`);
    if (id !== 'dashboard') {
      const category = id;
      domElements.categoryTaskLists[category] = document.getElementById(`${id}-task-list`);
      domElements.unclickAllButtons[category] = document.getElementById(`unclick-all-${category}-button`);
    }
  });
  domElements.dashboardSummariesContainer = document.getElementById('dashboard-summaries');
  domElements.weeklyProgressFill = document.getElementById('weekly-progress-fill');
  domElements.weeklyPointsStat = document.getElementById('weekly-points-stat');
  domElements.monthlyProgressFill = document.getElementById('monthly-progress-fill');
  domElements.monthlyPointsStat = document.getElementById('monthly-points-stat');
  domElements.calendarMonthYear = document.getElementById('calendar-month-year');
  domElements.calendarGrid = document.getElementById('calendar-grid');
  domElements.dailyNoteInput = document.getElementById('daily-note-input');
  domElements.saveNoteButton = document.getElementById('save-note-button');
  
  domElements.historyModal = document.getElementById('history-modal');
  domElements.historyModalCloseButton = document.getElementById('history-modal-close-button');
  domElements.historyModalDate = document.getElementById('history-modal-date');
  domElements.historyModalPoints = document.getElementById('history-modal-points');
  domElements.historyModalPercentage = document.getElementById('history-modal-percentage');
  domElements.historyTasksList = document.getElementById('history-tasks-list');
  
  domElements.historicalReflectionWrapper = document.getElementById('historical-reflection-wrapper');
  domElements.historyUserNoteDisplay = document.getElementById('history-user-note-display');
  domElements.historyUserNoteEdit = document.getElementById('history-user-note-edit');
  domElements.historicalNoteControls = document.getElementById('historical-note-controls');
  domElements.saveHistoricalNoteButton = document.getElementById('save-historical-note-button');
  domElements.clearHistoricalNoteButton = document.getElementById('clear-historical-note-button');
  domElements.historicalNoteStatus = document.getElementById('historical-note-status');

  domElements.saveProgressButtonContainer = document.getElementById('save-progress-button-container');
  domElements.saveProgressButton = document.getElementById('save-progress-button');
  domElements.saveProgressModal = document.getElementById('save-progress-modal');
  domElements.saveProgressModalContent = document.getElementById('save-progress-modal-content'); // Not used directly in current TS code but good to have
  domElements.saveProgressMessage = document.getElementById('save-progress-message');
  domElements.confirmSaveProgressButton = document.getElementById('confirm-save-progress-button');
  domElements.cancelSaveProgressButton = document.getElementById('cancel-save-progress-button');
  domElements.saveProgressCloseButton = document.getElementById('save-progress-close-button');


  let criticalElementMissing = false;
  const missingElementsReport = {tabsContainer: !!domElements.tabsContainer};


  tabIds.forEach(id => {
    if (!domElements.tabButtons[id]) { criticalElementMissing = true; missingElementsReport[`tabButton_${id}`] = false; }
     else { missingElementsReport[`tabButton_${id}`] = true;}
    if (!domElements.tabContents[id]) { criticalElementMissing = true; missingElementsReport[`tabContent_${id}`] = false; }
     else { missingElementsReport[`tabContent_${id}`] = true;}
    if (id !== 'dashboard') {
        const category = id;
        if (!domElements.categoryTaskLists[category]) {
           criticalElementMissing = true; missingElementsReport[`taskList_${category}`] = false;
        } else { missingElementsReport[`taskList_${category}`] = true;}
        if (!domElements.unclickAllButtons[category]) {
            criticalElementMissing = true; missingElementsReport[`unclickAllButton_${category}`] = false;
        } else { missingElementsReport[`unclickAllButton_${category}`] = true;}
    }
  });

  const criticalDashboardElements = {
    dashboardSummariesContainer: domElements.dashboardSummariesContainer,
    weeklyProgressFill: domElements.weeklyProgressFill, weeklyPointsStat: domElements.weeklyPointsStat,
    monthlyProgressFill: domElements.monthlyProgressFill, monthlyPointsStat: domElements.monthlyPointsStat,
    calendarMonthYear: domElements.calendarMonthYear, calendarGrid: domElements.calendarGrid,
    dailyNoteInput: domElements.dailyNoteInput, saveNoteButton: domElements.saveNoteButton,
    historyModal: domElements.historyModal, historyModalCloseButton: domElements.historyModalCloseButton,
    historyModalDate: domElements.historyModalDate, historyModalPoints: domElements.historyModalPoints,
    historyModalPercentage: domElements.historyModalPercentage, historyTasksList: domElements.historyTasksList,
    historicalReflectionWrapper: domElements.historicalReflectionWrapper,
    historyUserNoteDisplay: domElements.historyUserNoteDisplay, historyUserNoteEdit: domElements.historyUserNoteEdit,
    historicalNoteControls: domElements.historicalNoteControls, saveHistoricalNoteButton: domElements.saveHistoricalNoteButton,
    clearHistoricalNoteButton: domElements.clearHistoricalNoteButton, historicalNoteStatus: domElements.historicalNoteStatus,
    saveProgressButtonContainer: domElements.saveProgressButtonContainer, saveProgressButton: domElements.saveProgressButton,
    saveProgressModal: domElements.saveProgressModal, saveProgressMessage: domElements.saveProgressMessage,
    confirmSaveProgressButton: domElements.confirmSaveProgressButton, cancelSaveProgressButton: domElements.cancelSaveProgressButton,
    saveProgressCloseButton: domElements.saveProgressCloseButton,
  };

  for (const [key, element] of Object.entries(criticalDashboardElements)) {
    if (!element) { criticalElementMissing = true; missingElementsReport[key] = false; } 
    else { missingElementsReport[key] = true;}
  }
  
  if (criticalElementMissing) {
    console.error('Failed to initialize app: One or more critical DOM elements are missing.');
    console.error('Missing elements report:', missingElementsReport);
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">App initialization failed. Critical elements are missing. Please check the console.</p>';
    }
    return;
  }

  Object.keys(domElements.tabButtons).forEach(id => {
    const button = domElements.tabButtons[id];
    if (button) { button.addEventListener('click', () => switchTab(id));}
  });

  Object.keys(domElements.unclickAllButtons).forEach(category => {
    const button = domElements.unclickAllButtons[category];
    if (button) {
        button.addEventListener('click', () => unclickAllTasksInCategory(category));
    }
  });

  if(domElements.saveNoteButton) {
      domElements.saveNoteButton.addEventListener('click', saveDailyNote);
  }
  if(domElements.historyModalCloseButton) {
      domElements.historyModalCloseButton.addEventListener('click', closeHistoryModal);
  }
  if(domElements.historyModal) {
      domElements.historyModal.addEventListener('click', (event) => {
          if (event.target === domElements.historyModal) { 
              closeHistoryModal();
          }
      });
  }
  if (domElements.saveHistoricalNoteButton) {
    domElements.saveHistoricalNoteButton.addEventListener('click', saveHistoricalNote);
  }
  if (domElements.clearHistoricalNoteButton) {
    domElements.clearHistoricalNoteButton.addEventListener('click', clearHistoricalNote);
  }

  if (domElements.saveProgressButton) {
    domElements.saveProgressButton.addEventListener('click', handleSaveProgressClick);
  }
  if (domElements.confirmSaveProgressButton) {
    domElements.confirmSaveProgressButton.addEventListener('click', () => {
        finalizeAndLockTasks();
        closeSaveProgressConfirmationModal();
    });
  }
  if (domElements.cancelSaveProgressButton) {
    domElements.cancelSaveProgressButton.addEventListener('click', closeSaveProgressConfirmationModal);
  }
  if (domElements.saveProgressCloseButton) {
    domElements.saveProgressCloseButton.addEventListener('click', closeSaveProgressConfirmationModal);
  }
  if (domElements.saveProgressModal) {
    domElements.saveProgressModal.addEventListener('click', (event) => {
        if (event.target === domElements.saveProgressModal) {
            closeSaveProgressConfirmationModal();
        }
    });
  }


  loadAppData();
  renderCalendar(); 
  switchTab('dashboard'); 
  updateSaveProgressButtonState();
  initializeTabDragAndDrop(); // Initialize tab drag and drop
}


function switchTab(tabId) {
  activeTab = tabId;

  Object.keys(domElements.tabButtons).forEach(id => {
    const button = domElements.tabButtons[id];
    const content = domElements.tabContents[id];
    if (button && content) {
      if (id === activeTab) {
        content.classList.remove('hidden');
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        if (id === 'dashboard') { // Specific highlight for "Main" tab
            button.classList.add('main-tab-highlight');
        }
      } else {
        content.classList.add('hidden');
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
        if (id === 'dashboard') { // Ensure highlight is maintained correctly
            button.classList.add('main-tab-highlight');
        }
      }
    }
  });
  // Ensure "Main" tab always has its base highlight if not active
  if (domElements.tabButtons['dashboard'] && activeTab !== 'dashboard') {
      domElements.tabButtons['dashboard'].classList.add('main-tab-highlight');
  }


  if (activeTab === 'dashboard') {
    renderDashboard(); 
    renderCalendar(); 
  } else if (activeTab in TASKS_CONFIG) {
    renderCategoryTasks(activeTab);
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
