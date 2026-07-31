import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import {
  getFuelLogs,
  getMaintenanceLogs,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { FuelLog, MaintenanceLog } from "../../types/Tipos";

export default function DashboardScreen() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fuels = await getFuelLogs();
      const maints = await getMaintenanceLogs();
      setFuelLogs(fuels);
      setMaintenances(maints);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cálculos del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyFuelCost = fuelLogs
    .filter((log) => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.totalCost, 0);

  const monthlyMaintCost = maintenances
    .filter((log) => {
      const d = new Date(log.date);
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        log.status == "Completed"
      );
    })
    .reduce((acc, curr) => acc + curr.cost, 0);

  const pendingMaintenances = maintenances.filter(
    (m) => m.status === "Pending",
  );

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      <Text style={globalStyles.title}>Resumen del Mes</Text>

      <View style={globalStyles.row}>
        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Combustible</Text>
          <Text style={globalStyles.statValue}>
            ₡{monthlyFuelCost.toLocaleString()}
          </Text>
        </View>
        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Mantenimiento</Text>
          <Text style={globalStyles.statValue}>
            ₡{monthlyMaintCost.toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={[globalStyles.title, { marginTop: 16 }]}>
        Próximos Mantenimientos
      </Text>
      {pendingMaintenances.length === 0 ? (
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>
            No hay mantenimientos pendientes.
          </Text>
        </View>
      ) : (
        pendingMaintenances.map((item) => (
          <View key={item.id} style={globalStyles.card}>
            <View style={globalStyles.row}>
              <Text style={{ fontWeight: "600", fontSize: 16 }}>
                {item.title}
              </Text>
              <Text style={{ color: colors.danger, fontWeight: "bold" }}>
                {item.nextDueMileage
                  ? `${item.nextDueMileage.toLocaleString()} km`
                  : "Sin definir"}
              </Text>
            </View>
            <Text style={globalStyles.subtitle}>
              Vehículo: {item.vehicleId}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
