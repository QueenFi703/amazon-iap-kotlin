/**
 * DREDGE registry — Gradle-specific patches.
 *
 * Covers common Gradle build failures encountered in the
 * amazon-iap-kotlin pipeline.
 */

import type { Patch } from "../../types.js";

const gradlePatches: Patch[] = [
  {
    id: "gradle-wrapper-checksum-mismatch",
    title: "Fix Gradle wrapper checksum mismatch",
    category: "gradle",
    severity: "critical",
    triggers: [
      "Error: Failed to download",
      "checksum",
    ],
    mutations: [
      {
        path: "gradle/wrapper/gradle-wrapper.properties",
        search: /^(distributionUrl=.+)$/m,
        replace:
          "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip",
        description: "Pin wrapper to a known-good Gradle 8.11.1 distribution",
      },
    ],
    commitMessage:
      "fix(gradle): pin wrapper to gradle-8.11.1 to resolve checksum mismatch",
  },
  {
    id: "gradle-daemon-jvm-mismatch",
    title: "Fix Gradle JVM target mismatch",
    category: "gradle",
    severity: "high",
    triggers: [
      "Inconsistent JVM-target compatibility",
      "jvmTarget",
    ],
    mutations: [
      {
        path: "app/build.gradle",
        search: /jvmTarget\s*=\s*['"][^'"]+['"]/g,
        replace: "jvmTarget = '11'",
        description: "Align app module jvmTarget to 11",
      },
      {
        path: "bridge/build.gradle",
        search: /jvmTarget\s*=\s*['"][^'"]+['"]/g,
        replace: "jvmTarget = '11'",
        description: "Align bridge module jvmTarget to 11",
      },
    ],
    commitMessage:
      "fix(gradle): align jvmTarget to 11 across app and bridge modules",
  },
  {
    id: "gradle-cache-corrupted",
    title: "Add --no-build-cache flag on cache corruption",
    category: "gradle",
    severity: "medium",
    triggers: [
      "Could not load cache entry",
      "Build cache is corrupted",
    ],
    mutations: [
      {
        path: "gradle.properties",
        search: /^(org\.gradle\.caching\s*=\s*true)$/m,
        replace: "org.gradle.caching=false",
        description: "Disable build cache to avoid corrupted-entry failures",
      },
    ],
    commitMessage:
      "fix(gradle): disable build cache to recover from corrupted cache entries",
  },
  {
    id: "gradle-kotlin-version-pin",
    title: "Pin Kotlin version to known-good 1.9.24",
    category: "gradle",
    severity: "high",
    triggers: [
      "Could not resolve org.jetbrains.kotlin",
      "Kotlin stdlib",
    ],
    mutations: [
      {
        path: "build.gradle",
        search: /kotlin_version\s*=\s*['"][^'"]+['"]/,
        replace: "kotlin_version = '1.9.24'",
        description: "Pin kotlin_version to 1.9.24",
      },
    ],
    commitMessage: "fix(gradle): pin kotlin_version to 1.9.24",
  },
];

export default gradlePatches;
