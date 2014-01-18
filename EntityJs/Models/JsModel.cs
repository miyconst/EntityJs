using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Objects;
using EntityJs.Client;
using EntityJs.Client.Objects;

namespace EntityJs.Models
{
    public class JsModel : EntityModel<ObjectContext>
    {
        public JsModel(ObjectContext Context)
            : base (Context)
        {
            Func<dynamic, List<WhereParameter>, dynamic> w = (q, prms) => 
            {
                WhereParameter p = prms.First(val => val.Property == "NameLength");

                p.Name = "length";

                return q.Where("LENGTH(it.Name) > @length", new ObjectParameter[] { p.GetEntityParameter() });
            };

            this.WhereMethods.Add("Products.Length", w);
        }

        public override bool GetWhereParameter(string EntityName, string Parameter, out string NewParameter)
        {
            Dictionary<string, string> whereProperties = new Dictionary<string, string>();
            string key = EntityName + "." + Parameter;

            whereProperties.Add("Product.CategoryFullName", "it.Name + \" \" + it.Category.Name");
            whereProperties.Add("Product.NameLength", "it.Name.Length");
            whereProperties.Add("Product.MaxCategoryID", "it.Category.Products.Any() ? it.Category.Products.Max(it.ID) : 0");

            if (whereProperties.ContainsKey(key))
            {
                NewParameter = whereProperties[key];
                return true;
            }

            NewParameter = Parameter;
            return false;
        }

        public override bool GetOrderParameter(string EntityName, string Parameter, out string NewParameter)
        {
            Dictionary<string, string> whereProperties = new Dictionary<string, string>();
            string key = EntityName + "." + Parameter;

            whereProperties.Add("Product.CategoryFullName", "it.Name + \" \" + it.Category.Name");
            whereProperties.Add("Product.NameLength", "it.Name.Length");
            whereProperties.Add("Product.MaxCategoryID", "it.Category.Products.Any() ? it.Category.Products.Max(it.ID) : 0");

            if (whereProperties.ContainsKey(key))
            {
                NewParameter = whereProperties[key];
                return true;
            }

            NewParameter = Parameter;
            return false;
        }
    }
}