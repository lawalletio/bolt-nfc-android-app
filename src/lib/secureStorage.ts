import {NativeModules} from 'react-native';

type SecureStorageNative = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

const Native = NativeModules.SecureStorageModule as SecureStorageNative;

export const STORAGE_KEYS = {
  DEVICE_TOKEN: 'device_token',
  BASE_URL: 'base_url',
} as const;

const SecureStorage = {
  setItem: (key: string, value: string): Promise<void> => Native.setItem(key, value),
  getItem: (key: string): Promise<string | null> => Native.getItem(key),
  removeItem: (key: string): Promise<void> => Native.removeItem(key),
  clear: (): Promise<void> => Native.clear(),
};

export default SecureStorage;
