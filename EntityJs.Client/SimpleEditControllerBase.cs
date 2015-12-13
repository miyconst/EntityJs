using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Data.Objects;
using EntityJs.Client;
using EntityJs.Client.Objects;
using System.Data.Objects.DataClasses;
using System.Web.Script.Serialization;
using System.Reflection;

namespace EntityJs.Client
{
    public abstract class SimpleEditControllerBase : Controller
    {
        protected ObjectContext context;
        protected EntityModel<ObjectContext> model;
        protected JavaScriptSerializer serializer = new JavaScriptSerializer();

        public SimpleEditControllerBase(ObjectContext DB)
        {
            this.context = DB;
            model = CreateModel();
        }

        protected abstract long GetUserID();

        protected virtual object GetData(string EntityName, string EntitySetName = null)
        {
            string sn = this.GetSettingsName(EntityName);
            string us = this.GetUserSettings(EntityName);
            var columns = this.GetColumns(EntityName);

            return new
            {
                EntityName = EntityName,
                EntitySetName = EntitySetName,
                UserSettings = us,
                SettingsName = sn,
                Columns = columns
            };
        }

        protected virtual string GetSettingsName(string EntityName)
        {
            return "EntityJs.SimpleEdit." + EntityName;
        }

        protected virtual string GetUserSettings(string EntityName)
        {
            string sn = this.GetSettingsName(EntityName);
            dynamic db = context;
            long userID = this.GetUserID();
            //IQueryable<EntityObject> q = Dynamic.DynamicQueryable.Where(db.UserSettings, w, sn);
            IQueryable<EntityObject> q = db.UserSettings.Where("it.Name = '" + sn + "' AND it.UserID = " + userID);
            EntityObject us = q.FirstOrDefault();

            if (us == null)
            {
                return string.Empty;
            }

            Type type = us.GetType();
            PropertyInfo pi = type.GetProperty("Value");
            string v = pi.GetValue(us, null) as string;

            return v;
        }

        protected virtual List<object> GetColumns(string EntityName)
        {
            Type entityType = model.GetEntityType(EntityName);

            if (entityType == null)
            {
                throw new ArgumentException("Can't find entity with type " + EntityName);
            }

            EntityObject newEntity = Activator.CreateInstance(entityType) as EntityObject;

            if (!(newEntity is Objects.IEntity))
            {
                throw new ArgumentException(EntityName + " class has to implement IEntity interface!");
            }

            IEnumerable<string> properties = (newEntity as Objects.IEntity).ToJson().GetType().GetProperties().Select(val => val.Name);
            List<object> columns = new List<object>();

            foreach (string p in properties)
            {
                PropertyInfo pi = entityType.GetProperty(p);

                if (pi == null || !pi.CanRead || !pi.CanWrite)
                {
                    continue;
                }

                string dataType = string.Empty;
                bool required = false;
                string name = pi.Name;

                if (pi.PropertyType == typeof(int) || pi.PropertyType == typeof(decimal) || pi.PropertyType == typeof(long)
                    || pi.PropertyType == typeof(int?) || pi.PropertyType == typeof(decimal?) || pi.PropertyType == typeof(long?))
                {
                    dataType = "number";
                }
                else if(pi.PropertyType == typeof(DateTime) || pi.PropertyType == typeof(DateTime?))
                {
                    dataType = "date";
                }
                else if (pi.PropertyType == typeof(TimeSpan) || pi.PropertyType == typeof(TimeSpan?))
                {
                    dataType = "time";
                }
                else if (pi.PropertyType == typeof(bool) || pi.PropertyType == typeof(bool?))
                {
                    dataType = "checkbox";
                }

                required = pi.DeclaringType.IsPrimitive;

                var col = new
                {
                    title = name,
                    name = name,
                    type = dataType,
                    required = required,
                    filter = true
                };

                columns.Add(col);
            }

            return columns;
        }

        protected virtual EntityModel<ObjectContext> CreateModel()
        {
            return new EntityModel<ObjectContext>(context);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            model.Dispose();
        }
    }
}
