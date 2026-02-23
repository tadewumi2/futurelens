import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// ─── Client ───

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const ddb = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ─── Table Names (configurable via env) ───

const PROFILES_TABLE = process.env.DYNAMODB_PROFILES_TABLE || "FutureLens_Profiles";
const SIMULATIONS_TABLE = process.env.DYNAMODB_SIMULATIONS_TABLE || "FutureLens_Simulations";
const TRANSCRIPTS_TABLE = process.env.DYNAMODB_TRANSCRIPTS_TABLE || "FutureLens_Transcripts";

// ─── Helpers ───

function timestamp(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ═══════════════════════════════════
// PROFILES
// ═══════════════════════════════════

export interface StoredProfile {
  userId: string;
  sessionId: string;
  profile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save or update a user profile.
 * Uses sessionId as primary key (anonymous users).
 */
export async function saveProfile(
  sessionId: string,
  profile: Record<string, unknown>
): Promise<StoredProfile> {
  const item: StoredProfile = {
    userId: sessionId, // PK
    sessionId,
    profile,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };

  await ddb.send(
    new PutCommand({
      TableName: PROFILES_TABLE,
      Item: item,
    })
  );

  return item;
}

export async function getProfile(
  sessionId: string
): Promise<StoredProfile | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: PROFILES_TABLE,
      Key: { userId: sessionId },
    })
  );
  return (result.Item as StoredProfile) || null;
}

export async function updateProfile(
  sessionId: string,
  profile: Record<string, unknown>
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { userId: sessionId },
      UpdateExpression: "SET profile = :p, updatedAt = :u",
      ExpressionAttributeValues: {
        ":p": profile,
        ":u": timestamp(),
      },
    })
  );
}

// ═══════════════════════════════════
// SIMULATIONS
// ═══════════════════════════════════

export interface StoredSimulation {
  sessionId: string;     // PK
  simulationId: string;  // SK
  result: Record<string, unknown>;
  scenarioLabel?: string;
  isWhatIf: boolean;
  createdAt: string;
}

/**
 * Save a simulation result.
 * Supports multiple simulations per session (original + what-if scenarios).
 */
export async function saveSimulation(
  sessionId: string,
  result: Record<string, unknown>,
  options?: { scenarioLabel?: string; isWhatIf?: boolean }
): Promise<StoredSimulation> {
  const item: StoredSimulation = {
    sessionId,
    simulationId: generateId(),
    result,
    scenarioLabel: options?.scenarioLabel,
    isWhatIf: options?.isWhatIf || false,
    createdAt: timestamp(),
  };

  await ddb.send(
    new PutCommand({
      TableName: SIMULATIONS_TABLE,
      Item: item,
    })
  );

  return item;
}

/**
 * Get all simulations for a session (original + what-if).
 */
export async function getSimulations(
  sessionId: string
): Promise<StoredSimulation[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: SIMULATIONS_TABLE,
      KeyConditionExpression: "sessionId = :s",
      ExpressionAttributeValues: { ":s": sessionId },
      ScanIndexForward: false, // newest first
    })
  );
  return (result.Items as StoredSimulation[]) || [];
}

/**
 * Get the latest original (non-what-if) simulation.
 */
export async function getLatestSimulation(
  sessionId: string
): Promise<StoredSimulation | null> {
  const sims = await getSimulations(sessionId);
  return sims.find((s) => !s.isWhatIf) || null;
}

// ═══════════════════════════════════
// TRANSCRIPTS
// ═══════════════════════════════════

export interface TranscriptEntry {
  role: "USER" | "ASSISTANT";
  text: string;
  timestamp: string;
}

export interface StoredTranscript {
  sessionId: string;        // PK
  transcriptId: string;     // SK
  personaTimeframe: string;
  personaName: string;
  entries: TranscriptEntry[];
  duration: number;         // seconds
  createdAt: string;
}

/**
 * Save a conversation transcript.
 */
export async function saveTranscript(
  sessionId: string,
  data: {
    personaTimeframe: string;
    personaName: string;
    entries: TranscriptEntry[];
    duration: number;
  }
): Promise<StoredTranscript> {
  const item: StoredTranscript = {
    sessionId,
    transcriptId: generateId(),
    personaTimeframe: data.personaTimeframe,
    personaName: data.personaName,
    entries: data.entries,
    duration: data.duration,
    createdAt: timestamp(),
  };

  await ddb.send(
    new PutCommand({
      TableName: TRANSCRIPTS_TABLE,
      Item: item,
    })
  );

  return item;
}

/**
 * Get all transcripts for a session.
 */
export async function getTranscripts(
  sessionId: string
): Promise<StoredTranscript[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TRANSCRIPTS_TABLE,
      KeyConditionExpression: "sessionId = :s",
      ExpressionAttributeValues: { ":s": sessionId },
      ScanIndexForward: false,
    })
  );
  return (result.Items as StoredTranscript[]) || [];
}

// ═══════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════

/**
 * Load a complete session: profile + latest simulation + transcripts.
 */
export async function loadFullSession(sessionId: string) {
  const [profile, simulations, transcripts] = await Promise.all([
    getProfile(sessionId),
    getSimulations(sessionId),
    getTranscripts(sessionId),
  ]);

  return {
    profile,
    simulations,
    transcripts,
    latestSimulation: simulations.find((s) => !s.isWhatIf) || null,
    whatIfSimulations: simulations.filter((s) => s.isWhatIf),
  };
}

/**
 * Delete all data for a session (GDPR-style cleanup).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  // Delete profile
  await ddb.send(
    new DeleteCommand({
      TableName: PROFILES_TABLE,
      Key: { userId: sessionId },
    })
  ).catch(() => {});

  // Delete simulations
  const sims = await getSimulations(sessionId);
  for (const sim of sims) {
    await ddb.send(
      new DeleteCommand({
        TableName: SIMULATIONS_TABLE,
        Key: { sessionId, simulationId: sim.simulationId },
      })
    ).catch(() => {});
  }

  // Delete transcripts
  const txns = await getTranscripts(sessionId);
  for (const tx of txns) {
    await ddb.send(
      new DeleteCommand({
        TableName: TRANSCRIPTS_TABLE,
        Key: { sessionId, transcriptId: tx.transcriptId },
      })
    ).catch(() => {});
  }
}
