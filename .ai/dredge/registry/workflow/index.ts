/**
 * DREDGE registry — GitHub Actions workflow patches.
 *
 * Covers common workflow YAML failures in the amazon-iap-kotlin pipeline.
 */

import type { Patch } from "../../types.js";

const workflowPatches: Patch[] = [
  {
    id: "workflow-actions-checkout-version",
    title: "Downgrade actions/checkout to a stable v4",
    category: "workflow",
    severity: "high",
    triggers: [
      "Error: Unable to locate executable file: checkout",
      "actions/checkout@v",
      "Could not find action",
    ],
    mutations: [
      {
        path: ".github/workflows/android.yml",
        search: /uses:\s*actions\/checkout@v\d+/g,
        replace: "uses: actions/checkout@v4",
        description: "Pin checkout to v4 in android.yml",
      },
      {
        path: ".github/workflows/aws-gradle-pipeline.yml",
        search: /uses:\s*actions\/checkout@v\d+/g,
        replace: "uses: actions/checkout@v4",
        description: "Pin checkout to v4 in aws-gradle-pipeline.yml",
      },
    ],
    commitMessage:
      "fix(workflow): pin actions/checkout to v4 to restore checkout stability",
  },
  {
    id: "workflow-setup-java-version",
    title: "Pin actions/setup-java to v4",
    category: "workflow",
    severity: "medium",
    triggers: [
      "Unable to find java version",
      "actions/setup-java",
      "No valid download found",
    ],
    mutations: [
      {
        path: ".github/workflows/android.yml",
        search: /uses:\s*actions\/setup-java@v\d+/g,
        replace: "uses: actions/setup-java@v4",
        description: "Pin setup-java to v4 in android.yml",
      },
      {
        path: ".github/workflows/aws-gradle-pipeline.yml",
        search: /uses:\s*actions\/setup-java@v\d+/g,
        replace: "uses: actions/setup-java@v4",
        description: "Pin setup-java to v4 in aws-gradle-pipeline.yml",
      },
    ],
    commitMessage:
      "fix(workflow): pin actions/setup-java to v4 for stable JDK provisioning",
  },
  {
    id: "workflow-gradlew-permission",
    title: "Add gradlew execute-permission step",
    category: "workflow",
    severity: "low",
    triggers: [
      "Permission denied",
      "gradlew: command not found",
      "./gradlew: Permission denied",
    ],
    mutations: [
      {
        path: ".github/workflows/android.yml",
        // Capture the leading whitespace so we can mirror it in the injected step.
        search: /^(\s*)- name: Build with Gradle/m,
        replace: [
          "$1- name: Grant execute permission for gradlew",
          "$1  run: chmod +x gradlew",
          "$1- name: Build with Gradle",
        ].join("\n"),
        description:
          "Ensure gradlew is executable before the build step in android.yml",
      },
    ],
    commitMessage:
      "fix(workflow): add chmod +x gradlew step to prevent permission-denied errors",
  },
];

export default workflowPatches;
