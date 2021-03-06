//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace EntityJs.EF6.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class Incident
    {
        public int ID { get; set; }
        public Nullable<int> TypeID { get; set; }
        public System.DateTime Date { get; set; }
        public string Name { get; set; }
        public string Comments { get; set; }
        public bool Visible { get; set; }
        public int CreatorID { get; set; }
        public Nullable<int> ForUserID { get; set; }
        public Nullable<int> ForRoleID { get; set; }
    
        public virtual IncidentType IncidentType { get; set; }
        public virtual Role Role { get; set; }
        public virtual User User { get; set; }
    }
}
