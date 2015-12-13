using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class WhereCollection
    {
        public WhereCollection(JsWhereParameter[] Parameters)
        {
            this.Parameters = Parameters.Select(val => new WhereParameter(val)).ToList();
        }

        public WhereCollection()
        {
            this.Parameters = new List<WhereParameter>();
        }

        public List<WhereParameter> Parameters
        {
            get;
            protected set;
        }

        public dynamic AddWhere<TModel>(dynamic Query, EntityModel<TModel> Model, string EntityName, Dictionary<string, Func<dynamic, List<WhereParameter>, dynamic>> Methods, string Method = null)
            where TModel : DbContext
        {
            if (Method.IsNotNullOrEmpty())
            {
                return Methods[Method](Query, this.Parameters);
            }

            if (!this.Parameters.Any())
            {
                return Query;
            }

            List<ObjectParameter> prms = new List<ObjectParameter>();
            String whereString = BuildWhereString(prms, Model, EntityName);

            if (whereString.IsNotNullOrEmpty())
            {
                return Dynamic.DynamicQueryable.Where(Query, whereString, prms.ToArray());
            }
            else
            {
                return Query;
            }
        }

        public string BuildWhereString<TModel>(List<ObjectParameter> OutputParameters, EntityModel<TModel> Model, string EntityName)
            where TModel : DbContext
        {
            if (!this.Parameters.Any())
            {
                return string.Empty;
            }

            StringBuilder where = new StringBuilder();
            String whereString = string.Empty;

            for (int i = 0; i < this.Parameters.Count; i++)
            {
                WhereParameter par = this.Parameters[i];

                par.Model = Model;
                par.EntityName = EntityName;

                if (i > 0)
                {
                    where.Append(string.Format(" {0} ", par.Operand.ToString().ToUpper()));
                }

                if (par.DataType == DataTypesEnum.Group)
                {
                    string subWhere = par.SubCollection == null ? string.Empty : par.SubCollection.BuildWhereString(OutputParameters, Model, EntityName);
                    if (string.IsNullOrEmpty(subWhere.Trim()))
                    {
                        continue;
                    }

                    where.Append(string.Format(" ({0}) ", subWhere));
                }
                else
                {
                    if (par.Condition < ConditionsEnum.IsNull)
                    {
                        par.Name = "p" + OutputParameters.Count;
                        OutputParameters.Add(par.GetEntityParameter());
                    }
                    where.Append(par.ToString());
                }
            }

            whereString = where.ToString();

            return whereString;
        }
    }
}
