# Script Airtable – Préparation base "LPD Fleet"

Copie/colle le texte ci-dessous dans la console Airtable Scripting (Extensions > Apps > Scripting) pour créer automatiquement les tables minimales.

> ⚠️ Nécessite un workspace vide. Vérifie la limite Free tier : 1000 enregistrements/base et 5 éditeurs.

```js
const tables = base.tables.map((t) => t.name);

function ensureTable(name, fields) {
  if (tables.includes(name)) {
    output.text(`Table "${name}" déjà existante, ignorée.`);
    return base.getTable(name);
  }
  output.text(`Création de la table "${name}"...`);
  return base.createTable(name, fields);
}

const deptTable = ensureTable("departments", [
  { name: "Name", type: "singleLineText" },
  { name: "Region", type: "singleLineText" },
  { name: "Color", type: "singleLineText" },
]);

const usersTable = ensureTable("users", [
  { name: "Full name", type: "singleLineText" },
  { name: "Email", type: "email" },
  { name: "Role", type: "singleSelect", options: {
      choices: [
        { name: "driver" },
        { name: "fleet_manager" },
        { name: "admin" },
      ],
    },
  },
  { name: "Department", type: "multipleRecordLinks", options: {
      linkedTableId: deptTable.id,
    },
  },
  { name: "Active", type: "checkbox" },
]);

const vehiclesTable = ensureTable("vehicles", [
  { name: "Name", type: "singleLineText" },
  { name: "License plate", type: "singleLineText" },
  { name: "Model", type: "singleLineText" },
  { name: "Year", type: "number" },
  { name: "Department", type: "multipleRecordLinks", options: {
      linkedTableId: deptTable.id,
    },
  },
  { name: "Current km", type: "number" },
  { name: "CT due date", type: "date" },
  { name: "Service due km", type: "number" },
  { name: "Service due date", type: "date" },
  { name: "Status", type: "singleSelect", options: {
      choices: [
        { name: "available" },
        { name: "reserved" },
        { name: "maintenance" },
      ],
    },
  },
]);

const tripsTable = ensureTable("trips", [
  { name: "Vehicle", type: "multipleRecordLinks", options: {
      linkedTableId: vehiclesTable.id,
    },
  },
  { name: "Driver", type: "multipleRecordLinks", options: {
      linkedTableId: usersTable.id,
    },
  },
  { name: "Department", type: "multipleRecordLinks", options: {
      linkedTableId: deptTable.id,
    },
  },
  { name: "Start datetime", type: "date", options: { timeZone: "utc", isDateTime: true } },
  { name: "End datetime", type: "date", options: { timeZone: "utc", isDateTime: true } },
  { name: "Start km", type: "number" },
  { name: "End km", type: "number" },
  { name: "Fuel start", type: "number" },
  { name: "Fuel end", type: "number" },
  { name: "Cleanliness start", type: "singleSelect", options: {
      choices: [
        { name: "ok" },
        { name: "to_clean" },
        { name: "dirty" },
      ],
    },
  },
  { name: "Cleanliness end", type: "singleSelect", options: {
      choices: [
        { name: "ok" },
        { name: "to_clean" },
        { name: "dirty" },
      ],
    },
  },
  { name: "Incident notes", type: "multilineText" },
  { name: "Photos", type: "multipleAttachments" },
]);

ensureTable("maintenance_logs", [
  { name: "Vehicle", type: "multipleRecordLinks", options: {
      linkedTableId: vehiclesTable.id,
    },
  },
  { name: "Department", type: "multipleRecordLinks", options: {
      linkedTableId: deptTable.id,
    },
  },
  { name: "Type", type: "singleSelect", options: {
      choices: [
        { name: "ct" },
        { name: "service" },
        { name: "tires" },
        { name: "repair" },
        { name: "other" },
      ],
    },
  },
  { name: "Scheduled date", type: "date" },
  { name: "Performed date", type: "date" },
  { name: "Status", type: "singleSelect", options: {
      choices: [
        { name: "planned" },
        { name: "done" },
      ],
    },
  },
  { name: "Notes", type: "multilineText" },
]);

output.text("Tables prêtes !");
```
