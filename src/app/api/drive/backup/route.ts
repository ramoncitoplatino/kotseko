import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { Readable } from "stream";

export const runtime = "nodejs";

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string,
): Promise<string> {
  const q = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${name}'`,
    `trashed=false`,
    parentId ? `'${parentId}' in parents` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  const list = await drive.files.list({ q, fields: "files(id)" });
  if (list.data.files?.length) return list.data.files[0].id!;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
  });
  return folder.data.id!;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      {
        error:
          "Google Drive not connected. Sign in with Google to enable backups.",
      },
      { status: 403 },
    );
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Persist refreshed tokens back to DB
  oauth2.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        ...(tokens.expiry_date
          ? { expires_at: Math.floor(tokens.expiry_date / 1000) }
          : {}),
      },
    });
  });

  const drive = google.drive({ version: "v3", auth: oauth2 });

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: {
      pmsRecords: { orderBy: { serviceDate: "desc" } },
      fuelLogs: { orderBy: { date: "desc" } },
    },
  });

  // ── Build CSV ──
  const rows: string[] = [
    "Date,Type,Vehicle,Plate,Shop / Station,Odometer (km),Amount (PHP),Details",
  ];

  for (const v of vehicles) {
    const label = `${v.year} ${v.make} ${v.model}`;

    for (const pms of v.pmsRecords) {
      const items = (
        JSON.parse(pms.items) as { name: string; price: number }[]
      )
        .map((i) => `${i.name}: ₱${i.price}`)
        .join("; ");
      rows.push(
        [
          pms.serviceDate.toISOString().split("T")[0],
          "PMS",
          label,
          v.plateNumber,
          pms.shopName ?? "",
          pms.mileage ?? "",
          pms.totalAmount.toFixed(2),
          items,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      );
    }

    for (const f of v.fuelLogs) {
      rows.push(
        [
          f.date.toISOString().split("T")[0],
          "Fuel",
          label,
          v.plateNumber,
          f.station ?? "",
          f.odometer,
          f.totalCost.toFixed(2),
          `${f.liters}L @ ₱${f.pricePerLiter.toFixed(2)}/L`,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
  }

  const csv = rows.join("\n");
  const today = new Date().toISOString().split("T")[0];

  // ── Find / create root folder ──
  const rootId = await findOrCreateFolder(drive, "Kotseko Backup");

  // ── Upload CSV (create new dated file or replace today's) ──
  const csvName = `kotseko_${today}.csv`;
  const existing = await drive.files.list({
    q: `name='${csvName}' and '${rootId}' in parents and trashed=false`,
    fields: "files(id)",
  });

  if (existing.data.files?.length) {
    await drive.files.update({
      fileId: existing.data.files[0].id!,
      media: { mimeType: "text/csv", body: csv },
    });
  } else {
    await drive.files.create({
      requestBody: { name: csvName, parents: [rootId] },
      media: { mimeType: "text/csv", body: csv },
    });
  }

  // ── Upload receipt images ──
  const receiptsId = await findOrCreateFolder(drive, "receipts", rootId);
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  let newImages = 0;

  for (const v of vehicles) {
    for (const pms of v.pmsRecords) {
      if (!pms.receiptImagePath) continue;
      try {
        const fileName =
          pms.receiptImagePath.split("/").pop() ?? `receipt_${pms.id}.jpg`;

        const alreadyUploaded = await drive.files.list({
          q: `name='${fileName}' and '${receiptsId}' in parents and trashed=false`,
          fields: "files(id)",
        });
        if (alreadyUploaded.data.files?.length) continue;

        const res = await fetch(pms.receiptImagePath, {
          headers: blobToken ? { Authorization: `Bearer ${blobToken}` } : {},
        });
        if (!res.ok) continue;

        const buf = Buffer.from(await res.arrayBuffer());
        await drive.files.create({
          requestBody: { name: fileName, parents: [receiptsId] },
          media: {
            mimeType: "image/jpeg",
            body: Readable.from(buf),
          },
        });
        newImages++;
      } catch {
        // skip failed images — don't abort the whole backup
      }
    }
  }

  const totalRecords = vehicles.reduce(
    (s, v) => s + v.pmsRecords.length + v.fuelLogs.length,
    0,
  );

  return NextResponse.json({
    success: true,
    message: `Backup complete! ${vehicles.length} vehicle(s), ${totalRecords} record(s) exported. ${newImages} new receipt image(s) uploaded to Drive.`,
  });
}
