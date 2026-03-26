export type CardFields = {
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  region: string;
  company_description: string;
  country: string;
  company_category: string;
  company_source_url: string;
};

export type StoredCardRecord = {
  id: string;
  imageUrls: string[];
  fields: CardFields;
};

export type StoredCardResult = {
  cards: StoredCardRecord[];
};

export const emptyCardFields: CardFields = {
  first_name: "",
  last_name: "",
  company: "",
  job_title: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  region: "",
  company_description: "",
  country: "",
  company_category: "",
  company_source_url: ""
};
