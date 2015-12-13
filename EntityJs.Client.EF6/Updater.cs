using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Reflection;
using EntityJs.Client.Objects;

namespace EntityJs.Client
{
    public class Updater<ContextType>
        where ContextType : DbContext
    {
        EntityModel<ContextType> model;
        Dictionary<JsIDMap, IEntity> IDMaps;
        public Updater(EntityModel<ContextType> Model)
        {
            this.model = Model;
            this.model.ModelEvents.DataSaved += Model_DataSaved;
            IDMaps = new Dictionary<JsIDMap, IEntity>();
        }

        void Model_DataSaved(object sender, EventArgs e)
        {
            foreach (KeyValuePair<JsIDMap, IEntity> item in IDMaps)
            {
                IEntity entity = item.Value;
                PropertyInfo idprop = entity.GetType().GetProperty(model.IDKey);

                if (idprop.PropertyType == typeof(int))
                {
                    item.Key.NewID = (int)idprop.GetValue(entity, null);
                }
                else if (idprop.PropertyType == typeof(long))
                {
                    item.Key.NewID = (long)idprop.GetValue(entity, null);
                }
                else
                {
                    throw new Exception("Invalid type for ID");
                }
            }
        }

        public Objects.JsSaveResult Update(Objects.JsChanges Changes)
        {
            List<string> log = new List<string>();
            log.Add(string.Format("{0} Update started", DateTime.Now));

            Objects.JsSaveResult result = new Objects.JsSaveResult();
            bool updateCanceled = false;
            OperationResultsEnum r;
            foreach (Objects.JsEntity item in Changes.Deleted)
            {
                IEntity entity = model.Delete(item.EntitySetName, item.EntityName, item.Values.FirstOrDefault(val => val.Key == model.IDKey).Value.ToString(), out r);
                updateCanceled = updateCanceled || r == OperationResultsEnum.OperationCanceled;
                if (updateCanceled || r != OperationResultsEnum.Passed)
                {
                    if (entity != null)
                    {
                        result.CanceledObjects.Add(new Objects.JsEntityObjectContainer(item.EntityName, item.EntitySetName, entity, item.EntityMode));
                    }
                }
            }
            log.Add(string.Format("{0} Update Deleted processed", DateTime.Now));
            
            foreach (Objects.JsEntity item in Changes.Updated)
            {
                Dictionary<string, object> values = item.Values.ToDictionary(val => val.Key, val => val.Value);
                long id = Convert.ToInt64(values[model.IDKey]);
                Objects.JsIDMap map;
                IEntity entity;

                if (id > 0)
                {
                    entity = model.Update(item.EntitySetName, item.EntityName, values, out r);
                }
                else
                {
                    map = new Objects.JsIDMap();
                    map.OldID = id;
                    result.Maps.Add(map);
                    entity = model.Insert(item.EntitySetName, item.EntityName, values, out r);
                    PropertyInfo idprop = entity.GetType().GetProperty(model.IDKey);
                    if (idprop.PropertyType == typeof(int))
                    {
                        map.NewID = (int)idprop.GetValue(entity, null);
                    }
                    else if (idprop.PropertyType == typeof(long))
                    {
                        map.NewID = (long)idprop.GetValue(entity, null);
                    }
                    else
                    {
                        throw new Exception("Invalid type for ID");
                    }
                    IDMaps[map] = entity;
                    //entity.PropertyChanged += (sender, e) =>
                    //{
                    //    if (e.PropertyName == model.IDKey)
                    //    {
                    //        if (idprop.PropertyType == typeof(int))
                    //        {
                    //            map.NewID = (int)idprop.GetValue(entity, null);
                    //        }
                    //        else if (idprop.PropertyType == typeof(long))
                    //        {
                    //            map.NewID = (long)idprop.GetValue(entity, null);
                    //        }
                    //        else
                    //        {
                    //            throw new Exception("Invalid type for ID");
                    //        }
                    //    }
                    //};
                }

                updateCanceled = updateCanceled || r == OperationResultsEnum.OperationCanceled;
                if (updateCanceled || r != OperationResultsEnum.Passed)
                {
                    if (entity != null)
                    {
                        result.CanceledObjects.Add(new Objects.JsEntityObjectContainer(item.EntityName, item.EntitySetName, entity, item.EntityMode));
                    }
                }
                else
                {
                    result.Objects.Add(new Objects.JsEntityObjectContainer(item.EntityName, item.EntitySetName, entity, item.EntityMode));
                }
            }
            log.Add(string.Format("{0} Update Updated processed", DateTime.Now));

            while (updateCanceled && result.Objects.Any())
            {
                JsEntityObjectContainer jsObject = result.Objects.First();
                result.CanceledObjects.Add(jsObject);
                result.Objects.Remove(jsObject);
            }

            if (!updateCanceled)
            {
                log.Add(string.Format("{0} Update Before SaveChanges", DateTime.Now));
                updateCanceled = !model.SaveChanges();
                log.Add(string.Format("{0} Update After SaveChanges", DateTime.Now));
            }

            while (updateCanceled && result.Objects.Any())
            {
                JsEntityObjectContainer jsObject = result.Objects.First();
                result.CanceledObjects.Add(jsObject);
                result.Objects.Remove(jsObject);
            }

            result.Errors.AddRange(model.Errors);
            log.Add(string.Format("{0} Update completed", DateTime.Now));

            result.Data = log;
            return result;
        }

        public EntityModel<ContextType> EntityModel
        {
            get
            {
                return this.model;
            }
        }
    }
}
