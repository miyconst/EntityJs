using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Web.Script.Serialization;

namespace EntityJs.Client
{
    public class Serializer
    {
        public object Serialize(object Data, string Include = "", string SelectMode = "")
        {
            Dictionary<string, object> newData = new Dictionary<string, object>();
            List<string> include = Include.Split(new char[]{' '}).ToList();

            if (Data as EntityJs.Client.Objects.IEntityCustomSelect != null)
            {
                return ((EntityJs.Client.Objects.IEntityCustomSelect)Data).ToJson(SelectMode);
            }
            else if (Data as EntityJs.Client.Objects.IEntity != null)
            {
                return ((EntityJs.Client.Objects.IEntity)Data).ToJson();
            }

            MethodInfo mi = Data.GetType().GetMethod("ToJson");
            if (mi != null)
            {
                return mi.Invoke(Data, null);
            }

            foreach (PropertyInfo pi in Data.GetType().GetProperties())
            {
                if (IsSimpleType(pi.PropertyType))
                {
                    newData.Add(pi.Name, pi.GetValue(Data, null));
                }
                else if (include.IndexOf(pi.Name) >= 0)
                {
                    newData.Add(pi.Name, Serialize(pi.GetValue(Data, null)));
                }
            }

            return newData;
        }

        public bool IsSimpleType(Type Type)
        {
            Type[] types = new Type[] 
            {
                typeof(int), typeof(decimal), typeof(long), typeof(double), typeof(float), 
                typeof(int?), typeof(decimal?), typeof(long?), typeof(double?), typeof(float?), 
                typeof(string), typeof(char?),
                typeof(char?),
                typeof(DateTime), typeof(TimeSpan),
                typeof(DateTime?), typeof(TimeSpan?),
                typeof(bool),
                typeof(bool?)
            };

            return types.Where(val => val == Type).Count() > 0;
        }
    }
}