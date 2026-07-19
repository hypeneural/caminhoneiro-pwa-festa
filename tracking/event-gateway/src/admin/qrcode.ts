import QRCode from "qrcode";
import type { GatewayVehicle } from "../domain/vehicles.js";

export interface DriverSetupInstruction {
  app: "Traccar Client";
  serverUrl: string;
  deviceIdentifier: string;
  steps: string[];
}

export interface DriverSetupQrResponse {
  vehicleId: string;
  vehicleName: string;
  instruction: DriverSetupInstruction;
  qrText: string;
  qrDataUrl: string;
}

export function createDriverSetupInstruction(vehicle: GatewayVehicle, gpsPublicUrl: string): DriverSetupInstruction {
  return {
    app: "Traccar Client",
    serverUrl: gpsPublicUrl,
    deviceIdentifier: vehicle.uniqueId,
    steps: [
      "Instale ou abra o app Traccar Client.",
      "Configure Server URL exatamente como abaixo.",
      "Configure Device Identifier exatamente como abaixo.",
      "Ative o rastreamento e mantenha a permissao de localizacao em segundo plano."
    ]
  };
}

export function createDriverSetupText(vehicle: GatewayVehicle, instruction: DriverSetupInstruction): string {
  return [
    "Festa dos Caminhoneiros 2026",
    `Veiculo: ${vehicle.name}`,
    `App: ${instruction.app}`,
    `Server URL: ${instruction.serverUrl}`,
    `Device Identifier: ${instruction.deviceIdentifier}`,
    "Permitir localizacao em segundo plano.",
    "Manter o celular carregando durante a procissao."
  ].join("\n");
}

export async function createDriverSetupQr(
  vehicle: GatewayVehicle,
  gpsPublicUrl: string
): Promise<DriverSetupQrResponse> {
  const instruction = createDriverSetupInstruction(vehicle, gpsPublicUrl);
  const qrText = createDriverSetupText(vehicle, instruction);
  const qrDataUrl = await QRCode.toDataURL(qrText, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512
  });

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    instruction,
    qrText,
    qrDataUrl
  };
}

