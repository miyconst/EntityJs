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
    
    public partial class Order
    {
        public Order()
        {
            this.OrderItmes = new HashSet<OrderItme>();
        }
    
        public int ID { get; set; }
        public int CustomerID { get; set; }
        public System.DateTime Date { get; set; }
        public string Comments { get; set; }
    
        public virtual Customer Customer { get; set; }
        public virtual ICollection<OrderItme> OrderItmes { get; set; }
    }
}