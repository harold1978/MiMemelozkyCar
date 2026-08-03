import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { colors, globalStyles } from "../styles/Styles";
import { FuelLog } from "../types/Tipos";

interface FuelChartProps {
  fuelLogs: FuelLog[];
}

export default function FuelChart({ fuelLogs }: FuelChartProps) {
  const currentYear = new Date().getFullYear();
  const screenWidth = Dimensions.get("window").width - 32; // Margen dinámico del contenedor

  // Nombres cortos para los meses del año
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Inicializamos un arreglo de 12 posiciones con ceros
  const monthlyTotals = new Array(12).fill(0);

  // Sumamos los montos de cada recarga según el mes correspondiente
  fuelLogs.forEach((log) => {
    const logDate = new Date(log.date);
    if (logDate.getFullYear() === currentYear) {
      const monthIndex = logDate.getMonth(); // 0 - 11
      monthlyTotals[monthIndex] += log.totalCost;
    }
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        data: monthlyTotals,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Usa el color `secondary` (#3B82F6)
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`, // Color del texto de las etiquetas
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.secondary,
    },
  };

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.title}>
        Consumo de Combustible ({currentYear})
      </Text>

      <BarChart
        data={chartData}
        width={screenWidth > 600 ? 560 : screenWidth} // Ajuste responsivo para Web vs Móvil
        height={220}
        yAxisLabel="₡"
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={0}
        showValuesOnTopOfBars={true}
        fromZero={true}
        style={{
          marginVertical: 8,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
