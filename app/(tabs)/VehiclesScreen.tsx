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
  addVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { Vehicle } from "../../types/Tipos";

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [name, setName] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [placa, setplaca] = useState<string>("");

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (v?: Vehicle) => {
    if (v) {
      setSelectedVehicle(v);
      setName(v.name);
      setModel(v.model);
      setplaca(v.placa);
    } else {
      setSelectedVehicle(null);
      setName("");
      setModel("");
      setplaca("");
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !placa) {
      const msg = "Por favor complete el nombre del vehículo y la placa.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Atención", msg);
      return;
    }

    const payload: Vehicle = { name, model, placa };

    try {
      if (selectedVehicle?.id) {
        await updateVehicle(selectedVehicle.id, payload);
      } else {
        await addVehicle(payload);
      }
      setModalVisible(false);
      loadVehicles();
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
    }
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const performDelete = async () => {
      try {
        await deleteVehicle(id);
        loadVehicles();
      } catch (error) {
        console.error("Error al eliminar vehículo:", error);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("¿Desea eliminar este vehículo?")) performDelete();
    } else {
      Alert.alert("Confirmar", "¿Desea eliminar este vehículo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  return (
    <View style={globalStyles.container}>
      <TouchableOpacity
        style={[globalStyles.button, { marginBottom: 16 }]}
        onPress={() => handleOpenModal()}
      >
        <Text style={globalStyles.buttonText}>+ Registrar Vehículo</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        <FlatList
          data={vehicles}
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
                  {item.name}
                </Text>
                <Text style={{ fontWeight: "600", color: colors.secondary }}>
                  {item.placa}
                </Text>
              </View>
              <Text style={[globalStyles.subtitle, { marginTop: 4 }]}>
                Modelo: {item.model}
              </Text>

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

      {/* Modal Creación / Edición */}
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
              {selectedVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
            </Text>

            <TextInput
              style={globalStyles.input}
              placeholder="Nombre / Identificador (ej. Honda CR-V 2006)"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Año / Modelo (ej. 2006 2.4cc)"
              value={model}
              onChangeText={setModel}
            />
            <TextInput
              style={globalStyles.input}
              placeholder="Placa o Matrícula"
              value={placa}
              onChangeText={setplaca}
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
