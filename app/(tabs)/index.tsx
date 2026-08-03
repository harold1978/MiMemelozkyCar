import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import FuelChart from "../../components/FuelChart";
import {
  getFuelLogs,
  getMaintenanceLogs,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { FuelLog, MaintenanceLog } from "../../types/Tipos";

export default function DashboardScreen() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fuels = await getFuelLogs();
      const maints = await getMaintenanceLogs();
      setFuelLogs(fuels);
      setMaintenances(maints);
    } catch (e) {
      console.error("Error al cargar datos del Dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Métricas del Mes Actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyFuelCost = fuelLogs
    .filter((log) => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.totalCost, 0);

  const monthlyMaintCost = maintenances
    .filter((log) => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.cost, 0);

  // Mantenimientos pendientes (filtrados por estado y ordenados por kilometraje)
  const pendingMaintenances = maintenances
    .filter((m) => m.status === "Pending")
    .sort((a, b) => (a.nextDueMileage || 0) - (b.nextDueMileage || 0));

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      <Text style={globalStyles.title}>Resumen del Mes</Text>

      {/* Tarjetas de Métricas Rápidas */}
      <View style={globalStyles.row}>
        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Combustible</Text>
          <Text style={globalStyles.statValue}>
            ₡{monthlyFuelCost.toLocaleString()}
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Mantenimiento</Text>
          <Text style={[globalStyles.statValue, { color: colors.accent }]}>
            ₡{monthlyMaintCost.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Gráfico de Barras Histórico */}
      <FuelChart fuelLogs={fuelLogs} />

      {/* Sección de Próximos Servicios por Kilometraje */}
      <Text style={[globalStyles.title, { marginTop: 16 }]}>
        Próximos Servicios (Por KM)
      </Text>

      {pendingMaintenances.length === 0 ? (
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>
            No hay servicios pendientes agendados.
          </Text>
        </View>
      ) : (
        pendingMaintenances.map((item) => (
          <View
            key={item.id || Math.random().toString()}
            style={globalStyles.card}
          >
            <View style={globalStyles.row}>
              <Text
                style={{ fontWeight: "600", fontSize: 16, color: colors.text }}
              >
                {item.title}
              </Text>
              <Text style={{ color: colors.danger, fontWeight: "bold" }}>
                {item.nextDueMileage
                  ? `${item.nextDueMileage.toLocaleString()} km`
                  : "Sin limite"}
              </Text>
            </View>

            <View style={[globalStyles.row, { marginTop: 6 }]}>
              <Text style={globalStyles.subtitle}>
                Vehículo: {item.vehicleId}
              </Text>
              <Text style={globalStyles.subtitle}>
                Último KM: {item.mileage.toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
