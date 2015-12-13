using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Security.Cryptography;

namespace EntityJs.Client
{
    public static class mString
    {
        public static int InSeconds(this DateTime Date)
        {
            return (int)TimeSpan.FromTicks(Date.Ticks).TotalSeconds;
        }
        public static bool IsNullOrEmpty(string Value, params string[] Values)
        {
            bool result = false;
            result = Value.IsNullOrEmpty();
            if (!result)
            {
                foreach (string s in Values)
                {
                    result = result || s.IsNullOrEmpty();
                    if (result)
                    {
                        return result;
                    }
                }
            }
            return result;
        }
        public static bool IsNullOrEmpty(this string Value)
        {
            return string.IsNullOrEmpty(Value);
        }
        public static bool IsNotNullOrEmpty(this string Value)
        {
            return !string.IsNullOrEmpty(Value);
        }
        public static string UppercaseFirst(this string Value)
        {
            if (Value.IsNullOrEmpty())
            {
                return string.Empty;
            }
            return char.ToUpper(Value[0]) + Value.Substring(1);
        }

        public static string LowercaseFirst(this string Value)
        {
            if (Value.IsNullOrEmpty())
            {
                return string.Empty;
            }
            return char.ToLower(Value[0]) + Value.Substring(1);
        }

        public static long ToLong(this string Value)
        {
            return long.Parse(Value);
        }
        public static int ToInt(this string Value)
        {
            return int.Parse(Value);
        }
        public static int? ToIntOrDefault(this string Value)
        {
            if (Value.IsNullOrEmpty())
            {
                return null;
            }
            else
            {
                return Value.ToInt();
            }
        }
        public static int? ToIntFromBroken(this string Value)
        {
            Value = Value.ReplaceRegex(@"\D", string.Empty);
            return Value.ToIntOrDefault();
        }
        public static int ToIntFromBroken(this string Value, int Default = 0)
        {
            Value = Value.ReplaceRegex(@"\D", string.Empty);
            return Value.ToIntOrDefault() ?? Default;
        }
        public static decimal? ToDecimalOrDefault(this string Value)
        {
            if (Value.IsNotNullOrEmpty())
            {
                return Value.ToDecimal();
            }
            else
            {
                return null;
            }
        }
        public static decimal ToDecimal(this string Value)
        {
            decimal result;
            if (!System.Text.RegularExpressions.Regex.IsMatch(Value, @"[\d.,]"))
            {
                throw new System.ArgumentException("Input string was not in correct format.");
            }
            if (decimal.TryParse(Value, out result))
            {
                return result;
            }
            Value = Value.Replace(".", ",");
            if (decimal.TryParse(Value, out result))
            {
                return result;
            }
            Value = Value.Replace(",", ".");
            return decimal.Parse(Value);
        }
        public static DateTime ToDateTime(this string Value)
        {
            DateTime result;
            result = DateTime.Parse(Value);
            return result;
        }
        public static DateTime? ToDateTimeOrDefault(this string Value)
        {
            DateTime result;
            if (Value.IsNullOrEmpty())
            {
                return null;
            }
            result = DateTime.Parse(Value);
            return result;
        }
        public static string Format(this string Value, params object[] Objects)
        {
            return string.Format(Value, Objects);
        }
        public static string ReplaceRegex(this string Value, string RegexWhat, string ReplaceTo)
        {
            if (Value.IsNullOrEmpty() || RegexWhat.IsNullOrEmpty())
            {
                return Value;
            }
            return System.Text.RegularExpressions.Regex.Replace(Value, RegexWhat, ReplaceTo);
        }
        public static string Replace(this string Value, char[] CharsToReplace, string ReplaceTo)
        {
            string result = Value;
            foreach (char c in CharsToReplace)
            {
                result = result.Replace(c + "", ReplaceTo);
            }
            return result;
        }

        public static string ToLink(this string Value)
        {
            return Value.ReplaceRegex(@"\W", "_");
        }
        public static bool Like(this string Value1, string Value2, bool CaseSensitive)
        {
            if (!CaseSensitive)
            {
                Value1 = Value1.ToLower();
                Value2 = Value2.ToLower();

            }
            string pattern = Value2.Replace("%", ".*").Replace("_", ".{1}");
            return System.Text.RegularExpressions.Regex.IsMatch(Value1, pattern);
        }
        public static bool Like(this string Value1, string Value2)
        {
            return Value1.Like(Value2, false);
        }
        public static string ToDecimalString(this decimal Value)
        {
            return Value.ToString().Replace(",", ".");
        }
        public static string ToDecimalString(this float Value)
        {
            return Value.ToString().Replace(",", ".");
        }
        public static string ToDecimalString(this double Value)
        {
            return Value.ToString().Replace(",", ".");
        }
        public static bool ToBool(this string Value)
        {
            bool result = Value == "True" || Value == "true" || Value == "1";
            return result;
        }

        public static string ToSha1Base64String(this string Value)
        {
            string sha1 = string.Empty;
            return Value.ToSha1Base64String(Encoding.Default, ref sha1);
        }
        public static string ToSha1Base64String(this string Value, Encoding UseEncoding, ref string Sha1Value)
        {
            string result;
            string input = Value;
            byte[] bytes;
            SHA1 sha1 = new SHA1CryptoServiceProvider();
            //bytes = Encoding.ASCII.GetBytes(Value);
            //bytes = Encoding.Default.GetBytes(Value);
            bytes = UseEncoding.GetBytes(Value);
            bytes = sha1.ComputeHash(bytes);
            Sha1Value = UseEncoding.GetString(bytes);
            result = Convert.ToBase64String(bytes);
            return result;
        }
        public static string FromBase64(this string Value)
        {
            return Value.FromBase64(Encoding.Default);
        }
        public static string FromBase64(this string Value, Encoding UseEncoding)
        {
            string result;
            byte[] bytes;
            bytes = Convert.FromBase64String(Value);
            result = UseEncoding.GetString(bytes);
            return result;
        }
        public static string ToBase64(this string Value)
        {
            return ToBase64(Value, Encoding.Default);
        }
        public static string ToBase64(this string Value, Encoding UseEncoding)
        {
            string result;
            byte[] bytes;
            bytes = UseEncoding.GetBytes(Value);
            result = Convert.ToBase64String(bytes);
            return result;
        }
        public static string ToShortDateString(this DateTime? Value)
        {
            return Value == null ? string.Empty : Value.Value.ToShortDateString();
        }
        public static string ToString(this DateTime? Value, string Format)
        {
            return Value == null ? string.Empty : Value.Value.ToString(Format);
        }
        public static string ToString(this Decimal? Value, string Format)
        {
            return Value == null ? (0.0).ToString(Format) : Value.Value.ToString(Format);
        }
        public static Dictionary<string, object> ToObjectDictionary(this Object Value)
        {
            Dictionary<string, object> values = new Dictionary<string, object>();
            foreach (PropertyInfo pi in Value.GetType().GetProperties())
            {
                values.Add(pi.Name, pi.GetValue(Value, null));
            }
            return values;
        }
    }
}