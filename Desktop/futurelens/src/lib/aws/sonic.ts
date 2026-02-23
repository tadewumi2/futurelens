import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NodeHttp2Handler } from "@smithy/node-http-handler";

const MODEL_ID = "amazon.nova-2-sonic-v1:0";
const REGION = process.env.AWS_REGION || "us-east-1";

export interface SonicSessionCallbacks {
  onAudioOutput: (audioBase64: string) => void;
  onTextOutput: (text: string, role: "USER" | "ASSISTANT") => void;
  onError: (error: string) => void;
  onSessionEnd: () => void;
}

/**
 * Manages a single Nova 2 Sonic bidirectional streaming session.
 * Follows the event protocol from the AWS documentation:
 * sessionStart → promptStart → contentStart(SYSTEM) → textInput → contentEnd
 *   → contentStart(AUDIO/USER) → audioInput... → contentEnd
 *   → promptEnd → sessionEnd
 */
export class SonicSession {
  private client: BedrockRuntimeClient;
  private stream: AsyncGenerator<any, any, any> | null = null;
  private inputStream: any = null;
  private isActive = false;
  private promptName: string;
  private systemContentName: string;
  private audioContentName: string;
  private callbacks: SonicSessionCallbacks;
  private responseTask: Promise<void> | null = null;
  private displayAssistantText = false;
  private currentRole: string = "";

  constructor(callbacks: SonicSessionCallbacks) {
    this.callbacks = callbacks;
    this.promptName = randomUUID();
    this.systemContentName = randomUUID();
    this.audioContentName = randomUUID();

    this.client = new BedrockRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      requestHandler: new NodeHttp2Handler({
        requestTimeout: 300000,
        sessionTimeout: 300000,
        disableConcurrentStreams: false,
      }),
    });
  }

  async startSession(systemPrompt: string, voiceId: string = "matthew") {
    try {
      // Create the bidirectional stream
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: MODEL_ID,
        body: undefined as any, // Body is sent via the stream
      });

      const response = await this.client.send(command);
      this.isActive = true;

      // Get the input/output streams
      if (response.body) {
        this.inputStream = response.body;
      }

      // Send session start
      await this.sendEvent({
        event: {
          sessionStart: {
            inferenceConfiguration: {
              maxTokens: 1024,
              topP: 0.9,
              temperature: 0.75,
            },
          },
        },
      });

      // Send prompt start
      await this.sendEvent({
        event: {
          promptStart: {
            promptName: this.promptName,
            textOutputConfiguration: {
              mediaType: "text/plain",
            },
            audioOutputConfiguration: {
              mediaType: "audio/lpcm",
              sampleRateHertz: 24000,
              sampleSizeBits: 16,
              channelCount: 1,
              voiceId,
              encoding: "base64",
              audioType: "SPEECH",
            },
          },
        },
      });

      // Send system prompt as text content
      await this.sendEvent({
        event: {
          contentStart: {
            promptName: this.promptName,
            contentName: this.systemContentName,
            type: "TEXT",
            interactive: true,
            role: "SYSTEM",
            textInputConfiguration: {
              mediaType: "text/plain",
            },
          },
        },
      });

      await this.sendEvent({
        event: {
          textInput: {
            promptName: this.promptName,
            contentName: this.systemContentName,
            content: systemPrompt,
          },
        },
      });

      await this.sendEvent({
        event: {
          contentEnd: {
            promptName: this.promptName,
            contentName: this.systemContentName,
          },
        },
      });

      // Start audio input content
      await this.sendEvent({
        event: {
          contentStart: {
            promptName: this.promptName,
            contentName: this.audioContentName,
            type: "AUDIO",
            interactive: true,
            role: "USER",
            audioInputConfiguration: {
              mediaType: "audio/lpcm",
              sampleRateHertz: 16000,
              sampleSizeBits: 16,
              channelCount: 1,
              audioType: "SPEECH",
              encoding: "base64",
            },
          },
        },
      });

      // Start processing responses
      this.responseTask = this.processResponses();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to start session";
      this.callbacks.onError(msg);
      this.isActive = false;
    }
  }

  async sendAudioChunk(audioBase64: string) {
    if (!this.isActive) return;

    await this.sendEvent({
      event: {
        audioInput: {
          promptName: this.promptName,
          contentName: this.audioContentName,
          content: audioBase64,
        },
      },
    });
  }

  async endSession() {
    if (!this.isActive) return;
    this.isActive = false;

    try {
      // End audio content
      await this.sendEvent({
        event: {
          contentEnd: {
            promptName: this.promptName,
            contentName: this.audioContentName,
          },
        },
      });

      // End prompt
      await this.sendEvent({
        event: {
          promptEnd: {
            promptName: this.promptName,
          },
        },
      });

      // End session
      await this.sendEvent({
        event: {
          sessionEnd: {},
        },
      });
    } catch {
      // Ignore errors during cleanup
    }

    this.callbacks.onSessionEnd();
  }

  private async sendEvent(event: object) {
    if (!this.inputStream) return;
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(event));
      await this.inputStream.sendInput({ chunk: { bytes } });
    } catch (error) {
      if (this.isActive) {
        const msg = error instanceof Error ? error.message : "Stream send error";
        this.callbacks.onError(msg);
      }
    }
  }

  private async processResponses() {
    try {
      if (!this.inputStream) return;

      for await (const output of this.inputStream) {
        if (!this.isActive) break;

        if (output.chunk?.bytes) {
          const responseData = new TextDecoder().decode(output.chunk.bytes);
          try {
            const jsonData = JSON.parse(responseData);

            if (jsonData.event) {
              // Handle content start
              if (jsonData.event.contentStart) {
                const cs = jsonData.event.contentStart;
                this.currentRole = cs.role || "";

                if (cs.additionalModelFields) {
                  const additional =
                    typeof cs.additionalModelFields === "string"
                      ? JSON.parse(cs.additionalModelFields)
                      : cs.additionalModelFields;
                  this.displayAssistantText =
                    additional.generationStage === "SPECULATIVE";
                } else {
                  this.displayAssistantText = false;
                }
              }

              // Handle text output (transcripts)
              if (jsonData.event.textOutput) {
                const text = jsonData.event.textOutput.content;
                const role =
                  this.currentRole === "USER" ? "USER" : "ASSISTANT";

                // Send user transcripts always, assistant only if speculative
                if (role === "USER" || this.displayAssistantText) {
                  this.callbacks.onTextOutput(text, role);
                }
              }

              // Handle audio output
              if (jsonData.event.audioOutput) {
                this.callbacks.onAudioOutput(
                  jsonData.event.audioOutput.content
                );
              }
            }
          } catch {
            // Skip non-JSON chunks
          }
        }
      }
    } catch (error) {
      if (this.isActive) {
        const msg =
          error instanceof Error ? error.message : "Response processing error";
        this.callbacks.onError(msg);
      }
    }
  }
}

function randomUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
