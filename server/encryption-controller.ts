// Encryption controller for admin panel settings management
import { db } from './db';
import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EncryptionSettings {
  globalEncryption: boolean;
  routeEncryption: {
    orders: boolean;
    admin: boolean;
    users: boolean;
    payments: boolean;
    products: boolean;
    profile: boolean;
  };
  clientDecryption: boolean;
  loggingEnabled: boolean;
  testingMode: boolean;
}

// Default encryption state
const defaultEncryptionSettings: EncryptionSettings = {
  globalEncryption: true,
  routeEncryption: {
    orders: true,
    admin: true,
    users: true,
    payments: true,
    products: true,
    profile: true,
  },
  clientDecryption: false,
  loggingEnabled: true,
  testingMode: false,
};

// Cache for encryption settings to avoid frequent database calls
let encryptionSettingsCache: EncryptionSettings | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

// Initialize encryption settings in database
async function initializeEncryptionSettings() {
  try {
    const encryptionKeys = [
      'encryption_global',
      'encryption_orders',
      'encryption_admin', 
      'encryption_users',
      'encryption_payments',
      'encryption_products',
      'encryption_profile',
      'encryption_client_decryption',
      'encryption_logging',
      'encryption_testing_mode'
    ];

    for (const key of encryptionKeys) {
      const existing = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (existing.length === 0) {
        let defaultValue = 'true';
        if (key === 'encryption_client_decryption' || key === 'encryption_testing_mode') {
          defaultValue = 'false';
        }

        await db.insert(systemSettings).values({
          key,
          value: defaultValue,
          type: 'boolean',
          label: `Encryption ${key.replace('encryption_', '').replace('_', ' ')}`,
          description: `Controls encryption for ${key.replace('encryption_', '').replace('_', ' ')}`,
          isActive: true
        });
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize encryption settings:', error);
  }
}

// Get encryption settings from database
async function getEncryptionSettingsFromDB(): Promise<EncryptionSettings> {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'encryption_global'));

    if (settings.length === 0) {
      await initializeEncryptionSettings();
    }

    const allSettings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.type, 'boolean'));

    const encryptionMap: any = {};
    allSettings.forEach(setting => {
      if (setting.key.startsWith('encryption_')) {
        encryptionMap[setting.key] = setting.value === 'true';
      }
    });

    return {
      globalEncryption: encryptionMap.encryption_global ?? true,
      routeEncryption: {
        orders: encryptionMap.encryption_orders ?? true,
        admin: encryptionMap.encryption_admin ?? true,
        users: encryptionMap.encryption_users ?? true,
        payments: encryptionMap.encryption_payments ?? true,
        products: encryptionMap.encryption_products ?? true,
        profile: encryptionMap.encryption_profile ?? true,
      },
      clientDecryption: encryptionMap.encryption_client_decryption ?? false,
      loggingEnabled: encryptionMap.encryption_logging ?? true,
      testingMode: encryptionMap.encryption_testing_mode ?? false,
    };
  } catch (error) {
    console.error('❌ Failed to get encryption settings from database:', error);
    return defaultEncryptionSettings;
  }
}

// Get current encryption settings with caching
export async function getEncryptionSettings(): Promise<EncryptionSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (encryptionSettingsCache && (now - lastCacheUpdate < CACHE_DURATION)) {
    return { ...encryptionSettingsCache };
  }
  
  // Fetch fresh settings from database
  encryptionSettingsCache = await getEncryptionSettingsFromDB();
  lastCacheUpdate = now;
  
  return { ...encryptionSettingsCache };
}

// Get current encryption settings synchronously (for middleware use)
export function getEncryptionSettingsSync(): EncryptionSettings {
  return encryptionSettingsCache || defaultEncryptionSettings;
}

