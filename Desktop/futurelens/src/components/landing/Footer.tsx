import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        &copy; 2026 FutureLens. Built for the Amazon Nova AI Hackathon.
      </div>
      <div className={styles.tag}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Powered by Amazon Nova
      </div>
    </footer>
  );
}
