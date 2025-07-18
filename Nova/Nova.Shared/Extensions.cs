using System.Collections.Generic;

namespace Nova.Shared
{
    /// <summary>
    /// Extension methods for Dictionary and other types
    /// </summary>
    public static class Extensions
    {
        /// <summary>
        /// Get value from dictionary or return default if key doesn't exist
        /// </summary>
        public static TValue GetValueOrDefault<TKey, TValue>(this Dictionary<TKey, TValue> dictionary, TKey key, TValue defaultValue = default(TValue))
        {
            if (dictionary == null)
                return defaultValue;

            return dictionary.TryGetValue(key, out TValue value) ? value : defaultValue;
        }

        /// <summary>
        /// Get value from dictionary as object or return default if key doesn't exist
        /// </summary>
        public static object GetValueOrDefault(this Dictionary<string, object> dictionary, string key, object defaultValue = null)
        {
            if (dictionary == null)
                return defaultValue;

            return dictionary.TryGetValue(key, out object value) ? value : defaultValue;
        }
    }
}