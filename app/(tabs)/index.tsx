import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
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
  const matchesTimeRange = (value: string, now: Date) => {
    const logDate = new Date(value);

    if (Number.isNaN(logDate.getTime())) {
      return false;
    }

    if (selectedTimeRange === "MONTH") {
      return (
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear()
      );
    }

    if (selectedTimeRange === "YEAR") {
      return logDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const filteredFuel = useMemo(() => {
    const now = new Date();
    return fuelLogs.filter((log) => {
      const matchVehicle =
        selectedVehicle === "ALL" || log.vehicleId === selectedVehicle;

      if (!matchVehicle) return false;
      return matchesTimeRange(log.date, now);
    });
  }, [fuelLogs, selectedVehicle, selectedTimeRange]);

  const filteredMaint = useMemo(() => {
    const now = new Date();
    return maintenances.filter((log) => {
      const matchVehicle =
        selectedVehicle === "ALL" || log.vehicleId === selectedVehicle;

      if (!matchVehicle) return false;
      return matchesTimeRange(log.date, now);
    });
  }, [maintenances, selectedVehicle, selectedTimeRange]);

  const getLogMileage = (log: FuelLog) => {
    const values = [log.mileage, log.kmActual];
    for (const value of values) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
    return 0;
  };

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
        const prev = getLogMileage(arr[i - 1]);
        const curr = getLogMileage(arr[i]);
        if (curr > prev) totalKmTraveled += curr - prev;
      }
    });

    const totalLiters = filteredFuel.reduce(
      (acc, curr) => acc + (curr.liters || 0),
      0,
    );
    console.log("Total Km:", totalKmTraveled, "Total Liters:", totalLiters);
    const avgEfficiency =
      totalLiters > 0
        ? ((totalKmTraveled * 1.60934) / totalLiters).toFixed(2)
        : "0";

    // Servicios pendientes de la selección
    const pendingServices = filteredMaint.filter((m) => m.status === "Pending");

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
  }, [filteredFuel, filteredMaint, selectedVehicle]);

  const getVehicleDisplayName = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.name || vehicle?.placa || "Vehículo sin nombre";
  };

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      {/* 1. SECCIÓN DE FILTROS */}
      <View style={globalStyles.filterContainer}>
        {/* Filtro por Rango Temporal */}
        <Text style={globalStyles.filterLabel}>Periodo:</Text>
        <View style={globalStyles.row}>
          {[
            { id: "MONTH", label: "Este Mes" },
            { id: "YEAR", label: "Este Año" },
            { id: "ALL", label: "Historico" },
          ].map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[
                globalStyles.chip,
                selectedTimeRange === range.id && globalStyles.chipActive,
                selectedTimeRange === range.id && {
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedTimeRange(range.id as any)}
            >
              <Text
                style={[
                  globalStyles.chipText,
                  selectedTimeRange === range.id && globalStyles.chipTextActive,
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
            <Text style={globalStyles.filterLabel}>Vehículo:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: "row" }}
            >
              <TouchableOpacity
                style={[
                  globalStyles.chip,
                  selectedVehicle === "ALL" && globalStyles.chipActive,
                ]}
                onPress={() => setSelectedVehicle("ALL")}
              >
                <Text
                  style={[
                    globalStyles.chipText,
                    selectedVehicle === "ALL" && globalStyles.chipTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    globalStyles.chip,
                    selectedVehicle === v.id && globalStyles.chipActive,
                    selectedVehicle === v.id && {
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedVehicle(v.id ?? "ALL")}
                >
                  <Text
                    style={[
                      globalStyles.chipText,
                      selectedVehicle === v.id && globalStyles.chipTextActive,
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
        <View style={globalStyles.badge}>
          <Text style={globalStyles.badgeText}>{kpis.pendingCount}</Text>
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
                Vehículo: {getVehicleDisplayName(item.vehicleId)}
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
