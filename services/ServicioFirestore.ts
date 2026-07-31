import { initializeApp } from "firebase/app";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    updateDoc,
} from "firebase/firestore";
import { FuelLog, MaintenanceLog } from "../types/Tipos";

// Reemplaza con las credenciales de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBucFF6UZR1VvHtGpwGvKfl4g_rZvkfLxs",
  authDomain: "mimemelozkycar.firebaseapp.com",
  projectId: "mimemelozkycar",
  storageBucket: "mimemelozkycar.firebasestorage.app",
  messagingSenderId: "803721311133",
  appId: "1:803721311133:web:e076733422344c2f9b7574",
  measurementId: "G-1Y7GZ3J23J",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- CRUD COMBUSTIBLE ---
export const addFuelLog = async (log: FuelLog) =>
  addDoc(collection(db, "fuelLogs"), log);
export const updateFuelLog = async (id: string, log: Partial<FuelLog>) =>
  updateDoc(doc(db, "fuelLogs", id), log);
export const deleteFuelLog = async (id: string) =>
  deleteDoc(doc(db, "fuelLogs", id));
export const getFuelLogs = async (): Promise<FuelLog[]> => {
  const snapshot = await getDocs(collection(db, "fuelLogs"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FuelLog);
};

// --- CRUD MANTENIMIENTO ---
export const addMaintenanceLog = async (log: MaintenanceLog) =>
  addDoc(collection(db, "maintenanceLogs"), log);
export const updateMaintenanceLog = async (
  id: string,
  log: Partial<MaintenanceLog>,
) => updateDoc(doc(db, "maintenanceLogs", id), log);
export const deleteMaintenanceLog = async (id: string) =>
  deleteDoc(doc(db, "maintenanceLogs", id));
export const getMaintenanceLogs = async (): Promise<MaintenanceLog[]> => {
  const snapshot = await getDocs(collection(db, "maintenanceLogs"));
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as MaintenanceLog,
  );
};
