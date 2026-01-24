'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Plus, Trash2, Check, 
  BrainCircuit, Sparkles, GripVertical, Bell, CornerDownRight, FileText, X,
  Maximize2, Minimize2, Settings, Archive, RotateCw, Flag, Paperclip, ExternalLink,
  File, Globe, Image as ImageIcon, Video, FileCode, Github, Youtube, Twitter, Instagram, 
  Linkedin, Figma, Codepen, Trello, Slack, Disc, Download, Upload, Eye, EyeOff, Keyboard,
  BarChart, ChevronDown, FolderPlus, Target, Calendar, Flame, Repeat, Headphones, Volume2, VolumeX, Move, Search, Tag
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { deriveKey, encryptData, decryptData } from '@/lib/client-crypto';

type SubTask = {
    id: string;
    text: string;
    completed: boolean;
};

type Attachment = {
    id: string;
    name: string;
    url: string;
    type: 'link';
};

type TaskList = {
    id: string;
    name: string;
};

type Task = {
  id: string;
  listId?: string;
  text: string;
  completed: boolean;
  subtasks: SubTask[];
  notes?: string;
  archived?: boolean;
  priority?: 'low' | 'medium' | 'high';
  attachments?: Attachment[];
  dueDate?: string;
  estimatedPomos?: number;
  actualPomos?: number;
  recurrence?: 'daily' | 'weekly' | 'monthly' | null;
  lastCompletedDate?: string;
  tags?: string[];
};

const SOUNDS = {
    bell: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    digital: 'https://assets.mixkit.co/active_storage/sfx/2864/2864-preview.mp3',
    nature: 'https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3'
};

