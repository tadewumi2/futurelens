"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <div className={styles.lensIcon}>
          <span className={styles.lensCore} />
        </div>
        FutureLens
      </Link>

      <ul className={styles.links}>
        <li>
          <a href="#how-it-works">How It Works</a>
        </li>
        <li>
          <a href="#futures">Your Future Selves</a>
        </li>
        <li>
          <Link href="/onboarding" className={styles.cta}>
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}
