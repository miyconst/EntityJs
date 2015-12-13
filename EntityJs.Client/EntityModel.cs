using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Objects;
using System.Data.Objects.DataClasses;
using System.Reflection;
using EntityJs.Client.Dynamic;
using EntityJs.Client.Objects;

namespace EntityJs.Client
{
    public class EntityModel<ContextType> : IDisposable, IParametrable
        where ContextType : ObjectContext
    {
        protected string idKey = "ID";
        protected string modelNamespace = string.Empty;
        protected ContextType context;
        public List<String> Errors = new List<string>();
        public Events.EventsContainer ModelEvents = new Events.EventsContainer();

        public EntityModel(ContextType Context)
        {
            this.context = Context;
            this.WhereMethods = new Dictionary<string, Func<dynamic, List<Objects.WhereParameter>, dynamic>>();
            this.OrderMethods = new Dictionary<string, Func<dynamic, List<Objects.OrderParameter>, dynamic>>();
        }

        public ContextType EntityContext
        {
            get
            {
                return this.context;
            }
        }

        public Dictionary<string, Func<dynamic, List<Objects.WhereParameter>, dynamic>> WhereMethods
        {
            get;
            protected set;
        }

        public Dictionary<string, Func<dynamic, List<Objects.OrderParameter>, dynamic>> OrderMethods
        {
            get;
            protected set;
        }

        public IQueryable SelectQuery(string EntitySetName, string EntityName, Objects.WhereCollection Where = null, Objects.OrderCollection Order = null)
        {
            IQueryable result;
            PropertyInfo propertyInfo = context.GetType().GetProperty(EntitySetName);
            Type entityType = (propertyInfo.PropertyType).GetGenericArguments()[0];
            dynamic entitySet = propertyInfo.GetValue(context, null);

            result = entitySet;

            if (this.WhereMethods.ContainsKey(""))
            {
                result = this.WhereMethods[""](result, new List<Objects.WhereParameter>());
            }

            WhereParameter prm = Where != null ? Where.Parameters.FirstOrDefault(val => val.Property == "Distinct") : null;

            if (prm != null)
            {
                Where.Parameters.Remove(prm);
            }

            if (Where != null && Order != null)
            {
                result = Where.AddWhere(result, this, EntityName, this.WhereMethods);
                result = Order.AddOrder(result, this, EntityName, this.OrderMethods);
            }
            else if (Where != null)
            {
                result = Where.AddWhere(result, this, EntityName, this.WhereMethods);
                result = result.OrderBy("it." + IDKey);
            }
            else if (Order != null)
            {
                result = Order.AddOrder(result, this, EntityName, this.OrderMethods);
            }
            else
            {
                result = result.OrderBy("it." + IDKey);
            }

            if (prm != null)
            {
                IQueryable q = EntityJs.Client.Dynamic.DynamicQueryable.GroupBy(result, prm.Value.ToString(), "it", null);

                q = q.Select("it.FirstOrDefault()");
                result = q as IQueryable<EntityObject>;

                if (Order != null)
                {
                    result = Order.AddOrder(result, this, EntityName, this.OrderMethods);
                }
                else
                {
                    result = result.OrderBy("it." + IDKey);
                }
            }

            return result;
        }

        public Dictionary<string, List<EntityObject>> Select(string EntitySetName, string EntityName, Objects.IncludeCollection Include = null, Objects.WhereCollection Where = null, Objects.OrderCollection Order = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null)
        {
            int count;

            return this.Select(EntitySetName, EntityName, out count, Include, Where, Order, Skip, Take, WhereMethod, OrderMethod);
        }

        public Dictionary<string, List<EntityObject>> Select(string EntitySetName, string EntityName, out int TotalCount, Objects.IncludeCollection Include = null, Objects.WhereCollection Where = null, Objects.OrderCollection Order = null, int Skip = -1, int Take = -1, string WhereMethod = null, string OrderMethod = null, string SelectMode = null)
        {
            string sqlQuery;
            IQueryable<EntityObject> result;
            List<EntityObject> checkedResult = new List<EntityObject>();
            PropertyInfo propertyInfo = context.GetType().GetProperty(EntitySetName);
            Type entityType = (propertyInfo.PropertyType).GetGenericArguments()[0];
            bool dynamicEntity = typeof(IDynamic).IsAssignableFrom(entityType);

            dynamic entitySet = propertyInfo.GetValue(context, null);
            Events.CheckPermissionsEventArgs e;
            Dictionary<string, List<EntityObject>> fullResult = new Dictionary<string, List<EntityObject>>();

            if (dynamicEntity)
            {
                IDynamic dentity = (IDynamic)Activator.CreateInstance(entityType);
                foreach (string include in dentity.Include.Split('|'))
                {
                    if (include.IsNullOrEmpty())
                    {
                        continue;
                    }
                    entitySet = entitySet.Include(include);
                }
            }
            result = entitySet;

            if (Include != null)
            {
                result = Include.AddInclude(result);
            }

            if (this.WhereMethods.ContainsKey(""))
            {
                result = this.WhereMethods[""](result, new List<Objects.WhereParameter>());
            }

            WhereParameter prm = Where != null ? Where.Parameters.FirstOrDefault(val => val.Property == "Distinct") : null;

            if (prm != null)
            {
                Where.Parameters.Remove(prm);
            }

            if (WhereMethod.IsNotNullOrEmpty() && Where == null)
            {
                Where = new WhereCollection();
            }

            if (Where != null && Order != null)
            {
                result = Where.AddWhere(result, this, EntityName, this.WhereMethods, WhereMethod);
                result = Order.AddOrder(result, this, EntityName, this.OrderMethods, OrderMethod);
            }
            else if (Where != null)
            {
                result = Where.AddWhere(result, this, EntityName, this.WhereMethods, WhereMethod);
                result = result.OrderBy("it." + IDKey);
            }
            else if (Order != null)
            {
                result = Order.AddOrder(result, this, EntityName, this.OrderMethods, OrderMethod);
            }
            else
            {
                result = result.OrderBy("it." + IDKey);
            }

            if (prm != null)
            {
                IQueryable q = EntityJs.Client.Dynamic.DynamicQueryable.GroupBy(result, prm.Value.ToString(), "it", null);

                q = q.Select("it.FirstOrDefault()");
                result = q as IQueryable<EntityObject>;

                if (Order != null)
                {
                    result = Order.AddOrder(result, this, EntityName, this.OrderMethods, OrderMethod);
                }
                else
                {
                    result = result.OrderBy("it." + IDKey);
                }
            }

            TotalCount = result.Count();

            if (Skip < 0)
            {
                Skip = 0;
            }

            result = result.Skip(Skip);

            if (Take > 0)
            {
                result = result.Take(Take);
            }

            if (Include != null && Include.IncludeResults)
            {
                for (int i = 0; i < Include.Parameters.Count; i++)
                {
                    this.Include(Include.Parameters[i], fullResult);
                }
            }
            sqlQuery = ((ObjectQuery)result).ToTraceString();// DEBUG mode only
            foreach (EntityObject entity in result)
            {
                e = new Events.CheckPermissionsEventArgs(this.context, EntitySetName, EntityName, entity, Events.ActionsEnum.Select);
                e.EntityMode = SelectMode;

                this.ModelEvents.OnCheckPermission(this, e);

                if (e.Cancel)
                {
                    Errors.AddRange(e.Errors);
                    continue;
                }

                this.ModelEvents.OnSelecting(this, e);
                this.ModelEvents.OnSelected(this, e);
                checkedResult.Add(entity);

                if (Include == null || !Include.IncludeResults)
                {
                    continue;
                }

                for (int i = 0; i < Include.Parameters.Count; i++)
                {
                    this.Include(Include.Parameters[i], entity, fullResult);
                }
            }

            fullResult.Add(EntitySetName, checkedResult);

            foreach (string key in fullResult.Select(val => val.Key).ToList())
            {
                fullResult[key] = fullResult[key].Distinct().ToList();
            }

            this.ModelEvents.OnDataSelected(this, new EventArgs());

            return fullResult;
        }

        public EntityObject FirstOrDefault(string EntitySetName, string EntityName, Objects.IncludeCollection Include, Objects.WhereCollection Where, Objects.OrderCollection Order, int Skip, int Take, bool CheckPermissions)
        {
            return Select(EntitySetName, EntityName, Include, Where, Order, Skip, Take)[EntitySetName].FirstOrDefault();
        }

        public EntityObject FirstOrDefault(string EntitySetName, string EntityName, object ID)
        {
            Objects.WhereCollection where = new Objects.WhereCollection();

            where.Parameters.Add(new Objects.WhereParameter(new Objects.JsWhereParameter()
            {
                Property = "ID",
                DataType = Objects.DataTypesEnum.Number,
                Value = ID,
                Condition = Objects.ConditionsEnum.Equals
            }));

            return Select(EntitySetName, EntityName, null, where, null, -1, -1)[EntitySetName].FirstOrDefault();
        }

        public EntityObject Insert(string EntitySetName, string EntityName, object Values)
        {
            OperationResultsEnum result = OperationResultsEnum.Passed;
            return Insert(EntitySetName, EntityName, Values.ToObjectDictionary(), out result);
        }

        public EntityObject Insert(string EntitySetName, string EntityName, Dictionary<string, object> Values, out OperationResultsEnum Result)
        {
            Type entityType = GetEntityType(EntityName);
            PropertyInfo propertyInfo = context.GetType().GetProperty(EntitySetName);
            EntityObject newEntity = Activator.CreateInstance(entityType) as EntityObject;
            IDynamic dentity = newEntity as IDynamic;
            Events.CheckPermissionsEventArgs e;

            List<string> dynamicFields = new List<string>();

            foreach (KeyValuePair<string, object> item in Values)
            {
                if (dentity != null && dentity.IsDynamicField(item.Key))
                {
                    dynamicFields.Add(item.Key);
                    continue;
                }
                else
                {
                    PropertyInfo entityPropertyInfo = newEntity.GetType().GetProperty(item.Key);

                    if (entityPropertyInfo == null || !entityPropertyInfo.CanWrite)
                    {
                        continue;
                    }

                    object newValue = ConvertValue(item.Value, entityPropertyInfo.PropertyType);
                    //object oldValue = entityPropertyInfo.GetValue(newEntity, null);
                    if (newValue == null && entityPropertyInfo.GetValue(newEntity, null) == null)
                    {
                        continue;
                    }
                    entityPropertyInfo.SetValue(newEntity, newValue, null);
                }
            }

            e = new Events.CheckPermissionsEventArgs(this.context, EntitySetName, EntityName, newEntity, Values, Events.ActionsEnum.Insert);

            //context.AttachTo(EntitySetName, newEntity);
            context.AddObject(EntitySetName, newEntity);

            this.ModelEvents.OnCheckPermission(this, e);


            Result = e.Result;

            if (e.Cancel)
            {
                context.Detach(newEntity);
                Errors.AddRange(e.Errors);

                return newEntity;
            }

            foreach (string field in dynamicFields)
            {
                Type propertyType = null;
                propertyType = dentity.GetDynamicFieldType(field);
                if (propertyType == null)
                {
                    continue;
                }
                dentity.SetValue(field, ConvertValue(Values[field], propertyType));
            }

            this.ModelEvents.OnInserting(this, e);
            Result = e.Result;

            if (e.Cancel)
            {
                context.Detach(newEntity);
                Errors.AddRange(e.Errors);

                return newEntity;
            }

            //context.AddObject(EntitySetName, newEntity);

            this.ModelEvents.OnInserted(this, e);
            Result = e.Result;
            Errors.AddRange(e.Errors);
            if (e.Cancel)
            {
                return newEntity;
            }

            return newEntity;
        }

        public EntityObject Update(string EntitySetName, string EntityName, object Values)
        {
            OperationResultsEnum result = OperationResultsEnum.Passed;
            return Update(EntitySetName, EntityName, Values.ToObjectDictionary(), out result);
        }

        public EntityObject Update(string EntitySetName, string EntityName, Dictionary<string, object> Values, out OperationResultsEnum Result)
        {
            string ID = Values[IDKey].ToString();
            Type entityType = GetEntityType(EntityName);
            PropertyInfo propertyInfo = context.GetType().GetProperty(EntitySetName);
            dynamic entitySet = propertyInfo.GetValue(context, null);
            EntityObject entity = FirstOrDefault(EntitySetName, EntityName, ID);
            IDynamic dentity = entity as IDynamic;
            Events.CheckPermissionsEventArgs e;

            e = new Events.CheckPermissionsEventArgs(this.context, EntitySetName, EntityName, entity, Values, Events.ActionsEnum.Edit);
            this.ModelEvents.OnCheckPermission(this, e);

            if (entity == null)
            {
                e.Cancel = true;
            }

            Result = e.Result;
            Errors.AddRange(e.Errors);

            if (e.Cancel)
            {
                Result = OperationResultsEnum.EntityCanceled;
                return entity;
            }

            e.Errors.Clear();
            this.ModelEvents.OnUpdating(this, e);
            Result = e.Result;
            Errors.AddRange(e.Errors);
            if (e.Cancel)
            {
                Result = OperationResultsEnum.EntityCanceled;
                return entity;
            }

            foreach (KeyValuePair<string, object> item in Values)
            {
                if (dentity != null && dentity.IsDynamicField(item.Key))
                {
                    Type propertyType = null;
                    propertyType = dentity.GetDynamicFieldType(item.Key);
                    if (propertyType == null)
                    {
                        continue;
                    }
                    dentity.SetValue(item.Key, ConvertValue(item.Value, propertyType));
                }
                else
                {
                    PropertyInfo entityPropertyInfo = entity.GetType().GetProperty(item.Key);

                    if (entityPropertyInfo == null || !entityPropertyInfo.CanWrite)
                    {
                        continue;
                    }

                    entityPropertyInfo.SetValue(entity, ConvertValue(item.Value, entityPropertyInfo.PropertyType), null);
                }
            }

            e.Errors.Clear();
            this.ModelEvents.OnUpdated(this, e);
            Result = e.Result;
            Errors.AddRange(e.Errors);
            if (e.Cancel)
            {
                return entity;
            }

            return entity;
        }

        public EntityObject Delete(string EntitySetName, string EntityName, object ID)
        {
            OperationResultsEnum result = OperationResultsEnum.Passed;
            return Delete(EntitySetName, EntityName, ID.ToString(), out result);
        }

        public EntityObject Delete(string EntitySetName, string EntityName, string ID, out OperationResultsEnum Result)
        {
            Type entityType = GetEntityType(EntityName);
            PropertyInfo propertyInfo = context.GetType().GetProperty(EntitySetName);
            EntityObject entity = FirstOrDefault(EntitySetName, EntityName, ID);
            Events.CheckPermissionsEventArgs e;

            if (entity == null)
            {
                Result = OperationResultsEnum.EntityCanceled;

                return entity;
            }

            e = new Events.CheckPermissionsEventArgs(this.context, EntitySetName, EntityName, entity, Events.ActionsEnum.Delete);
            this.ModelEvents.OnCheckPermission(this, e);

            if (e.Entity == null)
            {
                e.Cancel = true;
            }

            Result = e.Result;

            if (e.Cancel)
            {
                return entity;
            }

            this.ModelEvents.OnDeleting(this, e);

            context.DeleteObject(entity);

            this.ModelEvents.OnDeleted(this, e);

            return entity;
        }

        public string IDKey
        {
            get
            {
                return idKey;
            }
            set
            {
                idKey = value;
            }
        }

        public bool SaveChanges()
        {
            System.ComponentModel.CancelEventArgs e = new System.ComponentModel.CancelEventArgs();
            this.ModelEvents.OnDataSaving(this, e);
            if (e.Cancel)
            {
                return false;
            }
            this.context.SaveChanges();
            this.ModelEvents.OnDataSaved(this);
            return true;
        }

        public void Dispose()
        {
            context.Dispose();
        }

        public virtual bool GetWhereParameter(string EntityName, string Parameter, out string NewParameter)
        {
            NewParameter = Parameter;
            return false;
        }

        public virtual bool GetOrderParameter(string EntityName, string Parameter, out string NewParameter)
        {
            NewParameter = Parameter;
            return false;
        }

        public virtual Type GetEntityType(string TypeName)
        {
            Type entityType;

            if (this.modelNamespace.IsNotNullOrEmpty())
            {
                entityType = Assembly.GetAssembly(context.GetType()).GetTypes().FirstOrDefault(val => val.FullName == modelNamespace + "." + TypeName);
            }
            else
            {
                entityType = Assembly.GetAssembly(context.GetType()).GetTypes().FirstOrDefault(val => val.Name == TypeName);
            }

            return entityType;
        }

        protected void Include(Objects.IncludeParameter Include, Dictionary<string, List<EntityObject>> Result)
        {
            if (Include == null)
            {
                return;
            }

            if (!Result.ContainsKey(Include.EntitySetName))
            {
                Result[Include.EntitySetName] = new List<EntityObject>();
            }

            if (Include.Child != null)
            {
                this.Include(Include.Child, Result);
            }
        }

        protected void Include(Objects.IncludeParameter Include, EntityObject Entity, Dictionary<string, List<EntityObject>> Result)
        {
            if (Include == null)
            {
                return;
            }

            if (!Result.ContainsKey(Include.EntitySetName))
            {
                Result[Include.EntitySetName] = new List<EntityObject>();
            }

            PropertyInfo pi;
            Events.CheckPermissionsEventArgs e;

            if (Include.Collection)
            {
                string p = Include.Property.IsNotNullOrEmpty() ? Include.Property : Include.EntitySetName;
                pi = Entity.GetType().GetProperty(p);

                dynamic collection = pi.GetValue(Entity, null);

                collection = (collection as IEnumerable).OfType<EntityObject>().ToList();
                (collection as List<EntityObject>).ForEach(val =>
                {
                    e = new Events.CheckPermissionsEventArgs(this.context, Include.EntitySetName, Include.EntityName, val, Events.ActionsEnum.Select);
                    this.ModelEvents.OnCheckPermission(this, e);

                    if (e.Cancel)
                    {
                        return;
                    }

                    this.ModelEvents.OnSelecting(this, e);
                    this.ModelEvents.OnSelected(this, e);

                    Result[Include.EntitySetName].Add(val);

                    if (Include.Child != null)
                    {
                        this.Include(Include.Child, val, Result);
                    }
                });
            }
            else
            {
                string p = Include.Property.IsNotNullOrEmpty() ? Include.Property : Include.EntityName;
                pi = Entity.GetType().GetProperty(p);

                EntityObject val = pi.GetValue(Entity, null) as EntityObject;

                e = new Events.CheckPermissionsEventArgs(this.context, Include.EntitySetName, Include.EntityName, val, Events.ActionsEnum.Select);
                this.ModelEvents.OnCheckPermission(this, e);

                if (e.Cancel)
                {
                    return;
                }

                this.ModelEvents.OnSelecting(this, e);
                this.ModelEvents.OnSelected(this, e);

                Result[Include.EntitySetName].Add(val);

                if (Include.Child != null)
                {
                    this.Include(Include.Child, val, Result);
                }
            }
        }

        protected object ConvertValue(object Value, Type ToType)
        {
            if (Value == null)
            {
                return Value;
            }

            ToType = Nullable.GetUnderlyingType(ToType) ?? ToType;

            try
            {
                return Convert.ChangeType(Value, ToType);
            }
            catch (Exception ex)
            {
                if (ex is System.FormatException || ex is System.InvalidCastException)
                {
                    if (ToType == typeof(decimal))
                    {
                        return Value == null ? 0 : Value.ToString().ToDecimal();
                    }
                    else if (ToType == typeof(TimeSpan))
                    {
                        TimeSpan result;
                        if (TimeSpan.TryParse(Value as string, out result))
                        {
                            return result;
                        }
                        int[] parts = Value.ToString().Trim().Split(new[] { ':', ',', '.' }, StringSplitOptions.RemoveEmptyEntries).Select(val => val.ToInt()).ToArray();
                        result = TimeSpan.FromHours(parts.FirstOrDefault());
                        result = result.Add(TimeSpan.FromMinutes(parts.ElementAtOrDefault(1)));
                        result = result.Add(TimeSpan.FromSeconds(parts.ElementAtOrDefault(2)));
                        return result;
                    }
                    else if (ToType == typeof(Boolean))
                    {
                        string strvalue = Value as string;
                        strvalue = strvalue ?? "";
                        return strvalue == "1" || strvalue.ToLower() == "on" ? true : strvalue == "0" || strvalue.ToLower() == "off" ? false : Boolean.Parse(strvalue);
                    }
                    else
                    {
                        throw ex;
                    }
                }
                else
                {
                    throw ex;
                }
            }
        }
    }
}
