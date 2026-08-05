import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { FuelLog, MaintenanceLog, Vehicle } from "../types/Tipos";

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

// Obtiene el último registro de combustible de un vehículo específico
export const getLastFuelLog = async (
  vehicleId: string,
): Promise<FuelLog | null> => {
  console.log("holaaaaa:", vehicleId);
  try {
    const q = query(
      collection(db, "fuelLogs"),
      where("vehicleId", "==", vehicleId),
      orderBy("date", "desc"),
      limit(1),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      console.log(snapshot);
      return { id: doc.id, ...doc.data() } as FuelLog;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener último kilometraje:", error);
    return null;
  }
};

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

// --- CRUD VEHÍCULOS ---
export const addVehicle = async (vehicle: Vehicle) =>
  addDoc(collection(db, "vehicles"), vehicle);
export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>) =>
  updateDoc(doc(db, "vehicles", id), vehicle);
export const deleteVehicle = async (id: string) =>
  deleteDoc(doc(db, "vehicles", id));
export const getVehicles = async (): Promise<Vehicle[]> => {
  const snapshot = await getDocs(collection(db, "vehicles"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Vehicle);
};
