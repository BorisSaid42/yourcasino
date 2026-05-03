import { createFileRoute, redirect } from '@tanstack/react-router';
import { api } from '../../../../../lib/interaction/api';
import { updateCredentials } from '../../../../../lib/interaction/credentials';
import { reloadSockets } from '../../../../../lib/interaction/sockets';
import type { BaseCredentials } from '../../../../../queries/auth';

export const Route = createFileRoute('/auth/verify-email/$userId/$code/')({
  beforeLoad: async ({ params }) => {
    const { userId, code } = params;

    try {
      const data = await api.post<BaseCredentials & { jwt: string }, BaseCredentials & { jwt: string }>(
        '/auth/verify-email',
        { userId, code },
      );

      const { jwt } = data;
      updateCredentials(jwt);
      reloadSockets();

      throw redirect({ to: '/' });
    } catch (error) {
      if (error instanceof Error && 'to' in error) {
        throw error;
      }
      throw redirect({ to: '/' });
    }
  },
});
