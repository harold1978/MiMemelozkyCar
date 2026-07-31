import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceLogs,
  updateMaintenanceLog,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { MaintenanceLog } from "../../types/Tipos";

export default function MaintenanceScreen() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  // Campos del Formulario
  const [vehicleId, setVehicleId] = useState<string>("CRV-2006");
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [mileage, setMileage] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [nextDueMileage, setNextDueMileage] = useState<string>(""); // Nuevo campo por kilometraje
  const [status, setStatus] = useState<"Pending" | "Completed">("Pending");

  useEffect(() => {
    loadMaintenanceLogs();
  }, []);

  const loadMaintenanceLogs = async () => {
    setLoading(true);
    try {
      const data = await getMaintenanceLogs();
      data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setLogs(data);
    } catch (error) {
      console.error("Error al cargar mantenimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (log?: MaintenanceLog) => {
    if (log) {
      setSelectedLog(log);
      setVehicleId(log.vehicleId);
      setTitle(log.title);
      setDate(log.date);
      setMileage(log.mileage.toString());
      setCost(log.cost.toString());
      setNextDueMileage(
        log.nextDueMileage ? log.nextDueMileage.toString() : "",
      );
      setStatus(log.status);
    } else {
      setSelectedLog(null);
      setVehicleId("CRV-2006");
      setTitle("");
      setDate(new Date().toISOString().split("T")[0]);
      setMileage("");
      setCost("");
      setNextDueMileage("");
      setStatus("Pending");
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title || !date || !mileage || !cost) {
      const msg = "Por favor complete el título, fecha, kilometraje y costo.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Atención", msg);
      return;
    }

    const payload: MaintenanceLog = {
      vehicleId,
      title,
      date,
      mileage: parseFloat(mileage),
      cost: parseFloat(cost),
      status,
    };

    // Solo se agrega si el usuario digitó un kilometraje válido (evitamos undefined)
    if (nextDueMileage && nextDueMileage.trim() !== "") {
      payload.nextDueMileage = parseFloat(nextDueMileage);
    }

    try {
      if (selectedLog?.id) {
        await updateMaintenanceLog(selectedLog.id, payload);
      } else {
        await addMaintenanceLog(payload);
      }
      setModalVisible(false);
      loadMaintenanceLogs();
    } catch (error) {
      console.error("Error al guardar mantenimiento:", error);
    }
  };

  const handleDelete = (id?: string) => {
    if (!id) return;

    const performDelete = async () => {
      try {
        await deleteMaintenanceLog(id);
        loadMaintenanceLogs();
      } catch (error) {
        console.error("Error al eliminar mantenimiento:", error);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("¿Está seguro de eliminar este mantenimiento?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Confirmar",
        "¿Desea eliminar este registro de mantenimiento?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: performDelete },
        ],
      );
    }
  };

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity
        style={[globalStyles.button, { marginBottom: 16 }]}
        onPress={() => handleOpenModal()}
      >
        <Text style={globalStyles.buttonText}>+ Registrar Mantenimiento</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={globalStyles.card}>
              <View style={globalStyles.row}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    color: colors.text,
                  }}
                >
                  {item.title}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      item.status === "Completed"
                        ? colors.accent
                        : colors.danger,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontWeight: "bold", fontSize: 12 }}
                  >
                    {item.status === "Completed" ? "Completado" : "Pendiente"}
                  </Text>
                </View>
              </View>

              <View style={[globalStyles.row, { marginVertical: 8 }]}>
                <Text style={globalStyles.subtitle}>
                  Vehículo: {item.vehicleId}
                </Text>
                <Text style={globalStyles.subtitle}>Fecha: {item.date}</Text>
              </View>

              <View style={globalStyles.row}>
                <Text style={globalStyles.subtitle}>
                  KM Realizado: {item.mileage.toLocaleString()} km
                </Text>
                <Text
                  style={{
                    fontWeight: "bold",
                    color: colors.secondary,
                    fontSize: 16,
                  }}
                >
                  ₡{item.cost.toLocaleString()}
                </Text>
              </View>

              {item.nextDueMileage && (
                <Text
                  style={[
                    globalStyles.subtitle,
                    { marginTop: 4, color: colors.danger, fontWeight: "600" },
                  ]}
                >
                  Próximo cambio al alcanzar:{" "}
                  {item.nextDueMileage.toLocaleString()} km
                </Text>
              )}

              <View style={[globalStyles.row, { marginTop: 12 }]}>
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

      {/* Modal Formulario */}
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
              {selectedLog ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Descripción (ej. Cambio de Aceite 5W-20)"
              value={title}
              onChangeText={setTitle}
            />

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
              placeholder="Kilometraje actual del mantenimiento"
              keyboardType="numeric"
              value={mileage}
              onChangeText={setMileage}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Costo total (₡)"
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
            />

            <TextInput
              style={globalStyles.input}
              placeholder="Próximo servicio al alcanzar el KM (ej. 155000)"
              keyboardType="numeric"
              value={nextDueMileage}
              onChangeText={setNextDueMileage}
            />

            <View style={[globalStyles.row, { marginVertical: 8 }]}>
              <Text style={{ fontSize: 16, color: colors.text }}>
                Estado: {status === "Completed" ? "Completado" : "Pendiente"}
              </Text>
              <Switch
                value={status === "Completed"}
                onValueChange={(value) =>
                  setStatus(value ? "Completed" : "Pending")
                }
                trackColor={{ false: colors.danger, true: colors.accent }}
              />
            </View>

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
