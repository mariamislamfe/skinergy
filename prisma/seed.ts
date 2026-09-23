import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding Skinergy database...");

  await prisma.notification.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.note.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.burnCase.deleteMany();
  await prisma.device.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ---------- Healthcare staff ----------
  const drLaila = await prisma.user.create({
    data: {
      name: "Dr. Laila Mostafa",
      email: "dr.laila@skinergy.health",
      passwordHash,
      role: "DOCTOR",
      defaultMode: "HEALTHCARE",
      avatarColor: "#7a2333",
    },
  });

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@skinergy.health",
      passwordHash,
      role: "ADMIN",
      defaultMode: "HEALTHCARE",
      avatarColor: "#5e1a27",
    },
  });

  // ---------- Personal patient user ----------
  const ahmedUser = await prisma.user.create({
    data: {
      name: "Ahmed Hassan",
      email: "ahmed@skinergy.health",
      passwordHash,
      role: "PATIENT",
      defaultMode: "PERSONAL",
      avatarColor: "#9a2c40",
    },
  });

  const ahmed = await prisma.patient.create({
    data: {
      patientCode: "SK-1001",
      name: "Ahmed Hassan",
      age: 32,
      sex: "Male",
      phone: "+20 100 123 4567",
      email: "ahmed@skinergy.health",
      emergencyName: "Mona Hassan (Mother)",
      emergencyPhone: "+20 100 987 6543",
      avatarColor: "#9a2c40",
      selfUserId: ahmedUser.id,
      managedBy: { connect: [{ id: drLaila.id }] },
    },
  });

  // Ahmed's family & caregivers
  await prisma.familyMember.createMany({
    data: [
      { patientId: ahmed.id, name: "Mona Hassan", relation: "Mother", phone: "+20 100 987 6543", accepted: true },
      { patientId: ahmed.id, name: "Karim Hassan", relation: "Father", phone: "+20 111 222 3344", accepted: true },
      { patientId: ahmed.id, name: "Yousef Hassan", relation: "Brother", phone: "+20 122 333 4455", accepted: false },
      { patientId: ahmed.id, name: "Nadia Sami", relation: "Caregiver", phone: "+20 155 666 7788", accepted: true },
    ],
  });

  // ---------- Ahmed: Case #001 Right Hand (primary, well documented) ----------
  const case1 = await prisma.burnCase.create({
    data: {
      caseNumber: "001",
      patientId: ahmed.id,
      bodyLocation: "Right Hand",
      degree: "Second-degree (superficial partial thickness)",
      status: "MONITORING",
      cause: "Contact with hot cooking pan",
      openedAt: daysAgo(7),
    },
  });

  const s1 = await prisma.scan.create({
    data: {
      burnCaseId: case1.id,
      label: "Initial Assessment",
      temperatureC: 37.9,
      moistureIdx: 42,
      rednessIdx: 78,
      areaCm2: 14.2,
      deviceId: "SK-DEV-001",
      capturedAt: daysAgo(7),
    },
  });
  await prisma.assessment.create({
    data: {
      scanId: s1.id,
      severity: "ATTENTION",
      summary: "Elevated redness index and localized temperature consistent with an acute second-degree burn. Blistering noted at presentation.",
      aiSummary: "Based on the available assessment, indicators (redness and local temperature) are consistent with an acute superficial partial-thickness burn. Professional medical evaluation is recommended for initial dressing and pain management.",
      changeFlag: false,
    },
  });

  const s2 = await prisma.scan.create({
    data: {
      burnCaseId: case1.id,
      label: "Follow-up Scan",
      temperatureC: 37.3,
      moistureIdx: 48,
      rednessIdx: 61,
      areaCm2: 13.1,
      deviceId: "SK-DEV-001",
      capturedAt: daysAgo(4),
    },
  });
  await prisma.assessment.create({
    data: {
      scanId: s2.id,
      severity: "FOLLOW_UP",
      summary: "Redness index reduced from 78 to 61. Surface temperature trending toward baseline. Mild peeling observed.",
      aiSummary: "Possible indicators of early healing — redness and temperature have both decreased since the initial scan. Continued monitoring and a follow-up scan in 3-4 days is advisable.",
      changeFlag: false,
    },
  });

  const s3 = await prisma.scan.create({
    data: {
      burnCaseId: case1.id,
      label: "Follow-up Scan",
      temperatureC: 36.9,
      moistureIdx: 55,
      rednessIdx: 39,
      areaCm2: 11.6,
      deviceId: "SK-DEV-001",
      capturedAt: daysAgo(0),
    },
  });
  await prisma.assessment.create({
    data: {
      scanId: s3.id,
      severity: "MONITORING",
      summary: "Redness index continues to decline (61 → 39). Affected area reduced by ~18% since previous scan. No signs of infection.",
      aiSummary: "Visible changes suggest improvement compared with the previous assessment — redness, temperature, and affected area have all trended favorably. Routine monitoring is sufficient at this stage.",
      changeFlag: false,
    },
  });

  // Conversations for case1
  const convo1 = await prisma.conversation.create({
    data: { burnCaseId: case1.id, title: "Is the redness normal?", createdAt: daysAgo(6) },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: convo1.id, role: "user", content: "Is the redness around my burn normal for day 1?", createdAt: daysAgo(6) },
      {
        conversationId: convo1.id,
        role: "assistant",
        content:
          "Based on the available assessment for your Right Hand burn (Case #001), some redness is expected in the first 24–48 hours after a second-degree burn — it's part of the body's normal inflammatory response. Your latest scan recorded a redness index of 78, which is elevated but consistent with an acute burn.\n\n**Possible indicators to watch for:**\n- Redness spreading beyond the original area\n- Increasing pain after day 2-3\n- Pus, odor, or fever\n\nIf you notice any of these, professional medical evaluation is recommended promptly. Otherwise, keep the area clean, covered, and scan again in 2-3 days so we can track the trend together.",
        createdAt: daysAgo(6),
      },
    ],
  });

  const convo2 = await prisma.conversation.create({
    data: { burnCaseId: case1.id, title: "Compare today's scan", createdAt: daysAgo(0) },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: convo2.id, role: "user", content: "Is my burn getting better?", createdAt: daysAgo(0) },
      {
        conversationId: convo2.id,
        role: "assistant",
        content:
          "Yes — based on your last 3 scans, the trend is positive:\n\n| Metric | Day 1 | Day 4 | Today |\n|---|---|---|---|\n| Redness index | 78 | 61 | 39 |\n| Temperature | 37.9°C | 37.3°C | 36.9°C |\n| Area | 14.2 cm² | 13.1 cm² | 11.6 cm² |\n\nAll three measurements are trending toward baseline, which is a possible indicator of healthy healing. This isn't a diagnosis — if pain increases or you notice new symptoms, please seek professional medical evaluation. Otherwise, your next scan in about a week is reasonable.",
        createdAt: daysAgo(0),
      },
    ],
  });

  // Notes & follow-ups for case1
  await prisma.note.create({
    data: {
      burnCaseId: case1.id,
      authorId: drLaila.id,
      authorName: "Dr. Laila Mostafa",
      content: "Patient reports pain decreasing steadily. Advised to continue silver sulfadiazine dressing and avoid direct sunlight on the area.",
      createdAt: daysAgo(4),
    },
  });
  await prisma.followUp.create({
    data: { burnCaseId: case1.id, dueAt: daysFromNow(3), status: "SCHEDULED", note: "Check healing progress, consider reducing dressing frequency." },
  });

  // ---------- Ahmed: Case #002 Left Forearm ----------
  const case2 = await prisma.burnCase.create({
    data: {
      caseNumber: "002",
      patientId: ahmed.id,
      bodyLocation: "Left Forearm",
      degree: "First-degree",
      status: "FOLLOW_UP",
      cause: "Steam exposure",
      openedAt: daysAgo(2),
    },
  });
  const s4 = await prisma.scan.create({
    data: {
      burnCaseId: case2.id,
      label: "Initial Assessment",
      temperatureC: 37.1,
      moistureIdx: 50,
      rednessIdx: 44,
      areaCm2: 6.4,
      deviceId: "SK-DEV-001",
      capturedAt: daysAgo(2),
    },
  });
  await prisma.assessment.create({
    data: {
      scanId: s4.id,
      severity: "FOLLOW_UP",
      summary: "Mild surface redness with no blistering. Consistent with a first-degree burn.",
      aiSummary: "Based on the available assessment, this appears to be a mild superficial burn. A follow-up scan in 3 days is recommended to confirm the healing trend.",
      changeFlag: false,
    },
  });
  await prisma.followUp.create({
    data: { burnCaseId: case2.id, dueAt: daysFromNow(1), status: "SCHEDULED", note: "3-day follow-up scan for left forearm." },
  });

  // ---------- Ahmed: Case #003 Upper Arm (older, closed) ----------
  const case3 = await prisma.burnCase.create({
    data: {
      caseNumber: "003",
      patientId: ahmed.id,
      bodyLocation: "Upper Arm",
      degree: "First-degree",
      status: "MONITORING",
      cause: "Sun exposure",
      openedAt: daysAgo(30),
      closedAt: daysAgo(20),
    },
  });
  const s5 = await prisma.scan.create({
    data: {
      burnCaseId: case3.id,
      label: "Initial Assessment",
      temperatureC: 37.0,
      moistureIdx: 52,
      rednessIdx: 30,
      areaCm2: 22.0,
      deviceId: "SK-DEV-001",
      capturedAt: daysAgo(30),
    },
  });
  await prisma.assessment.create({
    data: {
      scanId: s5.id,
      severity: "MONITORING",
      summary: "Superficial sunburn, resolved without complication.",
      aiSummary: "This mild case resolved on its own. No further action was needed.",
      changeFlag: false,
    },
  });

  // ---------- Notifications for Ahmed ----------
  await prisma.notification.createMany({
    data: [
      { userId: ahmedUser.id, type: "new_scan", title: "New scan saved", body: "Your Right Hand (Case #001) follow-up scan has been saved.", createdAt: daysAgo(0) },
      { userId: ahmedUser.id, type: "follow_up", title: "Follow-up due soon", body: "Left Forearm (Case #002) follow-up scan is due tomorrow.", createdAt: daysAgo(0) },
      { userId: ahmedUser.id, type: "family_update", title: "Caregiver notified", body: "Mona Hassan was notified about your latest assessment.", read: true, createdAt: daysAgo(4) },
    ],
  });

  // ================= Additional healthcare patients =================
  const patientsData = [
    {
      code: "SK-1002", name: "Sara Ali", age: 27, sex: "Female", location: "Left Hand", status: "FOLLOW_UP" as const,
      degree: "Second-degree", cause: "Hot oil splash",
    },
    {
      code: "SK-1003", name: "Mohamed Ali", age: 45, sex: "Male", location: "Leg", status: "ATTENTION" as const,
      degree: "Third-degree (deep)", cause: "Industrial equipment burn",
    },
    {
      code: "SK-1004", name: "Fatma El-Sayed", age: 8, sex: "Female", location: "Right Shoulder", status: "MONITORING" as const,
      degree: "First-degree", cause: "Hot water spill",
    },
    {
      code: "SK-1005", name: "Youssef Nabil", age: 52, sex: "Male", location: "Chest", status: "MONITORING" as const,
      degree: "Second-degree", cause: "Chemical exposure",
    },
    {
      code: "SK-1006", name: "Hana Tarek", age: 34, sex: "Female", location: "Left Foot", status: "FOLLOW_UP" as const,
      degree: "Second-degree", cause: "Fireplace ember contact",
    },
    {
      code: "SK-1007", name: "Karim Adel", age: 61, sex: "Male", location: "Right Forearm", status: "MONITORING" as const,
      degree: "First-degree", cause: "Grill contact",
    },
  ];

  let dayOffset = 1;
  for (const p of patientsData) {
    const patient = await prisma.patient.create({
      data: {
        patientCode: p.code,
        name: p.name,
        age: p.age,
        sex: p.sex,
        phone: "+20 10" + Math.floor(10000000 + Math.random() * 89999999),
        emergencyName: "Emergency Contact",
        emergencyPhone: "+20 11" + Math.floor(10000000 + Math.random() * 89999999),
        avatarColor: ["#9a2c40", "#c65a6e", "#7a2333", "#b3475b", "#5e1a27"][dayOffset % 5],
        managedBy: { connect: [{ id: drLaila.id }] },
      },
    });

    const bcase = await prisma.burnCase.create({
      data: {
        caseNumber: "001",
        patientId: patient.id,
        bodyLocation: p.location,
        degree: p.degree,
        status: p.status,
        cause: p.cause,
        openedAt: daysAgo(dayOffset),
      },
    });

    const redness = p.status === "ATTENTION" ? 82 : p.status === "FOLLOW_UP" ? 58 : 28;
    const scan = await prisma.scan.create({
      data: {
        burnCaseId: bcase.id,
        label: dayOffset === 0 ? "Initial Assessment" : "Follow-up Scan",
        temperatureC: 36.8 + Math.random() * 1.4,
        moistureIdx: 35 + Math.random() * 30,
        rednessIdx: redness,
        areaCm2: 5 + Math.random() * 20,
        deviceId: "SK-DEV-00" + ((dayOffset % 3) + 1),
        capturedAt: daysAgo(dayOffset === 1 ? 0 : dayOffset),
      },
    });

    const summaryMap: Record<string, string> = {
      ATTENTION: "High redness index and irregular tissue pattern detected. Deep tissue involvement suspected.",
      FOLLOW_UP: "Moderate healing progress observed. Continued monitoring recommended with follow-up scan.",
      MONITORING: "Healing trend is favorable with no signs of complication.",
    };
    const aiMap: Record<string, string> = {
      ATTENTION: "Based on the available assessment, several indicators suggest this burn may require prompt professional medical evaluation.",
      FOLLOW_UP: "Possible indicators of gradual improvement — a follow-up scan is recommended to confirm the trend.",
      MONITORING: "Available measurements are within an expected healing range. Routine monitoring is sufficient.",
    };

    await prisma.assessment.create({
      data: {
        scanId: scan.id,
        severity: p.status,
        summary: summaryMap[p.status],
        aiSummary: aiMap[p.status],
        changeFlag: p.status === "ATTENTION",
      },
    });

    if (p.status === "FOLLOW_UP") {
      await prisma.followUp.create({
        data: { burnCaseId: bcase.id, dueAt: daysFromNow(dayOffset % 2 === 0 ? 0 : 1), status: "SCHEDULED", note: "Routine follow-up scan." },
      });
    }
    if (p.status === "ATTENTION") {
      await prisma.followUp.create({
        data: { burnCaseId: bcase.id, dueAt: daysFromNow(0), status: "SCHEDULED", note: "Urgent re-evaluation needed." },
      });
      await prisma.note.create({
        data: {
          burnCaseId: bcase.id,
          authorId: drLaila.id,
          authorName: "Dr. Laila Mostafa",
          content: "Recommended for in-person evaluation given deep tissue involvement. Scheduling specialist referral.",
        },
      });
    }

    dayOffset++;
  }

  // Archived patient example
  await prisma.patient.create({
    data: {
      patientCode: "SK-0990",
      name: "Nour Ibrahim",
      age: 29,
      sex: "Female",
      archived: true,
      avatarColor: "#64748b",
      managedBy: { connect: [{ id: drLaila.id }] },
    },
  });

  // ---------- Devices ----------
  await prisma.device.create({
    data: {
      ownerId: ahmedUser.id,
      name: "Skinergy Device #001",
      serial: "SK-DEV-001",
      status: "connected",
      connection: "wifi",
      battery: 86,
      signal: "Excellent",
      ipAddress: "192.168.4.1",
      lastConnected: new Date(),
    },
  });
  await prisma.device.create({
    data: {
      name: "Skinergy Device #002",
      serial: "SK-DEV-002",
      status: "disconnected",
      connection: "wifi",
      battery: 54,
      signal: "Good",
      ipAddress: "192.168.4.1",
      lastConnected: daysAgo(2),
    },
  });
  await prisma.device.create({
    data: {
      name: "Skinergy Device #003 (Ward B)",
      serial: "SK-DEV-003",
      status: "disconnected",
      connection: "wifi",
      battery: 91,
      signal: "Fair",
      ipAddress: "192.168.4.1",
      lastConnected: daysAgo(1),
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  Personal: ahmed@skinergy.health");
  console.log("  Doctor:   dr.laila@skinergy.health");
  console.log("  Admin:    admin@skinergy.health");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