const TASK_TAGS = [
    { id: 'work', label: 'Work', color: 'bg-blue-500' },
    { id: 'personal', label: 'Personal', color: 'bg-green-500' },
    { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { id: 'ideas', label: 'Ideas', color: 'bg-purple-500' },
    { id: 'learning', label: 'Learning', color: 'bg-amber-500' },
];


const RADIO_STATIONS = [
    { name: 'Lo-fi Hip Hop', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', color: 'bg-purple-500' },
    { name: 'Chillhop', url: 'https://streams.ilovemusic.de/iloveradio2.mp3', color: 'bg-blue-500' },
    { name: 'Jazz Vibes', url: 'https://streams.ilovemusic.de/iloveradio10.mp3', color: 'bg-amber-500' },
    { name: 'Deep Focus', url: 'https://streams.ilovemusic.de/iloveradio16.mp3', color: 'bg-green-500' },
];


const DEFAULT_SETTINGS = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    interval: 4,
    sound: 'bell' as keyof typeof SOUNDS
};

export default function TasksPage() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([{ id: 'default', name: 'My Tasks' }]);
  const [activeListId, setActiveListId] = useState<string>('default');
  const [newTaskText, setNewTaskText] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTaskID, setActiveTaskID] = useState<string | null>(null);

  const [modalType, setModalType] = useState<'SUBTASK' | 'NOTE' | 'BRAINSTORM' | 'SETTINGS' | 'ARCHIVE' | 'ATTACHMENT' | 'SHORTCUTS' | 'STATS' | 'NEW_LIST' | 'DUE_DATE' | 'ESTIMATE' | 'MOVE_TO_LIST' | 'SYNC'>('SUBTASK');
  const [modalInput, setModalInput] = useState('');
  const [attachmentName, setAttachmentName] = useState(''); // Separate state for attachment name
  
  // Sync State
  const [syncKey, setSyncKey] = useState<CryptoKey | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncSalt, setSyncSalt] = useState<string | null>(null);

  // User State
  const [user, setUser] = useState<{ username: string; avatar: string | null } | null>(null);

  useEffect(() => {
      fetch('/api/auth/me')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
              if (data) setUser(data);
          })
          .catch(err => console.error('Failed to fetch user', err));
  }, []);

  // Pomodoro
  const [pomoSettings, setPomoSettings] = useState(DEFAULT_SETTINGS);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [focusHistory, setFocusHistory] = useState<{ date: string; minutes: number; tasksCompleted?: number }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [currentStation, setCurrentStation] = useState(0);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [streamType, setStreamType] = useState<'youtube' | 'twitch'>('youtube');
  
  // Notes & Links Module State
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'links'>('tasks');
  const [notePages, setNotePages] = useState<{ id: string; title: string; content: string }[]>([
      { id: 'default', title: 'Notes', content: '' }
  ]);
  const [activeNoteId, setActiveNoteId] = useState('default');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [savedLinks, setSavedLinks] = useState<{ id: string; title: string; url: string; createdAt: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const modalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // --- Effects ---
  


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        // ... (existing notification logic)
        if (Notification.permission === 'granted') {
            setNotificationsEnabled(true);
        }
    }
    audioRef.current = new Audio(SOUNDS[pomoSettings.sound] || SOUNDS.bell); 
  }, [pomoSettings.sound]);

  useEffect(() => {
      // Auto focus logic
      if (modalOpen && modalInputRef.current && !['SETTINGS', 'ARCHIVE'].includes(modalType)) {
          setTimeout(() => modalInputRef.current?.focus(), 100);
      }
  }, [modalOpen, modalType]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    let modeLabel = 'Focus';
    if (mode === 'break') modeLabel = 'Short Break';
    if (mode === 'longBreak') modeLabel = 'Long Break';
    
    document.title = isRunning ? `(${timeString}) ${modeLabel}` : 'Workflow';

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      audioRef.current?.play().catch(e => console.log('Audio play failed', e));
      
      if (mode === 'work') {
          const newSessions = sessionsCompleted + 1;
          setSessionsCompleted(newSessions);

          // Increment pomos on current task
          if (currentTaskId) {
              setTasks(prev => prev.map(t => 
                  t.id === currentTaskId 
                      ? { ...t, actualPomos: (t.actualPomos || 0) + 1 }
                      : t
              ));
          }

          // Log History
          const today = new Date().toISOString().split('T')[0];
          setFocusHistory(prev => {
              const existing = prev.find(h => h.date === today);
              if (existing) {
                  return prev.map(h => h.date === today ? { ...h, minutes: h.minutes + pomoSettings.work } : h);
              }
              return [...prev, { date: today, minutes: pomoSettings.work }];
          });
          
          if (newSessions % pomoSettings.interval === 0) {
              setMode('longBreak');
              setTimeLeft(pomoSettings.longBreak * 60);
              toast.success(`Great job! You've done ${newSessions} sessions.`, { description: `Take a ${pomoSettings.longBreak}m long break.` });
              if (notificationsEnabled) new Notification("Long Break!", { body: `Great job! You've done ${newSessions} sessions. Take ${pomoSettings.longBreak}m.` });
          } else {
              setMode('break');
              setTimeLeft(pomoSettings.shortBreak * 60);
              toast.success('Focus Session Complete!', { description: 'Time to recharge.' });
              if (notificationsEnabled) new Notification("Short Break!", { body: "Time to recharge." });
          }
      } else {
          setMode('work');
          setTimeLeft(pomoSettings.work * 60);
          toast.info('Break Over!', { description: 'Ready to focus?' });
          if (notificationsEnabled) new Notification("Back to Work!", { body: "Ready to focus?" });
      }
    }
    
  return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, notificationsEnabled, sessionsCompleted, pomoSettings]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('my-tasks');
    if (saved) {
        const loadedTasks = JSON.parse(saved);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Migration and recurring task reset
        const migratedTasks = loadedTasks.map((t: Task) => {
            let task = {
                ...t,
                listId: t.listId || 'default'
            };
            
            // Reset recurring tasks if needed
            if (task.recurrence && task.completed && task.lastCompletedDate) {
                const lastCompleted = new Date(task.lastCompletedDate + 'T00:00:00');
                const daysSince = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
                
                let shouldReset = false;
                if (task.recurrence === 'daily' && daysSince >= 1) shouldReset = true;
                if (task.recurrence === 'weekly' && daysSince >= 7) shouldReset = true;
                if (task.recurrence === 'monthly' && daysSince >= 30) shouldReset = true;
                
                if (shouldReset) {
                    task = { ...task, completed: false, actualPomos: 0 };
                }
            }
            
            return task;
        });
        setTasks(migratedTasks);
    }

    const savedLists = localStorage.getItem('my-task-lists');
    if (savedLists) {
         setLists(JSON.parse(savedLists));
    }
    
    const savedActiveList = localStorage.getItem('active-list-id');
    if (savedActiveList) {
        setActiveListId(savedActiveList);
    }
    
    const savedSettings = localStorage.getItem('workflow-settings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.pomoSettings) setPomoSettings(parsed.pomoSettings);
        if (parsed.sessionsCompleted !== undefined) setSessionsCompleted(parsed.sessionsCompleted);
        if (parsed.focusHistory) setFocusHistory(parsed.focusHistory);
        
        setTimeLeft(parsed.timeLeft || (DEFAULT_SETTINGS.work * 60));
        setMode(parsed.mode || 'work');
        setIsTimerMinimized(parsed.isTimerMinimized || false);
    }
    
    // Load Notes & Links
    const savedNotes = localStorage.getItem('workflow-notes');
    if (savedNotes) {
        try {
            const parsed = JSON.parse(savedNotes);
            if (Array.isArray(parsed)) {
                setNotePages(parsed);
            } else {
                // Migration from old single-note format
                setNotePages([{ id: 'default', title: 'Notes', content: parsed }]);
            }
        } catch {
            // Old string format - migrate
            setNotePages([{ id: 'default', title: 'Notes', content: savedNotes }]);
        }
    }
    
    const savedLinksData = localStorage.getItem('workflow-links');
    if (savedLinksData) setSavedLinks(JSON.parse(savedLinksData));
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('my-tasks', JSON.stringify(tasks));
        localStorage.setItem('my-task-lists', JSON.stringify(lists));
        localStorage.setItem('active-list-id', activeListId);
    }
  }, [tasks, lists, activeListId, isLoaded]);

  // Save Notes & Links
  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('workflow-notes', JSON.stringify(notePages));
        localStorage.setItem('workflow-links', JSON.stringify(savedLinks));
    }
  }, [notePages, savedLinks, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('workflow-settings', JSON.stringify({
            timeLeft,
            mode,
            isTimerMinimized,
            pomoSettings,
            sessionsCompleted,
            focusHistory
        }));
    }
  }, [timeLeft, mode, isTimerMinimized, pomoSettings, sessionsCompleted, focusHistory, isLoaded]);

  // --- Handlers ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        toast.error("This browser does not support notifications.");
        return;
    }
    
    if (Notification.permission === 'denied') {
        toast.error("Notifications are blocked.", { description: "Please enable them in your browser settings." });
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success("Notifications enabled!");
        new Notification("Hello!", { body: "You will now receive alerts for your timer." });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(pomoSettings.work * 60);
    else if (mode === 'break') setTimeLeft(pomoSettings.shortBreak * 60);
    else if (mode === 'longBreak') setTimeLeft(pomoSettings.longBreak * 60);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in input/textarea
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                toggleTimer();
                break;
            case 'n':
                e.preventDefault();
                document.querySelector<HTMLInputElement>('input[placeholder="What\'s your focus today?"]')?.focus();
                break;
            case '?':
                openModal(null, 'SHORTCUTS');
                break;
            case 'escape':
                if (modalOpen) setModalOpen(false);
                else if (isZenMode) setIsZenMode(false);
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    
  return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, modalOpen, isZenMode]);
  
  const switchMode = (m: 'work' | 'break' | 'longBreak') => {
    setMode(m);
    setIsRunning(false);
    if (m === 'work') setTimeLeft(pomoSettings.work * 60);
    else if (m === 'break') setTimeLeft(pomoSettings.shortBreak * 60);
    else if (m === 'longBreak') setTimeLeft(pomoSettings.longBreak * 60);
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    setTasks((prev) => [
      { 
          id, 
          text: text.trim(), 
          completed: false, 
          subtasks: [], 
          priority: 'medium', 
          attachments: [],
          listId: activeListId // Tag with active list
      }, 
      ...prev
    ]);
    toast.success('Task Added');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    addTask(newTaskText);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
        if (t.id === id) {
            const isCompleting = !t.completed;
            if (isCompleting) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#27272a', '#52525b', '#e4e4e7', '#f4f4f5'],
                    disableForReducedMotion: true
                });

                // Clear focus if this was the current task
                if (currentTaskId === id) {
                    setCurrentTaskId(null);
                }

                // Log Task Completion
                const today = new Date().toISOString().split('T')[0];
                setFocusHistory(prev => {
                    const existing = prev.find(h => h.date === today);
                    if (existing) {
                        return prev.map(h => h.date === today ? { ...h, tasksCompleted: (h.tasksCompleted || 0) + 1 } : h);
                    }
                    return [...prev, { date: today, minutes: 0, tasksCompleted: 1 }];
                });
            }
            // Track lastCompletedDate for recurring tasks
            const today = new Date().toISOString().split('T')[0];
            return { ...t, completed: !t.completed, lastCompletedDate: isCompleting ? today : t.lastCompletedDate };
        }
        return t;
    }));
  };

  const cyclePriority = (id: string) => {
      setTasks(tasks.map(t => {
          if (t.id === id) {
              const current = t.priority || 'medium';
              let next: 'low' | 'medium' | 'high' = 'medium';
              if (current === 'low') next = 'medium';
              if (current === 'medium') next = 'high';
              if (current === 'high') next = 'low';
              return { ...t, priority: next };
          }
          return t;
      }));
  };

  const cycleRecurrence = (id: string) => {
      setTasks(tasks.map(t => {
          if (t.id === id) {
              const order: (typeof t.recurrence)[] = [null, 'daily', 'weekly', 'monthly'];
              const currentIndex = order.indexOf(t.recurrence || null);
              const next = order[(currentIndex + 1) % order.length];
              const label = next ? next : 'none';
              toast.info(`Recurrence: ${label}`);
              return { ...t, recurrence: next };
          }
          return t;
      }));
  };

  const toggleTag = (taskId: string, tagId: string) => {
      setTasks(tasks.map(t => {
          if (t.id === taskId) {
              const currentTags = t.tags || [];
              if (currentTags.includes(tagId)) {
                  return { ...t, tags: currentTags.filter(tag => tag !== tagId) };
              } else {
                  return { ...t, tags: [...currentTags, tagId] };
              }
          }
          return t;
      }));
  };

  const [searchQuery, setSearchQuery] = useState('');

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const archiveTask = (id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, archived: true } : t));
      toast('Task Archived', {
          action: {
              label: 'Undo',
              onClick: () => unarchiveTask(id)
          }
      });
  };

  const unarchiveTask = (id: string) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, archived: false } : t));
  };

  const openModal = (taskId: string | null, type: 'SUBTASK' | 'NOTE' | 'BRAINSTORM' | 'SETTINGS' | 'ARCHIVE' | 'ATTACHMENT') => {
      setActiveTaskID(taskId);
      setModalType(type);
      
      if (type === 'NOTE' && taskId) {
          const task = tasks.find(t => t.id === taskId);
          setModalInput(task?.notes || '');
      } else if (type === 'SETTINGS') {
          setSettingsForm(pomoSettings);
      } else {
          setModalInput('');
          setAttachmentName('');
      }
      setModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (modalType === 'SETTINGS') {
          const newSettings = {
              work: Number(settingsForm.work) || 25,
              shortBreak: Number(settingsForm.shortBreak) || 5,
              longBreak: Number(settingsForm.longBreak) || 15,
              interval: Number(settingsForm.interval) || 4,
              sound: settingsForm.sound || 'bell'
          };
          setPomoSettings(newSettings);
          if (!isRunning) {
               if (mode === 'work') setTimeLeft(newSettings.work * 60);
               else if (mode === 'break') setTimeLeft(newSettings.shortBreak * 60);
               else if (mode === 'longBreak') setTimeLeft(newSettings.longBreak * 60);
          }
          toast.info('Settings Saved');
          setModalOpen(false);
          return;
      }

      if (modalType === 'BRAINSTORM') {
          const lines = modalInput.split('\n');
          lines.forEach(line => {
             if(line.trim()) addTask(line);
          });
          setModalOpen(false);
          return;
      }

      if (!activeTaskID && modalType !== 'ARCHIVE') return;

      if (modalType === 'SUBTASK') {
          if (!modalInput.trim()) return;
          const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);
          setTasks(tasks.map(task => {
              if (task.id === activeTaskID) {
                  return {
                      ...task,
                      subtasks: [...task.subtasks, { id: subId, text: modalInput.trim(), completed: false }]
                  };
              }
              return task;
          }));
      } else if (modalType === 'NOTE') {
          setTasks(tasks.map(task => {
              if (task.id === activeTaskID) {
                  return { ...task, notes: modalInput.trim() };
              }
              return task;
          }));
      } else if (modalType === 'ATTACHMENT') {
          if (!modalInput.trim()) return; 
          const attId = Date.now().toString(36) + Math.random().toString(36).substr(2);
          // Auto-name if empty
          let name = attachmentName.trim();
          if (!name) {
              try {
                  name = new URL(modalInput).hostname;
              } catch {
                  name = "Link";
              }
          }
          
          setTasks(tasks.map(task => {
              if (task.id === activeTaskID) {
                  return {
                      ...task,
                      attachments: [...(task.attachments || []), { id: attId, name, url: modalInput.trim(), type: 'link' }]
                  };
              }
              return task;
          }));
          toast.success('Link Attached');
      }
      setModalOpen(false);
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
      setTasks(tasks.map(task => {
          if (task.id === taskId) {
              return {
                  ...task,
                  subtasks: task.subtasks.map(st => 
                    st.id === subTaskId ? { ...st, completed: !st.completed } : st
                  )
              };
          }
          return task;
      }));
  };

   const deleteSubTask = (taskId: string, subTaskId: string) => {
      setTasks(tasks.map(task => {
          if (task.id === taskId) {
              return {
                  ...task,
                  subtasks: task.subtasks.filter(st => st.id !== subTaskId)
              };
          }
          return task;
      }));
  };

  const deleteAttachment = (taskId: string, attId: string) => {
      setTasks(tasks.map(task => {
          if (task.id === taskId) {
              return {
                  ...task,
                  attachments: (task.attachments || []).filter(a => a.id !== attId)
              };
          }
          return task;
      }));
  };

  const toggleMinimize = () => {
      setIsTimerMinimized(!isTimerMinimized);
  };

  // Filter tasks by active list
  const currentListTasks = tasks.filter(t => (t.listId || 'default') === activeListId);

  const searchFilter = (t: Task) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return t.text.toLowerCase().includes(query) ||
             t.tags?.some(tag => tag.toLowerCase().includes(query)) ||
             t.notes?.toLowerCase().includes(query);
  };

  const activeTasks = currentListTasks.filter(t => !t.completed && !t.archived && searchFilter(t));
  const completedTasks = currentListTasks.filter(t => t.completed && !t.archived && searchFilter(t));
  const archivedTasks = currentListTasks.filter(t => t.archived);

  // Sorting: High > Medium > Low
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const getSubtaskProgress = (t: Task) => {
      if (!t.subtasks || t.subtasks.length === 0) return 0;
      const completed = t.subtasks.filter(s => s.completed).length;
      return completed / t.subtasks.length;
  };

  const handleReorder = (newActiveTasks: Task[]) => {
      setTasks([...newActiveTasks, ...completedTasks, ...archivedTasks]);
  };

  const getTotalTime = () => {
      if (mode === 'work') return pomoSettings.work * 60;
      if (mode === 'break') return pomoSettings.shortBreak * 60;
      return pomoSettings.longBreak * 60;
  };
  
  const progress = timeLeft / getTotalTime();
  const strokeDasharray = 283; 

  const getPriorityColor = (p?: string) => {
      if (p === 'disaster') return 'text-red-600'; 
      if (p === 'high') return 'text-red-400';
      if (p === 'medium') return 'text-amber-400';
      return 'text-zinc-600';
  };

  const getIconForUrl = (url: string) => {
      try {
          const u = new URL(url);
          const domain = u.hostname.toLowerCase();
          const path = u.pathname.toLowerCase();

          // Services
          if (domain.includes('github.com')) return <Github size={12} />;
          if (domain.includes('youtube.com') || domain.includes('youtu.be')) return <Youtube size={12} />;
          if (domain.includes('twitter.com') || domain.includes('x.com')) return <Twitter size={12} />;
          if (domain.includes('figma.com')) return <Figma size={12} />;
          if (domain.includes('instagram.com')) return <Instagram size={12} />;
          if (domain.includes('linkedin.com')) return <Linkedin size={12} />;
          if (domain.includes('codepen.io')) return <Codepen size={12} />;
          if (domain.includes('trello.com')) return <Trello size={12} />;
          if (domain.includes('slack.com')) return <Slack size={12} />;

          // Files by extension
          if (path.endsWith('.pdf') || path.endsWith('.doc') || path.endsWith('.docx') || path.endsWith('.txt')) return <FileText size={12} />;
          if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg')) return <ImageIcon size={12} />;
          if (path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.avi')) return <Video size={12} />;
          if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.py') || path.endsWith('.css') || path.endsWith('.html')) return <FileCode size={12} />;
          
          // Default Web
          return <Globe size={12} />;
      } catch {
          return <ExternalLink size={12} />;
      }
  };

  const exportData = () => {
      const data = {
          tasks,
          lists,
          activeListId,
          savedLinks,
          notePages,
          settings: { timeLeft, mode, isTimerMinimized, pomoSettings },
          focusHistory
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.tasks) setTasks(data.tasks);
              if (data.lists) setLists(data.lists);
              if (data.activeListId) setActiveListId(data.activeListId);
              if (data.savedLinks) setSavedLinks(data.savedLinks);
              if (data.notePages) setNotePages(data.notePages);
              if (data.focusHistory) setFocusHistory(data.focusHistory);
              if (data.settings) {
                  const s = data.settings;
                  if (s.timeLeft) setTimeLeft(s.timeLeft);
                  if (s.mode) setMode(s.mode);
                  if (s.pomoSettings) setPomoSettings(s.pomoSettings);
                  if (typeof s.isTimerMinimized === 'boolean') setIsTimerMinimized(s.isTimerMinimized);
              }
              toast.success('Data imported successfully!');
              setModalOpen(false);
          } catch (err) {
              console.error(err);
              toast.error('Failed to import data: Invalid file');
          }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calculate current streak (consecutive days with tasks completed)
  const calculateStreak = (): number => {
      if (focusHistory.length === 0) return 0;
      
      // Sort history by date descending
      const sorted = [...focusHistory]
          .filter(h => h.tasksCompleted && h.tasksCompleted > 0)
          .sort((a, b) => b.date.localeCompare(a.date));
      
      if (sorted.length === 0) return 0;
      
      let streak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      // Check if today or yesterday has activity (allow starting streak check from yesterday)
      const todayStr = checkDate.toISOString().split('T')[0];
      const yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const hasToday = sorted.some(h => h.date === todayStr);
      const hasYesterday = sorted.some(h => h.date === yesterdayStr);
      
      if (!hasToday && !hasYesterday) return 0;
      
      // Start from today if active, otherwise yesterday
      if (!hasToday) {
          checkDate = yesterday;
      }
      
      // Count consecutive days backward
      while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (sorted.some(h => h.date === dateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
          } else {
              break;
          }
      }
      
      return streak;
  };
  
  const currentStreak = calculateStreak();


  // --- Import / Export ---
  const fileInputRef = useRef<HTMLInputElement>(null);





  // --- Sync Logic ---
  const handleSyncSetup = async (password: string) => {
      try {
          setIsSyncing(true);
          
          // 1. Check if server has data
          const res = await fetch('/api/sync');
          const serverData = await res.json();
          
          let key: CryptoKey;
          let salt = serverData.salt;

          if (serverData.encryptedData && salt) {
              // Case A: Verify Password & Download
              key = await deriveKey(password, salt);
              try {
                  const decrypted = await decryptData(serverData.encryptedData, serverData.iv, key);
                  // Merge logic (Simple overwrite from server for now, or smarter merge later)
                  // For MVP: Server wins if it exists, to avoid overwriting remote data with empty local state on new device.
                  // But we should prompt? For now, let's assume if you are logging in, you want the server data.
                  if (decrypted) {
                      if (decrypted.tasks) setTasks(decrypted.tasks);
                      if (decrypted.lists) setLists(decrypted.lists);
                      if (decrypted.activeListId) setActiveListId(decrypted.activeListId);
                      if (decrypted.savedLinks) setSavedLinks(decrypted.savedLinks);
                      if (decrypted.notePages) setNotePages(decrypted.notePages);
                      if (decrypted.settings) {
                          if (decrypted.settings.timeLeft) setTimeLeft(decrypted.settings.timeLeft);
                          if (decrypted.settings.mode) setMode(decrypted.settings.mode);
                          if (decrypted.settings.pomoSettings) setPomoSettings(decrypted.settings.pomoSettings);
                          if (typeof decrypted.settings.isTimerMinimized === 'boolean') setIsTimerMinimized(decrypted.settings.isTimerMinimized);
                      }
                      
                      const date = new Date(decrypted.updatedAt || Date.now());
                      setLastSyncTime(date);
                      toast.success(`Synced! (Last update: ${date.toLocaleTimeString()})`);
                  }
              } catch (e) {
                  toast.error('Incorrect password (decryption failed)');
                  setIsSyncing(false);
                  return;
              }
          } else {
              // Case B: First time setup / Upload
              salt = window.crypto.randomUUID(); // Simple salt
              key = await deriveKey(password, salt);
              
              // Initial upload
              await performSync(key, salt);
              toast.success('Sync enabled & data uploaded!');
          }
          
          setSyncKey(key);
          setSyncSalt(salt);
          setModalOpen(false);
      } catch (e) {
          console.error(e);
          toast.error('Sync setup failed');
      } finally {
          setIsSyncing(false);
      }
  };

  const performSync = async (key: CryptoKey, saltStr: string) => {
      if (!key) return;
      
      const dataToEncrypt = {
          tasks,
          lists,
          activeListId,
          savedLinks,
          notePages,
          settings: { timeLeft, mode, isTimerMinimized, pomoSettings },
          updatedAt: new Date().toISOString()
      };
      
      const { cipherText, iv } = await encryptData(dataToEncrypt, key);
      
      await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              encryptedData: cipherText,
              salt: saltStr,
              iv,
              version: 1
          })
      });
      setLastSyncTime(new Date());
  };

  // Auto-Sync Effect
  /*
  useEffect(() => {
      if (!syncKey || isSyncing || !syncSalt) return;
      
      const timeoutId = setTimeout(() => {
          performSync(syncKey, syncSalt);
      }, 5000); // Debounce 5s
      
      
  return () => clearTimeout(timeoutId);
  }, [tasks, lists, savedLinks, notePages, pomoSettings, syncKey, syncSalt]);
  */

  if (!isLoaded) {
    return <div className="min-h-full w-full bg-zinc-950" />;
  }

  
  return (
    <div className="min-h-full w-full p-8 md:p-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 relative">
      <Toaster position="bottom-right" theme="dark" />
      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={importData} 
          accept=".json" 
          className="hidden" 
      />
      
      {/* Header */}
      {!isZenMode && (
      <motion.div 
        layout
        className="mb-12 flex justify-between items-center"
      >
        <div className="flex items-center gap-6">
            <div className="relative">
                <button 
                    onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
                    className="flex items-center gap-2 group"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight">
                        {lists.find(l => l.id === activeListId)?.name || 'My Tasks'}
                    </h1>
                    <ChevronDown 
                        size={24} 
                        className={clsx(
                            "text-zinc-500 group-hover:text-zinc-300 transition-all",
                            isListDropdownOpen && "rotate-180"
                        )} 
                    />
                </button>
                <p className="text-zinc-500 mt-2 font-medium">Capture ideas. Stay focused.</p>

                {/* List Dropdown */}
                <AnimatePresence>
                    {isListDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-2 space-y-1">
                                {lists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => {
                                            setActiveListId(list.id);
                                            setIsListDropdownOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 rounded-lg transition-colors font-medium",
                                            activeListId === list.id 
                                                ? "bg-zinc-100 text-zinc-900" 
                                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                                        )}
                                    >
                                        {list.name}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-white/5 p-2">
                                <button
                                    onClick={() => {
                                        setIsListDropdownOpen(false);
                                        setModalInput('');
                                        setModalType('NEW_LIST');
                                        setModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-100 transition-colors font-medium"
                                >
                                    <FolderPlus size={18} />
                                    Create New List
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mini Timer */}
            <AnimatePresence>
                {isTimerMinimized && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md"
                    >
                        <span className="text-2xl font-bold text-zinc-100 tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                        <div className="flex bg-black/30 rounded-lg p-1">
                             <div className={clsx("w-2 h-2 rounded-full mx-1", mode === 'work' ? "bg-zinc-100" : "bg-zinc-700")} />
                             <div className={clsx("w-2 h-2 rounded-full mx-1", mode !== 'work' ? "bg-zinc-100" : "bg-zinc-700")} />
                        </div>
                         <button 
                            onClick={toggleTimer}
                            className="btn btn-circle btn-sm bg-zinc-100 hover:bg-white text-zinc-900 border-none"
                        >
                            {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button 
                            onClick={toggleMinimize}
                            title="Expand Timer"
                            className="btn btn-circle btn-sm btn-ghost hover:bg-white/10 text-zinc-400"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        <div className="flex gap-2 items-center">
            {/* Streak Badge */}
            {currentStreak > 0 && (
                <div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 font-bold text-sm"
                    title={`${currentStreak} day streak! Keep it up!`}
                >
                    <Flame size={16} className="fill-orange-400" />
                    <span>{currentStreak}</span>
                </div>
            )}
            {!notificationsEnabled && (
                <button 
                  onClick={requestNotificationPermission}
                  className="btn btn-circle btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100"
                  title="Enable Notifications"
                >
                  <Bell size={24} />
                </button>
            )}

            {/* Music Player Toggle */}
            <div className="relative">
                <button 
                    onClick={() => setShowMusicPanel(!showMusicPanel)}
                    className={clsx(
                        "btn btn-circle btn-ghost hover:bg-white/10",
                        isMusicPlaying ? "text-green-400" : "text-zinc-500 hover:text-zinc-100"
                    )}
                    title={isMusicPlaying ? "Music playing" : "Focus music"}
                >
                    <Headphones size={24} />
                </button>
                
                {/* Music Panel */}
                <AnimatePresence>
                    {showMusicPanel && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-2 p-4 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 w-72"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-zinc-300">Focus Music</span>
                                <button 
                                    onClick={() => {
                                        if (musicRef.current) {
                                            if (isMusicPlaying) {
                                                musicRef.current.pause();
                                            } else {
                                                musicRef.current.play().catch(e => console.log('Music play failed', e));
                                            }
                                            setIsMusicPlaying(!isMusicPlaying);
                                        }
                                    }}
                                    className={clsx(
                                        "btn btn-sm btn-circle",
                                        isMusicPlaying ? "bg-green-500 text-black" : "bg-zinc-700 text-zinc-300"
                                    )}
                                >
                                    {isMusicPlaying ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                            </div>
                            
                            {/* Station Selector */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {RADIO_STATIONS.map((station, i) => (
                                    <button
                                        key={station.name}
                                        onClick={() => {
                                            setCurrentStation(i);
                                            if (musicRef.current) {
                                                musicRef.current.src = station.url;
                                                musicRef.current.volume = musicVolume;
                                                if (isMusicPlaying) {
                                                    musicRef.current.play().catch(e => console.log('Music play failed', e));
                                                }
                                            }
                                        }}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                            currentStation === i 
                                                ? `${station.color} text-white` 
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                        )}
                                    >
                                        {station.name}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <VolumeX size={16} className="text-zinc-500" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={musicVolume}
                                    onChange={(e) => {
                                        const vol = parseFloat(e.target.value);
                                        setMusicVolume(vol);
                                        if (musicRef.current) {
                                            musicRef.current.volume = vol;
                                        }
                                    }}
                                    className="flex-1 accent-green-500"
                                />
                                <Volume2 size={16} className="text-zinc-500" />
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                                <p className="text-xs text-zinc-500 font-medium">Video Stream</p>
                                
                                {/* Stream Type Toggle */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setStreamType('youtube')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                            streamType === 'youtube' 
                                                ? "bg-red-500 text-white" 
                                                : "bg-white/5 text-zinc-400"
                                        )}
                                    >
                                        <Youtube size={14} /> YouTube
                                    </button>
                                    <button
                                        onClick={() => setStreamType('twitch')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                            streamType === 'twitch' 
                                                ? "bg-purple-500 text-white" 
                                                : "bg-white/5 text-zinc-400"
                                        )}
                                    >
                                        <Video size={14} /> Twitch
                                    </button>
                                </div>
                                
                                {/* URL Input */}
                                <input
                                    type="text"
                                    placeholder={streamType === 'youtube' ? "Video ID (e.g., jfKfPfyJRdk)" : "Channel name (e.g., lolostream)"}
                                    value={customStreamUrl}
                                    onChange={(e) => setCustomStreamUrl(e.target.value)}
                                    className="w-full bg-black/20 text-zinc-200 text-xs px-3 py-2 rounded-lg border border-white/10 focus:border-zinc-500 outline-none"
                                />
                                
                                {/* Quick Presets */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setStreamType('youtube'); setCustomStreamUrl('jfKfPfyJRdk'); }}
                                        className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-zinc-400"
                                    >
                                        Lofi Girl
                                    </button>
                                    <button
                                        onClick={() => { setStreamType('youtube'); setCustomStreamUrl('rUxyKA_-grg'); }}
                                        className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-zinc-400"
                                    >
                                        Chillhop
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setShowYouTubePlayer(!showYouTubePlayer);
                                        if (isMusicPlaying && musicRef.current) {
                                            musicRef.current.pause();
                                            setIsMusicPlaying(false);
                                        }
                                    }}
                                    className={clsx(
                                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        showYouTubePlayer 
                                            ? "bg-red-500 text-white" 
                                            : "bg-zinc-100 text-zinc-900 hover:bg-white"
                                    )}
                                >
                                    {showYouTubePlayer ? 'Close Player' : 'Open Player'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


                 {user && (
                    <div className="flex items-center gap-3 mr-4 pl-4 border-l border-white/10">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="text-sm font-medium text-zinc-400 hidden md:block">
                            {user.username}
                        </span>
                    </div>
                )}
                
                <button 
                  onClick={() => openModal(null, 'STATS')}
                  className="btn btn-circle btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100"
                  title="Statistics"
                >
                  <BarChart size={24} />
                </button>
             <button 
              onClick={() => setIsZenMode(true)}
              className="btn btn-circle btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100"
              title="Enter Zen Mode"
            >
              <Eye size={24} />
            </button>
            <button 
              onClick={() => openModal(null, 'BRAINSTORM')}
              className="btn btn-circle btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100"
              title="Brainstorm Mode"
            >
              <BrainCircuit size={28} />
            </button>
            {archivedTasks.length > 0 && (
                <button 
                  onClick={() => openModal(null, 'ARCHIVE')}
                  className="btn btn-circle btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100 relative"
                  title={`Archived Tasks (${archivedTasks.length})`}
                >
                  <Archive size={24} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full text-[10px] flex items-center justify-center text-zinc-400 border border-white/10">
                      {archivedTasks.length}
                  </span>
                </button>
            )}
        </div>
      </motion.div>
      )}
      
      {/* Zen Mode Exit Button */}
      {isZenMode && (
          <div className="fixed top-6 right-6 z-50">
              <button 
                  onClick={() => setIsZenMode(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur border border-white/5 rounded-full text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all text-sm font-medium"
              >
                  <EyeOff size={16} />
                  Exit Zen
              </button>
          </div>
      )}

      {/* Quick Links Bar */}
      {!isZenMode && (
          <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2">
                  {savedLinks.slice(0, 8).map(link => (
                      <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 whitespace-nowrap transition-colors group"
                      >
                          <Globe size={12} className="flex-shrink-0" />
                          {link.title}
                          <button
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSavedLinks(savedLinks.filter(l => l.id !== link.id));
                              }}
                              className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          >
                              <X size={12} />
                          </button>
                      </a>
                  ))}
                  {savedLinks.length === 0 && (
                      <span className="text-zinc-600 text-sm">No quick links yet</span>
                  )}
              </div>
              
              {/* Add Link Button */}
              <form 
                  onSubmit={(e) => {
                      e.preventDefault();
                      if (newLinkUrl.trim()) {
                          const url = newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
                          try {
                              const hostname = new URL(url).hostname.replace('www.', '');
                              const newLink = {
                                  id: Date.now().toString(36),
                                  title: newLinkTitle.trim() || hostname,
                                  url,
                                  createdAt: new Date().toISOString()
                              };
                              setSavedLinks([...savedLinks, newLink]);
                              setNewLinkTitle('');
                              setNewLinkUrl('');
                              toast.success('Link added!');
                          } catch {
                              toast.error('Invalid URL');
                          }
                      }
                  }}
                  className="flex items-center gap-2"
              >
                  <input
                      type="text"
                      placeholder="+ Add link..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="w-40 bg-transparent text-zinc-400 text-sm px-3 py-1.5 border border-white/10 rounded-lg focus:outline-none focus:border-zinc-500"
                  />
              </form>
              
              {/* Notes Toggle */}
              <button
                  onClick={() => setActiveTab(activeTab === 'notes' ? 'tasks' : 'notes')}
                  className={clsx(
                      "p-2 rounded-lg transition-colors",
                      activeTab === 'notes' 
                          ? "bg-amber-500/20 text-amber-400" 
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  )}
                  title="Toggle Notes Panel"
              >
                  <FileText size={20} />
              </button>
          </div>
      )}

      {/* Notes Panel (Slide in from right) */}
      <AnimatePresence>
          {activeTab === 'notes' && (
              <>
              {/* Backdrop */}
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveTab('tasks')}
                  className="fixed inset-0 bg-black/50 z-30"
              />
              <motion.div
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="fixed top-0 right-0 w-[500px] h-full bg-zinc-900 border-l border-white/10 z-40 shadow-2xl flex flex-col"
              >
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                      <h3 className="text-lg font-bold text-zinc-100">📝 Notes</h3>
                      <button 
                          onClick={() => setActiveTab('tasks')}
                          className="text-zinc-500 hover:text-zinc-100"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  {/* Page Tabs */}
                  <div className="flex items-center gap-2 p-3 border-b border-white/10 overflow-x-auto">
                      {notePages.map(page => (
                          <button
                              key={page.id}
                              onClick={() => setActiveNoteId(page.id)}
                              onDoubleClick={() => setEditingNoteId(page.id)}
                              className={clsx(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 group",
                                  activeNoteId === page.id 
                                      ? "bg-zinc-100 text-zinc-900" 
                                      : "bg-white/5 text-zinc-400 hover:text-zinc-200"
                              )}
                          >
                              {editingNoteId === page.id ? (
                                  <input
                                      type="text"
                                      defaultValue={page.title}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={(e) => {
                                          setNotePages(notePages.map(p => 
                                              p.id === page.id ? { ...p, title: e.target.value || 'Untitled' } : p
                                          ));
                                          setEditingNoteId(null);
                                      }}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                              setNotePages(notePages.map(p => 
                                                  p.id === page.id ? { ...p, title: (e.target as HTMLInputElement).value || 'Untitled' } : p
                                              ));
                                              setEditingNoteId(null);
                                          }
                                          if (e.key === 'Escape') {
                                              setEditingNoteId(null);
                                          }
                                      }}
                                      className="bg-transparent border-none outline-none w-20 text-inherit"
                                  />
                              ) : (
                                  page.title
                              )}
                              {notePages.length > 1 && editingNoteId !== page.id && (
                                  <span
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          const newPages = notePages.filter(p => p.id !== page.id);
                                          setNotePages(newPages);
                                          if (activeNoteId === page.id && newPages.length > 0) {
                                              setActiveNoteId(newPages[0].id);
                                          }
                                      }}
                                      className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                  >
                                      <X size={12} />
                                  </span>
                              )}
                          </button>
                      ))}
                      <button
                          onClick={() => {
                              const newId = Date.now().toString(36);
                              setNotePages([...notePages, { id: newId, title: `Page ${notePages.length + 1}`, content: '' }]);
                              setActiveNoteId(newId);
                          }}
                          className="px-2 py-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/10 rounded-lg text-sm"
                          title="Add new page"
                      >
                          <Plus size={16} />
                      </button>
                  </div>
                  
                  {(() => {
                      const activePage = notePages.find(p => p.id === activeNoteId) || notePages[0];
                      
  return (
                          <>
                          <textarea
                              value={activePage?.content || ''}
                              onChange={(e) => setNotePages(notePages.map(p => 
                                  p.id === activeNoteId ? { ...p, content: e.target.value } : p
                              ))}
                              placeholder="Write your notes here... (Markdown supported)"
                              className="flex-1 w-full bg-transparent text-zinc-200 p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                          />
                          <div className="p-3 border-t border-white/10 text-xs text-zinc-600 text-center">
                              Auto-saved • {activePage?.content.length || 0} characters
                          </div>
                          </>
                      );
                  })()}
              </motion.div>
              </>
          )}
      </AnimatePresence>

      <div className={clsx("grid gap-8", isZenMode ? "grid-cols-1 max-w-2xl mx-auto" : "lg:grid-cols-3")}>
        
        {/* Left Col: Timer & Stats (Unchanged) */}
        <AnimatePresence>
        {!isTimerMinimized && !isZenMode && (
            <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="lg:col-span-1 space-y-6 overflow-hidden"
            >
                <motion.div 
                    layout
                    className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/5 p-8 shadow-2xl flex flex-col items-center"
                >
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                            onClick={() => openModal(null, 'SETTINGS')}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors"
                            title="Timer Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <button 
                            onClick={toggleMinimize}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors"
                            title="Minimize Timer"
                        >
                            <Minimize2 size={20} />
                        </button>
                    </div>

                    <div className="flex justify-center gap-2 mb-8 relative z-10 p-1 bg-black/20 rounded-full">
                    {['work', 'break', 'longBreak'].map((m) => (
                        <button
                        key={m}
                        onClick={() => switchMode(m as any)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                            mode === m 
                            ? "bg-zinc-100 text-zinc-900 shadow-lg" 
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                        >
                        {m === 'longBreak' ? 'Long Break' : m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                    </div>

                    <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" className="stroke-zinc-800 fill-none" strokeWidth="8" />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                className="stroke-zinc-100 fill-none"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={strokeDasharray}
                                initial={{ strokeDashoffset: 0 }}
                                animate={{ strokeDashoffset: strokeDasharray * (1 - progress) }}
                                transition={{ duration: 1, ease: "linear" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-6xl font-bold tracking-tighter text-zinc-100 tabular-nums">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm font-mono text-zinc-500 mt-2">
                                Session {sessionsCompleted % pomoSettings.interval + 1}/{pomoSettings.interval}
                            </div>
                        </div>
                    </div>

                    {/* Current Task Display */}
                    {currentTaskId && (
                        <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                            <div className="text-xs text-amber-500/70 uppercase font-bold mb-1">Focusing On</div>
                            <div className="text-sm text-zinc-200 font-medium truncate">
                                {tasks.find(t => t.id === currentTaskId)?.text || 'Unknown Task'}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 relative z-10 w-full">
                        <button 
                            onClick={toggleTimer}
                            className="btn btn-circle btn-lg bg-zinc-100 hover:bg-white text-zinc-950 border-none hover:scale-105 transition-all shadow-xl shadow-white/10"
                        >
                            {isRunning ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                        </button>
                        <button 
                            onClick={resetTimer}
                            className="btn btn-circle btn-lg btn-ghost hover:bg-white/10 text-zinc-500 hover:text-zinc-100"
                        >
                            <RotateCcw size={24} />
                        </button>
                    </div>


                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Right Col: Tasks */}
        <motion.div 
            layout
            className={clsx(
                "transition-all duration-500",
                isZenMode ? "col-span-1" : (isTimerMinimized ? "lg:col-span-3" : "lg:col-span-2")
            )}
        >
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl bg-zinc-900/50 border border-white/5 p-6 md:p-8 min-h-[500px] shadow-xl flex flex-col opacity-0"
           >
              {/* Search Input */}
              <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 text-zinc-200 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-zinc-500 text-sm"
                  />
                  {searchQuery && (
                      <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                          <X size={16} />
                      </button>
                  )}
              </div>

              <form onSubmit={handleAddTask} className="relative mb-8 group">
                <input
                  type="text"
                  placeholder="What's your focus today?"
                  className="w-full bg-transparent text-xl md:text-2xl font-medium text-zinc-100 placeholder:text-zinc-600 border-b-2 border-white/5 py-4 focus:outline-none focus:border-zinc-100 transition-colors pl-2"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity btn btn-circle btn-sm btn-ghost text-zinc-100">
                  <Plus size={24} />
                </button>
              </form>

              {/* Active Tasks */}
              <div className="mb-8">
                  <h2 className="text-xl font-bold text-zinc-100 mb-4 px-2">Active Tasks</h2>
                  <Reorder.Group axis="y" values={activeTasks} onReorder={handleReorder} className="space-y-3">
                      <AnimatePresence initial={false}>
                        {activeTasks.map((task) => {
                            const prog = getSubtaskProgress(task);
                            
  return (
                          <Reorder.Item 
                            key={task.id} 
                            value={task}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } }}
                            layoutTransition={{ duration: 0.2, ease: "easeInOut" }}
                            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
                            className={clsx(
                                "relative flex flex-col p-4 rounded-xl border transition-colors bg-white/5",
                                currentTaskId === task.id 
                                    ? "border-amber-500/50 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10" 
                                    : "border-transparent"
                            )}
                          >
                             {/* Progress Bar Background */}
                             {prog > 0 && (
                                <div className="absolute bottom-0 left-0 h-1 bg-green-500/20" style={{ width: `${prog * 100}%` }} />
                             )}
                             
                             <div className="flex items-center gap-4 relative z-10">
                                <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                                    <GripVertical size={18} />
                                </div>

                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className="w-6 h-6 rounded-full border-2 border-zinc-600 hover:border-zinc-100 flex items-center justify-center transition-colors flex-shrink-0"
                                >
                                </button>

                                {/* Task Text - Double-click to edit */}
                                {editingTaskId === task.id ? (
                                    <input
                                        type="text"
                                        defaultValue={task.text}
                                        autoFocus
                                        onBlur={(e) => {
                                            const newText = e.target.value.trim();
                                            if (newText && newText !== task.text) {
                                                setTasks(prev => prev.map(t => 
                                                    t.id === task.id ? { ...t, text: newText } : t
                                                ));
                                                toast.success('Task updated');
                                            }
                                            setEditingTaskId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                (e.target as HTMLInputElement).blur();
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingTaskId(null);
                                            }
                                        }}
                                        className="flex-1 text-lg font-medium text-zinc-200 bg-transparent border-b-2 border-zinc-500 focus:border-zinc-300 outline-none px-1 py-0"
                                    />
                                ) : (
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <span 
                                            onDoubleClick={() => setEditingTaskId(task.id)}
                                            className="w-full text-lg font-medium select-none truncate text-zinc-200 cursor-text hover:text-zinc-100 block"
                                            title="Double-click to edit"
                                        >
                                            {task.text}
                                        </span>
                                        {task.tags && task.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {task.tags.map(tagId => {
                                                    const tag = TASK_TAGS.find(t => t.id === tagId);
                                                    if (!tag) return null;
                                                    
  return (
                                                        <span key={tag.id} className={clsx(
                                                            "px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide border",
                                                            tag.color.replace('bg-', 'bg-').replace('500', '500/10'),
                                                            tag.color.replace('bg-', 'text-').replace('500', '400'),
                                                            tag.color.replace('bg-', 'border-').replace('500', '500/20')
                                                        )}>
                                                            {tag.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex gap-1 items-center">
                                    <button
                                        onClick={() => cyclePriority(task.id)}
                                        className={clsx("p-2 rounded-lg transition-colors", getPriorityColor(task.priority))}
                                        title={`Priority: ${task.priority || 'medium'}`}
                                    >
                                        <Flag size={18} fill={task.priority === 'high' || task.priority === 'medium' ? "currentColor" : "none"} />
                                    </button>

                                    {/* Recurrence Toggle */}
                                    <button
                                        onClick={() => cycleRecurrence(task.id)}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            task.recurrence === 'daily' && "text-blue-400 bg-blue-500/20",
                                            task.recurrence === 'weekly' && "text-purple-400 bg-purple-500/20",
                                            task.recurrence === 'monthly' && "text-green-400 bg-green-500/20",
                                            !task.recurrence && "text-zinc-500 hover:text-zinc-100 hover:bg-white/10"
                                        )}
                                        title={task.recurrence ? `Repeats ${task.recurrence}` : "Set recurrence"}
                                    >
                                        <Repeat size={18} />
                                    </button>

                                    <div className="w-px h-4 bg-white/10 mx-1" />

                                    <button 
                                        onClick={() => openModal(task.id, 'ATTACHMENT')}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            (task.attachments && task.attachments.length > 0) ? "text-zinc-100 bg-white/10" : "text-zinc-500 hover:text-zinc-100 hover:bg-white/10"
                                        )}
                                        title="Attach Link"
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => openModal(task.id, 'NOTE')}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            task.notes ? "text-zinc-100 bg-white/10" : "text-zinc-500 hover:text-zinc-100 hover:bg-white/10"
                                        )}
                                        title="Notes"
                                    >
                                        <FileText size={18} />
                                    </button>

                                    {/* Focus Button */}
                                    <button 
                                        onClick={() => setCurrentTaskId(currentTaskId === task.id ? null : task.id)}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            currentTaskId === task.id 
                                                ? "text-amber-400 bg-amber-500/20" 
                                                : "text-zinc-500 hover:text-amber-400 hover:bg-white/10"
                                        )}
                                        title={currentTaskId === task.id ? "Unfocus" : "Focus on task"}
                                    >
                                        <Target size={18} />
                                    </button>

                                    {/* Pomodoro Badge - Clickable to set estimate */}
                                    <button
                                        onClick={() => {
                                            setActiveTaskID(task.id);
                                            setModalInput(task.estimatedPomos?.toString() || '');
                                            setModalType('ESTIMATE');
                                            setModalOpen(true);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono transition-colors"
                                        title="Set pomodoro estimate"
                                    >
                                        <span className="text-red-400">🍅</span>
                                        <span className="text-zinc-400">
                                            {task.actualPomos || 0}/{task.estimatedPomos || '?'}
                                        </span>
                                    </button>

                                    {/* Due Date Button */}
                                    <button
                                        onClick={() => {
                                            setActiveTaskID(task.id);
                                            setModalInput(task.dueDate || '');
                                            setModalType('DUE_DATE');
                                            setModalOpen(true);
                                        }}
                                        className={clsx(
                                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                                            task.dueDate 
                                                ? (() => {
                                                    // Parse date in local timezone by appending time
                                                    const dueDate = new Date(task.dueDate + 'T00:00:00');
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (dueDate < today) return "bg-red-500/20 text-red-400";
                                                    if (dueDate.getTime() === today.getTime()) return "bg-amber-500/20 text-amber-400";
                                                    return "bg-white/5 text-zinc-400";
                                                })()
                                                : "bg-white/5 text-zinc-500 hover:text-zinc-300"
                                        )}
                                        title={task.dueDate ? `Due: ${new Date(task.dueDate + 'T00:00:00').toLocaleDateString()}` : "Set due date"}
                                    >
                                        <Calendar size={14} />
                                        {task.dueDate && (
                                            <span>
                                                {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => openModal(task.id, 'SUBTASK')}
                                        className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-white/10 rounded-lg"
                                        title="Add Substep"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    
                                    {/* Move to List - Only show if multiple lists */}
                                    {lists.length > 1 && (
                                        <button 
                                            onClick={() => {
                                                setActiveTaskID(task.id);
                                                setModalType('MOVE_TO_LIST');
                                                setModalOpen(true);
                                            }}
                                            className="p-2 text-zinc-500 hover:text-zinc-100 hover:bg-white/10 rounded-lg"
                                            title="Move to another list"
                                        >
                                            <Move size={18} />
                                        </button>
                                    )}
                                    
                                    {/* Tags Button */}
                                    <div className="relative group/tags">
                                        <button 
                                            className={clsx(
                                                "p-2 rounded-lg transition-colors",
                                                (task.tags && task.tags.length > 0) 
                                                    ? "text-zinc-100 bg-white/10" 
                                                    : "text-zinc-500 hover:text-zinc-100 hover:bg-white/10"
                                            )}
                                            title="Tags"
                                        >
                                            <Tag size={18} />
                                        </button>
                                        <div className="absolute bottom-full right-0 pb-2 hidden group-hover/tags:block z-50 min-w-[150px]">
                                            <div className="bg-zinc-800 border border-white/10 rounded-lg p-2 shadow-xl flex flex-col gap-1">
                                                {TASK_TAGS.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => toggleTag(task.id, tag.id)}
                                                        className={clsx(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors w-full text-left",
                                                            task.tags?.includes(tag.id) 
                                                                ? `${tag.color} text-white` 
                                                                : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <span className={clsx("w-2 h-2 rounded-full flex-shrink-0", tag.color)} />
                                                        {tag.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => deleteTask(task.id)}
                                        className="p-2 text-red-900/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                             </div>

                             {/* Notes Preview */}
                             {task.notes && (
                                 <div className="pl-12 mt-2 text-sm text-zinc-400 font-serif prose prose-invert prose-sm max-w-none relative z-10">
                                     <ReactMarkdown>
                                        {task.notes}
                                     </ReactMarkdown>
                                 </div>
                             )}

                             {/* Subtasks */}
                             <div className="pl-12 space-y-2 mt-2 relative z-10">
                                 <AnimatePresence>
                                    {(task.subtasks || []).map(sub => (
                                        <motion.div
                                            key={sub.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <CornerDownRight size={14} className="text-zinc-700" />
                                            <button 
                                                onClick={() => toggleSubTask(task.id, sub.id)}
                                                className={clsx(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                    sub.completed ? "bg-zinc-600 border-zinc-600" : "border-zinc-700 hover:border-zinc-500"
                                                )}
                                            >
                                                {sub.completed && <Check size={10} className="text-black" />}
                                            </button>
                                            <span className={clsx("flex-1 text-zinc-400 transition-colors", sub.completed && "line-through text-zinc-700")}>
                                                {sub.text}
                                            </span>
                                            <button onClick={() => deleteSubTask(task.id, sub.id)} className="text-zinc-800 hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                 </AnimatePresence>

                                 {/* Quick Add Subtask */}
                                 <div className="flex items-center gap-3 text-sm group/addsub opacity-50 hover:opacity-100 transition-opacity">
                                     <CornerDownRight size={14} className="text-zinc-700" />
                                     <Plus size={14} className="text-zinc-600" />
                                     <input
                                         type="text"
                                         placeholder="Add subtask..."
                                         className="flex-1 bg-transparent text-zinc-400 placeholder:text-zinc-700 outline-none text-sm"
                                         onKeyDown={(e) => {
                                             if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                                 const text = (e.target as HTMLInputElement).value.trim();
                                                 const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                                                 setTasks(prev => prev.map(t => {
                                                     if (t.id === task.id) {
                                                         return {
                                                             ...t,
                                                             subtasks: [...t.subtasks, { id: subId, text, completed: false }]
                                                         };
                                                     }
                                                     return t;
                                                 }));
                                                 (e.target as HTMLInputElement).value = '';
                                             }
                                         }}
                                     />
                                 </div>
                             </div>

                             {/* Attachments */}
                             {task.attachments && task.attachments.length > 0 && (
                                 <div className="group/list pl-12 mt-3 flex flex-wrap gap-2 relative z-10">
                                     {task.attachments.map(att => (
                                         <div key={att.id} className="group flex items-center gap-2 bg-zinc-800/50 border border-white/5 rounded-full px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">
                                             <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                                                 {getIconForUrl(att.url)}
                                                 <span className="max-w-[150px] truncate">{att.name}</span>
                                             </a>
                                             <button 
                                                 onClick={() => deleteAttachment(task.id, att.id)}
                                                 className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                                             >
                                                 <X size={12} />
                                             </button>
                                         </div>
                                     ))}
                                     <button
                                         onClick={() => openModal(task.id, 'ATTACHMENT')}
                                         className="opacity-0 group-hover/list:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 border border-white/10 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700"
                                         title="Add another link"
                                     >
                                         <Plus size={12} />
                                     </button>
                                 </div>
                             )}
                             
                             {task.subtasks && task.subtasks.length > 0 && (
                                <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-600 opacity-50 relative z-10">
                                    {Math.round(prog * 100)}%
                                </div>
                             )}
                          </Reorder.Item>
                        );
                      })}
                      </AnimatePresence>
                  </Reorder.Group>
              </div>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                  <div className="opacity-60 hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Completed ({completedTasks.length})</h2>
                      </div>
                      
                      <div className="space-y-3">
                          {completedTasks.map((task) => (
                              <motion.div 
                                key={task.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative flex items-center gap-4 p-4 rounded-xl border border-transparent bg-black/20"
                              >
                                  <div className="w-[18px]" />
                                  <button 
                                      onClick={() => toggleTask(task.id)}
                                      className="w-6 h-6 rounded-full border-2 bg-zinc-500 border-zinc-500 flex items-center justify-center transition-colors flex-shrink-0"
                                  >
                                      <Check size={14} className="text-zinc-950" />
                                  </button>
                                  <span className="flex-1 text-lg font-medium select-none truncate line-through text-zinc-600">
                                      {task.text}
                                  </span>
                                  {/* Archive Button */}
                                  <button 
                                      onClick={() => archiveTask(task.id)}
                                      className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors"
                                      title="Archive"
                                  >
                                      <Archive size={18} />
                                  </button>
                                  <button 
                                      onClick={() => deleteTask(task.id)}
                                      className="p-2 text-zinc-800 hover:text-red-400 transition-colors"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              )}

           </motion.div>
        </motion.div>
      </div>

      {/* Global Modal */}
      <AnimatePresence>
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setModalOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={clsx(
                            "relative w-full bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col",
                            modalType === 'NOTE' ? "max-w-3xl h-[80vh]" : "max-w-lg"
                        )}
                    >
                        <div className={clsx("p-6 overflow-y-auto", modalType === 'NOTE' ? "flex-1 flex flex-col" : "")}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    {modalType === 'BRAINSTORM' && <Sparkles size={20} className="text-zinc-100" />}
                                    {modalType === 'SETTINGS' && <Settings size={20} className="text-zinc-100" />}
                                    {modalType === 'ARCHIVE' && <Archive size={20} className="text-zinc-100" />}
                                    {modalType === 'ATTACHMENT' && <Paperclip size={20} className="text-zinc-100" />}
                                    {modalType === 'SHORTCUTS' && <Keyboard size={20} className="text-zinc-100" />}
                                    {modalType === 'STATS' && <BarChart size={20} className="text-zinc-100" />}
                                    {modalType === 'NEW_LIST' && <FolderPlus size={20} className="text-zinc-100" />}
                                    {modalType === 'DUE_DATE' && <Calendar size={20} className="text-zinc-100" />}
                                    {modalType === 'ESTIMATE' && <Target size={20} className="text-zinc-100" />}
                                    {modalType === 'MOVE_TO_LIST' && <Move size={20} className="text-zinc-100" />}
                                    <h3 className="text-xl font-bold text-zinc-100">
                                        {modalType === 'SUBTASK' && 'Add Subtask'}
                                        {modalType === 'NOTE' && 'Edit Notes'}
                                        {modalType === 'BRAINSTORM' && 'Brainstorm Tasks'}
                                        {modalType === 'SETTINGS' && 'Timer Settings'}
                                        {modalType === 'ARCHIVE' && 'Archived Tasks'}
                                        {modalType === 'ATTACHMENT' && 'Add Link Attachment'}
                                        {modalType === 'SHORTCUTS' && 'Keyboard Shortcuts'}
                                        {modalType === 'STATS' && 'Productivity Stats'}
                                        {modalType === 'NEW_LIST' && 'Create New List'}
                                        {modalType === 'DUE_DATE' && 'Set Due Date'}
                                        {modalType === 'ESTIMATE' && 'Set Pomodoro Estimate'}
                                        {modalType === 'MOVE_TO_LIST' && 'Move to List'}
                                    </h3>
                                </div>
                                <button type="button" onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content Switch */}
                            {modalType === 'ARCHIVE' && (
                                <div className="space-y-4">
                                    {archivedTasks.length === 0 ? (
                                        <div className="text-center text-zinc-500 py-8">
                                            No archived tasks found.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {archivedTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="flex-1 text-zinc-400 line-through text-sm">{task.text}</span>
                                                    <button 
                                                        onClick={() => unarchiveTask(task.id)}
                                                        className="p-2 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-100"
                                                        title="Restore"
                                                    >
                                                        <RotateCw size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteTask(task.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded text-red-900 hover:text-red-400"
                                                        title="Delete Forever"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalType === 'SUBTASK' && (
                                <form onSubmit={handleModalSubmit}>
                                    <input
                                        ref={modalInputRef as any}
                                        type="text"
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-zinc-500 transition-colors"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Add Task</button>
                                    </div>
                                </form>
                            )}
                            
                            {modalType === 'ATTACHMENT' && (
                                <form onSubmit={handleModalSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-zinc-500 uppercase">Link URL</label>
                                        <input
                                            ref={modalInputRef as any}
                                            type="url"
                                            value={modalInput}
                                            onChange={(e) => setModalInput(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-zinc-500 transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-zinc-500 uppercase">Display Name (Optional)</label>
                                        <input
                                            type="text"
                                            value={attachmentName}
                                            onChange={(e) => setAttachmentName(e.target.value)}
                                            placeholder="Project Spec, Figma Board, etc."
                                            className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-zinc-500 transition-colors"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Add Link</button>
                                    </div>
                                </form>
                            )}

                             {(modalType === 'NOTE' || modalType === 'BRAINSTORM') && (
                                <form onSubmit={handleModalSubmit} className={clsx("flex flex-col gap-4", modalType === 'NOTE' ? "flex-1 h-full" : "")}>
                                    <textarea
                                        ref={modalInputRef as any}
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        placeholder={modalType === 'BRAINSTORM' ? "Dump your thoughts here...\nOne idea per line." : "Add details, links, or thoughts... (Markdown supported)"}
                                        className={clsx(
                                            "w-full bg-black/20 text-base text-zinc-200 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-zinc-500 transition-colors resize-none leading-relaxed",
                                            modalType === 'NOTE' ? "h-full flex-1" : "h-40"
                                        )}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">{modalType === 'BRAINSTORM' ? 'Generate' : 'Save Notes'}</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'SYNC' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSyncSetup(modalInput);
                                }} className="flex flex-col gap-4">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
                                            <Lock size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-100">Setup Secure Sync</h3>
                                        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                                            Enter a <span className="text-zinc-200 font-medium">Sync Password</span> to encrypt your data. 
                                            This password never leaves your device. Existing data will be downloaded, or we'll upload your current tasks.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Sync Password</label>
                                        <input
                                            type="password"
                                            value={modalInput}
                                            onChange={(e) => setModalInput(e.target.value)}
                                            placeholder="Enter your secret password..."
                                            className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 mt-2 focus:outline-none focus:border-violet-500 transition-colors"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button 
                                            type="submit" 
                                            disabled={!modalInput || isSyncing}
                                            className="btn bg-violet-600 hover:bg-violet-500 text-white border-none px-6 disabled:opacity-50"
                                        >
                                            {isSyncing ? (
                                                <span className="loading loading-spinner loading-sm"></span>
                                            ) : (
                                                'Enable Sync'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                            
                            {modalType === 'SETTINGS' && (
                                <form onSubmit={handleModalSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase">Work (min)</label>
                                            <input 
                                                type="number" 
                                                value={settingsForm.work}
                                                onChange={(e) => setSettingsForm({...settingsForm, work: Number(e.target.value)})}
                                                className="w-full bg-black/20 text-zinc-100 border border-white/10 rounded-xl p-3 mt-1 focus:border-zinc-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase">Short Break</label>
                                            <input 
                                                type="number" 
                                                value={settingsForm.shortBreak}
                                                onChange={(e) => setSettingsForm({...settingsForm, shortBreak: Number(e.target.value)})}
                                                className="w-full bg-black/20 text-zinc-100 border border-white/10 rounded-xl p-3 mt-1 focus:border-zinc-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase">Long Break</label>
                                            <input 
                                                type="number" 
                                                value={settingsForm.longBreak}
                                                onChange={(e) => setSettingsForm({...settingsForm, longBreak: Number(e.target.value)})}
                                                className="w-full bg-black/20 text-zinc-100 border border-white/10 rounded-xl p-3 mt-1 focus:border-zinc-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-zinc-500 uppercase">Interval</label>
                                            <input 
                                                type="number" 
                                                value={settingsForm.interval}
                                                onChange={(e) => setSettingsForm({...settingsForm, interval: Number(e.target.value)})}
                                                className="w-full bg-black/20 text-zinc-100 border border-white/10 rounded-xl p-3 mt-1 focus:border-zinc-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-2">
                                        Long break triggers after every {settingsForm.interval} work sessions.
                                    </div>

                                    {/* Sound Selection */}
                                    <div className="pt-4 border-t border-white/5">
                                        <label className="text-sm font-bold text-zinc-500 uppercase block mb-2">Alarm Sound</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((soundKey) => (
                                                <button
                                                    key={soundKey}
                                                    type="button"
                                                    onClick={() => {
                                                        const audio = new Audio(SOUNDS[soundKey]);
                                                        audio.play().catch(() => {});
                                                        setSettingsForm({ ...settingsForm, sound: soundKey });
                                                    }}
                                                    className={clsx(
                                                        "p-3 rounded-xl border text-sm font-medium capitalize transition-all",
                                                        settingsForm.sound === soundKey 
                                                            ? "bg-zinc-100 text-zinc-900 border-zinc-100" 
                                                            : "bg-black/20 text-zinc-400 border-white/10 hover:bg-white/5 hover:text-zinc-200"
                                                    )}
                                                >
                                                    {soundKey}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Sync & Data */}
                                    <div className="pt-4 border-t border-white/5">
                                        <label className="text-sm font-bold text-zinc-500 uppercase block mb-2">Data & Sync</label>
                                        <div className="flex flex-col gap-3">
                                            {!syncKey ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setModalType('SYNC');
                                                        setModalInput(''); // Clear input for password
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Cloud size={18} />
                                                    Enable Secure Sync
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                                                    <div className="flex items-center gap-2">
                                                        <Check size={16} />
                                                        <span className="text-sm font-medium">Sync Active</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {lastSyncTime && (
                                                            <span className="text-xs opacity-70">
                                                                {lastSyncTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        )}
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                // Trigger a full re-sync (download)
                                                                setModalType('SYNC'); // Re-enter password or just re-run setup if we stored password? 
                                                                // Ideally we should just verify, but we can't get password back easily.
                                                                // Let's just prompt to re-enter for manual pull, OR better, check if we can pull with existing key.
                                                                // Actually we have valid key in syncKey.
                                                                // We can just pull.
                                                                setIsSyncing(true);
                                                                fetch('/api/sync').then(r => r.json()).then(async (serverData) => {
                                                                    if (serverData.encryptedData && syncKey) {
                                                                        try {
                                                                            const decrypted = await decryptData(serverData.encryptedData, serverData.iv, syncKey);
                                                                            if (decrypted) {
                                                                                setTasks(decrypted.tasks || []);
                                                                                setLists(decrypted.lists || []);
                                                                                if (decrypted.activeListId) setActiveListId(decrypted.activeListId);
                                                                                setSavedLinks(decrypted.savedLinks || []);
                                                                                setNotePages(decrypted.notePages || []);
                                                                                // ... settings ...
                                                                                setLastSyncTime(new Date());
                                                                                toast.success('Pulled latest data');
                                                                            }
                                                                        } catch(e) { toast.error('Decryption failed'); }
                                                                    }
                                                                    setIsSyncing(false);
                                                                });
                                                            }}
                                                            title="Pull latest from server"
                                                            className="p-1 hover:bg-green-500/20 rounded-full transition-colors"
                                                        >
                                                            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={exportData}
                                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-black/20 border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                                                >
                                                    <Download size={16} />
                                                    Export
                                                </button>
                                                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl bg-black/20 border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
                                                    <Upload size={16} />
                                                    Import
                                                    <input 
                                                        type="file" 
                                                        accept=".json" 
                                                        onChange={importData}
                                                        className="hidden" 
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Save Settings</button>
                                    </div>
                                </form>
                            )}

                             {modalType === 'SHORTCUTS' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                            <kbd className="kbd kbd-lg bg-zinc-800 text-zinc-100 border-white/10 mb-2">Space</kbd>
                                            <span className="text-sm text-zinc-400">Toggle Timer</span>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                            <kbd className="kbd kbd-lg bg-zinc-800 text-zinc-100 border-white/10 mb-2">N</kbd>
                                            <span className="text-sm text-zinc-400">New Task</span>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                            <kbd className="kbd kbd-lg bg-zinc-800 text-zinc-100 border-white/10 mb-2">Esc</kbd>
                                            <span className="text-sm text-zinc-400">Close / Exit Zen</span>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                                            <kbd className="kbd kbd-lg bg-zinc-800 text-zinc-100 border-white/10 mb-2">?</kbd>
                                            <span className="text-sm text-zinc-400">Shortcuts</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {modalType === 'STATS' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xs text-zinc-500 uppercase font-bold truncate">Focus Today</div>
                                            <div className="text-2xl md:text-3xl font-extrabold text-zinc-100">
                                                {focusHistory.find(h => h.date === new Date().toISOString().split('T')[0])?.minutes || 0}
                                                <span className="text-sm text-zinc-500 font-normal ml-1">min</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xs text-zinc-500 uppercase font-bold truncate">Tasks Finished</div>
                                            <div className="text-2xl md:text-3xl font-extrabold text-zinc-100">
                                                 {focusHistory.find(h => h.date === new Date().toISOString().split('T')[0])?.tasksCompleted || 0}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="text-xs text-zinc-500 uppercase font-bold truncate">Total Sessions</div>
                                            <div className="text-2xl md:text-3xl font-extrabold text-zinc-100">{sessionsCompleted}</div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <h4 className="text-lg font-bold text-zinc-200 mb-6">Last 7 Days</h4>
                                        <div className="flex items-end justify-between h-48 gap-2">
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (6 - i));
                                                const dateStr = d.toISOString().split('T')[0];
                                                const entry = focusHistory.find(h => h.date === dateStr);
                                                const minutes = entry ? entry.minutes : 0;
                                                const maxMin = Math.max(...focusHistory.map(h => h.minutes), 60); // Scale based on max or at least 60m
                                                const height = Math.max((minutes / maxMin) * 100, 4); // Min 4% height

                                                
  return (
                                                    <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                                                        <div className="relative w-full flex items-end justify-center">
                                                            <div 
                                                                className="w-full bg-zinc-700/50 hover:bg-zinc-100 transition-all rounded-md"
                                                                style={{ height: `${height}%` }}
                                                            />
                                                            <div className="absolute -top-8 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                                {minutes} min
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-zinc-500 mt-3 font-mono">
                                                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Heatmap Calendar */}
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-bold text-zinc-200">Activity Heatmap</h4>
                                            {currentStreak > 0 && (
                                                <div className="flex items-center gap-1.5 text-orange-400 text-sm font-bold">
                                                    <Flame size={14} className="fill-orange-400" />
                                                    <span>{currentStreak} day streak</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-12 gap-1">
                                            {Array.from({ length: 84 }).map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (83 - i));
                                                const dateStr = d.toISOString().split('T')[0];
                                                const entry = focusHistory.find(h => h.date === dateStr);
                                                const minutes = entry ? entry.minutes : 0;
                                                const tasks = entry?.tasksCompleted || 0;
                                                
                                                // Color intensity based on activity
                                                let bgColor = "bg-zinc-800/50";
                                                if (minutes > 0 || tasks > 0) {
                                                    const intensity = Math.min(minutes / 60, 1); // Cap at 1 hour for max intensity
                                                    if (intensity > 0.7) bgColor = "bg-green-500";
                                                    else if (intensity > 0.4) bgColor = "bg-green-600";
                                                    else if (intensity > 0.1) bgColor = "bg-green-700";
                                                    else bgColor = "bg-green-900";
                                                }
                                                
                                                
  return (
                                                    <div
                                                        key={i}
                                                        className={`aspect-square rounded-sm ${bgColor} hover:ring-2 hover:ring-zinc-500 transition-all cursor-default group relative`}
                                                        title={`${d.toLocaleDateString()}: ${minutes}min, ${tasks} tasks`}
                                                    >
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {minutes}m, {tasks} tasks
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-3 text-xs text-zinc-500">
                                            <span>Less</span>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-3 rounded-sm bg-zinc-800/50" />
                                                <div className="w-3 h-3 rounded-sm bg-green-900" />
                                                <div className="w-3 h-3 rounded-sm bg-green-700" />
                                                <div className="w-3 h-3 rounded-sm bg-green-600" />
                                                <div className="w-3 h-3 rounded-sm bg-green-500" />
                                            </div>
                                            <span>More</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {modalType === 'NEW_LIST' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (modalInput.trim()) {
                                        const newId = Date.now().toString(36);
                                        setLists([...lists, { id: newId, name: modalInput.trim() }]);
                                        setActiveListId(newId);
                                        setModalOpen(false);
                                        toast.success(`Created "${modalInput.trim()}"`);
                                    }
                                }}>
                                    <input
                                        type="text"
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        placeholder="e.g., Work, Personal, Side Project..."
                                        className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-zinc-500 transition-colors"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Create List</button>
                                    </div>
                                </form>
                            )}

                             {modalType === 'DUE_DATE' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (activeTaskID) {
                                        setTasks(prev => prev.map(t => 
                                            t.id === activeTaskID 
                                                ? { ...t, dueDate: modalInput || undefined }
                                                : t
                                        ));
                                        setModalOpen(false);
                                        toast.success(modalInput ? 'Due date set!' : 'Due date cleared');
                                    }
                                }}>
                                    <input
                                        type="date"
                                        value={modalInput}
                                        onChange={(e) => setModalInput(e.target.value)}
                                        className="w-full bg-black/20 text-lg text-zinc-100 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-zinc-500 transition-colors"
                                        autoFocus
                                    />
                                    <div className="flex justify-between gap-3 mt-6">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setModalInput('');
                                                if (activeTaskID) {
                                                    setTasks(prev => prev.map(t => 
                                                        t.id === activeTaskID ? { ...t, dueDate: undefined } : t
                                                    ));
                                                }
                                                setModalOpen(false);
                                                toast.info('Due date cleared');
                                            }} 
                                            className="btn btn-ghost hover:bg-red-500/20 text-red-400"
                                        >
                                            Clear Date
                                        </button>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                            <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Save</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                             {modalType === 'ESTIMATE' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (activeTaskID) {
                                        const estimate = parseInt(modalInput) || 0;
                                        setTasks(prev => prev.map(t => 
                                            t.id === activeTaskID 
                                                ? { ...t, estimatedPomos: estimate > 0 ? estimate : undefined }
                                                : t
                                        ));
                                        setModalOpen(false);
                                        toast.success(estimate > 0 ? `Estimated ${estimate} pomodoros` : 'Estimate cleared');
                                    }
                                }}>
                                    <div className="text-center mb-4">
                                        <p className="text-sm text-zinc-500">How many pomodoros do you think this task will take?</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setModalInput(String(Math.max(0, (parseInt(modalInput) || 0) - 1)))}
                                            className="btn btn-circle btn-lg btn-ghost text-zinc-400 hover:text-zinc-100"
                                        >
                                            -
                                        </button>
                                        <div className="text-6xl font-bold text-zinc-100 w-24 text-center">
                                            {modalInput || '0'}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setModalInput(String((parseInt(modalInput) || 0) + 1))}
                                            className="btn btn-circle btn-lg btn-ghost text-zinc-400 hover:text-zinc-100"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="text-center mt-2 text-sm text-zinc-500">
                                        🍅 = {pomoSettings.work} minutes
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost hover:bg-white/5 text-zinc-400">Cancel</button>
                                        <button type="submit" className="btn bg-zinc-100 hover:bg-white text-zinc-900 border-none px-6">Save</button>
                                    </div>
                                </form>
                            )}

                             {modalType === 'MOVE_TO_LIST' && (
                                <div className="space-y-2">
                                    <p className="text-sm text-zinc-500 mb-4">Select a list to move this task to:</p>
                                    {lists
                                        .filter(l => l.id !== activeListId) // Don't show current list
                                        .map(list => (
                                            <button
                                                key={list.id}
                                                onClick={() => {
                                                    if (activeTaskID) {
                                                        setTasks(prev => prev.map(t => 
                                                            t.id === activeTaskID 
                                                                ? { ...t, listId: list.id }
                                                                : t
                                                        ));
                                                        setModalOpen(false);
                                                        toast.success(`Moved to "${list.name}"`);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-zinc-200 font-medium flex items-center gap-3"
                                            >
                                                <FolderPlus size={18} className="text-zinc-500" />
                                                {list.name}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
      </AnimatePresence>

      {/* Floating Video Player */}
      <AnimatePresence>
          {showYouTubePlayer && (
              <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="fixed bottom-8 right-8 z-50 bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
              >
                  <div className="flex items-center justify-between px-4 py-2 bg-black/30">
                      <span className="text-sm font-bold text-zinc-300">
                          {streamType === 'youtube' ? '🎵 YouTube' : '🎮 Twitch'}
                      </span>
                      <button 
                          onClick={() => setShowYouTubePlayer(false)}
                          className="text-zinc-500 hover:text-white"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  {streamType === 'youtube' ? (
                      <iframe
                          width="320"
                          height="180"
                          src={`https://www.youtube.com/embed/${customStreamUrl || 'jfKfPfyJRdk'}?autoplay=1`}
                          title="YouTube Player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="border-0"
                      />
                  ) : (
                      <div className="flex flex-col">
                          <iframe
                              src={`https://player.twitch.tv/?channel=${customStreamUrl || 'lofiradio'}&parent=localhost&parent=mkhawam.com&parent=www.mkhawam.com`}
                              width="320"
                              height="180"
                              allowFullScreen
                              className="border-0"
                          />
                          <a
                              href={`https://www.twitch.tv/${customStreamUrl || 'lofiradio'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-center text-purple-400 hover:text-purple-300 py-2 bg-black/30"
                          >
                              Open in new tab if embed fails →
                          </a>
                      </div>
                  )}
              </motion.div>
          )}
      </AnimatePresence>

      {/* Hidden Audio Elements */}
      <audio 
        ref={musicRef} 
        src={RADIO_STATIONS[currentStation]?.url || RADIO_STATIONS[0].url}
        loop
      />
    </div>
  );

}
