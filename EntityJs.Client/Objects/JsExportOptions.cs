using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Objects
{
    public class JsExportOptions
    {
        public JsSelectOptions SelectOptions { get; set; }
        public JsExportParameter[] Parameters { get; set; }
        public ExportTypesEnum Type { get; set; }
        public string Name { get; set; }
    }
}
