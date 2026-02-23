"use client";

import { useState, useCallback } from "react";
import type { OnboardingFormData, UploadedDocument } from "@/lib/types/onboarding";
import styles from "./Onboarding.module.css";

interface Props {
  data: OnboardingFormData;
  onDocumentsChange: (docs: UploadedDocument[]) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.includes("pdf"))
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  if (type.includes("image"))
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

export default function StepDocuments({ data, onDocumentsChange }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setUploadError(null);
      const newDocs: UploadedDocument[] = [...data.documents];

      for (const file of Array.from(fileList)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setUploadError(`"${file.name}" is not a supported file type.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`"${file.name}" exceeds the 5MB limit.`);
          continue;
        }
        if (newDocs.some((d) => d.name === file.name)) {
          continue; // Skip duplicates
        }

        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // strip data:...;base64, prefix
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        newDocs.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content,
        });
      }

      onDocumentsChange(newDocs);
    },
    [data.documents, onDocumentsChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleRemove = (name: string) => {
    onDocumentsChange(data.documents.filter((d) => d.name !== name));
  };

  return (
    <>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h2 className={styles.formTitle}>Documents (Optional)</h2>
        <p className={styles.formSubtitle}>
          Upload your resume, financial statements, or any document that helps paint a fuller picture.
          Our AI will extract relevant details.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <div
          className={`${styles.uploadZone} ${isDragOver ? styles.dragover : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={(e) => {
              if (e.target.files?.length) {
                processFiles(e.target.files);
                e.target.value = ""; // reset so same file can be re-added
              }
            }}
          />
          <div className={styles.uploadIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            </svg>
          </div>
          <p className={styles.uploadText}>
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className={styles.uploadHint}>PDF, DOC, TXT, CSV, PNG, JPG — up to 5MB each</p>
        </div>

        {uploadError && (
          <div className={styles.voiceError}>{uploadError}</div>
        )}

        {data.documents.length > 0 && (
          <div className={styles.fileList}>
            {data.documents.map((doc) => (
              <div key={doc.name} className={styles.fileItem}>
                <div className={styles.fileIcon}>{getFileIcon(doc.type)}</div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{doc.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(doc.size)}</div>
                </div>
                <button
                  type="button"
                  className={styles.fileRemove}
                  onClick={() => handleRemove(doc.name)}
                  aria-label={`Remove ${doc.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Your documents are processed locally and sent securely to Amazon Nova for analysis. Nothing is stored permanently.
        </p>
      </div>
    </>
  );
}
