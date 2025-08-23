import { generatePassword } from '../../utils/passwordGenerator';

describe('generatePassword', () => {
  it('should generate a password of the specified length', async () => {
    const password = await generatePassword({ length: 12, useNumbers: false, useSymbols: false });
    expect(password.length).toBe(12);
  });

  it('should only include lowercase and uppercase letters by default', async () => {
    const password = await generatePassword({ length: 20, useNumbers: false, useSymbols: false });
    expect(password).toMatch(/^[a-zA-Z]+$/);
  });

  it('should include numbers when useNumbers is true', async () => {
    const password = await generatePassword({ length: 20, useNumbers: true, useSymbols: false });
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('should include symbols when useSymbols is true', async () => {
    const password = await generatePassword({ length: 20, useNumbers: false, useSymbols: true });
    const symbols = '!@#$%^&*()_+-=[]{}|;:\',./<>?';
    const hasSymbol = password.split('').some(char => symbols.includes(char));
    expect(hasSymbol).toBe(true);
  });

  it('should include numbers and symbols when both are true', async () => {
    const password = await generatePassword({ length: 20, useNumbers: true, useSymbols: true });
    const symbols = '!@#$%^&*()_+-=[]{}|;:\',./<>?';
    const hasSymbol = password.split('').some(char => symbols.includes(char));
    expect(password).toMatch(/[0-9]/);
    expect(hasSymbol).toBe(true);
  });

  it('should always include at least one lowercase and one uppercase letter', async () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 10; i++) {
      const password = await generatePassword({ length: 8, useNumbers: false, useSymbols: false });
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
    }
  });

  it('should throw an error for length less than 4', async () => {
    await expect(generatePassword({ length: 3, useNumbers: false, useSymbols: false })).rejects.toThrow(
      'Password length must be at least 4 characters.'
    );
  });
});
