/**
 * Calculates age in years from a date of birth string or Date object.
 * @param dob Date of birth (string or Date)
 * @returns Age as a number, or null if DOB is invalid
 */
export const calculateAge = (dob: string | Date | null | undefined): number | null => {
  if (!dob) return null;
  
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Formats age for display (e.g., "25 Y" or "N/A")
 * @param age Age number
 * @returns Formatted age string
 */
export const formatAge = (age: number | null): string => {
  if (age === null || age < 0) return 'N/A';
  return `${age} Y`;
};

/**
 * Formats gender/sex for display (e.g., "M", "F", or "—")
 * @param gender Gender string
 * @returns Formatted gender string
 */
export const formatGender = (gender: string | null | undefined): string => {
  if (!gender) return '—';
  return gender.charAt(0).toUpperCase();
};
