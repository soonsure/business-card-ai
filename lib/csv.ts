import type { CardFields } from "@/lib/types";

const CSV_HEADERS = [
  "Company Name",
  "Address",
  "Country",
  "Region",
  "Email",
  "Phone",
  "Contact Person",
  "Job Title",
  "Company Website",
  "Company Category"
];

const escapeCsvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;

function getContactPerson(fields: CardFields) {
  return `${fields.first_name} ${fields.last_name}`.trim();
}

function toCsvRow(fields: CardFields) {
  return [
    fields.company ?? "",
    fields.address ?? "",
    fields.country ?? "",
    fields.region ?? "",
    fields.email ?? "",
    fields.phone ?? "",
    getContactPerson(fields),
    fields.job_title ?? "",
    fields.website ?? "",
    fields.company_category ?? ""
  ];
}

export function cardFieldsToCsv(fields: CardFields) {
  const headerRow = CSV_HEADERS.join(",");
  const valueRow = toCsvRow(fields).map((value) => escapeCsvValue(value)).join(",");

  return `${headerRow}\n${valueRow}`;
}

export function multipleCardFieldsToCsv(fieldsList: CardFields[]) {
  const headerRow = CSV_HEADERS.join(",");
  const rows = fieldsList.map((fields) =>
    toCsvRow(fields).map((value) => escapeCsvValue(value)).join(",")
  );

  return `${headerRow}\n${rows.join("\n")}`;
}
