"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testDeviceConnection, type DeviceProbeResult } from "@/lib/device/real";

export async function connectDevice(deviceId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  await prisma.device.update({
    where: { id: deviceId },
    data: { status: "connected", lastConnected: new Date(), ownerId: session.user.id },
  });

  revalidatePath("/devices");
  return { success: true };
}

export async function disconnectDevice(deviceId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  await prisma.device.update({ where: { id: deviceId }, data: { status: "disconnected" } });

  revalidatePath("/devices");
  return { success: true };
}

export async function testDeviceConnectionAction(
  ipAddress: string
): Promise<{ error: string } | ({ success: true } & DeviceProbeResult)> {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const result = await testDeviceConnection(ipAddress);
  return { success: true, ...result };
}

export async function renameDevice(deviceId: string, name: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };
  if (!name.trim()) return { error: "Name cannot be empty." };

  await prisma.device.update({ where: { id: deviceId }, data: { name: name.trim() } });

  revalidatePath("/devices");
  return { success: true };
}
