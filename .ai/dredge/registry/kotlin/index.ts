/**
 * DREDGE registry — Kotlin-specific patches.
 *
 * Covers Kotlin compilation failures seen in the amazon-iap-kotlin pipeline.
 */

import type { Patch } from "../../types.js";

const kotlinPatches: Patch[] = [
  {
    id: "kotlin-java-source-compat",
    title: "Align Java source/target compatibility with jvmTarget",
    category: "kotlin",
    severity: "high",
    triggers: [
      "Source option 8 is no longer supported",
      "Target option 8 is no longer supported",
      "JavaVersion.VERSION_1_8",
    ],
    mutations: [
      {
        path: "app/build.gradle",
        search: /sourceCompatibility\s+JavaVersion\.VERSION_\w+/g,
        replace: "sourceCompatibility JavaVersion.VERSION_11",
        description: "Set app sourceCompatibility to Java 11",
      },
      {
        path: "app/build.gradle",
        search: /targetCompatibility\s+JavaVersion\.VERSION_\w+/g,
        replace: "targetCompatibility JavaVersion.VERSION_11",
        description: "Set app targetCompatibility to Java 11",
      },
      {
        path: "bridge/build.gradle",
        search: /sourceCompatibility\s+JavaVersion\.VERSION_\w+/g,
        replace: "sourceCompatibility JavaVersion.VERSION_11",
        description: "Set bridge sourceCompatibility to Java 11",
      },
      {
        path: "bridge/build.gradle",
        search: /targetCompatibility\s+JavaVersion\.VERSION_\w+/g,
        replace: "targetCompatibility JavaVersion.VERSION_11",
        description: "Set bridge targetCompatibility to Java 11",
      },
    ],
    commitMessage:
      "fix(kotlin): upgrade source/target compatibility to Java 11",
  },
  {
    id: "kotlin-stdlib-duplicate",
    title: "Remove duplicate Kotlin stdlib dependency",
    category: "kotlin",
    severity: "medium",
    triggers: [
      "Duplicate class kotlin.",
      "already provided by the Kotlin stdlib",
    ],
    mutations: [
      {
        path: "app/build.gradle",
        search:
          /\s*implementation\s+['"]org\.jetbrains\.kotlin:kotlin-stdlib-jdk\d+:[^'"]+['"]\s*\n/g,
        replace: "\n",
        description:
          "Remove explicit stdlib-jdkN dep (AGP adds it automatically)",
      },
      {
        path: "bridge/build.gradle",
        search:
          /\s*implementation\s+['"]org\.jetbrains\.kotlin:kotlin-stdlib-jdk\d+:[^'"]+['"]\s*\n/g,
        replace: "\n",
        description:
          "Remove explicit stdlib-jdkN dep (AGP adds it automatically)",
      },
    ],
    commitMessage:
      "fix(kotlin): remove redundant stdlib-jdkN to resolve duplicate class errors",
  },
  {
    id: "kotlin-mockk-jvm-target",
    title: "Align test jvmTarget for MockK 1.13.8 compatibility",
    category: "kotlin",
    severity: "medium",
    triggers: [
      "MockK",
      "Cannot inline bytecode built with JVM target",
    ],
    mutations: [
      {
        path: "bridge/build.gradle",
        search: /jvmTarget\s*=\s*['"][^'"]+['"]/g,
        replace: "jvmTarget = '11'",
        description: "Ensure bridge jvmTarget=11 for MockK 1.13.8",
      },
    ],
    commitMessage:
      "fix(kotlin): set bridge jvmTarget=11 for MockK 1.13.8 compatibility",
  },
];

export default kotlinPatches;
