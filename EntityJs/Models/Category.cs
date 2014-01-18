using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace EntityJs.Models
{
    public partial class Category : EntityJs.Client.Objects.IEntity
    {
        public object ToJson()
        {
            return new
            {
                this.ID,
                this.Name
            };
        }

        public void OnCheckPermissions(Client.Events.CheckPermissionsEventArgs e)
        {
            e.Cancel = false;
        }

        public void OnSelecting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnInserting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnUpdating(Client.Events.EntityEventArgs e)
        {
        }

        public void OnDeleting(Client.Events.EntityEventArgs e)
        {
        }

        public void OnSelected(Client.Events.EntityEventArgs e)
        {
        }

        public void OnInserted(Client.Events.EntityEventArgs e)
        {
        }

        public void OnUpdated(Client.Events.EntityEventArgs e)
        {
        }

        public void OnDeleted(Client.Events.EntityEventArgs e)
        {
        }
    }
}