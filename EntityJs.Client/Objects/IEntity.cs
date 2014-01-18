using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using EntityJs.Client.Events;

namespace EntityJs.Client.Objects
{
    public interface IEntity
    {
        object ToJson();

        void OnCheckPermissions(CheckPermissionsEventArgs e);
        
        void OnSelecting(EntityEventArgs e);
        void OnInserting(EntityEventArgs e);
        void OnUpdating(EntityEventArgs e);
        void OnDeleting(EntityEventArgs e);
        
        void OnSelected(EntityEventArgs e);
        void OnInserted(EntityEventArgs e);
        void OnUpdated(EntityEventArgs e);
        void OnDeleted(EntityEventArgs e);
    }
}
