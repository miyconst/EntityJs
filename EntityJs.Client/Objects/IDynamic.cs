using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public interface IDynamic
    {
        bool IsDynamicField(string Name);
        Type GetDynamicFieldType(string Name);
        void SetValue(string Name, object Value);
        string Include { get; }
    }
}
