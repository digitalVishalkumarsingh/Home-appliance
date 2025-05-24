/**
 * Utility function to generate a random password
 * 
 * @param length The length of the password to generate (default: 10)
 * @param includeUppercase Whether to include uppercase letters (default: true)
 * @param includeLowercase Whether to include lowercase letters (default: true)
 * @param includeNumbers Whether to include numbers (default: true)
 * @param includeSpecial Whether to include special characters (default: false)
 * @returns A random password string
 */
export function generateRandomPassword(
  length: number = 10,
  includeUppercase: boolean = true,
  includeLowercase: boolean = true,
  includeNumbers: boolean = true,
  includeSpecial: boolean = false
): string {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing characters like I and O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Removed confusing characters like l
  const numberChars = '23456789'; // Removed confusing characters like 0 and 1
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Create character pool based on options
  let charPool = '';
  if (includeUppercase) charPool += uppercaseChars;
  if (includeLowercase) charPool += lowercaseChars;
  if (includeNumbers) charPool += numberChars;
  if (includeSpecial) charPool += specialChars;

  // Ensure at least one character set is included
  if (charPool.length === 0) {
    charPool = lowercaseChars + numberChars;
  }

  // Generate password
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charPool.length);
    password += charPool[randomIndex];
  }

  // Ensure password contains at least one character from each required set
  const requiredSets = [];
  if (includeUppercase) requiredSets.push(uppercaseChars);
  if (includeLowercase) requiredSets.push(lowercaseChars);
  if (includeNumbers) requiredSets.push(numberChars);
  if (includeSpecial) requiredSets.push(specialChars);

  for (let i = 0; i < requiredSets.length; i++) {
    const set = requiredSets[i];
    if (!password.split('').some(char => set.includes(char))) {
      // Replace a random character with one from the required set
      const randomSetIndex = Math.floor(Math.random() * set.length);
      const randomPasswordIndex = Math.floor(Math.random() * password.length);
      password = 
        password.substring(0, randomPasswordIndex) + 
        set[randomSetIndex] + 
        password.substring(randomPasswordIndex + 1);
    }
  }

  return password;
}
