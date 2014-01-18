using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsExportParameter
    {
        public string Name { get; set; }
        public string Value { get; set; }

        public string Path { get; set; }
        public Delegate Compiled { get; set; }
        public LambdaExpression Expression { get; set; }

        public List<string> Errors { get; set; }

        public JsExportParameter()
        {
            Errors = new List<string>();
        }

        public void Compile(Type itType)
        {
            if (Expression != null)
            {
                return;
            }

            Value = Value ?? Name;
            Name = Name ?? Value;
            Path = Value;
            if (Path.StartsWith("$"))
            {
                Path = Path.Substring(1);
            }
            else
            {
                Path = "it." + Path;
            }

            if (itType == null)
            {
                return;
            }

            try
            {
                this.Expression = EntityJs.Client.Dynamic.DynamicExpression.ParseLambda(itType, typeof(object), Path);
                Compiled = this.Expression.Compile();
            }
            catch (Exception ex)
            {
                Errors.Add(ex.Message);
            }
        }

        public object GetValue(Object item)
        {
            object result = "";
            try
            {
                if (Compiled != null)
                {
                    result = Compiled.DynamicInvoke(item);
                }
            }
            catch (Exception ex)
            {
                this.Errors.Add(ex.Message);
            }
            return result;
        }
    }
}
