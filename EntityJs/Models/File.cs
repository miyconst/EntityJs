using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace EntityJs.Models
{
    public partial class File : EntityJs.Client.Objects.IEntity
    {
        public void RemoveFile()
        {
            System.IO.FileInfo fi = new System.IO.FileInfo(this.RealPath);

            if (fi.Exists)
            {
                fi.Delete();
            }
        }

        public string VirtualPath
        {
            get
            {
                return UrlHelper.GenerateContentUrl("~/" + this.Url, HttpContext.Current.Request.RequestContext.HttpContext);
            }
        }

        public string RealPath
        {
            get
            {
                return string.Format("{0}/{1}", HttpRuntime.AppDomainAppPath, this.Url);
            }
        }

        public object ToJson()
        {
            return new
            {
                this.ID,
                this.Name,
                this.Url,
                this.VirtualPath
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