// Update encryption settings in database
export async function updateEncryptionSettings(newSettings: Partial<EncryptionSettings>): Promise<EncryptionSettings> {
  try {
    // Update database with new settings
    const updates = [];
    
    if (newSettings.globalEncryption !== undefined) {
      updates.push(updateSystemSetting('encryption_global', newSettings.globalEncryption.toString()));
    }
    
    if (newSettings.clientDecryption !== undefined) {
      updates.push(updateSystemSetting('encryption_client_decryption', newSettings.clientDecryption.toString()));
    }
    
    if (newSettings.loggingEnabled !== undefined) {
      updates.push(updateSystemSetting('encryption_logging', newSettings.loggingEnabled.toString()));
    }
    
    if (newSettings.testingMode !== undefined) {
      updates.push(updateSystemSetting('encryption_testing_mode', newSettings.testingMode.toString()));
    }
    
    if (newSettings.routeEncryption) {
      for (const [route, enabled] of Object.entries(newSettings.routeEncryption)) {
        updates.push(updateSystemSetting(`encryption_${route}`, enabled.toString()));
      }
    }
    
    await Promise.all(updates);
    
    // Clear cache to force refresh
    encryptionSettingsCache = null;
    lastCacheUpdate = 0;
    
    // Get updated settings
    const updatedSettings = await getEncryptionSettings();
    
    if (updatedSettings.loggingEnabled) {
      console.log('🔧 Encryption settings updated:', {
        globalEncryption: updatedSettings.globalEncryption,
        testingMode: updatedSettings.testingMode,
        encryptedRoutes: Object.entries(updatedSettings.routeEncryption)
          .filter(([_, enabled]) => enabled)
          .map(([route]) => route)
      });
    }
    
    return updatedSettings;
  } catch (error) {
    console.error('❌ Failed to update encryption settings:', error);
    throw new Error('Failed to update encryption settings');
  }
}

// Helper function to update individual system setting
async function updateSystemSetting(key: string, value: string) {
  const existing = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({
      key,
      value,
      type: 'boolean',
      label: `Encryption ${key.replace('encryption_', '').replace('_', ' ')}`,
      description: `Controls encryption for ${key.replace('encryption_', '').replace('_', ' ')}`,
      isActive: true
    });
  }
}

// Check if encryption should be applied for a specific route
export function shouldEncryptRoute(path: string): boolean {
  const settings = getEncryptionSettingsSync();
  
  // If global encryption is disabled, don't encrypt anything
  if (!settings.globalEncryption) {
    return false;
  }

  // If testing mode is enabled, disable all encryption
  if (settings.testingMode) {
    return false;
  }

  // Check route-specific settings
  if (path.includes('/api/orders')) {
    return settings.routeEncryption.orders;
  }
  if (path.includes('/api/admin')) {
    return settings.routeEncryption.admin;
  }
  if (path.includes('/api/users')) {
    return settings.routeEncryption.users;
  }
  if (path.includes('/api/payments') || path.includes('upload-proof')) {
    return settings.routeEncryption.payments;
  }
  if (path.includes('/api/products')) {
    return settings.routeEncryption.products;
  }
  if (path.includes('/api/profile')) {
    return settings.routeEncryption.profile;
  }

  return false;
}

// Log encryption events if logging is enabled
export function logEncryptionEvent(type: 'ENCRYPT' | 'DECRYPT' | 'SKIP', details: any) {
  const settings = getEncryptionSettingsSync();
  
  if (!settings.loggingEnabled) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] ${type}:`, {
    type,
    path: details.path || 'unknown',
    method: details.method || 'unknown',
    encrypted: details.encrypted || false,
    dataSize: details.dataSize || 0,
    testingMode: settings.testingMode
  });
}

// Reset encryption settings to defaults
export async function resetEncryptionSettings(): Promise<EncryptionSettings> {
  const defaultSettings = {
    globalEncryption: true,
    routeEncryption: {
      orders: true,
      admin: true,
      users: true,
      payments: true,
      products: true,
      profile: true,
    },
    clientDecryption: false,
    loggingEnabled: true,
    testingMode: false,
  };
  
  const updatedSettings = await updateEncryptionSettings(defaultSettings);
  
  if (updatedSettings.loggingEnabled) {
    console.log('🔄 Encryption settings reset to defaults');
  }
  
  return updatedSettings;
}

// Get encryption statistics
export async function getEncryptionStats() {
  const settings = await getEncryptionSettings();
  
  return {
    globalEncryption: settings.globalEncryption,
    testingMode: settings.testingMode,
    enabledRoutes: Object.entries(settings.routeEncryption)
      .filter(([_, enabled]) => enabled)
      .map(([route]) => route),
    disabledRoutes: Object.entries(settings.routeEncryption)
      .filter(([_, enabled]) => !enabled)
      .map(([route]) => route),
    clientDecryption: settings.clientDecryption,
    loggingEnabled: settings.loggingEnabled,
    timestamp: new Date().toISOString()
  };
}

// Initialize encryption settings on startup
export async function initializeEncryptionController() {
  try {
    await initializeEncryptionSettings();
    // Load settings into cache
    await getEncryptionSettings();
    console.log('✅ Encryption controller initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize encryption controller:', error);
  }
}