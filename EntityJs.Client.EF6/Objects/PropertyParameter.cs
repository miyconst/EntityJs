using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace EntityJs.Client.Objects
{
    public abstract class PropertyParameter
    {
        private const string propertyCheckRegex = @"^[\w_.,()\[\]0-9]+$";

        public virtual bool GetNewParameter(string EntityName, string Parameter, out string NewParameter)
        {
            NewParameter = Parameter;
            return false;
        }

        public string Property
        {
            get;
            protected set;
        }

        public ActionsEnum Action
        {
            get;
            protected set;
        }

        public string EntityName
        {
            get;
            set;
        }

        public IParametrable Model
        {
            get;
            set;
        }

        protected void CheckProperty()
        {
            Regex reg = new Regex(propertyCheckRegex);

            if (!reg.IsMatch(this.Property))
            {
                throw new System.Security.SecurityException("Property must match " + propertyCheckRegex + ".");
            }
        }

        protected string ActionProperty
        {
            get
            {
                string newProperty;

                if (this.EntityName.IsNotNullOrEmpty() && this.Model != null && this.GetNewParameter(this.EntityName, this.Property, out newProperty))
                {
                    return string.Format("({0})", newProperty);
                }

                StringBuilder result = new StringBuilder();
                string[] properties = this.Property.Split(",".ToCharArray());

                switch (this.Action)
                {
                    case ActionsEnum.Deduct:
                        result.Append("(");

                        for (int i = 0; i < properties.Length; i++)
                        {
                            string p = properties[i];
                            if (!Regex.IsMatch(p, @"^\d+$"))
                            {
                                p = "it." + p;
                            }

                            if (i > 0)
                            {
                                result.Append(" - ");
                            }

                            result.Append(p);
                        }

                        result.Append(")");
                        break;
                    case ActionsEnum.Append:
                        result.Append("(");
                        
                        for (int i = 0; i < properties.Length; i++)
                        {
                            if (i > 0)
                            {
                                result.Append(" + \" \" + ");
                            }

                            result.Append("it.").Append(properties[i]);
                        }

                        result.Append(")");
                        break;
                    case ActionsEnum.Add:
                        result.Append("(");

                        for (int i = 0; i < properties.Length; i++)
                        {
                            string p = properties[i];
                            if (!Regex.IsMatch(p, @"^\d+$"))
                            {
                                p = "it." + p;
                            }

                            if (i > 0)
                            {
                                result.Append(" + ");
                            }

                            result.Append(p);
                        }

                        result.Append(")");
                        break;
                    default:
                        result.Append("it.").Append(this.Property);
                        break;
                }

                return result.ToString();
            }
        }
    }
}
