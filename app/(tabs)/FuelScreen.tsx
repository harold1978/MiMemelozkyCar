import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addFuelLog,
  deleteFuelLog,
  getFuelLogs,
  updateFuelLog,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { FuelLog } from "../../types/Tipos";

export default function FuelScreen() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);

  // Campos del Formulario
  const [vehicleId, setVehicleId] = useState<string>("CRV-2006"); // Identificador por defecto
  const [date, setDate] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [liters, setLiters] = useState<string>("");
  const [totalCost, setTotalCost] = useState<string>("");

  useEffect(() => {
    loadFuelLogs();
  }, []);

  const loadFuelLogs = async () => {
    setLoading(true);
    try {
      const data = await getFuelLogs();
      // Ordenar del más reciente al más antiguo
      data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setLogs(data);
    } catch (error) {
      console.error("Error al cargar registros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (log?: FuelLog) => {
    if (log) {
      setSelectedLog(log);
      setVehicleId(log.vehicleId);
      setDate(log.date);
      setMileage(log.mileage.toString());
      setLiters(log.liters.toString());
      setTotalCost(log.totalCost.toString());
    } else {
      setSelectedLog(null);
      setVehicleId("CRV-2006");
      setDate(new Date().toISOString().split("T")[0]); // Formato YYYY-MM-DD
      setMileage("");
      setLiters("");
      setTotalCost("");
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!mileage || !liters || !totalCost || !date) {
      const msg = "Por favor complete todos los campos obligatorios.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Atención", msg);
      return;
    }

    const payload: FuelLog = {
      vehicleId,
      date,
      mileage: parseFloat(mileage),
      liters: parseFloat(liters),
      totalCost: parseFloat(totalCost),
    };

    try {
      if (selectedLog?.id) {
        await updateFuelLog(selectedLog.id, payload);
      } else {
        await addFuelLog(payload);
      }
      setModalVisible(false);
      loadFuelLogs();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleDelete = (id?: string) => {
    if (!id) return;

    const performDelete = async () => {
      try {
        await deleteFuelLog(id);
        loadFuelLogs();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("¿Está seguro de que desea eliminar este registro?")) {
        performDelete();
      }
    } else {
      Alert.alert("Confirmar", "¿Desea eliminar este registro?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  return (
    <View style={globalStyles.container}>
      {/* Botón Nuevo Registro */}
      <TouchableOpacity
        style={[globalStyles.button, { marginBottom: 16 }]}
        onPress={() => handleOpenModal()}
      >
        <Text style={globalStyles.buttonText}>+ Registrar Recarga</Text>
      </TouchableOpacity>

      {/* Lista de Registros */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={globalStyles.card}>
              <View style={globalStyles.row}>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {item.vehicleId}
                </Text>
                <Text style={globalStyles.subtitle}>{item.date}</Text>
              </View>

              <View style={[globalStyles.row, { marginVertical: 8 }]}>
                <Text style={globalStyles.subtitle}>
                  KM: {item.mileage.toLocaleString()}
                </Text>
                <Text style={globalStyles.subtitle}>Litros: {item.liters}</Text>
                <Text style={{ fontWeight: "bold", color: colors.accent }}>
                  ₡{item.totalCost.toLocaleString()}
                </Text>
              </View>

              {/* Botones Modificar y Eliminar */}
              <View style={[globalStyles.row, { marginTop: 8 }]}>
                <TouchableOpacity
                  style={[
                    globalStyles.button,
                    { flex: 0.48, backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleOpenModal(item)}
                >
                  <Text style={globalStyles.buttonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    globalStyles.button,
                    globalStyles.buttonDanger,
                    { flex: 0.48 },
                  ]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={globalStyles.buttonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal Formulario (Crear / Editar) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
        >
          <View style={[globalStyles.card, { padding: 20 }]}>
            <Text style={globalStyles.title}>
              {selectedLog ? "Editar Registro" : "Nuevo Registro"}
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Identificador Vehículo (ej. CRV-2006)"
              value={vehicleId}
              onChangeText={setVehicleId}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Fecha (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Kilometraje actual"
              keyboardType="numeric"
              value={mileage}
              onChangeText={setMileage}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Litros recargados"
              keyboardType="numeric"
              value={liters}
              onChangeText={setLiters}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Costo total (₡)"
              keyboardType="numeric"
              value={totalCost}
              onChangeText={setTotalCost}
            />

            <View style={[globalStyles.row, { marginTop: 12 }]}>
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  { flex: 0.48, backgroundColor: colors.subtext },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={globalStyles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[globalStyles.button, { flex: 0.48 }]}
                onPress={handleSave}
              >
                <Text style={globalStyles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
