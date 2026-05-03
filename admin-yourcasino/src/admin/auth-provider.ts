import { DefaultAuthProvider } from 'adminjs';

import componentLoader from './component-loader.js';
import bcrypt from 'bcrypt';

/**
 * Make sure to modify "authenticate" to be a proper authentication method
 */
const provider = new DefaultAuthProvider({
  componentLoader,
  authenticate: async ({ email, password }) => {
    const { ADMIN_EMAIL } = process.env;
    const storedHash = `$2b$10$${process.env.ADMIN_PASSWORD_HASH}`;
    const passCorrect = await bcrypt.compare(password, storedHash);
    if (email === ADMIN_EMAIL && passCorrect) {
      return { email };
    }
    return null;
  },
});

export default provider;
