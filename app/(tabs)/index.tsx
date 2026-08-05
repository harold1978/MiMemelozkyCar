import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FuelChart from "../../components/FuelChart";
import {
  getFuelLogs,
  getMaintenanceLogs,
  getVehicles,
} from "../../services/ServicioFirestore";
import { colors, globalStyles } from "../../styles/Styles";
import { FuelLog, MaintenanceLog, Vehicle } from "../../types/Tipos";

export default function DashboardScreen() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // --- ESTADOS DE FILTROS ---
  const [selectedVehicle, setSelectedVehicle] = useState<string>("ALL"); // 'ALL' o vehicleId
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "MONTH" | "YEAR" | "ALL"
  >("MONTH");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fuels, maints, vehs] = await Promise.all([
        getFuelLogs(),
        getMaintenanceLogs(),
        getVehicles(),
      ]);
      setFuelLogs(fuels);
      setMaintenances(maints);
      setVehicles(vehs);
    } catch (e) {
      console.error("Error al cargar datos del Dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const filteredFuel = useMemo(() => {
    const now = new Date();
    return fuelLogs.filter((log) => {
      const matchVehicle =
        selectedVehicle === "ALL" || log.vehicleId === selectedVehicle;
      const logDate = new Date(log.date);

      if (!matchVehicle) return false;

      if (selectedTimeRange === "MONTH") {
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      } else if (selectedTimeRange === "YEAR") {
        return logDate.getFullYear() === now.getFullYear();
      }
      return true; // 'ALL'
    });
  }, [fuelLogs, selectedVehicle, selectedTimeRange]);

  const filteredMaint = useMemo(() => {
    const now = new Date();
    return maintenances.filter((log) => {
      const matchVehicle =
        selectedVehicle === "ALL" || log.vehicleId === selectedVehicle;
      const logDate = new Date(log.date);

      if (!matchVehicle) return false;

      if (selectedTimeRange === "MONTH") {
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      } else if (selectedTimeRange === "YEAR") {
        return logDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [maintenances, selectedVehicle, selectedTimeRange]);

  // --- CÁLCULO DE INDICADORES (KPIs) ---
  const kpis = useMemo(() => {
    const totalFuelCost = filteredFuel.reduce(
      (acc, curr) => acc + (curr.totalCost || 0),
      0,
    );
    const totalMaintCost = filteredMaint.reduce(
      (acc, curr) => acc + (curr.cost || 0),
      0,
    );
    const totalCombinedCost = totalFuelCost + totalMaintCost;

    // Promedio por recarga
    const avgFuelRefill =
      filteredFuel.length > 0 ? totalFuelCost / filteredFuel.length : 0;

    // Calcular km recorridos a partir de los registros (por vehículo)
    const logsByVehicle: Record<string, FuelLog[]> = {};
    filteredFuel.forEach((l) => {
      if (!logsByVehicle[l.vehicleId]) logsByVehicle[l.vehicleId] = [];
      logsByVehicle[l.vehicleId].push(l);
    });

    let totalKmTraveled = 0;
    Object.values(logsByVehicle).forEach((arr) => {
      arr.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      for (let i = 1; i < arr.length; i++) {
        const prev = Number(arr[i - 1].mileage || 0);
        const curr = Number(arr[i].mileage || 0);
        if (curr > prev) totalKmTraveled += curr - prev;
      }
    });

    const totalLiters = filteredFuel.reduce(
      (acc, curr) => acc + (curr.liters || 0),
      0,
    );
    const avgEfficiency =
      totalLiters > 0 ? (totalKmTraveled / totalLiters).toFixed(2) : "0";

    // Servicios pendientes de la selección
    const pendingServices = maintenances.filter(
      (m) =>
        m.status === "Pending" &&
        (selectedVehicle === "ALL" || m.vehicleId === selectedVehicle),
    );

    return {
      totalFuelCost,
      totalMaintCost,
      totalCombinedCost,
      avgFuelRefill,
      avgEfficiency,
      pendingCount: pendingServices.length,
      pendingServices: pendingServices.sort(
        (a, b) => (a.nextDueMileage || 0) - (b.nextDueMileage || 0),
      ),
    };
  }, [filteredFuel, filteredMaint, maintenances, selectedVehicle]);
  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      {/* 1. SECCIÓN DE FILTROS */}
      <View style={localStyles.filterContainer}>
        {/* Filtro por Rango Temporal */}
        <Text style={localStyles.filterLabel}>Periodo:</Text>
        <View style={globalStyles.row}>
          {[
            { id: "MONTH", label: "Este Mes" },
            { id: "YEAR", label: "Este Año" },
            { id: "ALL", label: "Historico" },
          ].map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                localStyles.chip,
                selectedTimeRange === range.id && localStyles.chipActive,
              ]}
              onPress={() => setSelectedTimeRange(range.id as any)}
            >
              <Text
                style={[
                  localStyles.chipText,
                  selectedTimeRange === range.id && localStyles.chipTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtro por Vehículo */}
        {vehicles.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={localStyles.filterLabel}>Vehículo:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: "row" }}
            >
              <TouchableOpacity
                style={[
                  localStyles.chip,
                  selectedVehicle === "ALL" && localStyles.chipActive,
                ]}
                onPress={() => setSelectedVehicle("ALL")}
              >
                <Text
                  style={[
                    localStyles.chipText,
                    selectedVehicle === "ALL" && localStyles.chipTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    localStyles.chip,
                    selectedVehicle === v.id && localStyles.chipActive,
                  ]}
                  onPress={() => setSelectedVehicle(v.id)}
                >
                  <Text
                    style={[
                      localStyles.chipText,
                      selectedVehicle === v.id && localStyles.chipTextActive,
                    ]}
                  >
                    {v.name || v.placa}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 2. TARJETAS DE INDICADORES (KPIs) */}
      <Text style={globalStyles.title}>Resumen Operativo</Text>

      {/* Fila 1: Gasto Total Combinado */}
      <View style={[globalStyles.card, { backgroundColor: colors.primary }]}>
        <Text style={[globalStyles.subtitle, { color: "#93C5FD" }]}>
          Inversión Total Operativa
        </Text>
        <Text
          style={[globalStyles.statValue, { color: "#FFFFFF", fontSize: 28 }]}
        >
          ₡{kpis.totalCombinedCost.toLocaleString()}
        </Text>
      </View>

      {/* Fila 2: Combustible vs Mantenimiento */}
      <View style={globalStyles.row}>
        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Gasto Combustible</Text>
          <Text style={globalStyles.statValue}>
            ₡{kpis.totalFuelCost.toLocaleString()}
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Gasto Servicios</Text>
          <Text style={[globalStyles.statValue, { color: colors.accent }]}>
            ₡{kpis.totalMaintCost.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Fila 3: Eficiencia y Promedios */}
      <View style={globalStyles.row}>
        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Rendimiento Prom.</Text>
          <Text style={[globalStyles.statValue, { color: "#10B981" }]}>
            {kpis.avgEfficiency} <Text style={{ fontSize: 14 }}>km/L</Text>
          </Text>
        </View>

        <View style={[globalStyles.card, { flex: 0.48 }]}>
          <Text style={globalStyles.subtitle}>Promedio / Recarga</Text>
          <Text style={globalStyles.statValue}>
            ₡{Math.round(kpis.avgFuelRefill).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* 3. GRÁFICO HISTÓRICO */}
      <FuelChart fuelLogs={filteredFuel} />

      {/* 4. MANTENIMIENTOS PENDIENTES */}
      <View style={[globalStyles.row, { marginTop: 16 }]}>
        <Text style={globalStyles.title}>Alertas de Servicio</Text>
        <View style={localStyles.badge}>
          <Text style={localStyles.badgeText}>{kpis.pendingCount}</Text>
        </View>
      </View>

      {kpis.pendingServices.length === 0 ? (
        <View style={globalStyles.card}>
          <Text style={globalStyles.subtitle}>
            Sin mantenimientos pendientes para este filtro.
          </Text>
        </View>
      ) : (
        kpis.pendingServices.map((item) => (
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
                  : "Sin límite"}
              </Text>
            </View>

            <View style={[globalStyles.row, { marginTop: 6 }]}>
              <Text style={globalStyles.subtitle}>
                Vehículo: {item.vehicleId}
              </Text>
              <Text style={globalStyles.subtitle}>
                Registrado a: {item.mileage.toLocaleString()} km
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  filterContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.subtext,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.secondary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
