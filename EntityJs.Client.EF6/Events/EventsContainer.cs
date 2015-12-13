using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace EntityJs.Client.Events
{
    public class EventsContainer
    {
        /// <summary>
        /// Fires after new entity has been added to the context.
        /// </summary>
        public event EntityDelegate Inserted;
        /// <summary>
        /// Fires after entity was deleted from the context.
        /// </summary>
        public event EntityDelegate Deleted;
        /// <summary>
        /// Fires after properties of entity were updated.
        /// </summary>
        public event EntityDelegate Updated;
        /// <summary>
        /// Fires after entity has been added to result collection.
        /// </summary>
        public event EntityDelegate Selected;
        /// <summary>
        /// Fires after data has selected.
        /// </summary>
        public event EventHandler DataSelected;
        /// <summary>
        /// Fires before new entity being added to the context. All the properties already set.
        /// </summary>
        public event EntityDelegate Inserting;
        /// <summary>
        /// Fires before deleting entity from the context.
        /// </summary>
        public event EntityDelegate Deleting;
        /// <summary>
        /// Fires before properties of entity being updated.
        /// </summary>
        public event EntityDelegate Updating;
        /// <summary>
        /// Fires before entity being added to result collection.
        /// </summary>
        public event EntityDelegate Selecting;
        /// <summary>
        /// Fires before any context actions to check whether this action is allowed.
        /// </summary>
        public event CheckPermissionDelegate CheckPermission;
        /// <summary>
        /// Fires before data is going to be saved.
        /// </summary>
        public event EventHandler<System.ComponentModel.CancelEventArgs> DataSaving;
        /// <summary>
        /// Fires after data has been saved.
        /// </summary>
        public event EventHandler DataSaved;

        public void OnInserted(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnInserted(e);
            }

            if (this.Inserted != null)
            {
                this.Inserted(sender, e);
            }
        }

        public void OnDeleted(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnDeleted(e);
            }

            if (this.Deleted != null)
            {
                this.Deleted(sender, e);
            }
        }

        public void OnUpdated(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnUpdated(e);
            }

            if (this.Updated != null)
            {
                this.Updated(sender, e);
            }
        }

        public void OnSelected(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnSelected(e);
            }

            if (this.Selected != null)
            {
                this.Selected(sender, e);
            }
        }

        public void OnInserting(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnInserting(e);
            }

            if (this.Inserting != null)
            {
                this.Inserting(sender, e);
            }
        }

        public void OnDeleting(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnDeleting(e);
            }

            if (this.Deleting != null)
            {
                this.Deleting(sender, e);
            }
        }

        public void OnUpdating(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnUpdating(e);
            }

            if (this.Updating != null)
            {
                this.Updating(sender, e);
            }
        }

        public void OnSelecting(object sender, EntityEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnSelecting(e);
            }

            if (this.Selecting != null)
            {
                this.Selecting(sender, e);
            }
        }

        public void OnDataSelected(object sender, EventArgs e)
        {
            if (this.DataSelected != null)
            {
                this.DataSelected(sender, e);
            }
        }

        public void OnCheckPermission(object sender, CheckPermissionsEventArgs e)
        {
            EntityJs.Client.Objects.IEntity obj = e.Entity as EntityJs.Client.Objects.IEntity;

            if (obj != null)
            {
                obj.OnCheckPermissions(e);
            }

            if (this.CheckPermission != null)
            {
                this.CheckPermission(sender, e);
            }
        }

        public void OnDataSaving(object sender, System.ComponentModel.CancelEventArgs e)
        {
            if (this.DataSaving != null)
            {
                this.DataSaving(sender, e);
            }
        }

        public void OnDataSaved(object sender)
        {
            if (this.DataSaved != null)
            {
                this.DataSaved(sender, EventArgs.Empty);
            }
        }
    }
}
