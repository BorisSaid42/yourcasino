import axios from 'axios';

export const formatApiErrorMessage = (error: Error): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.response?.data?.error ?? 'Something went wrong';

    return Array.isArray(message) ? message.join('\n') : message;
  } else {
    return error.message;
  }
};
