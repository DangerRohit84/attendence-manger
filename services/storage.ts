import { User, AttendanceRecord } from '../types';
import { STORAGE_KEYS } from '../constants';

export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  // Check if user exists (update scenario)
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const bulkCreateUsers = (newUsers: User[]): void => {
  const users = getUsers();
  // Filter out duplicates based on ID
  const existingIds = new Set(users.map(u => u.id));
  const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
  
  const updatedList = [...users, ...uniqueNewUsers];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
};

export const deleteUser = (id: string): void => {
  const users = getUsers();
  const updatedUsers = users.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
};

export const getAttendance = (): AttendanceRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return data ? JSON.parse(data) : [];
};

export const logAttendance = (record: AttendanceRecord): void => {
  const records = getAttendance();
  records.unshift(record); // Add to top
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
};

export const getUserById = (id: string): User | undefined => {
  const users = getUsers();
  return users.find(u => u.id === id);
};