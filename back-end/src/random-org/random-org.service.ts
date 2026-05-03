import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import axios, { AxiosResponse } from 'axios';
import { ServiceError } from '../common/service.error';
import { RandomOrgRequest, RandomOrgResponse } from './random-org.types';

@Injectable()
export class RandomOrgService {
  constructor(private readonly configService: ConfigService) {}

  async getRandomString(): Promise<string> {
    const url = this.configService.getRandomOrgApiUrl();
    const payload: RandomOrgRequest = {
      jsonrpc: '2.0',
      method: 'generateSignedStrings',
      params: {
        apiKey: this.configService.getRandomOrgApiKey(),
        n: 4,
        length: 32,
        characters: 'abcdefghijklmnopqrstuvwxyz',
        replacement: true,
      },
      id: Date.now(),
    };

    try {
      const response: AxiosResponse<RandomOrgResponse> = await axios.post(url, payload);

      if (!response.data.result?.random?.data?.length) {
        throw new Error('Invalid response from Random.org');
      }

      return response.data.result.random.data.join('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Random.org error:', err.response?.data || err.message);
      } else {
        console.error('Unexpected error:', (err as Error).message);
      }
      throw new ServiceError('Failed to fetch randomness');
    }
  }
}
