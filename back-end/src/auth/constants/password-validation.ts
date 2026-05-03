// Unified password validation
// Must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character
export const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/;

export const PASSWORD_VALIDATION_MESSAGE =
  'Password must be at least 8 characters long, contain one upper, one lower case, one number and one special character';
