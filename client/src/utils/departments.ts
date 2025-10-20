// Medical Departments - Most prominent departments in healthcare
export const MEDICAL_DEPARTMENTS = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'emergency_medicine', label: 'Emergency Medicine' },
  { value: 'endocrinology', label: 'Endocrinology' },
  { value: 'gastroenterology', label: 'Gastroenterology' },
  { value: 'general_medicine', label: 'General Medicine' },
  { value: 'general_surgery', label: 'General Surgery' },
  { value: 'gynecology_obstetrics', label: 'Gynecology & Obstetrics' },
  { value: 'hematology', label: 'Hematology' },
  { value: 'nephrology', label: 'Nephrology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'neurosurgery', label: 'Neurosurgery' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'otolaryngology', label: 'ENT (Otolaryngology)' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'pulmonology', label: 'Pulmonology' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'rheumatology', label: 'Rheumatology' },
  { value: 'urology', label: 'Urology' },
  { value: 'anesthesiology', label: 'Anesthesiology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'plastic_surgery', label: 'Plastic Surgery' },
] as const;

export type DepartmentValue = typeof MEDICAL_DEPARTMENTS[number]['value'];

// Helper function to get department label by value
export const getDepartmentLabel = (value: string): string => {
  const department = MEDICAL_DEPARTMENTS.find(dept => dept.value === value);
  return department ? department.label : value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get all department values
export const getDepartmentValues = (): string[] => {
  return MEDICAL_DEPARTMENTS.map(dept => dept.value);
};
