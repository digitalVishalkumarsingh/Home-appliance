// Utility to clear all caches and authentication data
export const clearAllCache = async () => {
  try {
    console.log('🧹 Starting comprehensive cache clearing...');

    // 1. Clear localStorage
    if (typeof window !== 'undefined') {
      console.log('🗑️ Clearing localStorage...');
      localStorage.clear();
    }

    // 2. Clear sessionStorage
    if (typeof window !== 'undefined') {
      console.log('🗑️ Clearing sessionStorage...');
      sessionStorage.clear();
    }

    // 3. Clear all cookies
    if (typeof document !== 'undefined') {
      console.log('🍪 Clearing cookies...');
      const cookies = document.cookie.split(";");
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name) {
          // Clear with different path and domain combinations
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
          document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        }
      });
    }

    // 4. Clear browser caches
    if ('caches' in window) {
      console.log('💾 Clearing browser caches...');
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // 5. Clear IndexedDB
    if ('indexedDB' in window && indexedDB.databases) {
      console.log('🗄️ Clearing IndexedDB...');
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve(undefined);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        })
      );
    }

    // 6. Clear Next.js cache (if possible)
    if (typeof window !== 'undefined') {
      console.log('⚡ Attempting to clear Next.js cache...');
      // Force reload to clear any in-memory caches
      window.location.reload();
    }

    console.log('✅ Cache clearing completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

// Quick auth data clearing function
export const clearAuthData = () => {
  try {
    console.log('🔐 Clearing authentication data...');
    
    if (typeof window !== 'undefined') {
      // Clear localStorage auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token_backup");
      
      // Clear sessionStorage auth data
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("token_backup");
    }

    if (typeof document !== 'undefined') {
      // Clear auth cookies
      const authCookies = ["token", "auth_token", "token_backup"];
      authCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `${cookieName}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      });
    }

    console.log('✅ Authentication data cleared successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};

// Function to add cache clearing button to page (for debugging)
export const addCacheClearButton = () => {
  if (typeof document !== 'undefined') {
    const button = document.createElement('button');
    button.innerHTML = '🧹 Clear All Cache';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #ff4444;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    `;
    button.onclick = async () => {
      if (confirm('This will clear all cache and reload the page. Continue?')) {
        await clearAllCache();
      }
    };
    document.body.appendChild(button);
  }
};
