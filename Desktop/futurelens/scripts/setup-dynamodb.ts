#!/usr/bin/env node

/**
 * FutureLens — DynamoDB Table Setup
 *
 * Run once before first use:
 *   npx tsx scripts/setup-dynamodb.ts
 *
 * Requires AWS credentials configured (env vars or ~/.aws/credentials).
 * Tables use on-demand billing (pay-per-request) — no provisioned capacity.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type KeySchemaElement,
  type AttributeDefinition,
} from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const TABLES: {
  TableName: string;
  KeySchema: KeySchemaElement[];
  AttributeDefinitions: AttributeDefinition[];
}[] = [
  {
    TableName: "FutureLens_Profiles",
    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
  },
  {
    TableName: "FutureLens_Simulations",
    KeySchema: [
      { AttributeName: "sessionId", KeyType: "HASH" },
      { AttributeName: "simulationId", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "sessionId", AttributeType: "S" },
      { AttributeName: "simulationId", AttributeType: "S" },
    ],
  },
  {
    TableName: "FutureLens_Transcripts",
    KeySchema: [
      { AttributeName: "sessionId", KeyType: "HASH" },
      { AttributeName: "transcriptId", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "sessionId", AttributeType: "S" },
      { AttributeName: "transcriptId", AttributeType: "S" },
    ],
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ResourceNotFoundException"
    ) {
      return false;
    }
    throw err;
  }
}

async function main() {
  console.log(`\n🔧 FutureLens DynamoDB Setup (region: ${REGION})\n`);

  for (const table of TABLES) {
    const exists = await tableExists(table.TableName);
    if (exists) {
      console.log(`  ✓ ${table.TableName} — already exists`);
      continue;
    }

    console.log(`  ⏳ Creating ${table.TableName}...`);
    await client.send(
      new CreateTableCommand({
        ...table,
        BillingMode: "PAY_PER_REQUEST",
      }),
    );
    console.log(`  ✓ ${table.TableName} — created`);
  }

  console.log(`\n✅ All tables ready.\n`);
  console.log("Table names (add to .env.local if customizing):");
  console.log("  DYNAMODB_PROFILES_TABLE=FutureLens_Profiles");
  console.log("  DYNAMODB_SIMULATIONS_TABLE=FutureLens_Simulations");
  console.log("  DYNAMODB_TRANSCRIPTS_TABLE=FutureLens_Transcripts\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message || err);
  process.exit(1);
});
