// THIS FILE WILL ONLY BE USED FROM CUSTOM EXECUTOR

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from '../config/data-source.config';

// Make sure dbConfig is imported only after dotenv.config

const prefixPath = process.env.TMP_ENV_BASE_PATH ?? '.';
const suffixPath = process.env.TMP_ENV_SUFFIX_PATH ?? '';

// manually load .env from different directory
dotenv.config({ path: `${prefixPath}/.env${suffixPath}` });

export default new DataSource(createDataSourceOptions());
